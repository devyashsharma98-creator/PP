/**
 * GET  /api/v1/events/[eventId]/vritt — The stored report and what the caller may do to it
 * POST /api/v1/events/[eventId]/vritt — Save a draft, submit, review or reopen
 *
 * Editing, submitting and reviewing are three separate authorities. Holding
 * canUpdateEvent lets an organiser write and submit their own unit's report; it
 * does not let them sign it off, and it does not reach events outside their
 * scope.
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { events, eventVritt } from "@/db/schema/index";
import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import type { AuthContext } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, badRequest, notFound, forbidden, conflict } from "@/lib/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import {
  availableVrittActions,
  canAccessVrittEvent,
  decideVrittTransition,
  vrittFieldPolicy,
  type VrittStatus,
} from "@/lib/app/vritt-access";
import * as eventService from "@/lib/server/services/event-service";
import { z } from "zod";

const VRITT_STATUSES = ["draft", "submitted", "reviewed"] as const;

const updateVrittSchema = z.object({
  content: z.string().optional(),
  contentHi: z.string().optional(),
  attendanceCount: z.number().int().min(0).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  status: z.enum(VRITT_STATUSES).default("draft"),
  reviewNotes: z.string().max(10000).optional(),
  /**
   * The status the caller's screen showed. When present and no longer true, the
   * request is refused with 409 instead of being judged against a report the
   * person has not seen. `null` means "I saw no vritt yet".
   */
  expectedStatus: z.enum(VRITT_STATUSES).nullable().optional(),
});

type Params = { eventId: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadEvent(eventId: string, orgId: string) {
  if (!UUID_RE.test(eventId)) return undefined;
  return db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, orgId)),
    columns: { id: true, title: true, unitId: true, departmentId: true, createdBy: true, status: true },
  });
}

function subjectOf(ctx: AuthContext) {
  return {
    userId: ctx.session.userId,
    roleCodes: ctx.session.effectiveRoleCodes,
    scope: resolveScopedAccess(ctx.session.assignments),
  };
}

export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;
  const event = await loadEvent(eventId, ctx.session.orgId);
  if (!event) return notFound("Event not found.");

  const subject = subjectOf(ctx);
  if (!canAccessVrittEvent(subject, event)) {
    return forbidden("You do not have access to this event.");
  }

  const stored = await db.query.eventVritt.findFirst({
    where: eq(eventVritt.eventId, eventId),
    columns: {
      status: true, content: true, contentHi: true, attendanceCount: true,
      mediaUrls: true, reviewNotes: true, updatedAt: true,
    },
  });

  const current = (stored?.status as VrittStatus | undefined) ?? null;

  return apiSuccess({
    vritt: stored
      ? {
          status: stored.status,
          content: stored.content,
          contentHi: stored.contentHi,
          attendanceCount: stored.attendanceCount,
          mediaUrls: Array.isArray(stored.mediaUrls) ? (stored.mediaUrls as string[]) : [],
          reviewNotes: stored.reviewNotes,
          updatedAt: stored.updatedAt,
        }
      : null,
    // Decided by the same rule that authorizes the write, so the sheet never
    // offers a button the server would refuse.
    actions: availableVrittActions({
      subject,
      event,
      current,
      hasEditPermission: ctx.permissions.canUpdateEvent,
    }),
  });
});

export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await loadEvent(eventId, ctx.session.orgId);
  if (!event) return notFound("Event not found.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = updateVrittSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const { expectedStatus, ...input } = parsed.data;

  const existing = await db.query.eventVritt.findFirst({
    where: eq(eventVritt.eventId, eventId),
    columns: { id: true, status: true },
  });

  const currentStatus = (existing?.status as VrittStatus | undefined) ?? null;
  const subject = subjectOf(ctx);

  // Order matters. Scope first, so nothing is disclosed about an event the
  // caller cannot see. Then staleness, before judging the transition: a unit
  // head whose report was submitted from another device must hear "this changed
  // since you opened it", not "only a reviewer may do that" — the latter judges
  // an action against a report they have not seen. The status revealed by the
  // 409 is already visible to them through GET.
  if (!canAccessVrittEvent(subject, event)) {
    return forbidden("You do not have access to this event.");
  }

  if (expectedStatus !== undefined && expectedStatus !== currentStatus) {
    return conflict(
      "This vritt has changed since you opened it. Reload the report and try again.",
    );
  }

  const decision = decideVrittTransition({
    subject,
    event,
    current: currentStatus,
    next: input.status,
    hasEditPermission: ctx.permissions.canUpdateEvent,
  });

  if (!decision.allowed) {
    return forbidden(decision.reason ?? "You do not have permission to change this vritt.");
  }

  // Submitting, reviewing and reopening move the report between hands; they do
  // not rewrite it. Content sent alongside such a transition is refused rather
  // than quietly discarded, so the caller learns that reviewing accepts what was
  // submitted and that a rewrite needs an explicit reopening first.
  const policy = vrittFieldPolicy(currentStatus, input.status);
  const carriesContent =
    input.content !== undefined ||
    input.contentHi !== undefined ||
    input.attendanceCount !== undefined ||
    input.mediaUrls !== undefined;

  if (carriesContent && !policy.contentWritable) {
    return badRequest(
      input.status === "reviewed"
        ? "A review accepts the submitted report. Reopen the vritt to draft to change its content."
        : "This transition cannot change the report's content. Save your edits as a draft first.",
    );
  }

  if (input.reviewNotes !== undefined && !policy.reviewNotesWritable) {
    return badRequest("Review notes can only be set when marking a vritt reviewed.");
  }

  // The status the decision was made against is carried into the write, which
  // refuses to land if the vritt has moved on in the meantime.
  const result = await eventService.upsertEventVritt(
    eventId,
    input,
    event.title,
    ctx,
    ip,
    currentStatus,
  );
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});
