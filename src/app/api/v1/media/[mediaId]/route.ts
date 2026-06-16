import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest } from "@/lib/response";
import { updateMediaAssetSchema } from "@/lib/validators/media";
import * as mediaService from "@/lib/server/services/media-service";

export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { mediaId: string }; if (!p?.mediaId) return badRequest("Media ID is required.");
  const result = await mediaService.getMediaAsset(p.mediaId);
  if (!result.ok) return result.response;
  return apiSuccess(result.data);
});

export const PATCH = withPermission("canManageMediaLibrary", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { mediaId: string }; if (!p?.mediaId) return badRequest("Media ID is required.");
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = updateMediaAssetSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await mediaService.updateMediaAsset(p.mediaId, parsed.data, ctx);
  if (!result.ok) return result.response;
  return apiSuccess(result.data);
});

export const DELETE = withPermission("canDeleteMedia", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const p = params as { mediaId: string }; if (!p?.mediaId) return badRequest("Media ID is required.");
  const result = await mediaService.deleteMediaAsset(p.mediaId, ctx);
  if (!result.ok) return result.response;
  return new Response(null, { status: 204 });
});

function apiSuccess<T>(data: T) {
  return Response.json({ success: true, data });
}
