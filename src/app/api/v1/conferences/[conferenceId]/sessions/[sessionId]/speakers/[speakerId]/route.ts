import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest } from "@/lib/response";
import { updateSessionSpeakerSchema } from "@/lib/validators/conferences";
import * as conferenceService from "@/lib/server/services/conference-service";

export const PATCH = withPermission("canManageConferenceSpeakers", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as unknown as { conferenceId: string; sessionId: string; speakerId: string };
  if (!p?.speakerId) return badRequest("Speaker ID is required.");
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = updateSessionSpeakerSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await conferenceService.updateSpeaker(p.speakerId, parsed.data, ctx);
  if (!result.ok) return result.response;
  return apiSuccess(result.data);
});

export const DELETE = withPermission("canManageConferenceSpeakers", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as unknown as { conferenceId: string; sessionId: string; speakerId: string };
  if (!p?.speakerId) return badRequest("Speaker ID is required.");
  const result = await conferenceService.deleteSpeaker(p.speakerId, ctx);
  if (!result.ok) return result.response;
  return new Response(null, { status: 204 });
});

function apiSuccess<T>(data: T) { return Response.json({ success: true, data }); }
