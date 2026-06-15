/**
 * GET    /api/v1/users/[userId]  — Get user profile (org_admin or self)
 * PATCH  /api/v1/users/[userId]  — Update user profile (org_admin or self)
 * DELETE /api/v1/users/[userId]  — Permanently delete a user account (org_admin+)
 */
import "server-only";

import { NextRequest } from "next/server";

import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { hasRoleOrAbove } from "@/lib/permissions";
import { updateUserSchema } from "@/lib/validators/users";
import { apiSuccess, badRequest, forbidden } from "@/lib/response";
import { getUserProfile, updateUserProfile, deleteUser as deleteUserService } from "@/lib/server/services/user-service";

type Params = { userId: string };

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId } = params as Params;

  const isSelf = ctx.session.userId === userId;
  const isAdmin = hasRoleOrAbove(ctx.session.effectiveRoleCodes, "org_admin");
  if (!isSelf && !isAdmin) return forbidden("You may only view your own profile.");

  const result = await getUserProfile(userId, ctx.session.orgId);
  if (result instanceof Response) return result;

  return apiSuccess({ ...result.profile, roleAssignments: result.roleAssignments });
});

// ── PATCH ──────────────────────────────────────────────────────────────────────
export const PATCH = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId } = params as Params;

  const isSelf = ctx.session.userId === userId;
  const isAdmin = hasRoleOrAbove(ctx.session.effectiveRoleCodes, "org_admin");
  if (!isSelf && !isAdmin) return forbidden("You may only update your own profile.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  if (input.isActive !== undefined && !isAdmin) {
    return forbidden("Only administrators can change account active status.");
  }

  const result = await updateUserProfile(
    userId,
    ctx.session.orgId,
    input,
    ctx.session.userId,
    ctx.session.email,
    ctx.session.displayName,
    ip,
  );

  if (result instanceof Response) return result;
  return apiSuccess(result);
});

// ── DELETE ─────────────────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId } = params as Params;

  const isAdmin = hasRoleOrAbove(ctx.session.effectiveRoleCodes, "org_admin");
  if (!isAdmin) return forbidden("Only administrators can delete accounts.");

  // Prevent self-deletion
  if (ctx.session.userId === userId) {
    return forbidden("You cannot delete your own account. Ask another administrator to do this.");
  }

  const result = await deleteUserService(
    userId,
    ctx.session.orgId,
    ctx.session.userId,
    ctx.session.email,
    ctx.session.displayName,
    ip,
  );

  if (result instanceof Response) return result;
  return apiSuccess(result);
});
