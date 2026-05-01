/**
 * GET /api/v1/vimarsh/topics — List active Vimarsh topics with resources, grouped by group.
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq, asc } from "drizzle-orm";

import { db } from "@/db/client";
import { vimarshTopics, vimarshResources } from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;

  // 1. Fetch active topics for this org
  const topicRows = await db
    .select({
      id: vimarshTopics.id,
      title: vimarshTopics.title,
      titleHi: vimarshTopics.titleHi,
      description: vimarshTopics.description,
      descriptionHi: vimarshTopics.descriptionHi,
      group: vimarshTopics.group,
      sortOrder: vimarshTopics.sortOrder,
    })
    .from(vimarshTopics)
    .where(and(eq(vimarshTopics.orgId, orgId), eq(vimarshTopics.isActive, true)))
    .orderBy(asc(vimarshTopics.sortOrder));

  if (topicRows.length === 0) {
    return apiSuccess([]);
  }

  const topicIds = topicRows.map((t) => t.id);

  // 2. Fetch active resources for these topics
  const resourceRows = await db
    .select({
      id: vimarshResources.id,
      topicId: vimarshResources.topicId,
      title: vimarshResources.title,
      titleHi: vimarshResources.titleHi,
      url: vimarshResources.url,
      resourceType: vimarshResources.resourceType,
      sortOrder: vimarshResources.sortOrder,
    })
    .from(vimarshResources)
    .where(and(eq(vimarshResources.orgId, orgId), eq(vimarshResources.isActive, true)))
    .orderBy(asc(vimarshResources.sortOrder));

  // 3. Nest resources into topics
  const resourcesByTopic = new Map<string, typeof resourceRows>();
  for (const r of resourceRows) {
    if (!topicIds.includes(r.topicId)) continue;
    const list = resourcesByTopic.get(r.topicId) ?? [];
    list.push(r);
    resourcesByTopic.set(r.topicId, list);
  }

  const topicsWithResources = topicRows.map((t) => ({
    ...t,
    resources: resourcesByTopic.get(t.id) ?? [],
  }));

  // 4. Group by group field
  const grouped = new Map<string, typeof topicsWithResources>();
  for (const t of topicsWithResources) {
    const list = grouped.get(t.group) ?? [];
    list.push(t);
    grouped.set(t.group, list);
  }

  const payload = Array.from(grouped.entries()).map(([group, topics]) => ({
    group,
    topics,
  }));

  return apiSuccess(payload);
});
