/**
 * GET   /api/v1/events/[eventId]  — Get event with full details
 * PATCH /api/v1/events/[eventId]  — Update event metadata (unit_head+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  events, eventStatusHistory, eventFormConfigs,
  eventFormQuestions, eventPolls, eventVritt,
} from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { hasRoleOrAbove } from "@/lib/permissions";
import { updateEventSchema } from "@/lib/validators/events";
import { apiSuccess, badRequest, notFound, forbidden, serverError } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";

type Params = { eventId: string };

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  // Validate UUID format before querying (prevents 500 on malformed IDs)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(eventId)) return notFound("Event not found.");

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    with: {
      formConfig: true,
      formQuestions: { orderBy: (q, { asc }) => [asc(q.displayOrder)] },
      polls: {
        with: {
          options: { orderBy: (o, { asc }) => [asc(o.displayOrder)] },
        },
      },
      statusHistory: { orderBy: (h, { desc }) => [desc(h.createdAt)] },
      vritt: true,
    },
  });

  if (!event) return notFound("Event not found.");
  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  if (!rowMatchesScope(scopedAccess, event, ctx.session.userId)) {
    return forbidden("You do not have access to this event.");
  }

  return apiSuccess(event);
});

// ── PATCH ─────────────────────────────────────────────────────────────────────
export const PATCH = withPermission("canUpdateEvent", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, status: true, unitId: true, createdBy: true },
  });
  if (!event) return notFound("Event not found.");

  // Karyakarta can only edit events they created
  const isOwner = event.createdBy === ctx.session.userId;
  const isAdmin = hasRoleOrAbove(ctx.session.effectiveRoleCodes, "aayam_pramukh");
  if (!isOwner && !isAdmin) return forbidden("You may only edit events you created.");

  // Cannot edit published or cancelled events
  if (event.status === "authorized_public" || event.status === "cancelled") {
    return forbidden(`Cannot edit an event with status '${event.status}'.`);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const [updated] = await db
    .update(events)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.startsAt !== undefined && { startsAt: input.startsAt ? new Date(input.startsAt) : null }),
      ...(input.endsAt !== undefined && { endsAt: input.endsAt ? new Date(input.endsAt) : null }),
      ...(input.locationId !== undefined && { locationId: input.locationId }),
      ...(input.checklist !== undefined && { checklist: input.checklist }),
      ...(input.metadata !== undefined && { metadata: input.metadata }),
      updatedBy: ctx.session.userId,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning({ id: events.id, title: events.title, updatedAt: events.updatedAt });

  if (!updated) return serverError("Failed to update event.");

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "event.updated",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: eventId,
      payload: input as Record<string, unknown>,
      changeSummary: `Event updated: "${updated.title}".`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} updated event: "${updated.title}".`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return apiSuccess(updated);
});
