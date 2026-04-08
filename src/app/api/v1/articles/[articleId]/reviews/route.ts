/**
 * GET  /api/v1/articles/[articleId]/reviews  — List review history for an article
 * POST /api/v1/articles/[articleId]/reviews  — Submit a standalone review record
 *
 * Note: Reviews are automatically created when /workflow is called.
 * The POST here is for adding additional reviewer notes without a status change.
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { articles, articleReviews, articlePublications } from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { submitReviewSchema, createPublicationSchema } from "@/lib/validators/articles";
import { apiSuccess, apiCreated, badRequest, notFound, serverError } from "@/lib/response";
import { writeAuditLog } from "@/lib/audit";

type Params = { articleId: string };

// ── GET — Review history ──────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { articleId } = params as Params;

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.orgId, ctx.session.orgId)),
    columns: { id: true },
  });
  if (!article) return notFound("Article not found.");

  const reviews = await db.query.articleReviews.findMany({
    where: eq(articleReviews.articleId, articleId),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  const publications = await db.query.articlePublications.findMany({
    where: eq(articlePublications.articleId, articleId),
    orderBy: (p, { desc }) => [desc(p.publishedAt)],
  });

  return apiSuccess({ reviews, publications });
});

// ── POST — Standalone review note ─────────────────────────────────────────────
// Use this to add editorial notes without changing the article status.
export const POST = withPermission("canReviewArticle", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { articleId } = params as Params;

  const url = req.nextUrl.pathname;
  const isPublication = url.includes("/publications");

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.orgId, ctx.session.orgId)),
    columns: { id: true, status: true, title: true },
  });
  if (!article) return notFound("Article not found.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  // ── Publication record ────────────────────────────────────────────────────
  if (isPublication) {
    const parsed = createPublicationSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
    const input = parsed.data;

    const [pub] = await db
      .insert(articlePublications)
      .values({
        articleId,
        channel: input.channel,
        publishedBy: ctx.session.userId,
        publishedUrl: input.publishedUrl ?? null,
        metadata: input.metadata ?? null,
      })
      .returning({ id: articlePublications.id });

    await writeAuditLog({
      orgId: ctx.session.orgId,
      action: "article.publication_recorded",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "article",
      entityId: articleId,
      changeSummary: `Article published on channel: ${input.channel}.`,
    });

    return apiCreated({ publicationId: pub?.id, channel: input.channel });
  }

  // ── Review note ───────────────────────────────────────────────────────────
  const parsed = submitReviewSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const [review] = await db
    .insert(articleReviews)
    .values({
      articleId,
      reviewStep: article.status,
      reviewerUserId: ctx.session.userId,
      reviewerNameSnapshot: ctx.session.displayName ?? ctx.session.email,
      decision: input.decision,
      reviewNotes: input.reviewNotes ?? null,
      edits: input.edits ?? null,
      valuesChecklistSnapshot: input.valuesChecklistSnapshot ?? null,
    })
    .returning({ id: articleReviews.id, decision: articleReviews.decision });

  if (!review) return serverError("Failed to save review.");

  await writeAuditLog({
    orgId: ctx.session.orgId,
    action: "article.review_submitted",
    actorUserId: ctx.session.userId,
    actorEmail: ctx.session.email,
    actorIp: ip,
    entityType: "article",
    entityId: articleId,
    payload: { decision: input.decision, step: article.status },
    changeSummary: `Review submitted: ${input.decision} at step ${article.status}.`,
  });

  return apiCreated({ reviewId: review.id, decision: review.decision });
});
