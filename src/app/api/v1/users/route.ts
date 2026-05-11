/**
 * GET  /api/v1/users   — List org users with search + filters (org_admin+)
 * POST /api/v1/users   — Create a new user with initial role (org_admin+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, count, eq, gt, ilike, inArray, isNull, lte, or } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, roles, userRoleAssignments } from "@/db/schema/index";
import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { getPrimaryRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth/password";
import { createUserSchema, listUsersQuerySchema } from "@/lib/validators/users";
import {
  apiSuccess, apiCreated, badRequest, conflict, serverError,
  parsePagination, paginationMeta,
} from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withPermission("canManageUsers", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const sp = req.nextUrl.searchParams;
  const query = listUsersQuerySchema.safeParse(Object.fromEntries(sp));
  if (!query.success) return badRequest(query.error.errors[0]?.message ?? "Invalid query.");
  const q = query.data;

  const { page, limit, offset } = parsePagination(sp, { page: q.page, limit: q.limit });

  const conditions: ReturnType<typeof eq>[] = [eq(profiles.orgId, ctx.session.orgId)];
  if (q.isActive !== undefined) conditions.push(eq(profiles.isActive, q.isActive));

  const searchCondition = q.search
    ? or(
        ilike(profiles.displayName, `%${q.search}%`),
        ilike(profiles.email, `%${q.search}%`)
      )
    : undefined;

  const whereClause = searchCondition
    ? and(...conditions, searchCondition)
    : and(...conditions);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: profiles.id,
        email: profiles.email,
        displayName: profiles.displayName,
        displayNameHi: profiles.displayNameHi,
        phone: profiles.phone,
        responsibility: profiles.responsibility,
        responsibilityHi: profiles.responsibilityHi,
        isActive: profiles.isActive,
        lastLoginAt: profiles.lastLoginAt,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(profiles.createdAt),

    db
      .select({ value: count() })
      .from(profiles)
      .where(whereClause),
  ]);

  const total = Number(totalRow[0]?.value ?? 0);
  const userIds = rows.map((row) => row.id);
  const now = new Date();

  const assignmentRows = userIds.length
    ? await db
        .select({
          userId: userRoleAssignments.userId,
          roleCode: roles.code,
          roleName: roles.name,
          roleNameHi: roles.nameHi,
          isPrimary: userRoleAssignments.isPrimary,
        })
        .from(userRoleAssignments)
        .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
        .where(
          and(
            inArray(userRoleAssignments.userId, userIds),
            lte(userRoleAssignments.startsAt, now),
            or(isNull(userRoleAssignments.endsAt), gt(userRoleAssignments.endsAt, now)),
          ),
        )
    : [];

  const rolesByUser = new Map<
    string,
    Array<{
      code: string;
      name: string;
      nameHi: string | null;
      isPrimary: boolean;
    }>
  >();

  for (const assignment of assignmentRows) {
    const current = rolesByUser.get(assignment.userId) ?? [];
    current.push({
      code: assignment.roleCode,
      name: assignment.roleName,
      nameHi: assignment.roleNameHi,
      isPrimary: assignment.isPrimary,
    });
    rolesByUser.set(assignment.userId, current);
  }

  const payload = rows.map((row) => {
    const activeRoles = rolesByUser.get(row.id) ?? [];
    const roleCodes = activeRoles.map((role) => role.code) as Parameters<typeof getPrimaryRole>[0];
    return {
      ...row,
      roles: activeRoles,
      primaryRoleCode: activeRoles.length ? getPrimaryRole(roleCodes) : null,
    };
  });

  return apiSuccess(payload, { meta: paginationMeta(page, limit, total) });
});

// ── POST ──────────────────────────────────────────────────────────────────────
export const POST = withPermission("canManageUsers", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  // Email uniqueness within org
  const existing = await db.query.profiles.findFirst({
    where: and(eq(profiles.email, input.email), eq(profiles.orgId, ctx.session.orgId)),
    columns: { id: true },
  });
  if (existing) return conflict("A user with this email already exists in this organisation.");

  const passwordHash = await hashPassword(input.password);

  // Find role record
  const roleRecord = await db.query.roles.findFirst({
    where: eq(roles.code, input.roleCode),
    columns: { id: true },
  });
  if (!roleRecord) return badRequest(`Role '${input.roleCode}' is not recognised.`);

  // Insert profile
  const [newProfile] = await db
    .insert(profiles)
    .values({
      orgId: ctx.session.orgId,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      displayNameHi: input.displayNameHi,
      phone: input.phone,
      responsibility: input.responsibility,
      responsibilityHi: input.responsibilityHi,
    })
    .returning({
      id: profiles.id,
      email: profiles.email,
      displayName: profiles.displayName,
      isActive: profiles.isActive,
      createdAt: profiles.createdAt,
    });

  if (!newProfile) return serverError("Failed to create user.");

  // Assign initial role
  await db.insert(userRoleAssignments).values({
    userId: newProfile.id,
    roleId: roleRecord.id,
    scopeType: "org",
    orgId: ctx.session.orgId,
    unitId: input.unitId ?? null,
    departmentId: input.departmentId ?? null,
    isPrimary: true,
    assignedBy: ctx.session.userId,
  });

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "user.created",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "profile",
      entityId: newProfile.id,
      changeSummary: `User created: ${input.email} with role ${input.roleCode}.`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} added new member: ${input.displayName ?? input.email}.`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return apiCreated({ ...newProfile, roleCode: input.roleCode });
});
