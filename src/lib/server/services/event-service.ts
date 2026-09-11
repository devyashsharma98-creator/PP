/**
 * src/lib/server/services/event-service.ts
 *
 * Encapsulates DB operations and business logic for event-related API routes.
 * All functions return a Result<T> discriminated union so route handlers stay thin.
 */
import "server-only";

import { NextResponse } from "next/server";
import { and, eq, gte, lte, ilike, count, desc, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import {
  events,
  units,
  eventStatusHistory,
  eventPolls,
  eventPollOptions,
  eventPollVotes,
  eventVritt,
  notifications,
  eventFormConfigs,
  eventFormQuestions,
} from "@/db/schema/index";
import { auditAndActivity, writeAuditLog } from "@/lib/audit";
import type { EventStatus } from "@/lib/permissions/event-workflow";
import { validateEventTransition } from "@/lib/permissions/event-workflow";
import type { ScopedAccess } from "@/lib/app/scope";
import { vrittFieldPolicy } from "@/lib/app/vritt-access";
import { commitCriticalTransition } from "@/lib/app/critical-transition";
import type { AuthContext } from "@/lib/middleware/with-auth";
import {
  hasRoleOrAbove,
} from "@/lib/permissions";
import type {
  CreateEventInput,
  ListEventsQuery,
  CreatePollInput,
  Checklist,
} from "@/lib/validators/events";
import type { InferSelectModel } from "drizzle-orm";
import {
  apiSuccess,
  apiCreated,
  badRequest,
  forbidden,
  serverError,
  notFound,
  conflict,
} from "@/lib/response";

// ── Result type ───────────────────────────────────────────────────────────────

type Result<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

function err(response: NextResponse): Result<never> {
  return { ok: false, response };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Cyclomatic: 5, Cognitive: 8
 * Build the WHERE clause conditions for listing events.
 */
function buildEventWhereConditions(
  q: ListEventsQuery,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
): SQL<unknown> | undefined {
  const conditions: SQL<unknown>[] = [eq(events.orgId, orgId)];

  if (q.status) conditions.push(eq(events.status, q.status as EventStatus));
  if (q.unitId) conditions.push(eq(events.unitId, q.unitId));
  if (q.departmentId) conditions.push(eq(events.departmentId, q.departmentId));
  if (q.fromDate) conditions.push(gte(events.startsAt, new Date(q.fromDate)));
  if (q.toDate) conditions.push(lte(events.startsAt, new Date(q.toDate)));
  if (q.search) conditions.push(ilike(events.title, `%${q.search}%`));

  if (!scopedAccess.orgWide) {
    const scopeConditions: SQL<unknown>[] = [eq(events.createdBy, userId)];
    if (scopedAccess.unitIds.size > 0) scopeConditions.push(inArray(events.unitId, [...scopedAccess.unitIds]));
    if (scopedAccess.departmentIds.size > 0) scopeConditions.push(inArray(events.departmentId, [...scopedAccess.departmentIds]));
    if (scopedAccess.eventIds.size > 0) scopeConditions.push(inArray(events.id, [...scopedAccess.eventIds]));
    const scopeClause = or(...scopeConditions);
    if (scopeClause) conditions.push(scopeClause);
  }

  return and(...conditions);
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Cyclomatic: 2, Cognitive: 4
 * List events with filters, joins, and pagination.
 */
export async function listEvents(
  q: ListEventsQuery,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  page: number,
  limit: number,
  offset: number,
): Promise<Result<{ rows: unknown[]; total: number }>> {
  const whereClause = buildEventWhereConditions(q, orgId, scopedAccess, userId);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        status: events.status,
        unitId: events.unitId,
        unitName: units.name,
        departmentId: events.departmentId,
        submittedByNameSnapshot: events.submittedByNameSnapshot,
        checklist: events.checklist,
        metadata: events.metadata,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        // Status only — content is fetched per event when the report is opened.
        vrittStatus: eventVritt.status,
      })
      .from(events)
      .leftJoin(units, eq(events.unitId, units.id))
      .leftJoin(eventVritt, eq(eventVritt.eventId, events.id))
      .where(whereClause)
      .orderBy(desc(events.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ value: count() }).from(events).where(whereClause),
  ]);

  const total = Number(totalRow[0]?.value ?? 0);
  return ok({ rows, total });
}

