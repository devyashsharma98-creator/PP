import "server-only";

import { NextRequest } from "next/server";

import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { updateProjectSchema } from "@/lib/validators/tasks";
import { apiSuccess, badRequest, notFound } from "@/lib/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import * as taskService from "@/lib/server/services/task-service";

export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const p = params as { projectId: string };
  if (!p?.projectId) return badRequest("Project ID is required.");

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await taskService.getProject(p.projectId, ctx.session.orgId, scopedAccess, ctx.session.userId);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});

export const PATCH = withPermission("canUpdateProject", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const p = params as { projectId: string };
  if (!p?.projectId) return badRequest("Project ID is required.");

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

  const result = await taskService.updateProject(p.projectId, parsed.data, ctx);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});

export const DELETE = withPermission("canUpdateProject", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const p = params as { projectId: string };
  if (!p?.projectId) return badRequest("Project ID is required.");

  const result = await taskService.deleteProject(p.projectId, ctx);
  if (!result.ok) return result.response;

  return new Response(null, { status: 204 });
});
