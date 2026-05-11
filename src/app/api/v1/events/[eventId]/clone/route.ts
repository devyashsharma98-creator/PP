/**
 * POST /api/v1/events/[eventId]/clone — Clone an event (unit_head+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/client";
import {
  events,
  eventFormConfigs,
  eventFormQuestions,
  eventStatusHistory,
} from "@/db/schema/index";
import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import { apiCreated, badRequest, notFound, forbidden, serverError } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";

type Params = { eventId: string };

export const POST = withPermission("canCreateEvent", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  // Validate UUID
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(eventId)) return badRequest("Invalid event ID.");

  // Fetch source event with form config and questions
  const sourceEvent = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    with: {
      formConfig: true,
      formQuestions: { orderBy: (q, { asc }) => [asc(q.displayOrder)] },
    },
  });

  if (!sourceEvent) return notFound("Event not found.");

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  if (!rowMatchesScope(scopedAccess, sourceEvent, ctx.session.userId)) {
    return forbidden("You do not have access to clone this event.");
  }

  const actorName = ctx.session.displayName ?? ctx.session.email;

  // 1. Create cloned event
  const [newEvent] = await db
    .insert(events)
    .values({
      orgId: ctx.session.orgId,
      unitId: sourceEvent.unitId,
      departmentId: sourceEvent.departmentId,
      locationId: sourceEvent.locationId,
      title: `${sourceEvent.title} (Copy)`,
      description: sourceEvent.description,
      startsAt: sourceEvent.startsAt,
      endsAt: sourceEvent.endsAt,
      status: "draft",
      submittedByNameSnapshot: actorName,
      checklist: sourceEvent.checklist ?? {},
      metadata: sourceEvent.metadata ?? null,
      createdBy: ctx.session.userId,
      updatedBy: ctx.session.userId,
    })
    .returning({
      id: events.id,
      title: events.title,
      status: events.status,
      startsAt: events.startsAt,
      createdAt: events.createdAt,
    });

  if (!newEvent) return serverError("Failed to clone event.");

  // 2. Clone form config if exists
  const sourceConfig = sourceEvent.formConfig;
  if (sourceConfig) {
    await db.insert(eventFormConfigs).values({
      eventId: newEvent.id,
      isEnabled: sourceConfig.isEnabled,
      isPublic: sourceConfig.isPublic,
      collectPhone: sourceConfig.collectPhone,
      collectCity: sourceConfig.collectCity,
      collectAttendingCount: sourceConfig.collectAttendingCount,
      collectSpecialNeeds: sourceConfig.collectSpecialNeeds,
      collectNotes: sourceConfig.collectNotes,
      allowMultipleSubmissions: sourceConfig.allowMultipleSubmissions,
      maxRegistrations: sourceConfig.maxRegistrations,
      opensAt: sourceConfig.opensAt,
      closesAt: sourceConfig.closesAt,
    });
  }

  // 3. Clone form questions
  if (sourceEvent.formQuestions?.length) {
    await db.insert(eventFormQuestions).values(
      sourceEvent.formQuestions.map((q) => ({
        eventId: newEvent.id,
        questionKey: q.questionKey,
        label: q.label,
        labelHi: q.labelHi,
        questionType: q.questionType,
        isRequired: q.isRequired,
        displayOrder: q.displayOrder,
        optionsJson: q.optionsJson,
      })),
    );
  }

  // 4. Seed initial status history
  await db.insert(eventStatusHistory).values({
    eventId: newEvent.id,
    fromStatus: null,
    toStatus: "draft",
    actorUserId: ctx.session.userId,
    actorNameSnapshot: actorName,
    notes: `Cloned from event "${sourceEvent.title}" (${eventId}).`,
  });

  // 5. Audit
  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "event.cloned",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip ?? undefined,
      entityType: "event",
      entityId: newEvent.id,
      changeSummary: `Event cloned: "${newEvent.title}" from "${sourceEvent.title}" (${eventId}).`,
    },
    {
      summary: `${actorName} cloned event: "${sourceEvent.title}" → "${newEvent.title}".`,
      actorNameSnapshot: actorName,
    }
  );

  return apiCreated({ ...newEvent, sourceEventId: eventId });
});
