/**
 * POST /api/v1/events/[eventId]/clone — Clone an event (unit_head+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/client";
import { events } from "@/db/schema/index";
import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import { apiCreated, badRequest, notFound, forbidden } from "@/lib/response";
import * as eventService from "@/lib/server/services/event-service";

type Params = { eventId: string };

export const POST = withPermission("canCreateEvent", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(eventId)) return badRequest("Invalid event ID.");

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

  const result = await eventService.cloneEvent(eventId, sourceEvent, ctx, ip);
  if (!result.ok) return result.response;

  return apiCreated(result.data);
});
