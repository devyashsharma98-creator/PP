import "server-only";
import { NextRequest } from "next/server";
import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest } from "@/lib/response";
import * as surveyService from "@/lib/server/services/survey-service";

export const GET = withPermission("canViewSurveyResponses", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { surveyId: string };
  if (!p?.surveyId) return badRequest("Survey ID is required.");
  const result = await surveyService.listResponses(p.surveyId, ctx.session.orgId);
  if (!result.ok) return result.response;
  return Response.json({ success: true, data: { rows: result.data.rows } });
});
