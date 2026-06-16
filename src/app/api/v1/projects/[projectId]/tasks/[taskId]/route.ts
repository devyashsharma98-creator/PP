import "server-only";

import { NextRequest } from "next/server";

import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { updateTaskSchema } from "@/lib/validators/tasks";
import { apiSuccess, badRequest } from "@/lib/response";
import * as taskService from "@/lib/server/services/task-service";

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

  const result = await taskService.updateTask(p.projectId, p.taskId, parsed.data, ctx);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});

export const DELETE = withPermission("canUpdateTask", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const p = params as { projectId: string; taskId: string };
  if (!p?.projectId || !p?.taskId) return badRequest("Project and Task IDs are required.");

  const result = await taskService.deleteTask(p.projectId, p.taskId, ctx);
  if (!result.ok) return result.response;

  return new Response(null, { status: 204 });
});
