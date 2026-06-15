/**
 * GET  /api/v1/users/[userId]/roles  — List role assignments for a user
 * POST /api/v1/users/[userId]/roles  — Assign a new role to a user (org_admin+)
 * DELETE /api/v1/users/[userId]/roles — Remove a role assignment (org_admin+)
 */
import "server-only";

import { NextRequest } from "next/server";

import { withAuth, withRole, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { hasRoleOrAbove } from "@/lib/permissions";
import { assignRoleSchema } from "@/lib/validators/users";
import { apiSuccess, apiCreated, badRequest, forbidden } from "@/lib/response";
import { listUserRoleAssignments, assignRoleToUser } from "@/lib/server/services/user-service";

type Params = { userId: string };

export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId } = params as Params;

  const isSelf = ctx.session.userId === userId;
  const isAdmin = hasRoleOrAbove(ctx.session.effectiveRoleCodes, "org_admin");
  if (!isSelf && !isAdmin) return forbidden();

  const result = await listUserRoleAssignments(userId);
  return apiSuccess(result);
});

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

  const result = await assignRoleToUser(
    userId,
    ctx.session.orgId,
    parsed.data,
    ctx.session.userId,
    ctx.session.email,
    ctx.session.displayName,
    ip
  );

  if (result instanceof Response) return result;
  return apiCreated(result);
});
