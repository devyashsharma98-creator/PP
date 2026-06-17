import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest, parsePagination } from "@/lib/response";
import { createSurveySchema, listSurveysQuerySchema } from "@/lib/validators/surveys";
import * as surveyService from "@/lib/server/services/survey-service";

export const GET = withPermission("canManageSurvey", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const url = new URL(req.url);
  const q = listSurveysQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!q.success) return badRequest(q.error.errors[0]?.message ?? "Invalid query.");
  const { page, limit, offset } = parsePagination(url.searchParams, { page: q.data.page, limit: q.data.limit });
  const result = await surveyService.listSurveys(q.data, ctx.session.orgId, page, limit, offset);
  if (!result.ok) return result.response;
  return Response.json({ success: true, data: { rows: result.data.rows, total: result.data.total, page, limit } });
});

export const POST = withPermission("canCreateSurvey", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = createSurveySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await surveyService.createSurvey(parsed.data, ctx);
  if (!result.ok) return result.response;
  return Response.json({ success: true, data: result.data }, { status: 201 });
});
