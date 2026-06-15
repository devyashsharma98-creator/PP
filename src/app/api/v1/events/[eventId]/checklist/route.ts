/**
 * GET   /api/v1/events/[eventId]/checklist  — Get logistics checklist
 * PATCH /api/v1/events/[eventId]/checklist  — Update logistics checklist items
 *
 * Checklist tracks pre-event logistics:
 *   designing | food | seating | transport | accommodation |
 *   soundMic | camera | screen | lights
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { events } from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { checklistSchema } from "@/lib/validators/events";
import { apiSuccess, badRequest, notFound, forbidden } from "@/lib/response";
import * as eventService from "@/lib/server/services/event-service";

type Params = { eventId: string };

// ── GET ─────────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const result = await eventService.getEventChecklist(eventId, ctx.session.orgId);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});

// ── PATCH ───────────────────────────────────────────────────────────────────────
export const PATCH = withPermission("canUpdateEvent", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, checklist: true, status: true },
  });
  if (!event) return notFound("Event not found.");

  if (event.status === "cancelled" || event.status === "rejected") {
    return forbidden(`Cannot update checklist for an event with status '${event.status}'.`);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = checklistSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid checklist.");
  const newChecklist = parsed.data;

  const result = await eventService.updateEventChecklist(
    eventId,
    (event.checklist as Record<string, boolean>) ?? {},
    newChecklist,
    ctx,
    ip
  );
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});
