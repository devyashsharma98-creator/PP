import "server-only";

import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { articles, articleReviews, events, circulars, profiles } from "@/db/schema/index";
import type { ArticleStatus } from "@/db/schema/enums";
import {
  computeScore,
  getLevel,
  type ContributionMetrics,
  type ContributorEntry,
} from "./contributions";

// ── Aggregation helpers ─────────────────────────────────────────────────

export async function getAllMetrics(
  orgId: string,
): Promise<Map<string, ContributionMetrics>> {
  const metricsMap = new Map<string, ContributionMetrics>();

  function add(userId: string, key: keyof ContributionMetrics, n: number) {
    if (!userId) return;
    let m = metricsMap.get(userId);
    if (!m) {
      m = { authored: 0, published: 0, reviews: 0, events: 0, circulars: 0 };
      metricsMap.set(userId, m);
    }
    m[key] += n;
  }

  // Articles authored
  const authoredRows = await db
    .select({ userId: articles.authorUserId, cnt: count() })
    .from(articles)
    .where(
      and(
        eq(articles.orgId, orgId),
        sql`${articles.authorUserId} IS NOT NULL`,
      ),
    )
    .groupBy(articles.authorUserId);
  for (const r of authoredRows) {
    if (r.userId) add(r.userId, "authored", r.cnt);
  }

  // Articles published (status = 'authorized_public')
  const publishedRows = await db
    .select({ userId: articles.authorUserId, cnt: count() })
    .from(articles)
    .where(
      and(
        eq(articles.orgId, orgId),
        eq(articles.status, "authorized_public" satisfies ArticleStatus),
        sql`${articles.authorUserId} IS NOT NULL`,
      ),
    )
    .groupBy(articles.authorUserId);
  for (const r of publishedRows) {
    if (r.userId) add(r.userId, "published", r.cnt);
  }

  // Reviews done — join through articles for org scope
  const reviewRows = (await db
    .select({
      userId: articleReviews.reviewerUserId,
      cnt: count(),
    })
    .from(articleReviews)
    .innerJoin(articles, eq(articleReviews.articleId, articles.id))
    .where(
      and(
        eq(articles.orgId, orgId),
        sql`${articleReviews.reviewerUserId} IS NOT NULL`,
      ),
    )
    .groupBy(articleReviews.reviewerUserId)) as { userId: string | null; cnt: number }[];
  for (const r of reviewRows) {
    if (r.userId) add(r.userId, "reviews", r.cnt);
  }

  // Events organised
  const eventRows = await db
    .select({ userId: events.createdBy, cnt: count() })
    .from(events)
    .where(
      and(
        eq(events.orgId, orgId),
        sql`${events.createdBy} IS NOT NULL`,
      ),
    )
    .groupBy(events.createdBy);
  for (const r of eventRows) {
    if (r.userId) add(r.userId, "events", r.cnt);
  }

  // Circulars issued
  const circularRows = await db
    .select({ userId: circulars.authorUserId, cnt: count() })
    .from(circulars)
    .where(
      and(
        eq(circulars.orgId, orgId),
        sql`${circulars.authorUserId} IS NOT NULL`,
      ),
    )
    .groupBy(circulars.authorUserId);
  for (const r of circularRows) {
    if (r.userId) add(r.userId, "circulars", r.cnt);
  }

  return metricsMap;
}

export async function getProfileMap(
  orgId: string,
): Promise<Map<string, { name: string | null; nameHi: string | null }>> {
  const profileRows = await db
    .select({
      id: profiles.id,
      name: profiles.displayName,
      nameHi: profiles.displayNameHi,
    })
    .from(profiles)
    .where(and(eq(profiles.orgId, orgId), eq(profiles.isActive, true)));

  const map = new Map<string, { name: string | null; nameHi: string | null }>();
  for (const p of profileRows) {
    map.set(p.id, { name: p.name, nameHi: p.nameHi });
  }
  return map;
}

export function buildContributorEntries(
  metricsMap: Map<string, ContributionMetrics>,
  profileMap: Map<string, { name: string | null; nameHi: string | null }>,
): ContributorEntry[] {
  const entries: ContributorEntry[] = [];
  for (const [userId, metrics] of metricsMap) {
    const p = profileMap.get(userId);
    const score = computeScore(metrics);
    const { level, levelHi } = getLevel(score);
    entries.push({
      userId,
      name: p?.name ?? null,
      nameHi: p?.nameHi ?? null,
      metrics,
      score,
      level,
      levelHi,
    });
  }
  entries.sort((a, b) => b.score - a.score);
  return entries;
}
