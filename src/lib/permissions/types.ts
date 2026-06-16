/**
 * Pragya Pravah — Permission System Types
 */

export const ROLE_CODES = [
  "super_admin",
  "org_admin",
  "vibhag_pramukh",
  "aayam_pramukh",
  "unit_head",
  "karyakarta",
  "prant_sanyojak",
  "prant_aayam_pramukh",
  "kshetra_reviewer",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

// ── Role priority (lower = higher authority) ──────────────────────────────────
export const ROLE_PRIORITY: Record<RoleCode, number> = {
  super_admin: 0,
  org_admin: 1,
  kshetra_reviewer: 2,
  prant_sanyojak: 3,
  prant_aayam_pramukh: 4,
  vibhag_pramukh: 5,
  aayam_pramukh: 6,
  unit_head: 7,
  karyakarta: 8,
};

// ── Permission flags surfaced to UI/API layer ─────────────────────────────────
export interface AppPermissions {
  // Events
  canCreateEvent: boolean;
  canUpdateEvent: boolean;
  canSubmitEvent: boolean;
  canReviewEvent: boolean;
  canPublishEvent: boolean;
  canCancelEvent: boolean;
  canManageEventForm: boolean;
  canManagePolls: boolean;
  canFinalizePoll: boolean;
  canViewRegistrations: boolean;

  // Articles (Aalekh)
  canCreateArticle: boolean;
  canUpdateArticle: boolean;
  canSubmitArticle: boolean;
  canReviewArticle: boolean;
  canPublishArticle: boolean;
  canArchiveArticle: boolean;

  // Prachar
  canUpdatePrachar: boolean;
  canViewPracharReport: boolean;

  // Users
  canManageUsers: boolean;
  canAssignRoles: boolean;
  canViewDirectory: boolean;

  // Tasks / Projects
  canCreateProject: boolean;
  canUpdateProject: boolean;
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canAssignTask: boolean;

  // Circulars
  canCreateCircular: boolean;
  canBroadcastCircular: boolean;

  // Volunteers
  canManageVolunteers: boolean;
  canLogActivity: boolean;

  // Media Library
  canUploadMedia: boolean;
  canDeleteMedia: boolean;
  canManageMediaLibrary: boolean;

  // Conferences
  canCreateConference: boolean;
  canManageConference: boolean;
  canManageConferenceSessions: boolean;
  canManageConferenceSpeakers: boolean;
  canViewConferenceRegistrations: boolean;

  // System
  canViewAuditLogs: boolean;
  canManageOrg: boolean;
}
