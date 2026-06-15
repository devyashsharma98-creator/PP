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
import { events } from "@/db/schema/index";
import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { eventWorkflowSchema } from "@/lib/validators/events";
import { apiSuccess, badRequest, notFound, forbidden } from "@/lib/response";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import * as eventService from "@/lib/server/services/event-service";

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

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, title: true, status: true, unitId: true, departmentId: true, createdBy: true },
  });
  if (!event) return notFound("Event not found.");

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  if (!rowMatchesScope(scopedAccess, event, ctx.session.userId)) {
    return forbidden("You do not have access to transition this event.");
  }

  const result = await eventService.transitionEventWorkflow(eventId, event, toStatus, notes, ctx, ip);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});
