/**
 * /api/v1/publications/[id]
 *   GET    — issue detail with its articles (submitter/reviewer names joined).
 *   PATCH  — update the issue (canPublishArticle).
 *   DELETE — remove the issue; its articles are detached (publicationId → null).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db/client";
import { publications, publicationArticles, profiles } from "@/db/schema/index";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiNoContent, badRequest, notFound, serverError } from "@/lib/response";

type Params = { id: string };

export const GET = withAuth(async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  const [issue] = await db
    .select()
    .from(publications)
    .where(and(eq(publications.id, id), eq(publications.orgId, orgId)))
    .limit(1);
  if (!issue) return notFound("Publication not found.");

  const submitter = alias(profiles, "submitter");
  const reviewer = alias(profiles, "reviewer");

  const articles = await db
    .select({
      id: publicationArticles.id,
      title: publicationArticles.title,
      titleHi: publicationArticles.titleHi,
      abstract: publicationArticles.abstract,
      status: publicationArticles.status,
      recommendation: publicationArticles.recommendation,
      rating: publicationArticles.rating,
      reviewComment: publicationArticles.reviewComment,
      version: publicationArticles.version,
      sortOrder: publicationArticles.sortOrder,
      submittedAt: publicationArticles.submittedAt,
      submitterName: submitter.displayName,
      reviewerName: reviewer.displayName,
    })
    .from(publicationArticles)
    .leftJoin(submitter, eq(publicationArticles.submittedBy, submitter.id))
    .leftJoin(reviewer, eq(publicationArticles.reviewerId, reviewer.id))
    .where(and(eq(publicationArticles.publicationId, id), eq(publicationArticles.orgId, orgId)))
    .orderBy(asc(publicationArticles.sortOrder), asc(publicationArticles.submittedAt));

  return apiSuccess({ ...issue, articles });
});

export const PATCH = withPermission("canPublishArticle", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["title", "titleHi", "subtitle", "subtitleHi", "issueNumber", "description", "descriptionHi", "status", "visibility", "coverImageUrl"] as const) {
    if (k in body) patch[k] = body[k] == null ? null : String(body[k]);
  }
  if (body.status === "published" && !("publishDate" in body)) patch.publishDate = new Date();
  if ("publishDate" in body) patch.publishDate = body.publishDate ? new Date(String(body.publishDate)) : null;

  try {
    const [updated] = await db
      .update(publications)
      .set(patch)
      .where(and(eq(publications.id, id), eq(publications.orgId, orgId)))
      .returning();
    if (!updated) return notFound("Publication not found.");
    return apiSuccess(updated);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Update failed");
  }
});

export const DELETE = withPermission("canPublishArticle", async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  try {
    const [deleted] = await db
      .delete(publications)
      .where(and(eq(publications.id, id), eq(publications.orgId, orgId)))
      .returning({ id: publications.id });
    if (!deleted) return notFound("Publication not found.");
    return apiNoContent();
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Delete failed");
  }
});
