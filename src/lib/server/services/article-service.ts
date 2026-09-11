/**
 * Article Service — DB operations and business logic for article (Aalekh) routes.
 *
 * All state-changing operations emit audit logs. Keep route handlers thin:
 * auth → validate → service → response.
 */
import "server-only";

import { and, eq, ilike, or, count, desc, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { articles, articleReviews, articlePublications, notifications } from "@/db/schema/index";
import { auditAndActivity, writeAuditLog } from "@/lib/audit";
import { commitCriticalTransition } from "@/lib/app/critical-transition";
import type { ScopedAccess } from "@/lib/app/scope";
import {
  validateArticleTransition,
  type ArticleStatus,
  type ValuesChecklist,
} from "@/lib/permissions/article-workflow";
import type { RoleCode } from "@/lib/permissions/types";
import type {
  ListArticlesQuery,
  CreateArticleInput,
  SubmitReviewInput,
  CreatePublicationInput,
} from "@/lib/validators/articles";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ArticleListRow {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  status: string;
  authorUserId: string | null;
  authorNameSnapshot: string | null;
  unitId: string | null;
  departmentId: string | null;
  valuesChecklist: unknown;
  documentUrl: string | null;
  socialUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleListResult {
  rows: ArticleListRow[];
  total: number;
}

export interface CreatedArticle {
  id: string;
  title: string;
  status: string;
  category: string;
  valuesChecklist: unknown;
  authorUserId: string | null;
  createdAt: Date;
}

export interface WorkflowResult {
  articleId: string;
  fromStatus: string;
  toStatus: string;
  publishedAt: Date | null;
  updatedAt: Date;
  notes: string | null;
}

export type TransitionResult =
  | { kind: "success"; data: WorkflowResult }
  | { kind: "forbidden"; message: string }
  /** The article moved out of the expected prior status before this write landed. */
  | { kind: "stale"; message: string }
  | { kind: "server_error"; message: string };

export interface CreatedReview {
  id: string;
  decision: string;
}

export interface WorkflowArticle {
  id: string;
  title: string;
  status: string;
  authorUserId: string | null;
  valuesChecklist: unknown;
  publishedAt?: Date | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build the WHERE clause conditions for listing articles.
 * Complexity: cyclomatic 6, cognitive 8
 */
function buildArticleWhereConditions(
  q: ListArticlesQuery,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
): SQL<unknown> | undefined {
  const conditions: SQL<unknown>[] = [eq(articles.orgId, orgId)];

  if (q.status) conditions.push(eq(articles.status, q.status as ArticleStatus));
  if (q.category) conditions.push(eq(articles.category, q.category));
  if (q.authorUserId) conditions.push(eq(articles.authorUserId, q.authorUserId));
  if (q.unitId) conditions.push(eq(articles.unitId, q.unitId));
  if (q.departmentId) conditions.push(eq(articles.departmentId, q.departmentId));

  const searchPattern = q.search ? "%" + q.search + "%" : undefined;
  const searchCondition = searchPattern
    ? or(
        ilike(articles.title, searchPattern),
        ilike(articles.summary, searchPattern),
      )
    : undefined;

  if (!scopedAccess.orgWide) {
    const scopeConditions: SQL<unknown>[] = [eq(articles.authorUserId, userId)];
    if (scopedAccess.unitIds.size > 0)
      scopeConditions.push(inArray(articles.unitId, [...scopedAccess.unitIds]));
    if (scopedAccess.departmentIds.size > 0)
      scopeConditions.push(inArray(articles.departmentId, [...scopedAccess.departmentIds]));
    if (scopedAccess.articleIds.size > 0)
      scopeConditions.push(inArray(articles.id, [...scopedAccess.articleIds]));
    const scopeClause = or(...scopeConditions);
    if (scopeClause) conditions.push(scopeClause);
  }

  return searchCondition ? and(...conditions, searchCondition) : and(...conditions);
}

// ── List articles ─────────────────────────────────────────────────────────────

/**
 * List articles with filters and pagination.
 * Complexity: cyclomatic 2, cognitive 3
 */
export async function listArticles(
  orgId: string,
  userId: string,
  q: ListArticlesQuery,
  limit: number,
  offset: number,
  scopedAccess: ScopedAccess,
): Promise<ArticleListResult> {
  const whereClause = buildArticleWhereConditions(q, orgId, scopedAccess, userId);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        summary: articles.summary,
        category: articles.category,
        status: articles.status,
        authorUserId: articles.authorUserId,
        authorNameSnapshot: articles.authorNameSnapshot,
        unitId: articles.unitId,
        departmentId: articles.departmentId,
        featuredImage: articles.featuredImage,
        valuesChecklist: articles.valuesChecklist,
        documentUrl: articles.documentUrl,
        socialUrl: articles.socialUrl,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(whereClause)
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ value: count() }).from(articles).where(whereClause),
  ]);

  return { rows: rows as ArticleListRow[], total: Number(totalRow[0]?.value ?? 0) };
}

