import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { articles } from "@/db/schema/index";
import { getClientIp, type AuthContext } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { hasRoleOrAbove } from "@/lib/permissions";
import { updateArticleSchema } from "@/lib/validators/articles";
import { apiSuccess, badRequest, notFound, forbidden, serverError } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";

export async function patchArticle(req: NextRequest, ctx: AuthContext, articleId: string) {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
    columns: { id: true, title: true, status: true, authorUserId: true },
  });
  if (!article) return notFound("Article not found.");

  const isAuthor = article.authorUserId === ctx.session.userId;
  const isSenior = hasRoleOrAbove(ctx.session.effectiveRoleCodes, "aayam_pramukh");
  if (!isAuthor && !isSenior) return forbidden("You may only edit articles you authored.");

  if (article.status === "authorized_public" || article.status === "archived") {
    return forbidden(`Cannot edit an article with status '${article.status}'.`);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = updateArticleSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const [updated] = await db
    .update(articles)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.summary !== undefined && { summary: input.summary }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.documentUrl !== undefined && { documentUrl: input.documentUrl }),
      ...(input.socialUrl !== undefined && { socialUrl: input.socialUrl }),
      ...(input.valuesChecklist !== undefined && { valuesChecklist: input.valuesChecklist }),
      updatedBy: ctx.session.userId,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, articleId))
    .returning({ id: articles.id, title: articles.title, updatedAt: articles.updatedAt });

  if (!updated) return serverError("Failed to update article.");

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "article.updated",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "article",
      entityId: articleId,
      payload: input as Record<string, unknown>,
      changeSummary: `Article updated: "${updated.title}".`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} updated article: "${updated.title}".`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return apiSuccess(updated);
}
