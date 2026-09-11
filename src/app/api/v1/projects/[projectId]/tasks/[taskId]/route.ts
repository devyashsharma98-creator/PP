import "server-only";

import { NextRequest } from "next/server";

import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { updateTaskSchema } from "@/lib/validators/tasks";
import { apiSuccess, badRequest } from "@/lib/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import * as taskService from "@/lib/server/services/task-service";

/** Deep-link target for reminders: read one task directly by its own id. */
export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const p = params as { projectId: string; taskId: string };
  if (!p?.projectId || !p?.taskId) return badRequest("Project and Task IDs are required.");

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await taskService.getTask(
    p.projectId,
    p.taskId,
    ctx.session.orgId,
    scopedAccess,
    ctx.session.userId,
    ctx.session.effectiveRoleCodes,
  );
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});

export const PATCH = withPermission("canUpdateTask", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const p = params as { projectId: string; taskId: string };
  if (!p?.projectId || !p?.taskId) return badRequest("Project and Task IDs are required.");

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await taskService.updateTask(p.projectId, p.taskId, parsed.data, ctx, scopedAccess);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});

export const DELETE = withPermission("canUpdateTask", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const p = params as { projectId: string; taskId: string };
  if (!p?.projectId || !p?.taskId) return badRequest("Project and Task IDs are required.");

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await taskService.deleteTask(p.projectId, p.taskId, ctx, scopedAccess);
  if (!result.ok) return result.response;

  return new Response(null, { status: 204 });
});
