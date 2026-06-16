import "server-only";

import { NextRequest } from "next/server";

import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess } from "@/lib/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import * as taskService from "@/lib/server/services/task-service";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await taskService.getTaskboardData(ctx.session.orgId, scopedAccess, ctx.session.userId);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});
