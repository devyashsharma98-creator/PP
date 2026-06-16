import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest } from "@/lib/response";
import { createSessionSpeakerSchema } from "@/lib/validators/conferences";
import * as conferenceService from "@/lib/server/services/conference-service";

export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as unknown as { conferenceId: string; sessionId: string };
  if (!p?.sessionId) return badRequest("Session ID is required.");
  const result = await conferenceService.listSpeakers(p.sessionId);
  if (!result.ok) return result.response;
  return apiSuccess(result.data.rows);
});

export const POST = withPermission("canManageConferenceSpeakers", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as unknown as { conferenceId: string; sessionId: string };
  if (!p?.sessionId) return badRequest("Session ID is required.");
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = createSessionSpeakerSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await conferenceService.createSpeaker(p.sessionId, parsed.data, ctx);
  if (!result.ok) return result.response;
  return apiCreated(result.data);
});

function apiSuccess<T>(data: T) { return Response.json({ success: true, data }); }
function apiCreated<T>(data: T) { return Response.json({ success: true, data }, { status: 201 }); }
