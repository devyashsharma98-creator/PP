import "server-only";
import { NextRequest } from "next/server";
import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess } from "@/lib/response";
import * as circularService from "@/lib/server/services/circular-service";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const result = await circularService.getUnreadCount(ctx.session.orgId, ctx.session.userId);
  if (!result.ok) return result.response;
  return apiSuccess(result.data);
});
