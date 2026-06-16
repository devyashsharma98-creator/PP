import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createVolunteerActivitySchema } from "@/lib/validators/volunteers";
import { apiSuccess, apiCreated, badRequest, parsePagination, paginationMeta } from "@/lib/response";
import * as volunteerService from "@/lib/server/services/volunteer-service";

export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { volunteerId: string }; if (!p?.volunteerId) return badRequest("Volunteer ID is required.");
  const sp = req.nextUrl.searchParams;
  const { page, limit, offset } = parsePagination(sp);
  const result = await volunteerService.listActivities(p.volunteerId, page, limit, offset);
  if (!result.ok) return result.response;
  return apiSuccess(result.data.rows, { meta: paginationMeta(page, limit, result.data.total) });
});

export const POST = withPermission("canLogActivity", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { volunteerId: string }; if (!p?.volunteerId) return badRequest("Volunteer ID is required.");
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = createVolunteerActivitySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await volunteerService.createActivity(p.volunteerId, parsed.data, ctx);
  if (!result.ok) return result.response;
  return apiCreated(result.data);
});
