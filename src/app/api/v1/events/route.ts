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

  // Scope: karyakarta can only see their unit's events
  const conditions: SQL<unknown>[] = [eq(events.orgId, ctx.session.orgId)];

  if (q.status) conditions.push(eq(events.status, q.status as EventStatus));
  if (q.unitId) conditions.push(eq(events.unitId, q.unitId));
  if (q.departmentId) conditions.push(eq(events.departmentId, q.departmentId));
  if (q.fromDate) conditions.push(gte(events.startsAt, new Date(q.fromDate)));
  if (q.toDate) conditions.push(lte(events.startsAt, new Date(q.toDate)));
  if (q.search) conditions.push(ilike(events.title, `%${q.search}%`));

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  if (!scopedAccess.orgWide) {
    const scopeConditions: SQL<unknown>[] = [eq(events.createdBy, ctx.session.userId)];
    if (scopedAccess.unitIds.size > 0) scopeConditions.push(inArray(events.unitId, [...scopedAccess.unitIds]));
    if (scopedAccess.departmentIds.size > 0) scopeConditions.push(inArray(events.departmentId, [...scopedAccess.departmentIds]));
    if (scopedAccess.eventIds.size > 0) scopeConditions.push(inArray(events.id, [...scopedAccess.eventIds]));
    const scopeClause = or(...scopeConditions);
    if (scopeClause) conditions.push(scopeClause);
  }

  const whereClause = and(...conditions);

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

  // Initial status history entry
  await db.insert(eventStatusHistory).values({
    eventId: newEvent.id,
    fromStatus: null,
    toStatus: "draft",
    actorUserId: ctx.session.userId,
    actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    notes: "Event created.",
  });

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "event.created",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: newEvent.id,
      changeSummary: `Event created: "${input.title}".`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} created event: "${input.title}".`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return apiCreated(newEvent);
});
