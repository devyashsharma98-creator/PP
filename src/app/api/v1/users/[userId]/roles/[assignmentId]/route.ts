/**
 * DELETE /api/v1/users/[userId]/roles/[assignmentId] — Remove a role assignment (org_admin+)
 */
import "server-only";

import { NextRequest } from "next/server";

import { withRole, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess } from "@/lib/response";
import { removeRoleAssignment } from "@/lib/server/services/user-service";

type Params = { userId: string; assignmentId: string };

export const DELETE = withRole("org_admin", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { userId, assignmentId } = params as Params;

  const result = await removeRoleAssignment(
    userId,
    ctx.session.orgId,
    assignmentId,
    ctx.session.userId,
    ctx.session.email,
    ctx.session.displayName,
    ip
  );

  if (result instanceof Response) return result;
  return apiSuccess(result);
});
