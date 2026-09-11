import "server-only";

import { NextRequest } from "next/server";

import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { updateProjectSchema } from "@/lib/validators/tasks";
import { apiSuccess, badRequest } from "@/lib/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import * as taskService from "@/lib/server/services/task-service";

export const GET = withAuth(async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const p = params as { projectId: string };
  if (!p?.projectId) return badRequest("Project ID is required.");

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await taskService.getProject(
    p.projectId,
    ctx.session.orgId,
    scopedAccess,
    ctx.session.userId,
    ctx.session.effectiveRoleCodes,
  );
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

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await taskService.updateProject(p.projectId, parsed.data, ctx, scopedAccess);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});

/**
 * DELETE archives the project by default. Permanent deletion cascades to every
 * task in it, so it must be asked for explicitly (`?hardDelete=true`) and
 * confirmed against the exact number of tasks that will be destroyed
 * (`?expectedTaskCount=N`). A mismatch is a 409, not a silent deletion.
 */
export const DELETE = withPermission("canUpdateProject", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const p = params as { projectId: string };
  if (!p?.projectId) return badRequest("Project ID is required.");

  const sp = req.nextUrl.searchParams;
  const hardDelete = sp.get("hardDelete") === "true";
  const rawExpected = sp.get("expectedTaskCount");
  let expectedTaskCount: number | undefined;
  if (rawExpected !== null) {
    const parsedCount = Number(rawExpected);
    if (!Number.isInteger(parsedCount) || parsedCount < 0) {
      return badRequest("expectedTaskCount must be a non-negative integer.");
    }
    expectedTaskCount = parsedCount;
  }

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  const result = await taskService.removeProject(p.projectId, ctx, scopedAccess, {
    hardDelete,
    expectedTaskCount,
  });
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});
