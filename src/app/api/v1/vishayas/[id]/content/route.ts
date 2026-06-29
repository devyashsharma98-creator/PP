/**
 * GET /api/v1/vishayas/[id]/content
 * Resolves everything tagged with a vishay into displayable items, grouped by
 * content type. This is the read side of the taxonomy bridge — it powers the
 * "one subject, many surfaces" detail view.
 *
 * Returns: { vishay: {...}, groups: { article: [...], event: [...], scholar: [...] } }
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq, inArray, desc } from "drizzle-orm";

import { db } from "@/db/client";
import { vishayas, contentVishayaMap, articles, events, scholars, publicationArticles, researchProjects } from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, notFound } from "@/lib/response";

type Params = { id: string };

export const GET = withAuth(async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  const [vishay] = await db
    .select({
      id: vishayas.id,
      slug: vishayas.slug,
      nameEn: vishayas.nameEn,
      nameHi: vishayas.nameHi,
      description: vishayas.description,
      descriptionHi: vishayas.descriptionHi,
      color: vishayas.color,
      icon: vishayas.icon,
    })
    .from(vishayas)
    .where(and(eq(vishayas.id, id), eq(vishayas.orgId, orgId)))
    .limit(1);

  if (!vishay) return notFound("Vishay not found.");

  // All links for this vishay, grouped by type in memory.
  const links = await db
    .select({ contentType: contentVishayaMap.contentType, contentId: contentVishayaMap.contentId })
    .from(contentVishayaMap)
    .where(and(eq(contentVishayaMap.orgId, orgId), eq(contentVishayaMap.vishayId, id)));

  const idsByType = new Map<string, string[]>();
  for (const l of links) {
    const list = idsByType.get(l.contentType) ?? [];
    list.push(l.contentId);
    idsByType.set(l.contentType, list);
  }

  const articleIds = idsByType.get("article") ?? [];
  const eventIds = idsByType.get("event") ?? [];
  const scholarIds = idsByType.get("scholar") ?? [];
  const publicationIds = idsByType.get("publication") ?? [];
  const projectIds = idsByType.get("project") ?? [];

  const [articleRows, eventRows, scholarRows, publicationRows, projectRows] = await Promise.all([
    articleIds.length
      ? db
          .select({ id: articles.id, title: articles.title, status: articles.status, category: articles.category })
          .from(articles)
          .where(and(eq(articles.orgId, orgId), inArray(articles.id, articleIds)))
          .orderBy(desc(articles.updatedAt))
      : Promise.resolve([]),
    eventIds.length
      ? db
          .select({ id: events.id, title: events.title, status: events.status, startsAt: events.startsAt })
          .from(events)
          .where(and(eq(events.orgId, orgId), inArray(events.id, eventIds)))
          .orderBy(desc(events.startsAt))
      : Promise.resolve([]),
    scholarIds.length
      ? db
          .select({ id: scholars.id, name: scholars.name, nameHi: scholars.nameHi, slug: scholars.slug, designation: scholars.designation })
          .from(scholars)
          .where(and(eq(scholars.orgId, orgId), inArray(scholars.id, scholarIds)))
          .orderBy(scholars.name)
      : Promise.resolve([]),
    publicationIds.length
      ? db
          .select({ id: publicationArticles.id, title: publicationArticles.title, titleHi: publicationArticles.titleHi, status: publicationArticles.status })
          .from(publicationArticles)
          .where(and(eq(publicationArticles.orgId, orgId), inArray(publicationArticles.id, publicationIds)))
          .orderBy(desc(publicationArticles.submittedAt))
      : Promise.resolve([]),
    projectIds.length
      ? db
          .select({ id: researchProjects.id, title: researchProjects.title, titleHi: researchProjects.titleHi, status: researchProjects.status })
          .from(researchProjects)
          .where(and(eq(researchProjects.orgId, orgId), inArray(researchProjects.id, projectIds)))
          .orderBy(desc(researchProjects.updatedAt))
      : Promise.resolve([]),
  ]);

  return apiSuccess({
    vishay,
    groups: {
      article: articleRows,
      event: eventRows,
      scholar: scholarRows,
      publication: publicationRows,
      project: projectRows,
    },
    totals: {
      article: articleRows.length,
      event: eventRows.length,
      scholar: scholarRows.length,
      publication: publicationRows.length,
      project: projectRows.length,
      all: articleRows.length + eventRows.length + scholarRows.length + publicationRows.length + projectRows.length,
    },
  });
});
