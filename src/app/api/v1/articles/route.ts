/**
 * GET  /api/v1/articles  — List articles (Aalekh) with filters + pagination
 * POST /api/v1/articles  — Create a new article draft (karyakarta+)
 */
import "server-only";

import { NextRequest } from "next/server";

import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createArticleSchema, listArticlesQuerySchema } from "@/lib/validators/articles";
import {
  apiSuccess, apiCreated, badRequest, forbidden, serverError,
  parsePagination, paginationMeta,
} from "@/lib/response";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import { listArticles, createArticle } from "@/lib/server/services/article-service";

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

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const { rows, total } = await listArticles(
    ctx.session.orgId,
    ctx.session.userId,
    q,
    limit,
    offset,
    scopedAccess,
  );

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

  const unitId = input.unitId ?? ctx.session.unitId ?? null;
  const departmentId = input.departmentId ?? ctx.session.departmentId ?? null;

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  if (
    !rowMatchesScope(
      scopedAccess,
      {
        unitId,
        departmentId,
        authorUserId: ctx.session.userId,
        createdBy: ctx.session.userId,
      },
      ctx.session.userId,
    )
  ) {
    return forbidden("You cannot create an article outside your assigned scope.");
  }

  const newArticle = await createArticle(
    ctx.session.orgId,
    ctx.session.userId,
    ctx.session.displayName,
    ctx.session.email,
    unitId,
    departmentId,
    input,
    ip,
  );

  if (!newArticle) return serverError("Failed to create article.");

  return apiCreated(newArticle);
});
