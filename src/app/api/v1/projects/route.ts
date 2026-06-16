import "server-only";

import { NextRequest } from "next/server";

import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createProjectSchema, listProjectsQuerySchema } from "@/lib/validators/tasks";
import { apiSuccess, apiCreated, badRequest, parsePagination, paginationMeta } from "@/lib/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import * as taskService from "@/lib/server/services/task-service";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const sp = req.nextUrl.searchParams;
  const query = listProjectsQuerySchema.safeParse(Object.fromEntries(sp));
  if (!query.success) return badRequest(query.error.errors[0]?.message ?? "Invalid query.");
  const q = query.data;

  const { page, limit, offset } = parsePagination(sp, { page: q.page, limit: q.limit });
  const scopedAccess = resolveScopedAccess(ctx.session.assignments);

  const result = await taskService.listProjects(q, ctx.session.orgId, scopedAccess, ctx.session.userId, page, limit, offset);
  if (!result.ok) return result.response;

  return apiSuccess(result.data.rows, { meta: paginationMeta(page, limit, result.data.total) });
});

export const POST = withPermission("canCreateProject", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const result = await taskService.createProject(input, ctx);
  if (!result.ok) return result.response;

  return apiCreated(result.data);
});
