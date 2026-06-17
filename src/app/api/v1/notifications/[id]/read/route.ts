import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { notifications } from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, notFound, serverError } from "@/lib/response";

export const POST = withAuth(async (req: NextRequest, ctx) => {
  try {
    const id = req.nextUrl.pathname.split("/").at(-2);
    if (!id) return notFound("Notification ID not found.");

    const [existing] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.recipientUserId, ctx.session.userId)));

    if (!existing) return notFound("Notification not found.");

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id));

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("Notification mark-read error:", error);
    return serverError("Failed to mark notification as read");
  }
});
