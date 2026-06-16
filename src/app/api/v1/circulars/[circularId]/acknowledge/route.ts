import "server-only";
import { NextRequest } from "next/server";
import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, apiCreated, badRequest } from "@/lib/response";
import * as circularService from "@/lib/server/services/circular-service";

export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { circularId: string }; if (!p?.circularId) return badRequest("Circular ID is required.");
  const result = await circularService.acknowledgeCircular(p.circularId, ctx.session.userId, ctx.session.orgId);
  if (!result.ok) return result.response;
  return apiCreated(result.data);
});