// ── Create article ────────────────────────────────────────────────────────────

/**
 * Create a new article draft and emit audit log.
 * Returns null if the insert fails.
 * Complexity: cyclomatic 2, cognitive 3
 */
export async function createArticle(
  orgId: string,
  userId: string,
  displayName: string | null,
  email: string,
  unitId: string | null,
  departmentId: string | null,
  input: CreateArticleInput,
  ip: string | null,
): Promise<CreatedArticle | null> {
  const [newArticle] = await db
    .insert(articles)
    .values({
      orgId,
      unitId,
      departmentId,
      title: input.title,
      content: input.content ?? null,
      summary: input.summary ?? null,
      category: input.category,
      authorUserId: userId,
      authorNameSnapshot: displayName ?? email,
      status: "draft",
      sourceThreadId: input.sourceThreadId ?? null,
      featuredImage: input.featuredImage ?? null,
      documentUrl: input.documentUrl ?? null,
      socialUrl: input.socialUrl ?? null,
      valuesChecklist: input.valuesChecklist,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      category: articles.category,
      valuesChecklist: articles.valuesChecklist,
      authorUserId: articles.authorUserId,
      createdAt: articles.createdAt,
    });

  if (!newArticle) return null;

  const actorName = displayName ?? email;
  await auditAndActivity(
    {
      orgId,
      action: "article.created",
      actorUserId: userId,
      actorEmail: email,
      actorIp: ip ?? undefined,
      entityType: "article",
      entityId: newArticle.id,
      changeSummary: `Article created: "${newArticle.title}" (category: ${newArticle.category}).`,
    },
    {
      summary: `${actorName} created article: "${newArticle.title}".`,
      actorNameSnapshot: actorName,
    },
  );

  return newArticle as CreatedArticle;
}

// ── Workflow helpers ──────────────────────────────────────────────────────────

/**
 * Get an article by ID scoped to an org, with columns needed for workflow.
 * Returns null if not found.
 * Complexity: cyclomatic 1, cognitive 2
 */
export async function getArticleForWorkflow(
  articleId: string,
  orgId: string,
): Promise<WorkflowArticle | null> {
  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.orgId, orgId)),
    columns: {
      id: true,
      title: true,
      status: true,
      authorUserId: true,
      valuesChecklist: true,
    },
  });

  return article ?? null;
}

/**
 * Transition an article through the workflow state machine.
 * Validates the transition, updates the article, records review history,
 * notifies the author, and emits an audit log.
 * Complexity: cyclomatic 6, cognitive 10
 */
