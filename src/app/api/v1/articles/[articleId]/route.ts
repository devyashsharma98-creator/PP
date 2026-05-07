/**
 * GET   /api/v1/articles/[articleId]  — Get full article with reviews + publications
 * PATCH /api/v1/articles/[articleId]  — Update article (author or aayam_pramukh+)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { articles } from "@/db/schema/index";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import { apiSuccess, notFound, forbidden } from "@/lib/response";
import { patchArticle } from "./_patch";

type Params = { articleId: string };

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { articleId } = params as Params;

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.orgId, ctx.session.orgId)),
    with: {
      reviews: {
        orderBy: (r, { desc }) => [desc(r.createdAt)],
        with: { reviewer: { columns: { id: true, displayName: true, email: true } } },
      },
      publications: { orderBy: (p, { desc }) => [desc(p.publishedAt)] },
      author: { columns: { id: true, displayName: true, email: true } },
    },
  });

  if (!article) return notFound("Article not found.");
  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  if (!rowMatchesScope(scopedAccess, article, ctx.session.userId)) {
    return forbidden("You do not have access to this article.");
  }

  // Karyakarta can only view own articles or published ones
  const isKaryakartaOnly =
    ctx.session.effectiveRoleCodes.length === 1 &&
    ctx.session.effectiveRoleCodes[0] === "karyakarta";
  if (
    isKaryakartaOnly &&
    article.authorUserId !== ctx.session.userId &&
    article.status !== "authorized_public"
  ) {
    return forbidden("You may only view your own articles.");
  }

  return apiSuccess(article);
});

// ── PATCH ─────────────────────────────────────────────────────────────────────
export const PATCH = withPermission("canUpdateArticle", async (req: NextRequest, ctx, params) => {
  const { articleId } = params as Params;
  return patchArticle(req, ctx, articleId);
});
