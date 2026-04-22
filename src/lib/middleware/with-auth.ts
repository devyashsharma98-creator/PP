/**
 * Pragya Pravah — Auth Middleware for API Routes
 *
 * Usage in any API route handler:
 *
 *   import { withAuth, withRole } from "@/lib/middleware/with-auth";
 *
 *   export const GET = withAuth(async (req, ctx) => {
 *     const { session } = ctx;
 *     // session.userId, session.primaryRoleCode, etc.
 *     ...
 *   });
 *
 *   export const POST = withRole("aayam_pramukh", async (req, ctx) => { ... });
 */
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getSession, type VerifiedSession } from "../auth/session";
import { resolvePermissions, hasRoleOrAbove, type RoleCode } from "../permissions/index";
import { apiError } from "../response";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthContext {
  session: VerifiedSession;
  permissions: ReturnType<typeof resolvePermissions>;
}

type RouteContext = { params: Promise<unknown> };

export type AuthedHandler = (
  req: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string> | unknown
) => Promise<NextResponse | Response>;

// ── Core wrapper ──────────────────────────────────────────────────────────────

/**
 * Wrap a handler to require a valid session.
 * Injects `session` and `permissions` into the handler context.
 */
export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest, routeCtx: RouteContext): Promise<Response> => {
    const session = await getSession();

    if (!session) {
      return apiError("UNAUTHORIZED", "Authentication required.", 401);
    }

    const permissions = resolvePermissions(session.effectiveRoleCodes);
    const params = routeCtx?.params ? await routeCtx.params : undefined;

    return handler(req, { session, permissions }, params);
  };
}

/**
 * Wrap a handler to require a minimum role level.
 * Implicitly requires authentication.
 */
export function withRole(minimumRole: RoleCode, handler: AuthedHandler) {
  return withAuth(async (req, ctx, params) => {
    if (!hasRoleOrAbove(ctx.session.effectiveRoleCodes, minimumRole)) {
      return apiError(
        "FORBIDDEN",
        `This action requires at least the '${minimumRole}' role.`,
        403
      );
    }
    return handler(req, ctx, params);
  });
}

/**
 * Wrap a handler to require a specific permission flag.
 */
export function withPermission(
  permission: keyof ReturnType<typeof resolvePermissions>,
  handler: AuthedHandler
) {
  return withAuth(async (req, ctx, params) => {
    if (!ctx.permissions[permission]) {
      return apiError(
        "FORBIDDEN",
        `You do not have permission to perform this action.`,
        403
      );
    }
    return handler(req, ctx, params);
  });
}

/**
 * Extract the client IP from a Next.js request.
 * Handles Cloudflare, reverse proxies, and direct connections.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
