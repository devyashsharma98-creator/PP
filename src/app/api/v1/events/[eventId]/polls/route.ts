/**
 * GET  /api/v1/events/[eventId]/polls       — List polls for an event
 * POST /api/v1/events/[eventId]/polls       — Create a poll (unit_head+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { events } from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createPollSchema } from "@/lib/validators/events";
import { apiSuccess, apiCreated, badRequest, notFound, serverError } from "@/lib/response";
import * as eventService from "@/lib/server/services/event-service";

type Params = { eventId: string };

// ── GET polls ───────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true },
  });
  if (!event) return notFound("Event not found.");

  const result = await eventService.getEventPolls(eventId);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});

// ── POST create poll ────────────────────────────────────────────────────────────
export const POST = withPermission("canManagePolls", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await eventService.validateEventForPollCreation(eventId, ctx.session.orgId);
  if (!event.ok) return event.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = createPollSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const result = await eventService.createEventPoll(eventId, input, ctx, ip);
  if (!result.ok) return result.response;

  return apiCreated(result.data);
});
