/**
 * GET /api/v1/events/[eventId]/registrations
 *
 * List event registrations. Requires unit_head+ (internal use).
 * Public registration submission is at /api/public/events/[eventId]/registrations
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq, count, desc } from "drizzle-orm";

import { db } from "@/db/client";
import { events, eventRegistrations, eventRegistrationAnswers } from "@/db/schema/index";
import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, notFound, parsePagination, paginationMeta } from "@/lib/response";

type Params = { eventId: string };

export const GET = withPermission("canViewRegistrations", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;
  const sp = req.nextUrl.searchParams;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, title: true },
  });
  if (!event) return notFound("Event not found.");

  const { page, limit, offset } = parsePagination(sp);

  const [rows, totalRow] = await Promise.all([
    db.query.eventRegistrations.findMany({
      where: eq(eventRegistrations.eventId, eventId),
      with: { answers: true },
      orderBy: (r, { desc }) => [desc(r.submittedAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId)),
  ]);

  const total = Number(totalRow[0]?.value ?? 0);
  const checkedInCount = rows.filter((r) => r.isCheckedIn).length;

  return apiSuccess(
    {
      eventId,
      eventTitle: event.title,
      registrations: rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        city: r.city,
        attendingCount: r.attendingCount,
        hasSpecialNeeds: r.hasSpecialNeeds,
        isCheckedIn: r.isCheckedIn,
        checkedInAt: r.checkedInAt,
        submittedAt: r.submittedAt,
        answers: r.answers,
      })),
      summary: { total, checkedIn: checkedInCount, pending: total - checkedInCount },
    },
    { meta: paginationMeta(page, limit, total) }
  );
});
