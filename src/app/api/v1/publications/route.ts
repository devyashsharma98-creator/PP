/**
 * /api/v1/publications
 *   GET  — list issues with article counts.
 *   POST — create an issue (requires canPublishArticle — editorial level).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, desc, eq, sql as dsql } from "drizzle-orm";

import { db } from "@/db/client";
import { publications, publicationArticles } from "@/db/schema/index";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";

const ISSUE_STATUSES = new Set(["draft", "preparing", "reviewing", "published"]);

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;

  const rows = await db
    .select()
    .from(publications)
    .where(eq(publications.orgId, orgId))
    .orderBy(desc(publications.updatedAt));

  const counts = await db
    .select({ publicationId: publicationArticles.publicationId, count: dsql<number>`count(*)::int` })
    .from(publicationArticles)
    .where(eq(publicationArticles.orgId, orgId))
    .groupBy(publicationArticles.publicationId);

  const countByPub = new Map(counts.map((c) => [c.publicationId, c.count]));

  return apiSuccess(rows.map((p) => ({ ...p, articleCount: countByPub.get(p.id) ?? 0 })));
});

export const POST = withPermission("canPublishArticle", async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const userId = ctx.session.userId;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const title = String(body.title ?? "").trim();
  const titleHi = String(body.titleHi ?? "").trim();
  if (!title || !titleHi) return badRequest("title and titleHi are required.");

  const status = ISSUE_STATUSES.has(String(body.status)) ? String(body.status) : "draft";

  try {
    const [inserted] = await db
      .insert(publications)
      .values({
        orgId,
        title,
        titleHi,
        subtitle: body.subtitle ? String(body.subtitle) : null,
        subtitleHi: body.subtitleHi ? String(body.subtitleHi) : null,
        issueNumber: body.issueNumber ? String(body.issueNumber) : null,
        description: body.description ? String(body.description).trim() : null,
        descriptionHi: body.descriptionHi ? String(body.descriptionHi).trim() : null,
        status,
        visibility: body.visibility ? String(body.visibility) : "public",
        createdBy: userId,
      })
      .returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Insert failed");
  }
});
