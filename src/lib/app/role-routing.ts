import type { RoleCode } from "@/lib/permissions/types";
import { ROLE_PRIORITY } from "@/lib/permissions/types";

export const ADMIN_ROLES: RoleCode[] = ["super_admin", "org_admin"];
export const OVERSIGHT_ROLES: RoleCode[] = [
  "super_admin",
  "org_admin",
  "kshetra_reviewer",
  "prant_sanyojak",
  "vibhag_pramukh",
];
export const DASHBOARD_ROLES: RoleCode[] = [
  "super_admin",
  "org_admin",
  "kshetra_reviewer",
  "prant_sanyojak",
  "prant_aayam_pramukh",
  "vibhag_pramukh",
  "aayam_pramukh",
  "unit_head",
];
export const PRACHAR_ROLES: RoleCode[] = [
  "super_admin",
  "org_admin",
  "kshetra_reviewer",
  "prant_sanyojak",
  "prant_aayam_pramukh",
  "vibhag_pramukh",
  "aayam_pramukh",
];
export const COORDINATION_ROLES: RoleCode[] = [
  "super_admin",
  "org_admin",
  "kshetra_reviewer",
  "prant_sanyojak",
  "prant_aayam_pramukh",
  "vibhag_pramukh",
  "aayam_pramukh",
  "unit_head",
];

const PROTECTED_ROUTE_ROLES: Array<{ prefix: string; roles: RoleCode[] }> = [
  { prefix: "/super-admin", roles: ADMIN_ROLES },
  { prefix: "/users", roles: ADMIN_ROLES },
  { prefix: "/overview", roles: OVERSIGHT_ROLES },
  { prefix: "/dashboard", roles: DASHBOARD_ROLES },
  { prefix: "/prachar", roles: PRACHAR_ROLES },
  { prefix: "/calendar", roles: COORDINATION_ROLES },
  { prefix: "/directory", roles: COORDINATION_ROLES },
  { prefix: "/dayitv", roles: COORDINATION_ROLES },
  { prefix: "/aalekh", roles: ["super_admin", "org_admin", "kshetra_reviewer", "prant_sanyojak", "prant_aayam_pramukh", "vibhag_pramukh", "aayam_pramukh", "unit_head", "karyakarta"] },
];

export function getHighestRole(roleCodes: readonly RoleCode[] | null | undefined): RoleCode {
  const roles = roleCodes?.filter(Boolean) ?? [];
  if (!roles.length) return "karyakarta";
  return roles.reduce((best, role) => (ROLE_PRIORITY[role] < ROLE_PRIORITY[best] ? role : best), roles[0]);
}

export function getRoleLandingPath(roleCodes: readonly RoleCode[] | null | undefined) {
  const primaryRole = getHighestRole(roleCodes);

  if (primaryRole === "super_admin" || primaryRole === "org_admin") return "/super-admin";
  if (
    primaryRole === "kshetra_reviewer" ||
    primaryRole === "prant_sanyojak" ||
    primaryRole === "vibhag_pramukh"
  ) {
    return "/overview";
  }
  if (primaryRole === "prant_aayam_pramukh" || primaryRole === "aayam_pramukh" || primaryRole === "unit_head") {
    return "/dashboard";
  }
  return "/aalekh";
}

export function getAllowedRolesForPath(pathname: string) {
  return PROTECTED_ROUTE_ROLES.find((entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`))?.roles ?? null;
}

export function canAccessPathForRoles(pathname: string, roleCodes: readonly RoleCode[] | null | undefined) {
  const allowedRoles = getAllowedRolesForPath(pathname);
  if (!allowedRoles) return true;
  const roles = roleCodes ?? [];
  return roles.some((role) => allowedRoles.includes(role));
}
