import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest } from "@/lib/response";
import * as volunteerService from "@/lib/server/services/volunteer-service";

export const DELETE = withPermission("canManageVolunteers", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { activityId: string }; if (!p?.activityId) return badRequest("Activity ID is required.");
  const result = await volunteerService.deleteActivity(p.activityId, ctx);
  if (!result.ok) return result.response;
  return new Response(null, { status: 204 });
});
