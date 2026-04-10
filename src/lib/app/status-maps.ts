/**
 * Centralized UI ↔ DB status mapping for events and articles.
 * Single source of truth — imported by repository, validators, and other modules.
 *
 * NOTE: repository.ts still has its own copies for now (migrated in a follow-up).
 * This module is the canonical reference for any NEW code.
 */

// ── Event status mappings ─────────────────────────────────────────────────────

export const dbToUiEventStatus: Record<string, string> = {
  draft: "Draft",
  submitted_by_unit: "Submitted by Unit",
  pending_aayam_review: "Pending Aayam Review",
  pending_vibhag_review: "Pending Vibhag Review",
  pending_prant_authorization: "Pending Prant Authorization",
  pending_prant_dual_authorization: "Pending Prant Dual Authorization",
  authorized_public: "Published",
  published: "Published",
  escalated_kshetra: "Escalated to Kshetra",
  returned_for_revision: "Returned for Revision",
  rejected: "Rejected",
  cancelled: "Cancelled",
  pending_final_approval: "Pending Vibhag Review",
};

export const uiToDbEventStatus: Record<string, string> = {
  Draft: "draft",
  "Submitted by Unit": "submitted_by_unit",
  "Pending Aayam Review": "pending_aayam_review",
  "Pending Vibhag Review": "pending_vibhag_review",
  "Pending Prant Authorization": "pending_prant_authorization",
  "Pending Prant Dual Authorization": "pending_prant_dual_authorization",
  Published: "authorized_public",
  "Escalated to Kshetra": "escalated_kshetra",
  "Returned for Revision": "returned_for_revision",
  Rejected: "rejected",
  Cancelled: "cancelled",
};

// ── Article status mappings ───────────────────────────────────────────────────

export const dbToUiArticleStatus: Record<string, string> = {
  draft: "Draft",
  pending_unit_head_review: "Pending Unit Head Review",
  pending_aayam_review: "Pending Aayam Review",
  pending_vibhag_review: "Pending Vibhag Review",
  pending_prant_authorization: "Pending Prant Authorization",
  authorized_public: "Published",
  published: "Published",
  escalated_kshetra: "Escalated to Kshetra",
  returned_for_revision: "Returned for Revision",
  rejected: "Rejected",
  archived: "Archived",
};

export const uiToDbArticleStatus: Record<string, string> = {
  Draft: "draft",
  "Pending Unit Head Review": "pending_unit_head_review",
  "Pending Aayam Review": "pending_aayam_review",
  "Pending Vibhag Review": "pending_vibhag_review",
  "Pending Prant Authorization": "pending_prant_authorization",
  Published: "authorized_public",
  "Escalated to Kshetra": "escalated_kshetra",
  "Returned for Revision": "returned_for_revision",
  Rejected: "rejected",
  Archived: "archived",
};

// ── Derived constants for Zod validation ──────────────────────────────────────

/** Valid UI-facing event status strings (keys of uiToDbEventStatus) */
export const validUiEventStatuses = Object.keys(uiToDbEventStatus) as [string, ...string[]];

/** Valid UI-facing article status strings (keys of uiToDbArticleStatus) */
export const validUiArticleStatuses = Object.keys(uiToDbArticleStatus) as [string, ...string[]];
