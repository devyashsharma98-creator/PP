/**
 * POST /api/v1/articles/[articleId]/publications — Record a publication (canReviewArticle)
 */
import "server-only";

import { NextRequest } from "next/server";

import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createPublicationSchema } from "@/lib/validators/articles";
import { apiCreated, badRequest, notFound } from "@/lib/response";
import { getArticleWithStatus, recordArticlePublication } from "@/lib/server/services/article-service";

type Params = { articleId: string };

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

  const parsed = createPublicationSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const pub = await recordArticlePublication(
    articleId,
    ctx.session.orgId,
    ctx.session.userId,
    ctx.session.email,
    input,
    ip,
  );

  return apiCreated({ publicationId: pub.id, channel: input.channel });
});
