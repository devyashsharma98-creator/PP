/**
 * GET /api/v1/campus-units/[id]/activation
 * Computes a 0-100 activation score for a unit from its study circles, outreach,
 * and resource activity, with the component counts that drive it.
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq, sql as dsql } from "drizzle-orm";

import { db } from "@/db/client";
import { campusStudyCircles, campusOutreachLog, campusResourceDistribution } from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";

type Params = { id: string };

export const GET = withAuth(async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id: unitId } = params as Params;
  const quarterAgo = new Date(Date.now() - 90 * 86400000);

  const [scAll] = await db
    .select({
      total: dsql<number>`count(*)::int`,
      completed: dsql<number>`count(*) filter (where ${campusStudyCircles.completed} = true)::int`,
      recent: dsql<number>`count(*) filter (where ${campusStudyCircles.scheduledDate} >= ${quarterAgo.toISOString()})::int`,
    })
    .from(campusStudyCircles)
    .where(and(eq(campusStudyCircles.orgId, orgId), eq(campusStudyCircles.unitId, unitId)));

  const [olAll] = await db
    .select({
      total: dsql<number>`count(*)::int`,
      recent: dsql<number>`count(*) filter (where ${campusOutreachLog.conductedDate} >= ${quarterAgo.toISOString()})::int`,
      pendingFollowUp: dsql<number>`count(*) filter (where ${campusOutreachLog.followUpNeeded} = true)::int`,
    })
    .from(campusOutreachLog)
    .where(and(eq(campusOutreachLog.orgId, orgId), eq(campusOutreachLog.unitId, unitId)));

  const [rdAll] = await db
    .select({ total: dsql<number>`count(*)::int` })
    .from(campusResourceDistribution)
    .where(and(eq(campusResourceDistribution.orgId, orgId), eq(campusResourceDistribution.unitId, unitId)));

  const studyCirclesTotal = scAll?.total ?? 0;
  const studyCirclesCompleted = scAll?.completed ?? 0;
  const studyCirclesRecent = scAll?.recent ?? 0;
  const outreachTotal = olAll?.total ?? 0;
  const outreachRecent = olAll?.recent ?? 0;
  const pendingFollowUp = olAll?.pendingFollowUp ?? 0;
  const resources = rdAll?.total ?? 0;

  // Weighted score, capped at 100. Recent activity counts most.
  const score = Math.min(
    100,
    studyCirclesCompleted * 15 +
      studyCirclesRecent * 6 +
      outreachRecent * 12 +
      outreachTotal * 4 +
      resources * 5,
  );

  const band = score >= 60 ? "active" : score >= 25 ? "moderate" : "dormant";

  return apiSuccess({
    score,
    band,
    components: {
      studyCirclesTotal,
      studyCirclesCompleted,
      studyCirclesRecent,
      outreachTotal,
      outreachRecent,
      pendingFollowUp,
      resources,
    },
  });
});