/**
 * Cyclomatic: 3, Cognitive: 5
 * Create a new event and seed its initial status history.
 */
export async function createEvent(
  input: Omit<CreateEventInput, "unitId" | "departmentId"> & { unitId: string | null; departmentId: string | null },
  ctx: AuthContext,
): Promise<Result<{ id: string; title: string; status: string; startsAt: Date | null; createdAt: Date }>> {
  const [newEvent] = await db
    .insert(events)
    .values({
      orgId: ctx.session.orgId,
      unitId: input.unitId,
      departmentId: input.departmentId,
      locationId: input.locationId ?? null,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      status: "draft",
      submittedByNameSnapshot: ctx.session.displayName ?? ctx.session.email,
      checklist: input.checklist ?? {},
      metadata: input.metadata ?? null,
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

  if (!newEvent) return err(serverError("Failed to create event."));

  const actorName = ctx.session.displayName ?? ctx.session.email;
  await db.insert(eventStatusHistory).values({
    eventId: newEvent.id,
    fromStatus: null,
    toStatus: "draft",
    actorUserId: ctx.session.userId,
    actorNameSnapshot: actorName,
    notes: "Event created.",
  });

  return ok(newEvent);
}

/**
 * Cyclomatic: 2, Cognitive: 3
 * Emit audit log and activity feed entry for event creation.
 */
export async function auditEventCreated(
  ctx: AuthContext,
  event: { id: string; title: string },
  ip: string,
): Promise<void> {
  const actorName = ctx.session.displayName ?? ctx.session.email;
  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "event.created",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip ?? undefined,
      entityType: "event",
      entityId: event.id,
      changeSummary: `Event created: "${event.title}".`,
    },
    {
      summary: `${actorName} created event: "${event.title}".`,
      actorNameSnapshot: actorName,
    }
  );
}

/**
 * Cyclomatic: 2, Cognitive: 4
 * Fetch polls for an event with computed vote counts.
 */
export async function getEventPolls(eventId: string): Promise<Result<unknown[]>> {
  const polls = await db.query.eventPolls.findMany({
    where: eq(eventPolls.eventId, eventId),
    with: {
      options: {
        orderBy: (o, { asc }) => [asc(o.displayOrder)],
        with: { votes: { columns: { id: true } } },
      },
    },
  });

  const pollsWithCounts = polls.map((poll) => ({
    ...poll,
    options: poll.options.map((opt) => ({
      id: opt.id,
      label: opt.label,
      labelHi: opt.labelHi,
      scheduledAt: opt.scheduledAt,
      displayOrder: opt.displayOrder,
      voteCount: opt.votes.length,
    })),
    totalVotes: poll.options.reduce((sum, opt) => sum + opt.votes.length, 0),
  }));

  return ok(pollsWithCounts);
}

/**
 * Cyclomatic: 3, Cognitive: 5
 * Create a poll with options for an event.
 */
