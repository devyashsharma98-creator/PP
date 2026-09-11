/**
 * Pragya Pravah — Export Authority Rules
 *
 * Exports leave the system as files, so they are treated as their own act of
 * authority rather than a by-product of being able to read a list. Member
 * exports in particular carry personal data (email, phone) and demand explicit
 * authority, not merely a valid session.
 */
import { hasRoleOrAbove, type RoleCode } from "@/lib/permissions/index";
import type { ScopedAccess } from "./scope";

export const EXPORT_ENTITIES = ["events", "articles", "members"] as const;
export type ExportEntity = (typeof EXPORT_ENTITIES)[number];

/** Legacy alias kept so existing `?entity=users` links keep working. */
export function normaliseExportEntity(raw: string | null): ExportEntity | null {
  if (!raw) return null;
  if (raw === "users" || raw === "members") return "members";
  if (raw === "events" || raw === "articles") return raw;
  return null;
}

export interface ExportSubject {
  roleCodes: RoleCode[];
  scope: ScopedAccess;
}

export interface ExportDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Member exports require an explicit people-management authority. Scope alone
 * is not enough: a unit head can see their people in the directory but does not
 * get to walk away with the org's contact list as a file.
 */
export function canExportMembers(subject: ExportSubject): ExportDecision {
  if (!hasRoleOrAbove(subject.roleCodes, "vibhag_pramukh")) {
    return {
      allowed: false,
      reason: "Member exports require at least the 'vibhag_pramukh' role.",
    };
  }
  if (!subject.scope.orgWide && subject.scope.departmentIds.size === 0 && subject.scope.unitIds.size === 0) {
    return { allowed: false, reason: "No record scope available for a member export." };
  }
  return { allowed: true };
}

export function canExportEntity(entity: ExportEntity, subject: ExportSubject): ExportDecision {
  if (entity === "members") return canExportMembers(subject);
  // Events and articles are already scope-filtered row by row; any member of the
  // org may export the subset they are entitled to read.
  return { allowed: true };
}

/**
 * Audit metadata for an export. Deliberately records only counts and filters —
 * never the exported rows themselves — so the audit trail does not become a
 * second copy of the personal data it is meant to police.
 */
export interface ExportAuditPayload extends Record<string, unknown> {
  entity: ExportEntity;
  rowCount: number;
  filters: Record<string, string>;
  scope: "org_wide" | "scoped";
  truncated: boolean;
}

export function buildExportAuditPayload(args: {
  entity: ExportEntity;
  rowCount: number;
  filters: Readonly<Record<string, string | undefined>>;
  orgWide: boolean;
  truncated: boolean;
}): ExportAuditPayload {
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(args.filters)) {
    if (value !== undefined && value !== "") filters[key] = value;
  }
  return {
    entity: args.entity,
    rowCount: args.rowCount,
    filters,
    scope: args.orgWide ? "org_wide" : "scoped",
    truncated: args.truncated,
  };
}
