/**
 * GET /api/v1/activity — List activity stream for the current org.
 * Optionally filters by current user's actorUserId.
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq, desc } from "drizzle-orm";

import { db } from "@/db/client";
import { activityStream } from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const { searchParams } = new URL(req.url);
  const mineOnly = searchParams.get("mine") === "true";

  const conditions = [eq(activityStream.orgId, orgId)];
  if (mineOnly && ctx.session.userId) {
    conditions.push(eq(activityStream.actorUserId, ctx.session.userId));
  }

  const rows = await db
    .select({
      id: activityStream.id,
      action: activityStream.action,
      actorUserId: activityStream.actorUserId,
      actorNameSnapshot: activityStream.actorNameSnapshot,
      entityType: activityStream.entityType,
      entityId: activityStream.entityId,
      summary: activityStream.summary,
      createdAt: activityStream.createdAt,
    })
    .from(activityStream)
    .where(and(...conditions))
    .orderBy(desc(activityStream.createdAt))
    .limit(50);

  return apiSuccess(rows);
});