export async function createEventPoll(
  eventId: string,
  input: CreatePollInput,
  ctx: AuthContext,
  ip: string,
): Promise<Result<{ pollId: string; question: string }>> {
  const [newPoll] = await db
    .insert(eventPolls)
    .values({
      eventId,
      question: input.question,
      questionHi: input.questionHi ?? null,
      pollType: input.pollType,
      createdBy: ctx.session.userId,
    })
    .returning({ id: eventPolls.id, question: eventPolls.question });

  if (!newPoll) return err(serverError("Failed to create poll."));

  await db.insert(eventPollOptions).values(
    input.options.map((opt, idx) => ({
      pollId: newPoll.id,
      label: opt.label,
      labelHi: opt.labelHi ?? null,
      scheduledAt: opt.scheduledAt ? new Date(opt.scheduledAt) : null,
      displayOrder: opt.displayOrder ?? idx,
    }))
  );

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "poll.created",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: eventId,
      changeSummary: `Poll created: "${input.question}".`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} added a poll to event.`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return ok({ pollId: newPoll.id, question: newPoll.question });
}

/**
 * Cyclomatic: 2, Cognitive: 3
 * Validate that an event exists and allows poll creation.
 */
export async function validateEventForPollCreation(
  eventId: string,
  orgId: string,
): Promise<Result<{ id: string; status: string }>> {
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, orgId)),
    columns: { id: true, status: true },
  });
  if (!event) return err(notFound("Event not found."));
  if (event.status === "cancelled" || event.status === "rejected") {
    return err(forbidden("Cannot add polls to a cancelled or rejected event."));
  }
  return ok(event);
}

/**
 * Cyclomatic: 3, Cognitive: 5
 * Cast a vote on an event poll.
 */
export async function castEventPollVote(
  eventId: string,
  pollId: string,
  optionId: string,
  userId: string,
  ip: string,
  userAgent: string | null,
): Promise<Result<{ pollId: string; optionId: string; voted: true }>> {
  const poll = await db.query.eventPolls.findFirst({
    where: eq(eventPolls.id, pollId),
    columns: { id: true, eventId: true, isFinalized: true },
    with: { options: { columns: { id: true } } },
  });
  if (!poll || poll.eventId !== eventId) return err(notFound("Poll not found."));
  if (poll.isFinalized) return err(forbidden("This poll has been finalized and is no longer accepting votes."));

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return err(badRequest("Option ID does not belong to this poll."));

  const [insertedVote] = await db
    .insert(eventPollVotes)
    .values({
      pollId,
      optionId,
      submittedBy: userId,
      submittedFromIp: ip,
      submittedUserAgent: userAgent,
    })
    .onConflictDoNothing()
    .returning({ id: eventPollVotes.id });

  if (!insertedVote) return err(conflict("You have already voted on this poll."));

  return ok({ pollId, optionId, voted: true });
}

/**
 * Cyclomatic: 4, Cognitive: 6
 * Finalize an event poll and set the winning option.
 */
export async function finalizeEventPoll(
  eventId: string,
  pollId: string,
  winnerOptionId: string,
  ctx: AuthContext,
  ip: string,
): Promise<Result<{ pollId: string; finalized: true; winnerOptionId: string }>> {
  if (!hasRoleOrAbove(ctx.session.effectiveRoleCodes, "aayam_pramukh")) {
    return err(forbidden("Finalizing a poll requires at least Aayam Pramukh role."));
  }

  const poll = await db.query.eventPolls.findFirst({
    where: eq(eventPolls.id, pollId),
    columns: { id: true, eventId: true, isFinalized: true },
    with: { options: { columns: { id: true } } },
  });
  if (!poll || poll.eventId !== eventId) return err(notFound("Poll not found."));
  if (poll.isFinalized) return err(conflict("This poll has already been finalized."));

  const winnerOption = poll.options.find((o) => o.id === winnerOptionId);
  if (!winnerOption) return err(badRequest("Winner option ID does not belong to this poll."));

  await db
    .update(eventPolls)
    .set({ isFinalized: true, winnerOptionId, updatedAt: new Date() })
    .where(eq(eventPolls.id, pollId));

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "poll.finalized",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: eventId,
      changeSummary: `Poll finalized. Winner option: ${winnerOptionId}.`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} finalized a poll.`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  const [eventRow] = await db
    .select({ title: events.title, createdBy: events.createdBy })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (eventRow?.createdBy && eventRow.createdBy !== ctx.session.userId) {
    await db.insert(notifications).values({
      orgId: ctx.session.orgId,
      recipientUserId: eventRow.createdBy,
      kind: "poll_finalized",
      title: "Poll finalized for your event",
      body: `A poll for "${eventRow.title}" has been finalized.`,
      entityType: "event",
      entityId: eventId,
      metadata: { pollId, winnerOptionId },
    });
  }

  return ok({ pollId, finalized: true, winnerOptionId });
}

/**
 * Write a vritt, conditional on the status the caller was authorized against.
 *
 * `expectedCurrent` is the status the authorization decision was made on (null
 * when no vritt existed). It is part of the statement's WHERE clause, so a
 * report that a reviewer submitted or signed off in the meantime cannot be
 * overwritten by a write authorized against the older state. A stale write
 * matches no row and is reported as a conflict rather than silently winning.
 */
