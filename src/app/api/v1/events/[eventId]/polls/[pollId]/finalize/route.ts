import "server-only";

import { NextRequest } from "next/server";

import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { finalizePollSchema } from "@/lib/validators/events";
import { apiSuccess, badRequest } from "@/lib/response";
import { finalizeEventPoll } from "@/lib/server/services/event-service";

type Params = { eventId: string; pollId: string };

export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId, pollId } = params as Params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON.");
  }

  const parsed = finalizePollSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

  const result = await finalizeEventPoll(eventId, pollId, parsed.data.winnerOptionId, ctx, ip);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});
