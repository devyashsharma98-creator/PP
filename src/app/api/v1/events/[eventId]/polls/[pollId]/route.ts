/**
 * POST /api/v1/events/[eventId]/polls/[pollId]/vote     — Cast a vote
 * POST /api/v1/events/[eventId]/polls/[pollId]/finalize — Finalize poll winner (aayam_pramukh+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { eventPolls, eventPollOptions, eventPollVotes } from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { castVoteSchema, finalizePollSchema } from "@/lib/validators/events";
import { apiSuccess, badRequest, notFound, forbidden, conflict, serverError } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";

type Params = { eventId: string; pollId: string };

// ── POST /vote ────────────────────────────────────────────────────────────────
// Authenticated users can vote. One vote per user per poll.
export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId, pollId } = params as Params;

  const url = req.nextUrl.pathname;
  const isFinalize = url.endsWith("/finalize");
  const isVote = url.endsWith("/vote") || (!isFinalize);

  // Load poll
  const poll = await db.query.eventPolls.findFirst({
    where: eq(eventPolls.id, pollId),
    columns: { id: true, eventId: true, isFinalized: true, pollType: true },
    with: { options: { columns: { id: true } } },
  });
  if (!poll || poll.eventId !== eventId) return notFound("Poll not found.");

  // ── FINALIZE ───────────────────────────────────────────────────────────────
  if (isFinalize) {
    // Requires aayam_pramukh or above
    const { hasRoleOrAbove } = await import("@/lib/permissions");
    if (!hasRoleOrAbove(ctx.session.effectiveRoleCodes, "aayam_pramukh")) {
      return forbidden("Finalizing a poll requires at least Aayam Pramukh role.");
    }

    if (poll.isFinalized) return conflict("This poll has already been finalized.");

    let body: unknown;
    try { body = await req.json(); } catch { return badRequest("Invalid JSON."); }

    const parsed = finalizePollSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

    const winnerOption = poll.options.find((o) => o.id === parsed.data.winnerOptionId);
    if (!winnerOption) return badRequest("Winner option ID does not belong to this poll.");

    await db
      .update(eventPolls)
      .set({ isFinalized: true, winnerOptionId: parsed.data.winnerOptionId, updatedAt: new Date() })
      .where(eq(eventPolls.id, pollId));

    await auditAndActivity(
      {
        orgId: ctx.session.orgId,
        action: "poll.finalized",
        actorUserId: ctx.session.userId,
        actorEmail: ctx.session.email,
        actorIp: ip,
        entityType: "event",
        entityId: eventId,
        changeSummary: `Poll finalized. Winner option: ${parsed.data.winnerOptionId}.`,
      },
      { summary: `${ctx.session.displayName ?? ctx.session.email} finalized a poll.`,
        actorNameSnapshot: ctx.session.displayName ?? ctx.session.email }
    );

    return apiSuccess({ pollId, finalized: true, winnerOptionId: parsed.data.winnerOptionId });
  }

  // ── VOTE ───────────────────────────────────────────────────────────────────
  if (poll.isFinalized) return forbidden("This poll has been finalized and is no longer accepting votes.");

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Invalid JSON."); }

  const parsed = castVoteSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

  const option = poll.options.find((o) => o.id === parsed.data.optionId);
  if (!option) return badRequest("Option ID does not belong to this poll.");

  // One vote per user per poll
  const existingVote = await db.query.eventPollVotes.findFirst({
    where: and(
      eq(eventPollVotes.pollId, pollId),
      eq(eventPollVotes.submittedBy, ctx.session.userId)
    ),
    columns: { id: true },
  });
  if (existingVote) return conflict("You have already voted on this poll.");

  await db.insert(eventPollVotes).values({
    pollId,
    optionId: parsed.data.optionId,
    submittedBy: ctx.session.userId,
    submittedFromIp: ip,
    submittedUserAgent: req.headers.get("user-agent") ?? null,
  });

  return apiSuccess({ pollId, optionId: parsed.data.optionId, voted: true });
});
