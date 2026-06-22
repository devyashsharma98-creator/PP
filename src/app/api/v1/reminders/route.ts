import "server-only";
import { NextRequest } from "next/server";
import { eq, and, ne, isNotNull } from "drizzle-orm";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";
import { db } from "@/db/client";
import { projectTasks, projects, events } from "@/db/schema/index";

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

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;

  const [rawTasks, rawEvents] = await Promise.all([
    db
      .select({
        id: projectTasks.id,
        title: projectTasks.title,
        titleHi: projectTasks.titleHi,
        dueDate: projectTasks.dueDate,
        status: projectTasks.status,
      })
      .from(projectTasks)
      .innerJoin(projects, eq(projectTasks.projectId, projects.id))
      .where(
        and(
          eq(projects.orgId, orgId),
          isNotNull(projectTasks.dueDate),
          ne(projectTasks.status, "done"),
        ),
      ),

    db
      .select({
        id: events.id,
        title: events.title,
        startsAt: events.startsAt,
        status: events.status,
      })
      .from(events)
      .where(
        and(
          eq(events.orgId, orgId),
          isNotNull(events.startsAt),
          ne(events.status, "cancelled"),
        ),
      ),
  ]);

  const taskRows = rawTasks as Array<{
    id: string;
    title: string;
    titleHi: string | null;
    dueDate: string | null;
    status: string;
  }>;

  const eventRows = rawEvents as Array<{
    id: string;
    title: string;
    startsAt: string | null;
    status: string;
  }>;

  const overdue: ReminderItem[] = [];
  const dueThisWeek: ReminderItem[] = [];
  const upcoming: ReminderItem[] = [];

  for (const t of taskRows) {
    if (!t.dueDate) continue;
    const urgency = computeUrgency(t.dueDate);
    if (!urgency) continue;
    const bucket = urgency === "overdue" ? overdue : urgency === "dueThisWeek" ? dueThisWeek : upcoming;
    bucket.push({
      type: "task",
      id: t.id,
      title: t.title,
      titleHi: t.titleHi,
      date: t.dueDate,
      status: t.status,
      href: "/dashboard#task-board",
    });
  }

  for (const e of eventRows) {
    if (!e.startsAt) continue;
    const urgency = computeUrgency(e.startsAt);
    if (!urgency) continue;
    const bucket = urgency === "overdue" ? overdue : urgency === "dueThisWeek" ? dueThisWeek : upcoming;
    bucket.push({
      type: "event",
      id: e.id,
      title: e.title,
      titleHi: null,
      date: e.startsAt,
      status: e.status,
      href: "/calendar",
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
