/**
 * POST /api/v1/events/[eventId]/polls/[pollId]/vote     — Cast a vote
 * POST /api/v1/events/[eventId]/polls/[pollId]/finalize — Finalize poll winner (aayam_pramukh+)
 */
import "server-only";

import { NextRequest } from "next/server";

import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { castVoteSchema, finalizePollSchema } from "@/lib/validators/events";
import { apiSuccess, badRequest } from "@/lib/response";
import {
  castEventPollVote,
  finalizeEventPoll,
} from "@/lib/server/services/event-service";

type Params = { eventId: string; pollId: string };

export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId, pollId } = params as Params;
  const url = req.nextUrl.pathname;
  const isFinalize = url.endsWith("/finalize");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON.");
  }

  if (isFinalize) {
    const parsed = finalizePollSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

    const result = await finalizeEventPoll(eventId, pollId, parsed.data.winnerOptionId, ctx, ip);
    if (!result.ok) return result.response;

    return apiSuccess(result.data);
  }

  const parsed = castVoteSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

  const result = await castEventPollVote(
    eventId,
    pollId,
    parsed.data.optionId,
    ctx.session.userId,
    ip,
    req.headers.get("user-agent") ?? null,
  );
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});
