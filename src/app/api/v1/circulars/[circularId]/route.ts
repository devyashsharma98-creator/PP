import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { updateCircularSchema } from "@/lib/validators/circulars";
import { apiSuccess, badRequest } from "@/lib/response";
import * as circularService from "@/lib/server/services/circular-service";

export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { circularId: string }; if (!p?.circularId) return badRequest("Circular ID is required.");
  const result = await circularService.getCircular(p.circularId, ctx.session.orgId);
  if (!result.ok) return result.response;
  return apiSuccess(result.data);
});

export const PATCH = withPermission("canCreateCircular", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { circularId: string }; if (!p?.circularId) return badRequest("Circular ID is required.");
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = updateCircularSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await circularService.updateCircular(p.circularId, parsed.data, ctx);
  if (!result.ok) return result.response;
  return apiSuccess(result.data);
});

export const DELETE = withPermission("canCreateCircular", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { circularId: string }; if (!p?.circularId) return badRequest("Circular ID is required.");
  const result = await circularService.deleteCircular(p.circularId, ctx);
  if (!result.ok) return result.response;
  return new Response(null, { status: 204 });
});
