import "server-only";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";
import { db } from "@/db/client";
import { pracharStatuses } from "@/db/schema/index";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;

  const rows = await db
    .select({
      entityType: pracharStatuses.entityType,
      entityId: pracharStatuses.entityId,
      platform: pracharStatuses.platform,
      isDone: pracharStatuses.isDone,
      skipReason: pracharStatuses.skipReason,
    })
    .from(pracharStatuses)
    .where(eq(pracharStatuses.orgId, orgId));

  const platforms = ["whatsapp", "facebook", "instagram", "telegram"] as const;

  const total = rows.length;
  let done = 0;
  let skipped = 0;
  const byPlatformMap: Record<string, { total: number; done: number; skipped: number }> = {};
  const entityTypeCounts: Record<string, { total: number; done: number }> = { event: { total: 0, done: 0 }, article: { total: 0, done: 0 } };
  const pendingEntityKeys = new Set<string>();
  const entityDoneMap = new Map<string, boolean>();

  for (const p of platforms) {
    byPlatformMap[p] = { total: 0, done: 0, skipped: 0 };
  }

  for (const r of rows) {
    if (r.isDone) done++;
    else if (r.skipReason) skipped++;

    const bp = byPlatformMap[r.platform];
    if (bp) {
      bp.total++;
      if (r.isDone) bp.done++;
      else if (r.skipReason) bp.skipped++;
    }

    const et = entityTypeCounts[r.entityType];
    if (et) {
      et.total++;
      if (r.isDone) et.done++;
    }

    const entityKey = `${r.entityType}:${r.entityId}`;
    if (!entityDoneMap.has(entityKey)) {
      entityDoneMap.set(entityKey, r.isDone);
    } else if (!entityDoneMap.get(entityKey)) {
      if (r.isDone) entityDoneMap.set(entityKey, true);
    }

    if (!r.isDone && !r.skipReason) {
      pendingEntityKeys.add(entityKey);
    }
  }

  const pending = total - done - skipped;
  const overallCompletionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const byPlatform = platforms.map((p) => {
    const bp = byPlatformMap[p];
    const pTotal = bp.total;
    return {
      platform: p,
      total: pTotal,
      done: bp.done,
      skipped: bp.skipped,
      pending: pTotal - bp.done - bp.skipped,
      completionRate: pTotal > 0 ? Math.round((bp.done / pTotal) * 100) : 0,
    };
  });

  const byEntityType = {
    event: {
      total: entityTypeCounts.event.total,
      done: entityTypeCounts.event.done,
      completionRate: entityTypeCounts.event.total > 0
        ? Math.round((entityTypeCounts.event.done / entityTypeCounts.event.total) * 100)
        : 0,
    },
    article: {
      total: entityTypeCounts.article.total,
      done: entityTypeCounts.article.done,
      completionRate: entityTypeCounts.article.total > 0
        ? Math.round((entityTypeCounts.article.done / entityTypeCounts.article.total) * 100)
        : 0,
    },
  };

  return apiSuccess({
    overall: {
      total,
      done,
      skipped,
      pending,
      completionRate: overallCompletionRate,
    },
    byPlatform,
    byEntityType,
    pendingEntities: pendingEntityKeys.size,
  });
});
