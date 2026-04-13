import type { CanonicalRoleCode, Role } from "@/lib/app/contracts";

export type DashboardLane =
  | "super_admin"
  | "prant"
  | "vibhag"
  | "aayam"
  | "unit"
  | "karyakarta";

const uiRoleFallbackMap: Record<Role, CanonicalRoleCode> = {
  vibhag_pramukh: "vibhag_pramukh",
  aayam_pramukh: "aayam_pramukh",
  unit_head: "unit_head",
  karyakarta: "karyakarta",
};

export function getCanonicalRoleFromUiRole(role: Role): CanonicalRoleCode {
  return uiRoleFallbackMap[role];
}

export function getDashboardLane(primaryRoleCode: CanonicalRoleCode | null | undefined): DashboardLane {
  if (primaryRoleCode === "super_admin" || primaryRoleCode === "org_admin") return "super_admin";
  if (primaryRoleCode === "kshetra_reviewer" || primaryRoleCode === "prant_sanyojak") return "prant";
  if (primaryRoleCode === "vibhag_pramukh") return "vibhag";
  if (primaryRoleCode === "aayam_pramukh" || primaryRoleCode === "prant_aayam_pramukh") return "aayam";
  if (primaryRoleCode === "unit_head") return "unit";
  return "karyakarta";
}
