import "server-only";

import { redirect } from "next/navigation";

import { getRoleLandingPath, canAccessPathForPrimaryRole } from "@/lib/app/role-routing";
import { getSession } from "@/lib/auth/session";
import type { RoleCode } from "@/lib/permissions/types";

export async function requirePageSession(
  returnTo: string,
  options: {
    allowedRoles?: RoleCode[];
    /**
     * Query string to carry through sign-in, so a deep link that names a record
     * (a reminder's ?projectId=…&taskId=…) still opens that record afterwards.
     * Accepts the raw search params of the incoming request.
     */
    search?: string | URLSearchParams | Record<string, string | string[] | undefined>;
  } = {},
) {
  const session = await getSession();

  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo + serialiseSearch(options.search))}`);
  }

  const roleCodes = session.effectiveRoleCodes;
  const primaryRoleCode = session.primaryRoleCode;
  const isAllowedByExplicitRule = options.allowedRoles
    ? options.allowedRoles.includes(primaryRoleCode)
    : true;
  // Route rules are keyed on the path alone, so any query string is stripped
  // before matching.
  const isAllowedByRouteRule = canAccessPathForPrimaryRole(
    returnTo.split("?")[0] ?? returnTo,
    primaryRoleCode,
  );

  if (!isAllowedByExplicitRule || !isAllowedByRouteRule) {
    redirect(getRoleLandingPath(roleCodes, primaryRoleCode));
  }

  return session;
}

function serialiseSearch(
  search: string | URLSearchParams | Record<string, string | string[] | undefined> | undefined,
): string {
  if (!search) return "";

  if (typeof search === "string") {
    const trimmed = search.replace(/^\?/, "");
    return trimmed ? `?${trimmed}` : "";
  }

  const params = search instanceof URLSearchParams ? search : new URLSearchParams();
  if (!(search instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
