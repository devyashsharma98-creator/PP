import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createCircularSchema, listCircularsQuerySchema } from "@/lib/validators/circulars";
import { apiSuccess, apiCreated, badRequest, parsePagination, paginationMeta } from "@/lib/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import * as circularService from "@/lib/server/services/circular-service";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const sp = req.nextUrl.searchParams;
  const query = listCircularsQuerySchema.safeParse(Object.fromEntries(sp));
  if (!query.success) return badRequest(query.error.errors[0]?.message ?? "Invalid query.");
  const { page, limit, offset } = parsePagination(sp, { page: query.data.page, limit: query.data.limit });
  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await circularService.listCirculars(query.data, ctx.session.orgId, ctx.session.userId, scopedAccess, page, limit, offset);
  if (!result.ok) return result.response;
  return apiSuccess(result.data.rows, { meta: paginationMeta(page, limit, result.data.total) });
});

export const POST = withPermission("canCreateCircular", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  let body; try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }
  const parsed = createCircularSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const result = await circularService.createCircular(parsed.data, ctx);
  if (!result.ok) return result.response;
  return apiCreated(result.data);
});
