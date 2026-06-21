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

  const [metricsMap, profileMap] = await Promise.all([
    getAllMetrics(orgId),
    getProfileMap(orgId),
  ]);

  const entries = buildContributorEntries(metricsMap, profileMap);
  const top25 = entries.slice(0, 25);

  return apiSuccess(top25);
});
