import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest } from "@/lib/response";
import { updateSurveySchema } from "@/lib/validators/surveys";
import * as surveyService from "@/lib/server/services/survey-service";

export const GET = withPermission("canManageSurvey", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { surveyId: string };
  if (!p?.surveyId) return badRequest("Survey ID is required.");
  const result = await surveyService.getSurvey(p.surveyId, ctx.session.orgId);
  if (!result.ok) return result.response;
  return Response.json({ success: true, data: result.data });
});

export const PATCH = withPermission("canManageSurvey", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { surveyId: string };
  if (!p?.surveyId) return badRequest("Survey ID is required.");
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = updateSurveySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await surveyService.updateSurvey(p.surveyId, parsed.data, ctx);
  if (!result.ok) return result.response;
  return Response.json({ success: true, data: result.data });
});

export const DELETE = withPermission("canManageSurvey", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { surveyId: string };
  if (!p?.surveyId) return badRequest("Survey ID is required.");
  const result = await surveyService.deleteSurvey(p.surveyId, ctx);
  if (!result.ok) return result.response;
  return new Response(null, { status: 204 });
});
