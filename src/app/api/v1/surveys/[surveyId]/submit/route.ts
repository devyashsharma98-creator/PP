import "server-only";
import { NextRequest } from "next/server";
import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest } from "@/lib/response";
import { submitSurveySchema } from "@/lib/validators/surveys";
import * as surveyService from "@/lib/server/services/survey-service";

export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { surveyId: string };
  if (!p?.surveyId) return badRequest("Survey ID is required.");
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = submitSurveySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await surveyService.submitSurveyResponse(p.surveyId, parsed.data, ctx);
  if (!result.ok) return result.response;
  return Response.json({ success: true, data: result.data }, { status: 201 });
});
