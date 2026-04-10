import "server-only";

import { redirect } from "next/navigation";

import { getRoleLandingPath, canAccessPathForPrimaryRole } from "@/lib/app/role-routing";
import { getSession } from "@/lib/auth/session";
import type { RoleCode } from "@/lib/permissions/types";

export async function requirePageSession(
  returnTo: string,
  options: { allowedRoles?: RoleCode[] } = {},
) {
  const session = await getSession();

  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const roleCodes = session.effectiveRoleCodes;
  const primaryRoleCode = session.primaryRoleCode;
  const isAllowedByExplicitRule = options.allowedRoles
    ? options.allowedRoles.includes(primaryRoleCode)
    : true;
  const isAllowedByRouteRule = canAccessPathForPrimaryRole(returnTo, primaryRoleCode);

  if (!isAllowedByExplicitRule || !isAllowedByRouteRule) {
    redirect(getRoleLandingPath(roleCodes, primaryRoleCode));
  }

  return session;
}