export async function transitionArticleWorkflow(
  article: WorkflowArticle,
  articleId: string,
  orgId: string,
  userId: string,
  displayName: string | null,
  email: string,
  effectiveRoleCodes: RoleCode[],
  toStatus: string,
  notes: string | undefined,
  valuesChecklist: ValuesChecklist | undefined,
  ip: string | null,
): Promise<TransitionResult> {
  // Merge checklist
  const currentChecklist = (article.valuesChecklist as ValuesChecklist) ?? {
    rashtraPratham: false,
    culturallyGrounded: false,
    balancedTone: false,
    noDivisiveContent: false,
  };

  const checklistForValidation = valuesChecklist
    ? { ...currentChecklist, ...valuesChecklist }
    : currentChecklist;

  // Validate transition
  const transitionError = validateArticleTransition(
    article.status as ArticleStatus,
    toStatus as ArticleStatus,
    effectiveRoleCodes,
    { note: notes, valuesChecklist: checklistForValidation },
  );
  if (transitionError) {
    return { kind: "forbidden", message: transitionError };
  }

  const now = new Date();
  const isPublishing = toStatus === "authorized_public";
  const fromStatus = article.status as ArticleStatus;
  const reviewerName = displayName ?? email;

  const reviewStages: ArticleStatus[] = [
    "pending_unit_head_review",
    "pending_aayam_review",
    "pending_vibhag_review",
    "pending_prant_authorization",
  ];
  const recordsReview = reviewStages.includes(fromStatus);
  const decision =
    toStatus === "returned_for_revision"
      ? "returned_for_revision"
      : toStatus === "rejected"
      ? "rejected"
      : "approved";

  const recipientId = article.authorUserId && article.authorUserId !== userId ? article.authorUserId : null;
  const notificationTitle = `Article status: ${toStatus.replace(/_/g, " ")}`;
  const notificationBody = `Your article "${article.title}" has moved to: ${toStatus.replace(/_/g, " ")}${notes ? ` — ${notes}` : ""}`;
  const notificationMetadata = JSON.stringify({ fromStatus, toStatus, notes: notes ?? null });
  const checklistJson = JSON.stringify(checklistForValidation);

  const outcome = await commitCriticalTransition<{
    id: string;
    title: string;
    status: string;
    review_rows: number;
    notification_rows: number;
  }>({
    expectedFrom: fromStatus,

    /**
     * One statement, as for events: the compare-and-swap UPDATE decides whether
     * anything happens, and the review and notification rows select FROM it, so
     * a review can never be recorded for a transition that did not take, nor a
     * transition committed without its review.
     */
    run: async () => {
      const result = await db.execute(sql`
        WITH updated AS (
          UPDATE ${articles}
             SET status = ${toStatus}::article_status,
                 values_checklist = CASE WHEN ${valuesChecklist !== undefined}
                                         THEN ${checklistJson}::jsonb
                                         ELSE values_checklist END,
                 published_at = CASE WHEN ${isPublishing} THEN ${now.toISOString()}::timestamptz
                                     ELSE published_at END,
                 updated_by = ${userId}::uuid,
                 updated_at = now()
           WHERE id = ${articleId}::uuid
             AND status = ${fromStatus}::article_status
          RETURNING id, title, status
        ),
        review AS (
          INSERT INTO article_reviews
            (article_id, review_step, reviewer_user_id, reviewer_name_snapshot,
             decision, review_notes, values_checklist_snapshot)
          SELECT updated.id,
                 ${fromStatus},
                 ${userId}::uuid,
                 ${reviewerName},
                 ${decision}::article_review_decision,
                 ${notes ?? null},
                 ${checklistJson}::jsonb
            FROM updated
           WHERE ${recordsReview}
          RETURNING id
        ),
        notification AS (
          INSERT INTO notifications
            (org_id, recipient_user_id, kind, title, body, entity_type, entity_id, metadata)
          SELECT ${orgId}::uuid,
                 ${recipientId}::uuid,
                 'article_status_change'::notification_kind,
                 ${notificationTitle},
                 ${notificationBody},
                 'article',
                 updated.id,
                 ${notificationMetadata}::jsonb
            FROM updated
           WHERE ${recipientId}::uuid IS NOT NULL
          RETURNING id
        )
        SELECT updated.id,
               updated.title,
               updated.status,
               (SELECT count(*) FROM review)::int       AS review_rows,
               (SELECT count(*) FROM notification)::int AS notification_rows
          FROM updated
      `);

      const rows = (result as unknown as { rows?: unknown[] }).rows ?? (result as unknown as unknown[]);
      return (Array.isArray(rows) ? rows[0] : undefined) as never;
    },

    wroteNotification: (row) => Number(row.notification_rows) > 0,
  });

  if (outcome.status === "stale") {
    return {
      kind: "stale",
      message: `This article is no longer in '${fromStatus}'. Someone else has already reviewed it — reload and try again.`,
    };
  }

  if (outcome.status === "failed") {
    console.error("[article.workflow] transition failed", {
      articleId,
      fromStatus,
      toStatus,
      error: outcome.error,
    });
    return {
      kind: "server_error",
      message: "The status change could not be completed. No change was saved.",
    };
  }

  await auditAndActivity(
    {
      orgId,
      action: "article.status_changed",
      actorUserId: userId,
      actorEmail: email,
      actorIp: ip ?? undefined,
      entityType: "article",
      entityId: articleId,
      payload: {
        fromStatus,
        toStatus,
        notes,
        reviewRecorded: Number(outcome.row.review_rows) > 0,
        notificationWritten: outcome.notificationWritten,
        notificationExpected: recipientId !== null,
      },
      changeSummary: `Article "${article.title}" moved from '${fromStatus}' to '${toStatus}'.`,
    },
    {
      summary: `${reviewerName} moved article "${article.title}" to ${toStatus.replace(/_/g, " ")}.`,
      actorNameSnapshot: reviewerName,
      payload: { fromStatus, toStatus },
    },
  );

  return {
    kind: "success",
    data: {
      articleId,
      fromStatus,
      toStatus,
      publishedAt: isPublishing ? now : null,
      updatedAt: now,
      notes: notes ?? null,
    },
  };
}

