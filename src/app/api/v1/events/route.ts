/**
 * GET  /api/v1/events  — List events with filters + pagination
 * POST /api/v1/events  — Create a new event (unit_head+)
 */
import "server-only";

import { NextRequest } from "next/server";

import { withAuth, withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createEventSchema, listEventsQuerySchema } from "@/lib/validators/events";
import {
  apiSuccess, apiCreated, badRequest, forbidden,
  parsePagination, paginationMeta,
} from "@/lib/response";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import * as eventService from "@/lib/server/services/event-service";

// ── GET ─────────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const sp = req.nextUrl.searchParams;
  const query = listEventsQuerySchema.safeParse(Object.fromEntries(sp));
  if (!query.success) return badRequest(query.error.errors[0]?.message ?? "Invalid query.");
  const q = query.data;

  const { page, limit, offset } = parsePagination(sp, { page: q.page, limit: q.limit });
  const scopedAccess = resolveScopedAccess(ctx.session.assignments);

  const result = await eventService.listEvents(q, ctx.session.orgId, scopedAccess, ctx.session.userId, page, limit, offset);
  if (!result.ok) return result.response;

  return apiSuccess(result.data.rows, { meta: paginationMeta(page, limit, result.data.total) });
});

// ── POST ────────────────────────────────────────────────────────────────────────
export const POST = withPermission("canCreateEvent", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  const unitId = input.unitId ?? ctx.session.unitId ?? null;
  const departmentId = input.departmentId ?? ctx.session.departmentId ?? null;
  const scopedAccess = resolveScopedAccess(ctx.session.assignments);
  if (!rowMatchesScope(scopedAccess, { unitId, departmentId, createdBy: ctx.session.userId }, ctx.session.userId)) {
    return forbidden("You cannot create an event outside your assigned scope.");
  }

  const result = await eventService.createEvent({ ...input, unitId, departmentId }, ctx);
  if (!result.ok) return result.response;

  await eventService.auditEventCreated(ctx, result.data, ip);

  return apiCreated(result.data);
});
