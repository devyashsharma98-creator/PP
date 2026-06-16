import "server-only";
import { NextRequest } from "next/server";
import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { listVolunteersQuerySchema } from "@/lib/validators/volunteers";
import { apiSuccess, badRequest, parsePagination, paginationMeta } from "@/lib/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import * as volunteerService from "@/lib/server/services/volunteer-service";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const sp = req.nextUrl.searchParams;
  const query = listVolunteersQuerySchema.safeParse(Object.fromEntries(sp));
  if (!query.success) return badRequest(query.error.errors[0]?.message ?? "Invalid query.");
  const { page, limit, offset } = parsePagination(sp, { page: query.data.page, limit: query.data.limit });
  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await volunteerService.listVolunteers(query.data, ctx.session.orgId, scopedAccess, page, limit, offset);
  if (!result.ok) return result.response;
  return apiSuccess(result.data.rows, { meta: paginationMeta(page, limit, result.data.total) });
});
