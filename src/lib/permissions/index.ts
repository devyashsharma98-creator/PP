/**
 * Pragya Pravah — RBAC Permission Resolution
 *
 * Resolves what a user can do based on their effective role codes.
 * Uses the highest-priority role when multiple are held.
 */
import type { RoleCode, AppPermissions } from "./types";
import { ROLE_PRIORITY } from "./types";

export * from "./types";

/**
 * Get the highest-authority role from a set of role codes.
 */
export function getPrimaryRole(roleCodes: RoleCode[]): RoleCode {
  if (!roleCodes.length) return "karyakarta";
  return roleCodes.reduce((best, code) =>
    ROLE_PRIORITY[code] < ROLE_PRIORITY[best] ? code : best
  );
}

/**
 * Check if a role is at or above a given authority level.
 */
export function hasRoleOrAbove(
  effectiveRoles: RoleCode[],
  minimumRole: RoleCode
): boolean {
  const threshold = ROLE_PRIORITY[minimumRole];
  return effectiveRoles.some((r) => ROLE_PRIORITY[r] <= threshold);
}

/**
 * Resolve the full permission set for a user from their effective role codes.
 */
export function resolvePermissions(effectiveRoleCodes: RoleCode[]): AppPermissions {
  const is = (role: RoleCode) => hasRoleOrAbove(effectiveRoleCodes, role);

  return {
    // ── Events ──────────────────────────────────────────────────────────────
    // Karyakarta and above can read; unit_head and above can create
    canCreateEvent: is("unit_head"),
    canUpdateEvent: is("unit_head"),
    canSubmitEvent: is("unit_head"),
    canReviewEvent: is("aayam_pramukh"),
    canPublishEvent: is("prant_sanyojak"),
    canCancelEvent: is("vibhag_pramukh"),
    canManageEventForm: is("unit_head"),
    canManagePolls: is("unit_head"),
    canFinalizePoll: is("aayam_pramukh"),
    canViewRegistrations: is("unit_head"),

    // ── Articles (Aalekh) ────────────────────────────────────────────────────
    canCreateArticle: is("karyakarta"),
    canUpdateArticle: is("karyakarta"),
    canSubmitArticle: is("karyakarta"),
    canReviewArticle: is("unit_head"),
    canPublishArticle: is("prant_sanyojak"),
    canArchiveArticle: is("vibhag_pramukh"),

    // ── Circulars ─────────────────────────────────────────────────────────────
    canCreateCircular: is("aayam_pramukh"),
    canBroadcastCircular: is("vibhag_pramukh"),

    // ── Volunteers ────────────────────────────────────────────────────────────
    canManageVolunteers: is("aayam_pramukh"),
    canLogActivity: is("karyakarta"),

    // ── Media Library ─────────────────────────────────────────────────────────
    canUploadMedia: is("karyakarta"),
    canDeleteMedia: is("unit_head"),
    canManageMediaLibrary: is("aayam_pramukh"),

    // ── Conferences ───────────────────────────────────────────────────────────
    canCreateConference: is("unit_head"),
    canManageConference: is("aayam_pramukh"),
    canManageConferenceSessions: is("unit_head"),
    canManageConferenceSpeakers: is("karyakarta"),
    canViewConferenceRegistrations: is("unit_head"),

    // ── Surveys ───────────────────────────────────────────────────────────────
    canCreateSurvey: is("unit_head"),
    canManageSurvey: is("aayam_pramukh"),
    canViewSurveyResponses: is("unit_head"),

    // ── Tasks / Projects ──────────────────────────────────────────────────────
    canCreateProject: is("unit_head"),
    canUpdateProject: is("unit_head"),
    canCreateTask: is("karyakarta"),
    canUpdateTask: is("karyakarta"),
    canAssignTask: is("unit_head"),

    // ── Prachar ──────────────────────────────────────────────────────────────
    canUpdatePrachar: is("aayam_pramukh"),
    canViewPracharReport: is("aayam_pramukh"),

    // ── Users ────────────────────────────────────────────────────────────────
    canManageUsers: is("org_admin"),
    canAssignRoles: is("org_admin"),
    canViewDirectory: is("karyakarta"),

    // ── System ───────────────────────────────────────────────────────────────
    canViewAuditLogs: is("vibhag_pramukh"),
    canManageOrg: is("org_admin"),
  };
}
