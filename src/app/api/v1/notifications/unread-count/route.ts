import "server-only";

import { NextRequest } from "next/server";
import { and, eq, sql as drizzleSql } from "drizzle-orm";

import { db } from "@/db/client";
import { notifications } from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, serverError } from "@/lib/response";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  try {
    const [result] = await db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.recipientUserId, ctx.session.userId), eq(notifications.isRead, false)));

    return apiSuccess({ unread_count: Number(result?.count ?? 0) });
  } catch (error) {
    console.error("Notifications count error:", error);
    return serverError("Failed to fetch notification count");
  }
});
