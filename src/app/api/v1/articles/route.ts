/**
 * GET  /api/v1/articles  — List articles (Aalekh) with filters + pagination
 * POST /api/v1/articles  — Create a new article draft (karyakarta+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq, ilike, or, count, desc } from "drizzle-orm";

import { db } from "@/db/client";
import { articles } from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createArticleSchema, listArticlesQuerySchema } from "@/lib/validators/articles";
import {
  apiSuccess, apiCreated, badRequest, serverError,
  parsePagination, paginationMeta,
} from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";
import type { ArticleStatus } from "@/lib/permissions/article-workflow";

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const sp = req.nextUrl.searchParams;
  const query = listArticlesQuerySchema.safeParse(Object.fromEntries(sp));
  if (!query.success) return badRequest(query.error.errors[0]?.message ?? "Invalid query.");
  const q = query.data;

  const { page, limit, offset } = parsePagination(sp, { page: q.page, limit: q.limit });

  const conditions: ReturnType<typeof eq>[] = [eq(articles.orgId, ctx.session.orgId)];

  if (q.status) conditions.push(eq(articles.status, q.status as ArticleStatus));
  if (q.category) conditions.push(eq(articles.category, q.category));
  if (q.authorUserId) conditions.push(eq(articles.authorUserId, q.authorUserId));
  if (q.unitId) conditions.push(eq(articles.unitId, q.unitId));
  if (q.departmentId) conditions.push(eq(articles.departmentId, q.departmentId));

  const searchCondition = q.search
    ? or(ilike(articles.title, `%${q.search}%`), ilike(articles.summary, `%${q.search}%`))
    : undefined;

  // Karyakarta: only see their own articles
  const isKaryakartaOnly =
    ctx.session.effectiveRoleCodes.length === 1 &&
    ctx.session.effectiveRoleCodes[0] === "karyakarta";
  if (isKaryakartaOnly) {
    conditions.push(eq(articles.authorUserId, ctx.session.userId));
  }

  const whereClause = searchCondition
    ? and(...conditions, searchCondition)
    : and(...conditions);

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

  const total = Number(totalRow[0]?.value ?? 0);

  return apiSuccess(rows, { meta: paginationMeta(page, limit, total) });
});

// ── POST ──────────────────────────────────────────────────────────────────────
export const POST = withPermission("canCreateArticle", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = createArticleSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const [newArticle] = await db
    .insert(articles)
    .values({
      orgId: ctx.session.orgId,
      unitId: input.unitId ?? ctx.session.unitId ?? null,
      departmentId: input.departmentId ?? ctx.session.departmentId ?? null,
      title: input.title,
      content: input.content ?? null,
      summary: input.summary ?? null,
      category: input.category,
      authorUserId: ctx.session.userId,
      authorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
      status: "draft",
      documentUrl: input.documentUrl ?? null,
      socialUrl: input.socialUrl ?? null,
      valuesChecklist: input.valuesChecklist,
      createdBy: ctx.session.userId,
      updatedBy: ctx.session.userId,
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

  if (!newArticle) return serverError("Failed to create article.");

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "article.created",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "article",
      entityId: newArticle.id,
      changeSummary: `Article created: "${input.title}" (category: ${input.category}).`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} created article: "${input.title}".`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return apiCreated(newArticle);
});
