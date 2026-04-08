/**
 * POST /api/v1/articles/[articleId]/workflow
 *
 * Trigger a workflow status transition on an article (Aalekh).
 * Enforces the full editorial review state machine including values checklist.
 *
 * Body: { toStatus: ArticleStatus, notes?: string, valuesChecklist?: ValuesChecklist }
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { articles, articleReviews, notifications } from "@/db/schema/index";
import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import {
  validateArticleTransition,
  isValuesChecklistComplete,
  type ArticleStatus,
} from "@/lib/permissions/article-workflow";
import { articleWorkflowSchema } from "@/lib/validators/articles";
import { apiSuccess, badRequest, notFound, forbidden, serverError } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";

type Params = { articleId: string };

export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { articleId } = params as Params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = articleWorkflowSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const { toStatus, notes, valuesChecklist } = parsed.data;

  // Load article
  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.orgId, ctx.session.orgId)),
    columns: {
      id: true,
      title: true,
      status: true,
      authorUserId: true,
      valuesChecklist: true,
    },
  });
  if (!article) return notFound("Article not found.");

  // Merge in any submitted valuesChecklist update
  const currentChecklist = (article.valuesChecklist as {
    rashtraPratham: boolean;
    culturallyGrounded: boolean;
    balancedTone: boolean;
    noDivisiveContent: boolean;
  }) ?? { rashtraPratham: false, culturallyGrounded: false, balancedTone: false, noDivisiveContent: false };

  const checklistForValidation = valuesChecklist
    ? { ...currentChecklist, ...valuesChecklist }
    : currentChecklist;

  // Validate transition through state machine (includes checklist enforcement)
  const transitionError = validateArticleTransition(
    article.status as ArticleStatus,
    toStatus as ArticleStatus,
    ctx.session.effectiveRoleCodes,
    { note: notes, valuesChecklist: checklistForValidation }
  );
  if (transitionError) return forbidden(transitionError);

  const now = new Date();
  const isPublishing = toStatus === "authorized_public";

  // Execute transition
  const [updated] = await db
    .update(articles)
    .set({
      status: toStatus as ArticleStatus,
      // Update checklist if provided
      ...(valuesChecklist && { valuesChecklist: checklistForValidation }),
      ...(isPublishing && { publishedAt: now }),
      updatedBy: ctx.session.userId,
      updatedAt: now,
    })
    .where(eq(articles.id, articleId))
    .returning({ id: articles.id, title: articles.title, status: articles.status });

  if (!updated) return serverError("Failed to update article status.");

  // Record review step (if transitioning from a review stage)
  const reviewStages: ArticleStatus[] = [
    "pending_unit_head_review",
    "pending_aayam_review",
    "pending_vibhag_review",
    "pending_prant_authorization",
  ];

  if (reviewStages.includes(article.status as ArticleStatus)) {
    const decision =
      toStatus === "returned_for_revision"
        ? "returned_for_revision"
        : toStatus === "rejected"
        ? "rejected"
        : "approved";

    await db.insert(articleReviews).values({
      articleId,
      reviewStep: article.status,
      reviewerUserId: ctx.session.userId,
      reviewerNameSnapshot: ctx.session.displayName ?? ctx.session.email,
      decision,
      reviewNotes: notes ?? null,
      valuesChecklistSnapshot: checklistForValidation,
    });
  }

  // Notify article author if they're not the actor
  if (article.authorUserId && article.authorUserId !== ctx.session.userId) {
    await db.insert(notifications).values({
      orgId: ctx.session.orgId,
      recipientUserId: article.authorUserId,
      kind: "article_status_change",
      title: `Article status: ${toStatus.replace(/_/g, " ")}`,
      body: `Your article "${article.title}" has moved to: ${toStatus.replace(/_/g, " ")}${notes ? ` — ${notes}` : ""}`,
      entityType: "article",
      entityId: articleId,
      metadata: { fromStatus: article.status, toStatus, notes },
    });
  }

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "article.status_changed",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "article",
      entityId: articleId,
      payload: { fromStatus: article.status, toStatus, notes },
      changeSummary: `Article "${article.title}" moved from '${article.status}' to '${toStatus}'.`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} moved article "${article.title}" to ${toStatus.replace(/_/g, " ")}.`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
      payload: { fromStatus: article.status, toStatus },
    }
  );

  return apiSuccess({
    articleId,
    fromStatus: article.status,
    toStatus,
    publishedAt: isPublishing ? now : null,
    updatedAt: now,
    notes: notes ?? null,
  });
});
