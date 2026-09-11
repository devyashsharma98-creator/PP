/**
 * GET /api/v1/assignees — Scoped, searchable directory of assignable members.
 *
 * Distinct from the admin-only /api/v1/users endpoint: this returns only the
 * members the caller may hand work to, and only the fields needed to pick a
 * name. It carries no contact details and no account state.
 */
import "server-only";

import { NextRequest } from "next/server";
import { z } from "zod";

import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, badRequest, forbidden } from "@/lib/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import { hasRoleOrAbove } from "@/lib/permissions/index";
import { searchAssignees } from "@/lib/server/services/assignee-service";

const querySchema = z.object({
  search: z.string().trim().max(128).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid query.");

  // Handing work to somebody is a coordination act, not a reading one.
  if (!hasRoleOrAbove(ctx.session.effectiveRoleCodes, "unit_head")) {
    return forbidden("Assigning work requires at least the 'unit_head' role.");
  }

  const scope = resolveScopedAccess(ctx.session.assignments);
  const result = await searchAssignees({
    orgId: ctx.session.orgId,
    userId: ctx.session.userId,
    roleCodes: ctx.session.effectiveRoleCodes,
    scope,
    search: parsed.data.search,
    limit: parsed.data.limit,
  });

  return apiSuccess(result.options);
});
