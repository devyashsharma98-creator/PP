import "server-only";

import { NextRequest } from "next/server";

import { NotificationService } from "@/lib/server/services/notification.service";
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
    const service = new NotificationService();
    const result = await service.listForUser(ctx.session.userId, parsed.data);
    return apiSuccess(result.data, { meta: result.pagination });
  } catch (error) {
    console.error("Notifications list error:", error);
    return serverError("Failed to fetch notifications");
  }
});

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  try {
    const body = await req.json();
    const service = new NotificationService();

    if (body.mark_all_read) {
      await service.markAllAsRead(ctx.session.userId);
      return apiSuccess({ success: true });
    }

    return badRequest("Invalid notification update request.");
  } catch (error) {
    console.error("Notifications update error:", error);
    return serverError("Failed to update notifications");
  }
});
