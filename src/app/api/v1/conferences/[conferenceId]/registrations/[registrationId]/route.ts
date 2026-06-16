import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest, apiSuccess } from "@/lib/response";
import * as conferenceService from "@/lib/server/services/conference-service";

export const PATCH = withPermission("canManageConference", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as unknown as { conferenceId: string; registrationId: string };
  if (!p?.registrationId) return badRequest("Registration ID is required.");
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const attended = body?.isAttended;
  if (typeof attended !== "boolean") return badRequest("isAttended boolean is required.");
  const result = await conferenceService.markAttendance(p.registrationId, attended, ctx);
  if (!result.ok) return result.response;
  return apiSuccess(result.data);
});
