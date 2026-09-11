/**
 * GET /api/v1/reminders — Deadlines the caller is entitled to be reminded about.
 *
 * Rows and counts are derived from the same authorized query, so the counts can
 * never hint at records the list withholds. Each row carries an exact deep link
 * back to the record it names.
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq, ne, isNotNull, inArray, or, type SQL } from "drizzle-orm";

import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";
import { db } from "@/db/client";
import { events } from "@/db/schema/index";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import * as taskService from "@/lib/server/services/task-service";

type ReminderItem = {
  type: "task" | "event";
  id: string;
  title: string;
  titleHi: string | null;
  date: string;
  status: string;
  href: string;
};

type UrgencyBucket = "overdue" | "dueThisWeek" | "upcoming";

function computeUrgency(dateStr: string): UrgencyBucket | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "dueThisWeek";
  if (diffDays <= 30) return "upcoming";
  return null;
}

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const scopedAccess = resolveScopedAccess(ctx.session.assignments);

  const eventConditions: SQL<unknown>[] = [
    eq(events.orgId, orgId),
    isNotNull(events.startsAt),
    ne(events.status, "cancelled"),
  ];

  if (!scopedAccess.orgWide) {
    const reach: SQL<unknown>[] = [eq(events.createdBy, ctx.session.userId)];
    if (scopedAccess.unitIds.size > 0) reach.push(inArray(events.unitId, [...scopedAccess.unitIds]));
    if (scopedAccess.departmentIds.size > 0) {
      reach.push(inArray(events.departmentId, [...scopedAccess.departmentIds]));
    }
    if (scopedAccess.eventIds.size > 0) reach.push(inArray(events.id, [...scopedAccess.eventIds]));
    const reachClause = or(...reach);
    if (reachClause) eventConditions.push(reachClause);
  }

  const [taskRows, rawEvents] = await Promise.all([
    taskService.listReminderTasks(orgId, scopedAccess, ctx.session.userId, ctx.session.effectiveRoleCodes),
    db
      .select({
        id: events.id,
        title: events.title,
        startsAt: events.startsAt,
        status: events.status,
        unitId: events.unitId,
        departmentId: events.departmentId,
        createdBy: events.createdBy,
      })
      .from(events)
      .where(and(...eventConditions)),
  ]);

  // Authoritative re-check on each row, mirroring the service-side task filter.
  const eventRows = rawEvents.filter((e) => rowMatchesScope(scopedAccess, e, ctx.session.userId));

  const overdue: ReminderItem[] = [];
  const dueThisWeek: ReminderItem[] = [];
  const upcoming: ReminderItem[] = [];

  const bucketFor = (urgency: UrgencyBucket) =>
    urgency === "overdue" ? overdue : urgency === "dueThisWeek" ? dueThisWeek : upcoming;

  for (const t of taskRows) {
    const due = toIso(t.dueDate);
    if (!due) continue;
    const urgency = computeUrgency(due);
    if (!urgency) continue;
    bucketFor(urgency).push({
      type: "task",
      id: t.id,
      title: t.title,
      titleHi: t.titleHi,
      date: due,
      status: t.status,
      // Exact deep link: opens the owning project with this task selected.
      href: `/task-board?projectId=${t.projectId}&taskId=${t.id}`,
    });
  }

  for (const e of eventRows) {
    const startsAt = toIso(e.startsAt);
    if (!startsAt) continue;
    const urgency = computeUrgency(startsAt);
    if (!urgency) continue;
    bucketFor(urgency).push({
      type: "event",
      id: e.id,
      title: e.title,
      titleHi: null,
      date: startsAt,
      status: e.status,
      href: `/calendar?eventId=${e.id}`,
    });
  }

  const sortByDate = (a: ReminderItem, b: ReminderItem) => new Date(a.date).getTime() - new Date(b.date).getTime();
  overdue.sort(sortByDate);
  dueThisWeek.sort(sortByDate);
  upcoming.sort(sortByDate);

  return apiSuccess({
    overdue,
    dueThisWeek,
    upcoming,
    counts: {
      overdue: overdue.length,
      dueThisWeek: dueThisWeek.length,
      upcoming: upcoming.length,
    },
  });
});
