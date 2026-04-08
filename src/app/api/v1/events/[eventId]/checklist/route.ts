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
import { writeAuditLog } from "@/lib/audit";

type Params = { eventId: string };

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, title: true, checklist: true, status: true },
  });

  if (!event) return notFound("Event not found.");

  return apiSuccess({ eventId, checklist: event.checklist });
});

// ── PATCH ─────────────────────────────────────────────────────────────────────
export const PATCH = withPermission("canUpdateEvent", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, checklist: true, status: true, createdBy: true },
  });
  if (!event) return notFound("Event not found.");

  // Cannot edit checklist of cancelled/rejected events
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

  // Merge with existing checklist
  const existingChecklist = (event.checklist as Record<string, boolean>) ?? {};
  const mergedChecklist = { ...existingChecklist, ...newChecklist };

  await db
    .update(events)
    .set({ checklist: mergedChecklist, updatedAt: new Date(), updatedBy: ctx.session.userId })
    .where(eq(events.id, eventId));

  await writeAuditLog({
    orgId: ctx.session.orgId,
    action: "event.checklist_updated",
    actorUserId: ctx.session.userId,
    actorEmail: ctx.session.email,
    actorIp: ip,
    entityType: "event",
    entityId: eventId,
    payload: { checklist: mergedChecklist },
    changeSummary: "Logistics checklist updated.",
  });

  return apiSuccess({ eventId, checklist: mergedChecklist });
});
