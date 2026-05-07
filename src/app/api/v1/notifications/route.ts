import "server-only";

import { NextRequest } from "next/server";
import { and, eq, desc, sql as drizzleSql } from "drizzle-orm";

import { db } from "@/db/client";
import { notifications } from "@/db/schema/index";
import { notificationFiltersSchema } from "@/lib/server/validation/notifications";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, badRequest, serverError } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const filters = {
    is_read: searchParams.get("is_read") === "true" ? true : searchParams.get("is_read") === "false" ? false : undefined,
    kind: searchParams.get("kind") || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "20", 10),
  };

  const parsed = notificationFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    return badRequest(parsed.error.errors[0]?.message ?? "Invalid notifications query.");
  }

  try {
    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const conditions = [eq(notifications.recipientUserId, ctx.session.userId)];
    if (parsed.data.is_read !== undefined) {
      conditions.push(eq(notifications.isRead, parsed.data.is_read));
    }
    if (parsed.data.kind) {
      conditions.push(eq(notifications.kind, parsed.data.kind));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [countResult] = await db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(notifications)
      .where(whereClause);

    const total = Number(countResult?.count ?? 0);

    const rows = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return apiSuccess(rows, {
      meta: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Notifications list error:", error);
    return serverError("Failed to fetch notifications");
  }
});

export const PATCH = withAuth(async (_req: NextRequest, ctx) => {
  try {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.recipientUserId, ctx.session.userId), eq(notifications.isRead, false)));

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("Notifications update error:", error);
    return serverError("Failed to update notifications");
  }
});
