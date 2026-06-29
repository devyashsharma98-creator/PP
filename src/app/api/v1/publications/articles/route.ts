/**
 * /api/v1/publications/articles
 *   GET  — list article submissions (filters: status, publicationId, mine=true).
 *   POST — submit an article (requires canCreateArticle).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db/client";
import { publicationArticles, publications, profiles } from "@/db/schema/index";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";

const ARTICLE_STATUSES = new Set([
  "submitted", "under_review", "revision_requested", "accepted", "rejected", "published", "withdrawn",
]);

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const publicationId = sp.get("publicationId");
  const mine = sp.get("mine") === "true";

  const submitter = alias(profiles, "submitter");
  const reviewer = alias(profiles, "reviewer");

  const filters = [eq(publicationArticles.orgId, orgId)];
  if (status && ARTICLE_STATUSES.has(status)) filters.push(eq(publicationArticles.status, status));
  if (publicationId) filters.push(eq(publicationArticles.publicationId, publicationId));
  if (mine) filters.push(eq(publicationArticles.submittedBy, ctx.session.userId));

  const rows = await db
    .select({
      id: publicationArticles.id,
      publicationId: publicationArticles.publicationId,
      publicationTitle: publications.title,
      title: publicationArticles.title,
      titleHi: publicationArticles.titleHi,
      abstract: publicationArticles.abstract,
      status: publicationArticles.status,
      recommendation: publicationArticles.recommendation,
      rating: publicationArticles.rating,
      reviewComment: publicationArticles.reviewComment,
      version: publicationArticles.version,
      submittedAt: publicationArticles.submittedAt,
      reviewedAt: publicationArticles.reviewedAt,
      submitterName: submitter.displayName,
      reviewerName: reviewer.displayName,
    })
    .from(publicationArticles)
    .leftJoin(submitter, eq(publicationArticles.submittedBy, submitter.id))
    .leftJoin(reviewer, eq(publicationArticles.reviewerId, reviewer.id))
    .leftJoin(publications, eq(publicationArticles.publicationId, publications.id))
    .where(and(...filters))
    .orderBy(desc(publicationArticles.submittedAt));

  return apiSuccess(rows);
});

export const POST = withPermission("canCreateArticle", async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const userId = ctx.session.userId;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const title = String(body.title ?? "").trim();
  if (!title) return badRequest("title is required.");

  try {
    const [inserted] = await db
      .insert(publicationArticles)
      .values({
        orgId,
        publicationId: body.publicationId ? String(body.publicationId) : null,
        title,
        titleHi: body.titleHi ? String(body.titleHi).trim() : null,
        abstract: body.abstract ? String(body.abstract).trim() : null,
        abstractHi: body.abstractHi ? String(body.abstractHi).trim() : null,
        body: body.body ? String(body.body) : "",
        bodyHi: body.bodyHi ? String(body.bodyHi) : null,
        authorIds: Array.isArray(body.authorIds) ? (body.authorIds as string[]) : null,
        references: body.references ? String(body.references) : null,
        status: "submitted",
        submittedBy: userId,
      })
      .returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Insert failed");
  }
});