export async function upsertEventVritt(
  eventId: string,
  input: {
    content?: string;
    contentHi?: string;
    attendanceCount?: number;
    mediaUrls?: string[];
    status: "draft" | "submitted" | "reviewed";
    reviewNotes?: string;
  },
  eventTitle: string,
  ctx: AuthContext,
  ip: string,
  expectedCurrent: "draft" | "submitted" | "reviewed" | null,
): Promise<Result<unknown>> {
  const policy = vrittFieldPolicy(expectedCurrent, input.status);

  // Which content fields this request actually carries. A field the caller did
  // not send must survive the write: submitting a report used to null out its
  // own text, attendance and media because the payload only named a status.
  const hasContent = policy.contentWritable && input.content !== undefined;
  const hasContentHi = policy.contentWritable && input.contentHi !== undefined;
  const hasAttendance = policy.contentWritable && input.attendanceCount !== undefined;
  const hasMedia = policy.contentWritable && input.mediaUrls !== undefined;
  const hasReviewNotes = policy.reviewNotesWritable && input.reviewNotes !== undefined;

  const result = await db.execute(sql`
    INSERT INTO event_vritt
      (event_id, content, content_hi, attendance_count, media_urls, status,
       submitted_by, reviewed_by, review_notes)
    SELECT ${eventId}::uuid,
           ${hasContent ? input.content : null},
           ${hasContentHi ? input.contentHi : null},
           ${hasAttendance ? input.attendanceCount : null},
           ${JSON.stringify(hasMedia ? input.mediaUrls : [])}::jsonb,
           ${input.status}::vritt_status,
           ${policy.setSubmittedBy ? ctx.session.userId : null}::uuid,
           ${policy.setReviewedBy ? ctx.session.userId : null}::uuid,
           ${hasReviewNotes ? input.reviewNotes : null}
     -- The candidate row must exist for ON CONFLICT to be reached at all.
     -- When no vritt exists yet we insert; when one does, we fall through to
     -- the guarded update below. If the caller expected a vritt that has since
     -- vanished, neither branch runs and the write is reported as a conflict.
     WHERE ${expectedCurrent === null}
        OR EXISTS (SELECT 1 FROM event_vritt WHERE event_id = ${eventId}::uuid)
    ON CONFLICT (event_id) DO UPDATE
       -- Each column is written only when this request both may change it and
       -- actually supplied it; otherwise the stored value is kept.
       SET content          = CASE WHEN ${hasContent}     THEN EXCLUDED.content
                                   ELSE event_vritt.content END,
           content_hi       = CASE WHEN ${hasContentHi}   THEN EXCLUDED.content_hi
                                   ELSE event_vritt.content_hi END,
           attendance_count = CASE WHEN ${hasAttendance}  THEN EXCLUDED.attendance_count
                                   ELSE event_vritt.attendance_count END,
           media_urls       = CASE WHEN ${hasMedia}       THEN EXCLUDED.media_urls
                                   ELSE event_vritt.media_urls END,
           status           = EXCLUDED.status,
           submitted_by     = CASE WHEN ${policy.setSubmittedBy} THEN EXCLUDED.submitted_by
                                   ELSE event_vritt.submitted_by END,
           reviewed_by      = CASE WHEN ${policy.setReviewedBy}  THEN EXCLUDED.reviewed_by
                                   ELSE event_vritt.reviewed_by END,
           review_notes     = CASE WHEN ${hasReviewNotes} THEN EXCLUDED.review_notes
                                   ELSE event_vritt.review_notes END,
           updated_at       = now()
     WHERE event_vritt.status = ${expectedCurrent}::vritt_status
    RETURNING id, event_id, content, content_hi, attendance_count, media_urls,
              status, submitted_by, reviewed_by, review_notes, created_at, updated_at
  `);

  const rows = (result as unknown as { rows?: unknown[] }).rows ?? (result as unknown as unknown[]);
  const updated = Array.isArray(rows) ? rows[0] : undefined;

  if (!updated) {
    return err(
      conflict(
        "This vritt has changed since you opened it. Reload the report and try again.",
      ),
    );
  }

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "event.vritt_updated",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: eventId,
      payload: { fromStatus: expectedCurrent, toStatus: input.status, contentChanged: hasContent || hasContentHi },
      changeSummary: `Vritt ${expectedCurrent === null ? "created" : "updated"} for event: "${eventTitle}". Status: ${input.status}.`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} updated event vritt for "${eventTitle}".`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return ok(updated);
}

/**
 * Cyclomatic: 4, Cognitive: 7
 * Transition an event through the workflow state machine.
 */
export async function transitionEventWorkflow(
  eventId: string,
  event: {
    id: string;
    title: string;
    status: string;
    unitId: string | null;
    departmentId: string | null;
    createdBy: string | null;
  },
  toStatus: string,
  notes: string | undefined,
  ctx: AuthContext,
  ip: string,
): Promise<Result<{ eventId: string; fromStatus: string; toStatus: string; updatedAt: Date; notes: string | null }>> {
  const transitionError = validateEventTransition(
    event.status as EventStatus,
    toStatus as EventStatus,
    ctx.session.effectiveRoleCodes,
    notes
  );
  if (transitionError) return err(forbidden(transitionError));

  const fromStatus = event.status as EventStatus;
  const actorName = ctx.session.displayName ?? ctx.session.email;

  // Notify the event's creator, unless they are the one acting.
  const recipientId =
    event.createdBy && event.createdBy !== ctx.session.userId ? event.createdBy : null;
  const notificationTitle = `Event status updated: ${toStatus.replace(/_/g, " ")}`;
  const notificationBody = `Your event "${event.title}" has moved to: ${toStatus.replace(/_/g, " ")}${notes ? ` — ${notes}` : ""}`;
  const notificationMetadata = JSON.stringify({ fromStatus, toStatus, notes: notes ?? null });

  const outcome = await commitCriticalTransition<{
    id: string;
    title: string;
    status: string;
    updated_at: Date;
    history_rows: number;
    notification_rows: number;
  }>({
    expectedFrom: fromStatus,

    /**
     * One statement. The UPDATE carries the expected prior status, so a
     * concurrent transition out of the same state matches no row; the history
     * and notification INSERTs select FROM that UPDATE, so they cannot fire
     * without it and cannot be left behind if it fails. Postgres commits or
     * aborts the whole statement together.
     */
    run: async () => {
      const result = await db.execute(sql`
        WITH updated AS (
          UPDATE ${events}
             SET status = ${toStatus}::event_status,
                 updated_by = ${ctx.session.userId}::uuid,
                 updated_at = now()
           WHERE id = ${eventId}::uuid
             AND status = ${fromStatus}::event_status
          RETURNING id, title, status, updated_at
        ),
        history AS (
          INSERT INTO event_status_history
            (event_id, from_status, to_status, actor_user_id, actor_name_snapshot, notes)
          SELECT updated.id,
                 ${fromStatus}::event_status,
                 ${toStatus}::event_status,
                 ${ctx.session.userId}::uuid,
                 ${actorName},
                 ${notes ?? null}
            FROM updated
          RETURNING id
        ),
        notification AS (
          INSERT INTO notifications
            (org_id, recipient_user_id, kind, title, body, entity_type, entity_id, metadata)
          SELECT ${ctx.session.orgId}::uuid,
                 ${recipientId}::uuid,
                 'event_status_change'::notification_kind,
                 ${notificationTitle},
                 ${notificationBody},
                 'event',
                 updated.id,
                 ${notificationMetadata}::jsonb
            FROM updated
           WHERE ${recipientId}::uuid IS NOT NULL
          RETURNING id
        )
        SELECT updated.id,
               updated.title,
               updated.status,
               updated.updated_at,
               (SELECT count(*) FROM history)::int      AS history_rows,
               (SELECT count(*) FROM notification)::int AS notification_rows
          FROM updated
      `);

      const rows = (result as unknown as { rows?: unknown[] }).rows ?? (result as unknown as unknown[]);
      return (Array.isArray(rows) ? rows[0] : undefined) as never;
    },

    wroteNotification: (row) => Number(row.notification_rows) > 0,
  });

  if (outcome.status === "stale") {
    return err(
      conflict(
        `This event is no longer in '${fromStatus}'. Someone else has already moved it — reload and try again.`,
      ),
    );
  }

  if (outcome.status === "failed") {
    console.error("[event.workflow] transition failed", {
      eventId,
      fromStatus,
      toStatus,
      error: outcome.error,
    });
    return err(serverError("The status change could not be completed. No change was saved."));
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
      payload: {
        fromStatus,
        toStatus,
        notes,
        // Reports what the statement actually wrote, not what was intended.
        notificationWritten: outcome.notificationWritten,
        notificationExpected: recipientId !== null,
      },
      changeSummary: `Event "${event.title}" moved from '${fromStatus}' to '${toStatus}'.`,
    },
    {
      summary: `${actorName} moved event "${event.title}" to ${toStatus.replace(/_/g, " ")}.`,
      actorNameSnapshot: actorName,
      payload: { fromStatus, toStatus },
    }
  );

  return ok({
    eventId,
    fromStatus,
    toStatus,
    updatedAt: outcome.row.updated_at,
    notes: notes ?? null,
  });
}

/**
 * Cyclomatic: 2, Cognitive: 3
 * Retrieve an event's checklist.
 */
export async function getEventChecklist(
  eventId: string,
  orgId: string,
): Promise<Result<{ eventId: string; checklist: unknown }>> {
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, orgId)),
    columns: { id: true, checklist: true },
  });

  if (!event) return err(notFound("Event not found."));
  return ok({ eventId, checklist: event.checklist });
}

/**
 * Cyclomatic: 3, Cognitive: 5
 * Merge and persist an event's checklist.
 */
export async function updateEventChecklist(
  eventId: string,
  existingChecklist: Record<string, boolean>,
  newChecklist: Checklist,
  ctx: AuthContext,
  ip: string,
): Promise<Result<{ eventId: string; checklist: Record<string, boolean> }>> {
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

  return ok({ eventId, checklist: mergedChecklist });
}

/**
 * Cyclomatic: 5, Cognitive: 10
 * Clone an event including its form config and questions.
 */
export async function cloneEvent(
  sourceEventId: string,
  sourceEvent: {
    title: string;
    description: string | null;
    unitId: string | null;
    departmentId: string | null;
    locationId: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    checklist: unknown;
    metadata: unknown;
    formConfig?: InferSelectModel<typeof eventFormConfigs> | null;
    formQuestions?: InferSelectModel<typeof eventFormQuestions>[] | null;
  },
  ctx: AuthContext,
  ip: string,
): Promise<Result<{ id: string; title: string; status: string; startsAt: Date | null; createdAt: Date; sourceEventId: string }>> {
  const actorName = ctx.session.displayName ?? ctx.session.email;

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

  if (!newEvent) return err(serverError("Failed to clone event."));

  if (sourceEvent.formConfig) {
    await db.insert(eventFormConfigs).values({
      eventId: newEvent.id,
      isEnabled: sourceEvent.formConfig.isEnabled,
      isPublic: sourceEvent.formConfig.isPublic,
      collectPhone: sourceEvent.formConfig.collectPhone,
      collectCity: sourceEvent.formConfig.collectCity,
      collectAttendingCount: sourceEvent.formConfig.collectAttendingCount,
      collectSpecialNeeds: sourceEvent.formConfig.collectSpecialNeeds,
      collectNotes: sourceEvent.formConfig.collectNotes,
      allowMultipleSubmissions: sourceEvent.formConfig.allowMultipleSubmissions,
      maxRegistrations: sourceEvent.formConfig.maxRegistrations,
      opensAt: sourceEvent.formConfig.opensAt,
      closesAt: sourceEvent.formConfig.closesAt,
    });
  }

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
      }))
    );
  }

  await db.insert(eventStatusHistory).values({
    eventId: newEvent.id,
    fromStatus: null,
    toStatus: "draft",
    actorUserId: ctx.session.userId,
    actorNameSnapshot: actorName,
    notes: `Cloned from event "${sourceEvent.title}" (${sourceEventId}).`,
  });

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "event.cloned",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip ?? undefined,
      entityType: "event",
      entityId: newEvent.id,
      changeSummary: `Event cloned: "${newEvent.title}" from "${sourceEvent.title}" (${sourceEventId}).`,
    },
    {
      summary: `${actorName} cloned event: "${sourceEvent.title}" → "${newEvent.title}".`,
      actorNameSnapshot: actorName,
    }
  );

  return ok({ ...newEvent, sourceEventId });
}
