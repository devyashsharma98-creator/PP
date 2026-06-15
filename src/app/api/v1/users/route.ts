/**
 * GET  /api/v1/users   — List org users with search + filters (org_admin+)
 * POST /api/v1/users   — Create a new user with initial role (org_admin+)
 */
import "server-only";

import { NextRequest } from "next/server";

import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { createUserSchema, listUsersQuerySchema } from "@/lib/validators/users";
import {
  apiSuccess, apiCreated, badRequest,
  parsePagination, paginationMeta,
} from "@/lib/response";
import { listUsers, createUser } from "@/lib/server/services/user-service";

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withPermission("canManageUsers", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const sp = req.nextUrl.searchParams;
  const query = listUsersQuerySchema.safeParse(Object.fromEntries(sp));
  if (!query.success) return badRequest(query.error.errors[0]?.message ?? "Invalid query.");
  const q = query.data;

  const { page, limit, offset } = parsePagination(sp, { page: q.page, limit: q.limit });

  const { users, total } = await listUsers(ctx.session.orgId, q, limit, offset);

  return apiSuccess(users, { meta: paginationMeta(page, limit, total) });
});

// ── POST ──────────────────────────────────────────────────────────────────────
export const POST = withPermission("canManageUsers", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

  const result = await createUser(
    parsed.data,
    ctx.session.orgId,
    ctx.session.userId,
    ctx.session.email,
    ctx.session.displayName,
    ip
  );

  if (result instanceof Response) return result;
  return apiCreated(result);
});
