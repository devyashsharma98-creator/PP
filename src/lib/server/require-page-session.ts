import "server-only";

import { redirect } from "next/navigation";

import { getRoleLandingPath, canAccessPathForRoles } from "@/lib/app/role-routing";
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
  const isAllowedByExplicitRule = options.allowedRoles
    ? roleCodes.some((role) => options.allowedRoles?.includes(role))
    : true;
  const isAllowedByRouteRule = canAccessPathForRoles(returnTo, roleCodes);

  if (!isAllowedByExplicitRule || !isAllowedByRouteRule) {
    redirect(getRoleLandingPath(roleCodes));
  }

  return session;
}
