/**
 * GET  /api/v1/users/[userId]/roles  — List role assignments for a user
 * POST /api/v1/users/[userId]/roles  — Assign a new role to a user (org_admin+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, roles, userRoleAssignments } from "@/db/schema/index";
import { withAuth, withRole, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { hasRoleOrAbove } from "@/lib/permissions";
import { assignRoleSchema } from "@/lib/validators/users";
import { apiSuccess, apiCreated, badRequest, notFound, forbidden, conflict } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";

type Params = { userId: string };

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId } = params as Params;

  // Self or admin
  const isSelf = ctx.session.userId === userId;
  const isAdmin = hasRoleOrAbove(ctx.session.effectiveRoleCodes, "org_admin");
  if (!isSelf && !isAdmin) return forbidden();

  const now = new Date();
  const assignments = await db
    .select({
      id: userRoleAssignments.id,
      roleCode: roles.code,
      roleName: roles.name,
      roleNameHi: roles.nameHi,
      scopeType: userRoleAssignments.scopeType,
      unitId: userRoleAssignments.unitId,
      departmentId: userRoleAssignments.departmentId,
      isPrimary: userRoleAssignments.isPrimary,
      startsAt: userRoleAssignments.startsAt,
      endsAt: userRoleAssignments.endsAt,
      createdAt: userRoleAssignments.createdAt,
    })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(eq(userRoleAssignments.userId, userId))
    .orderBy(userRoleAssignments.createdAt);

  const activeAssignments = assignments.filter(
    (a) => a.startsAt <= now && (!a.endsAt || a.endsAt > now)
  );

  return apiSuccess({ all: assignments, active: activeAssignments });
});

// ── POST ──────────────────────────────────────────────────────────────────────
export const POST = withRole("org_admin", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId } = params as Params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = assignRoleSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  // Verify target user exists in same org
  const targetUser = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), eq(profiles.orgId, ctx.session.orgId)),
    columns: { id: true, email: true, displayName: true },
  });
  if (!targetUser) return notFound("User not found.");

  // Resolve role ID from code
  const roleRecord = await db.query.roles.findFirst({
    where: eq(roles.code, input.roleCode),
    columns: { id: true },
  });
  if (!roleRecord) return badRequest(`Role '${input.roleCode}' is not recognised.`);

  // Insert assignment
  const [assignment] = await db
    .insert(userRoleAssignments)
    .values({
      userId,
      roleId: roleRecord.id,
      scopeType: input.scopeType,
      orgId: ctx.session.orgId,
      unitId: input.unitId ?? null,
      departmentId: input.departmentId ?? null,
      scopeEntityId: input.scopeEntityId ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      isPrimary: input.isPrimary,
      assignedBy: ctx.session.userId,
    })
    .returning({ id: userRoleAssignments.id });

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "user.role_assigned",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "profile",
      entityId: userId,
      payload: input as Record<string, unknown>,
      changeSummary: `Role '${input.roleCode}' assigned to ${targetUser.email}.`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} assigned role '${input.roleCode}' to ${targetUser.displayName ?? targetUser.email}.`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return apiCreated({ assignmentId: assignment?.id, roleCode: input.roleCode });
});

export const DELETE = withRole("org_admin", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId } = params as Params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const assignmentId =
    body && typeof body === "object" && "assignmentId" in body && typeof body.assignmentId === "string"
      ? body.assignmentId
      : null;

  if (!assignmentId) return badRequest("An assignmentId is required.");

  const targetUser = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), eq(profiles.orgId, ctx.session.orgId)),
    columns: { id: true, email: true, displayName: true },
  });
  if (!targetUser) return notFound("User not found.");

  const assignments = await db
    .select({
      id: userRoleAssignments.id,
      roleCode: roles.code,
      startsAt: userRoleAssignments.startsAt,
      endsAt: userRoleAssignments.endsAt,
    })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(eq(userRoleAssignments.userId, userId));

  const assignment = assignments.find((row) => row.id === assignmentId);
  if (!assignment) return notFound("Role assignment not found.");

  const now = new Date();
  const activeAssignments = assignments.filter(
    (row) => row.startsAt <= now && (!row.endsAt || row.endsAt > now),
  );

  if (activeAssignments.some((row) => row.id === assignmentId) && activeAssignments.length <= 1) {
    return conflict("A user must retain at least one active role. Deactivate the account to revoke access completely.");
  }

  await db
    .delete(userRoleAssignments)
    .where(and(eq(userRoleAssignments.id, assignmentId), eq(userRoleAssignments.userId, userId)));

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "user.role_removed",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "profile",
      entityId: userId,
      payload: { assignmentId, roleCode: assignment.roleCode },
      changeSummary: `Role '${assignment.roleCode}' removed from ${targetUser.email}.`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} removed role '${assignment.roleCode}' from ${targetUser.displayName ?? targetUser.email}.`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    },
  );

  return apiSuccess({ assignmentId, removed: true });
});
