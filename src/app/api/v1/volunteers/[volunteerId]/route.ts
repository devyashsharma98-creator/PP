import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { updateVolunteerProfileSchema } from "@/lib/validators/volunteers";
import { apiSuccess, badRequest } from "@/lib/response";
import * as volunteerService from "@/lib/server/services/volunteer-service";

export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { volunteerId: string }; if (!p?.volunteerId) return badRequest("Volunteer ID is required.");
  const result = await volunteerService.getVolunteer(p.volunteerId, ctx.session.orgId);
  if (!result.ok) return result.response;
  return apiSuccess(result.data);
});

export const PATCH = withPermission("canManageVolunteers", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { volunteerId: string }; if (!p?.volunteerId) return badRequest("Volunteer ID is required.");
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = updateVolunteerProfileSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await volunteerService.updateVolunteerProfile(p.volunteerId, parsed.data, ctx);
  if (!result.ok) return result.response;
  return apiSuccess(result.data);
});
