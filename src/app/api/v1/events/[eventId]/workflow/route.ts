/**
 * POST /api/v1/events/[eventId]/workflow
 *
 * Trigger a workflow status transition on an event.
 * The full event state machine is enforced here.
 *
 * Body: { toStatus: EventStatus, notes?: string }
 *
 * On success: returns the updated event with new status + history entry.
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { events, eventStatusHistory, notifications } from "@/db/schema/index";
import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { validateEventTransition } from "@/lib/permissions/event-workflow";
import { eventWorkflowSchema } from "@/lib/validators/events";
import { apiSuccess, badRequest, notFound, forbidden, serverError } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";
import type { EventStatus } from "@/lib/permissions/event-workflow";

type Params = { eventId: string };

export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = eventWorkflowSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const { toStatus, notes } = parsed.data;

  // Load event
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, title: true, status: true, unitId: true, createdBy: true },
  });
  if (!event) return notFound("Event not found.");

  // Validate transition through state machine
  const transitionError = validateEventTransition(
    event.status as EventStatus,
    toStatus as EventStatus,
    ctx.session.effectiveRoleCodes,
    notes
  );
  if (transitionError) return forbidden(transitionError);

  // Execute transition
  const now = new Date();
  const [updated] = await db
    .update(events)
    .set({
      status: toStatus as EventStatus,
      updatedBy: ctx.session.userId,
      updatedAt: now,
    })
    .where(eq(events.id, eventId))
    .returning({ id: events.id, title: events.title, status: events.status, updatedAt: events.updatedAt });

  if (!updated) return serverError("Failed to update event status.");

  // Record history (immutable)
  await db.insert(eventStatusHistory).values({
    eventId,
    fromStatus: event.status as EventStatus,
    toStatus: toStatus as EventStatus,
    actorUserId: ctx.session.userId,
    actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    notes: notes ?? null,
  });

  // Notify the event creator if they're not the one transitioning
  if (event.createdBy && event.createdBy !== ctx.session.userId) {
    await db.insert(notifications).values({
      orgId: ctx.session.orgId,
      recipientUserId: event.createdBy,
      kind: "event_status_change",
      title: `Event status updated: ${toStatus.replace(/_/g, " ")}`,
      body: `Your event "${event.title}" has moved to: ${toStatus.replace(/_/g, " ")}${notes ? ` — ${notes}` : ""}`,
      entityType: "event",
      entityId: eventId,
      metadata: { fromStatus: event.status, toStatus, notes },
    });
  }

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "event.status_changed",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: eventId,
      payload: { fromStatus: event.status, toStatus, notes },
      changeSummary: `Event "${event.title}" moved from '${event.status}' to '${toStatus}'.`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} moved event "${event.title}" to ${toStatus.replace(/_/g, " ")}.`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
      payload: { fromStatus: event.status, toStatus },
    }
  );

  return apiSuccess({
    eventId,
    fromStatus: event.status,
    toStatus,
    updatedAt: updated.updatedAt,
    notes: notes ?? null,
  });
});
