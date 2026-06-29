import "server-only";
import { and, eq, sql as dsql } from "drizzle-orm";

import { db } from "@/db/client";
import { researchProjects, researchMilestones } from "@/db/schema/index";

/**
 * Recompute a project's progress as the weighted share of completed milestones,
 * then persist it. neon-http has no transactions, so this is a fresh aggregate
 * read followed by a single UPDATE (see the no-transactions rule).
 */
export async function recomputeProjectProgress(orgId: string, projectId: string): Promise<number> {
  const [agg] = await db
    .select({
      totalWeight: dsql<number>`coalesce(sum(${researchMilestones.weight}), 0)::int`,
      doneWeight: dsql<number>`coalesce(sum(${researchMilestones.weight}) filter (where ${researchMilestones.status} = 'completed'), 0)::int`,
    })
    .from(researchMilestones)
    .where(and(eq(researchMilestones.orgId, orgId), eq(researchMilestones.projectId, projectId)));

  const total = agg?.totalWeight ?? 0;
  const done = agg?.doneWeight ?? 0;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  await db
    .update(researchProjects)
    .set({ progress, updatedAt: new Date() })
    .where(and(eq(researchProjects.id, projectId), eq(researchProjects.orgId, orgId)));

  return progress;
}
