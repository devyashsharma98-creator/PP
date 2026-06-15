/**
 * GET  /api/v1/articles/[articleId]/reviews  — List review history for an article
 * POST /api/v1/articles/[articleId]/reviews  — Submit a standalone review record
 *
 * Note: Reviews are automatically created when /workflow is called.
 * The POST here is for adding additional reviewer notes without a status change.
 */
import "server-only";

import { NextRequest } from "next/server";

import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { submitReviewSchema } from "@/lib/validators/articles";
import { apiSuccess, apiCreated, badRequest, notFound, serverError } from "@/lib/response";
import {
  getArticleMinimal,
  getArticleWithStatus,
  getArticleReviewHistory,
  submitStandaloneReview,
} from "@/lib/server/services/article-service";

type Params = { articleId: string };

// ── GET — Review history ──────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { articleId } = params as Params;

  const article = await getArticleMinimal(articleId, ctx.session.orgId);
  if (!article) return notFound("Article not found.");

  const { reviews, publications } = await getArticleReviewHistory(articleId);

  return apiSuccess({ reviews, publications });
});

// ── POST — Standalone review note ─────────────────────────────────────────────
export const POST = withPermission("canReviewArticle", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { articleId } = params as Params;

  const article = await getArticleWithStatus(articleId, ctx.session.orgId);
  if (!article) return notFound("Article not found.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = submitReviewSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const review = await submitStandaloneReview(
    articleId,
    ctx.session.orgId,
    ctx.session.userId,
    ctx.session.displayName,
    ctx.session.email,
    article.status,
    input,
    ip,
  );

  if (!review) return serverError("Failed to save review.");

  return apiCreated({ reviewId: review.id, decision: review.decision });
});