// ── Reviews ───────────────────────────────────────────────────────────────────

/**
 * Verify an article exists in an org. Returns minimal article or null.
 * Complexity: cyclomatic 1, cognitive 2
 */
export async function getArticleMinimal(
  articleId: string,
  orgId: string,
): Promise<{ id: string } | null> {
  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.orgId, orgId)),
    columns: { id: true },
  });
  return article ?? null;
}

/**
 * Get an article with status and title for review operations.
 * Returns null if not found.
 * Complexity: cyclomatic 1, cognitive 2
 */
export async function getArticleWithStatus(
  articleId: string,
  orgId: string,
): Promise<{ id: string; status: string; title: string } | null> {
  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.orgId, orgId)),
    columns: { id: true, status: true, title: true },
  });
  return article ?? null;
}

/**
 * Fetch review history and publications for an article.
 * Complexity: cyclomatic 1, cognitive 2
 */
export async function getArticleReviewHistory(articleId: string): Promise<{
  reviews: unknown[];
  publications: unknown[];
}> {
  const reviews = await db.query.articleReviews.findMany({
    where: eq(articleReviews.articleId, articleId),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  const publications = await db.query.articlePublications.findMany({
    where: eq(articlePublications.articleId, articleId),
    orderBy: (p, { desc }) => [desc(p.publishedAt)],
  });

  return { reviews, publications };
}

/**
 * Submit a standalone review note for an article.
 * Returns null if the insert fails.
 * Complexity: cyclomatic 2, cognitive 3
 */
export async function submitStandaloneReview(
  articleId: string,
  orgId: string,
  userId: string,
  displayName: string | null,
  email: string,
  articleStatus: string,
  input: SubmitReviewInput,
  ip: string | null,
): Promise<CreatedReview | null> {
  const [review] = await db
    .insert(articleReviews)
    .values({
      articleId,
      reviewStep: articleStatus,
      reviewerUserId: userId,
      reviewerNameSnapshot: displayName ?? email,
      decision: input.decision,
      reviewNotes: input.reviewNotes ?? null,
      edits: input.edits ?? null,
      valuesChecklistSnapshot: input.valuesChecklistSnapshot ?? null,
    })
    .returning({ id: articleReviews.id, decision: articleReviews.decision });

  if (!review) return null;

  await writeAuditLog({
    orgId,
    action: "article.review_submitted",
    actorUserId: userId,
    actorEmail: email,
    actorIp: ip ?? undefined,
    entityType: "article",
    entityId: articleId,
    payload: { decision: input.decision, step: articleStatus },
    changeSummary: `Review submitted: ${input.decision} at step ${articleStatus}.`,
  });

  return review as CreatedReview;
}

/**
 * Record a publication channel for an article.
 * Complexity: cyclomatic 2, cognitive 3
 */
export async function recordArticlePublication(
  articleId: string,
  orgId: string,
  userId: string,
  email: string,
  input: CreatePublicationInput,
  ip: string | null,
): Promise<{ id: string }> {
  const [pub] = await db
    .insert(articlePublications)
    .values({
      articleId,
      channel: input.channel,
      publishedBy: userId,
      publishedUrl: input.publishedUrl ?? null,
      metadata: input.metadata ?? null,
    })
    .returning({ id: articlePublications.id });

  await writeAuditLog({
    orgId,
    action: "article.publication_recorded",
    actorUserId: userId,
    actorEmail: email,
    actorIp: ip ?? undefined,
    entityType: "article",
    entityId: articleId,
    changeSummary: `Article published on channel: ${input.channel}.`,
  });

  return pub as { id: string };
}
