import "server-only";

import { NextRequest } from "next/server";

import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, serverError } from "@/lib/response";
import { getAppOverview } from "@/lib/server/app-overview";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  try {
    const data = await getAppOverview(ctx.session, ctx.permissions.canManageUsers);
    return apiSuccess(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load ERP overview.";
    console.error("ERP overview error:", message);
    return serverError(message);
  }
});
