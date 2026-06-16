import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createMediaAssetSchema, listMediaAssetsQuerySchema } from "@/lib/validators/media";
import { apiSuccess, apiCreated, badRequest, parsePagination, paginationMeta } from "@/lib/response";
import * as mediaService from "@/lib/server/services/media-service";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const sp = req.nextUrl.searchParams;
  const query = listMediaAssetsQuerySchema.safeParse(Object.fromEntries(sp));
  if (!query.success) return badRequest(query.error.errors[0]?.message ?? "Invalid query.");
  const { page, limit, offset } = parsePagination(sp, { page: query.data.page, limit: query.data.limit });
  const result = await mediaService.listMediaAssets(query.data, ctx.session.orgId, page, limit, offset);
  if (!result.ok) return result.response;
  return apiSuccess(result.data.rows, { meta: paginationMeta(page, limit, result.data.total) });
});

export const POST = withPermission("canUploadMedia", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = createMediaAssetSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await mediaService.createMediaAsset(parsed.data, ctx);
  if (!result.ok) return result.response;
  return apiCreated(result.data);
});
