/**
 * GET /api/v1/tasks/mine — Every task assigned to the caller, across projects.
 *
 * Deliberately not scope-filtered by project: an assignment is itself the
 * authority to see the task. This is how work handed over from another unit's
 * project becomes discoverable.
 */
import "server-only";

import { NextRequest } from "next/server";
import { z } from "zod";

import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, badRequest } from "@/lib/response";
import { taskStatusValues } from "@/db/schema/enums";
import * as taskService from "@/lib/server/services/task-service";

const querySchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  search: z.string().trim().max(128).optional(),
});

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid query.");

  const result = await taskService.listMyTasks(ctx.session.orgId, ctx.session.userId, parsed.data);
  if (!result.ok) return result.response;

  return apiSuccess(result.data.rows);
});
