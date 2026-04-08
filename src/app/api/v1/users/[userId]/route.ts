/**
 * GET   /api/v1/users/[userId]  — Get user profile (org_admin or self)
 * PATCH /api/v1/users/[userId]  — Update user profile (org_admin or self)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, userRoleAssignments, roles } from "@/db/schema/index";
import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { hasRoleOrAbove } from "@/lib/permissions";
import { updateUserSchema } from "@/lib/validators/users";
import { apiSuccess, badRequest, notFound, forbidden, serverError } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";

type Params = { userId: string };

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId } = params as Params;

  // Self or admin can view
  const isSelf = ctx.session.userId === userId;
  const isAdmin = hasRoleOrAbove(ctx.session.effectiveRoleCodes, "org_admin");
  if (!isSelf && !isAdmin) return forbidden("You may only view your own profile.");

  const profile = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), eq(profiles.orgId, ctx.session.orgId)),
    columns: {
      id: true,
      email: true,
      displayName: true,
      displayNameHi: true,
      phone: true,
      isActive: true,
      isEmailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!profile) return notFound("User not found.");

  // Load role assignments
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
    })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(eq(userRoleAssignments.userId, userId));

  return apiSuccess({ ...profile, roleAssignments: assignments });
});

// ── PATCH ─────────────────────────────────────────────────────────────────────
export const PATCH = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId } = params as Params;

  const isSelf = ctx.session.userId === userId;
  const isAdmin = hasRoleOrAbove(ctx.session.effectiveRoleCodes, "org_admin");
  if (!isSelf && !isAdmin) return forbidden("You may only update your own profile.");

  // Non-admins cannot change isActive
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  // Only org_admin can toggle isActive
  if (input.isActive !== undefined && !isAdmin) {
    return forbidden("Only administrators can change account active status.");
  }

  const existing = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), eq(profiles.orgId, ctx.session.orgId)),
    columns: { id: true },
  });
  if (!existing) return notFound("User not found.");

  const [updated] = await db
    .update(profiles)
    .set({
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.displayNameHi !== undefined && { displayNameHi: input.displayNameHi }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning({
      id: profiles.id,
      email: profiles.email,
      displayName: profiles.displayName,
      isActive: profiles.isActive,
      updatedAt: profiles.updatedAt,
    });

  if (!updated) return serverError("Failed to update user.");

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "user.updated",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "profile",
      entityId: userId,
      payload: input as Record<string, unknown>,
      changeSummary: `Profile updated for ${updated.email}.`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} updated profile for ${updated.email}.`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return apiSuccess(updated);
});
