/**
 * GET  /api/v1/events  — List events with filters + pagination
 * POST /api/v1/events  — Create a new event (unit_head+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq, gte, lte, ilike, count, desc, inArray, or, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { events, eventStatusHistory, units } from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createEventSchema, listEventsQuerySchema } from "@/lib/validators/events";
import {
  apiSuccess, apiCreated, badRequest, forbidden, serverError,
  parsePagination, paginationMeta,
} from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";
import type { EventStatus } from "@/lib/permissions/event-workflow";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";

/**
 * Build the WHERE clause conditions for listing events.
 * Extracted to reduce cognitive complexity of the GET handler.
 */
function buildEventWhereConditions(
  q: ReturnType<typeof listEventsQuerySchema.parse>,
  orgId: string,
  scopedAccess: ReturnType<typeof resolveScopedAccess>,
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

/**
 * Persist the initial "draft" status history for a newly created event.
 */
async function insertEventStatusHistory(
  eventId: string,
  userId: string,
  actorName: string,
) {
  await db.insert(eventStatusHistory).values({
    eventId,
    fromStatus: null,
    toStatus: "draft",
    actorUserId: userId,
    actorNameSnapshot: actorName,
    notes: "Event created.",
  });
}

/**
 * Emit audit log and activity feed entry for event creation.
 */
async function auditEventCreated(
  ctx: Parameters<Parameters<typeof withPermission>[1]>[1],
  event: { id: string; title: string },
  ip: string | null,
) {
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

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const sp = req.nextUrl.searchParams;
  const query = listEventsQuerySchema.safeParse(Object.fromEntries(sp));
  if (!query.success) return badRequest(query.error.errors[0]?.message ?? "Invalid query.");
  const q = query.data;

  const { page, limit, offset } = parsePagination(sp, { page: q.page, limit: q.limit });

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const whereClause = buildEventWhereConditions(q, ctx.session.orgId, scopedAccess, ctx.session.userId);

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
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .leftJoin(units, eq(events.unitId, units.id))
      .where(whereClause)
      .orderBy(desc(events.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ value: count() }).from(events).where(whereClause),
  ]);

  const total = Number(totalRow[0]?.value ?? 0);

  return apiSuccess(rows, { meta: paginationMeta(page, limit, total) });
});

// ── POST ──────────────────────────────────────────────────────────────────────
export const POST = withPermission("canCreateEvent", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  // Default unitId to the creator's unit if not provided
  const unitId = input.unitId ?? ctx.session.unitId ?? null;
  const departmentId = input.departmentId ?? ctx.session.departmentId ?? null;
  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  if (!rowMatchesScope(scopedAccess, { unitId, departmentId, createdBy: ctx.session.userId }, ctx.session.userId)) {
    return forbidden("You cannot create an event outside your assigned scope.");
  }

  const [newEvent] = await db
    .insert(events)
    .values({
      orgId: ctx.session.orgId,
      unitId,
      departmentId,
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

  if (!newEvent) return serverError("Failed to create event.");

  const actorName = ctx.session.displayName ?? ctx.session.email;
  await insertEventStatusHistory(newEvent.id, ctx.session.userId, actorName);
  await auditEventCreated(ctx, newEvent, ip);

  return apiCreated(newEvent);
});
