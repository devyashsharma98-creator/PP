/**
 * GET  /api/v1/events/[eventId]/polls       — List polls for an event
 * POST /api/v1/events/[eventId]/polls       — Create a poll (unit_head+)
 * POST /api/v1/events/[eventId]/polls/[pollId]/finalize — Finalize winner
 * POST /api/v1/events/[eventId]/polls/[pollId]/vote     — Cast a vote (public via auth)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq, count } from "drizzle-orm";

import { db } from "@/db/client";
import { events, eventPolls, eventPollOptions, eventPollVotes } from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createPollSchema, finalizePollSchema, castVoteSchema } from "@/lib/validators/events";
import { apiSuccess, apiCreated, badRequest, notFound, forbidden, conflict, serverError } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";

type Params = { eventId: string };

// ── GET polls ─────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true },
  });
  if (!event) return notFound("Event not found.");

  const polls = await db.query.eventPolls.findMany({
    where: eq(eventPolls.eventId, eventId),
    with: {
      options: {
        orderBy: (o, { asc }) => [asc(o.displayOrder)],
        with: { votes: { columns: { id: true } } },
      },
    },
  });

  // Add vote counts to each option
  const pollsWithCounts = polls.map((poll) => ({
    ...poll,
    options: poll.options.map((opt) => ({
      id: opt.id,
      label: opt.label,
      labelHi: opt.labelHi,
      scheduledAt: opt.scheduledAt,
      displayOrder: opt.displayOrder,
      voteCount: opt.votes.length,
    })),
    totalVotes: poll.options.reduce((sum, opt) => sum + opt.votes.length, 0),
  }));

  return apiSuccess(pollsWithCounts);
});

// ── POST create poll ──────────────────────────────────────────────────────────
export const POST = withPermission("canManagePolls", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, status: true },
  });
  if (!event) return notFound("Event not found.");
  if (event.status === "cancelled" || event.status === "rejected") {
    return forbidden("Cannot add polls to a cancelled or rejected event.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = createPollSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const [newPoll] = await db
    .insert(eventPolls)
    .values({
      eventId,
      question: input.question,
      questionHi: input.questionHi ?? null,
      pollType: input.pollType,
      createdBy: ctx.session.userId,
    })
    .returning({ id: eventPolls.id, question: eventPolls.question });

  if (!newPoll) return serverError("Failed to create poll.");

  // Insert options
  await db.insert(eventPollOptions).values(
    input.options.map((opt, idx) => ({
      pollId: newPoll.id,
      label: opt.label,
      labelHi: opt.labelHi ?? null,
      scheduledAt: opt.scheduledAt ? new Date(opt.scheduledAt) : null,
      displayOrder: opt.displayOrder ?? idx,
    }))
  );

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "poll.created",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: eventId,
      changeSummary: `Poll created: "${input.question}".`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} added a poll to event.`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return apiCreated({ pollId: newPoll.id, question: newPoll.question });
});
