/**
 * /api/v1/publications/articles/[id]
 *   PATCH  — edit, review, or transition an article's status.
 *            • Editing content: the submitter, or a reviewer (canReviewArticle).
 *            • Review fields / status changes: canReviewArticle.
 *            • status → published: canPublishArticle.
 *   DELETE — remove an article (submitter or canReviewArticle).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { publicationArticles } from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, apiNoContent, badRequest, forbidden, notFound, serverError } from "@/lib/response";

type Params = { id: string };

const STATUSES = new Set([
  "submitted", "under_review", "revision_requested", "accepted", "rejected", "published", "withdrawn",
]);
const RECOMMENDATIONS = new Set(["accept", "minor_revision", "major_revision", "reject"]);
const REVIEW_KEYS = ["recommendation", "rating", "reviewComment", "reviewCommentHi", "reviewerId", "reviewDueDate"];

export const PATCH = withAuth(async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const [existing] = await db
    .select()
    .from(publicationArticles)
    .where(and(eq(publicationArticles.id, id), eq(publicationArticles.orgId, orgId)))
    .limit(1);
  if (!existing) return notFound("Article not found.");

  const isSubmitter = existing.submittedBy === ctx.session.userId;
  const canReview = ctx.permissions.canReviewArticle;
  const canPublish = ctx.permissions.canPublishArticle;

  const touchesReview = REVIEW_KEYS.some((k) => k in body) || "status" in body;
  if (touchesReview && !canReview) {
    return forbidden("Reviewing requires the canReviewArticle permission.");
  }
  if (body.status === "published" && !canPublish) {
    return forbidden("Publishing requires the canPublishArticle permission.");
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };

  // Content edits — submitter or reviewer.
  if (isSubmitter || canReview) {
    for (const k of ["title", "titleHi", "abstract", "abstractHi", "body", "bodyHi", "references"] as const) {
      if (k in body) patch[k] = body[k] == null ? null : String(body[k]);
    }
    if ("publicationId" in body) patch.publicationId = body.publicationId ? String(body.publicationId) : null;
    // Resubmission after revision bumps the version.
    if (body.status === "submitted" && existing.status === "revision_requested") {
      patch.version = existing.version + 1;
    }
  } else if (!touchesReview) {
    return forbidden("You can only edit your own submissions.");
  }

  // Review fields.
  if ("recommendation" in body) {
    if (body.recommendation != null && !RECOMMENDATIONS.has(String(body.recommendation))) {
      return badRequest("Invalid recommendation.");
    }
    patch.recommendation = body.recommendation ? String(body.recommendation) : null;
  }
  if ("rating" in body) {
    const r = Number(body.rating);
    if (body.rating != null && (Number.isNaN(r) || r < 1 || r > 5)) return badRequest("rating must be 1–5.");
    patch.rating = body.rating == null ? null : r;
  }
  if ("reviewComment" in body) patch.reviewComment = body.reviewComment ? String(body.reviewComment) : null;
  if ("reviewCommentHi" in body) patch.reviewCommentHi = body.reviewCommentHi ? String(body.reviewCommentHi) : null;
  if ("reviewerId" in body) patch.reviewerId = body.reviewerId ? String(body.reviewerId) : null;
  if ("reviewDueDate" in body) patch.reviewDueDate = body.reviewDueDate ? new Date(String(body.reviewDueDate)) : null;

  // Status transition.
  if ("status" in body) {
    if (!STATUSES.has(String(body.status))) return badRequest("Invalid status.");
    patch.status = String(body.status);
    // Stamp review time when a decision is recorded.
    if (["accepted", "rejected", "revision_requested"].includes(String(body.status))) {
      patch.reviewedAt = new Date();
      if (!("reviewerId" in body) && !existing.reviewerId) patch.reviewerId = ctx.session.userId;
    }
  }

  try {
    const [updated] = await db
      .update(publicationArticles)
      .set(patch)
      .where(and(eq(publicationArticles.id, id), eq(publicationArticles.orgId, orgId)))
      .returning();
    return apiSuccess(updated);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Update failed");
  }
});

export const DELETE = withAuth(async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  const [existing] = await db
    .select({ submittedBy: publicationArticles.submittedBy })
    .from(publicationArticles)
    .where(and(eq(publicationArticles.id, id), eq(publicationArticles.orgId, orgId)))
    .limit(1);
  if (!existing) return notFound("Article not found.");

  if (existing.submittedBy !== ctx.session.userId && !ctx.permissions.canReviewArticle) {
    return forbidden("You cannot delete this article.");
  }

  try {
    await db.delete(publicationArticles).where(and(eq(publicationArticles.id, id), eq(publicationArticles.orgId, orgId)));
    return apiNoContent();
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Delete failed");
  }
});
