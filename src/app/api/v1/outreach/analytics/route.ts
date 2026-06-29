/**
 * GET /api/v1/outreach/analytics
 * Outreach completion analytics: overall rate, per-type breakdown, status counts.
 * Replaces the old Prachar Vishleshan social-coverage analytics.
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq, sql as dsql } from "drizzle-orm";

import { db } from "@/db/client";
import { outreachItems } from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";
import { OUTREACH_TYPES, OUTREACH_STATUSES } from "@/lib/app/outreach-types";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;

  // Counts grouped by (type, status) in a single pass.
  const rows = await db
    .select({
      type: outreachItems.outreachType,
      status: outreachItems.status,
      count: dsql<number>`count(*)::int`,
    })
    .from(outreachItems)
    .where(eq(outreachItems.orgId, orgId))
    .groupBy(outreachItems.outreachType, outreachItems.status);

  const byType: Record<string, Record<string, number>> = {};
  const statusTotals: Record<string, number> = { pending: 0, in_progress: 0, completed: 0, skipped: 0 };
  let total = 0;

  for (const r of rows) {
    byType[r.type] ??= { pending: 0, in_progress: 0, completed: 0, skipped: 0, total: 0 };
    byType[r.type][r.status] = r.count;
    byType[r.type].total += r.count;
    if (r.status in statusTotals) statusTotals[r.status] += r.count;
    total += r.count;
  }

  const completed = statusTotals.completed;
  // Completion rate excludes skipped (intentionally not done) from the denominator.
  const actionable = total - statusTotals.skipped;
  const completionRate = actionable === 0 ? 0 : Math.round((completed / actionable) * 100);

  const perType = Object.keys(OUTREACH_TYPES).map((type) => {
    const t = byType[type] ?? { pending: 0, in_progress: 0, completed: 0, skipped: 0, total: 0 };
    const typeActionable = t.total - t.skipped;
    return {
      type,
      labelEn: OUTREACH_TYPES[type].labelEn,
      labelHi: OUTREACH_TYPES[type].labelHi,
      color: OUTREACH_TYPES[type].color,
      icon: OUTREACH_TYPES[type].icon,
      total: t.total,
      completed: t.completed,
      pending: t.pending + t.in_progress,
      skipped: t.skipped,
      completionRate: typeActionable === 0 ? 0 : Math.round((t.completed / typeActionable) * 100),
    };
  });

  return apiSuccess({
    total,
    completed,
    pending: statusTotals.pending + statusTotals.in_progress,
    skipped: statusTotals.skipped,
    completionRate,
    statusTotals,
    perType,
    statuses: OUTREACH_STATUSES,
  });
});
