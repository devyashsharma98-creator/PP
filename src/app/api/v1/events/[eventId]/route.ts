/**
 * GET   /api/v1/events/[eventId]  — Get event with full details
 * PATCH /api/v1/events/[eventId]  — Update event metadata (unit_head+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  events,
} from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import { apiSuccess, notFound, forbidden } from "@/lib/response";
import { patchEvent } from "./_patch";

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
  const { eventId } = params as Params;
  return patchEvent(req, ctx, eventId);
});
