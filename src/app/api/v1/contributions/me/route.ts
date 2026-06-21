import "server-only";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";
import {
  getAllMetrics,
  getProfileMap,
  buildContributorEntries,
} from "@/lib/contributions.server";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const userId = ctx.session.userId;

  const [metricsMap, profileMap] = await Promise.all([
    getAllMetrics(orgId),
    getProfileMap(orgId),
  ]);

  const entries = buildContributorEntries(metricsMap, profileMap);

  const metrics = metricsMap.get(userId) ?? {
    authored: 0,
    published: 0,
    reviews: 0,
    events: 0,
    circulars: 0,
  };

  const myEntry = entries.find((e) => e.userId === userId);
  const rank = myEntry ? entries.indexOf(myEntry) + 1 : 0;

  const { level, levelHi } = myEntry ?? { level: "Naya Yogi", levelHi: "नया योगी" };

  return apiSuccess({
    userId,
    metrics,
    score: myEntry?.score ?? 0,
    level,
    levelHi,
    rank,
    totalContributors: entries.length,
  });
});
