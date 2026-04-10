import "server-only";

import { NextRequest } from "next/server";

import { NotificationService } from "@/lib/server/services/notification.service";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, serverError } from "@/lib/response";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  try {
    const service = new NotificationService();
    const count = await service.getUnreadCount(ctx.session.userId);
    return apiSuccess({ unread_count: count });
  } catch (error) {
    console.error("Notifications count error:", error);
    return serverError("Failed to fetch notification count");
  }
});
