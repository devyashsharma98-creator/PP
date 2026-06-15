/**
 * POST /api/v1/articles/[articleId]/workflow
 *
 * Trigger a workflow status transition on an article (Aalekh).
 * Enforces the full editorial review state machine including values checklist.
 */
import "server-only";

import { NextRequest } from "next/server";

import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { articleWorkflowSchema } from "@/lib/validators/articles";
import { apiSuccess, badRequest, notFound, forbidden, serverError } from "@/lib/response";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import {
  getArticleForWorkflow,
  transitionArticleWorkflow,
} from "@/lib/server/services/article-service";

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

  const article = await getArticleForWorkflow(articleId, ctx.session.orgId);
  if (!article) return notFound("Article not found.");

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  if (!rowMatchesScope(scopedAccess, article, ctx.session.userId)) {
    return forbidden("You do not have access to transition this article.");
  }

  const result = await transitionArticleWorkflow(
    article,
    articleId,
    ctx.session.orgId,
    ctx.session.userId,
    ctx.session.displayName,
    ctx.session.email,
    ctx.session.effectiveRoleCodes,
    toStatus,
    notes,
    valuesChecklist,
    ip,
  );

  if (result.kind === "forbidden") return forbidden(result.message);
  if (result.kind === "server_error") return serverError(result.message);

  return apiSuccess(result.data);
});
