/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's session context.
 * Used by the frontend to hydrate AppContext on load.
 */
import "server-only";

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles } from "@/db/schema/index";
import { getSession } from "@/lib/auth/session";
import { resolvePermissions } from "@/lib/permissions";
import { apiSuccess, apiError } from "@/lib/response";

export async function GET(_req: NextRequest): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return apiError("UNAUTHORIZED", "Not authenticated.", 401);
  }

  // Freshen profile data (display name may have changed since token was signed)
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.userId),
    columns: {
      id: true,
      email: true,
      displayName: true,
      displayNameHi: true,
      phone: true,
      isActive: true,
      orgId: true,
      lastLoginAt: true,
      requiresPasswordChange: true,
    },
  });

  if (!profile || !profile.isActive) {
    return apiError("UNAUTHORIZED", "Account is inactive or not found.", 401);
  }

  const permissions = resolvePermissions(session.effectiveRoleCodes);

  return apiSuccess({
    userId: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    displayNameHi: profile.displayNameHi,
    phone: profile.phone,
    orgId: profile.orgId,
    orgCode: session.orgCode,
    primaryRoleCode: session.primaryRoleCode,
    effectiveRoleCodes: session.effectiveRoleCodes,
    unitId: session.unitId,
    departmentId: session.departmentId,
    permissions,
    lastLoginAt: profile.lastLoginAt,
    requiresPasswordChange: profile.requiresPasswordChange,
  });
}
