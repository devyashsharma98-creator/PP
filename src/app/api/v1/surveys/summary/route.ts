import "server-only";
import { NextRequest } from "next/server";
import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import * as surveyService from "@/lib/server/services/survey-service";

export const GET = withPermission("canManageSurvey", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const result = await surveyService.getSurveySummary(ctx.session.orgId);
  if (!result.ok) return result.response;
  return Response.json({ success: true, data: result.data });
});
