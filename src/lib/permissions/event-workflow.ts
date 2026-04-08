/**
 * Pragya Pravah — Event Workflow State Machine
 *
 * Encodes all valid status transitions for Gativiidhi (Events).
 * Each transition specifies which roles can trigger it and whether
 * a review note is required.
 *
 * Full chain:
 *   draft
 *   → submitted_by_unit          (unit_head, karyakarta)
 *   → pending_aayam_review       (aayam_pramukh, vibhag_pramukh, org_admin)
 *   → pending_vibhag_review      (aayam_pramukh, vibhag_pramukh, org_admin)
 *   → pending_prant_authorization (vibhag_pramukh, prant_sanyojak, org_admin)
 *   → pending_prant_dual_authorization (prant_sanyojak, org_admin)
 *   → authorized_public          (prant_aayam_pramukh, org_admin)
 *
 *   Any stage → returned_for_revision (reviewer at that stage or above)
 *   Any stage → rejected               (reviewer at that stage or above)
 *   Any stage → escalated_kshetra     (kshetra_reviewer, org_admin)
 *   Any stage → cancelled              (vibhag_pramukh, org_admin)
 */
import type { RoleCode } from "./types";
import { hasRoleOrAbove } from "./index";

export type EventStatus =
  | "draft"
  | "submitted_by_unit"
  | "pending_aayam_review"
  | "pending_vibhag_review"
  | "pending_prant_authorization"
  | "pending_prant_dual_authorization"
  | "authorized_public"
  | "escalated_kshetra"
  | "returned_for_revision"
  | "rejected"
  | "cancelled";

export interface EventTransition {
  from: EventStatus[];
  to: EventStatus;
  requiredRole: RoleCode;
  noteRequired?: boolean;
  label: string;
  labelHi: string;
}

// Complete transition table
export const EVENT_TRANSITIONS: EventTransition[] = [
  // ── Forward chain ────────────────────────────────────────────────────────
  {
    from: ["draft", "returned_for_revision"],
    to: "submitted_by_unit",
    requiredRole: "unit_head",
    label: "Submit for Review",
    labelHi: "समीक्षा के लिए प्रस्तुत करें",
  },
  {
    from: ["submitted_by_unit"],
    to: "pending_aayam_review",
    requiredRole: "aayam_pramukh",
    label: "Accept — Begin Aayam Review",
    labelHi: "स्वीकार करें — आयाम समीक्षा आरंभ",
  },
  {
    from: ["pending_aayam_review"],
    to: "pending_vibhag_review",
    requiredRole: "aayam_pramukh",
    label: "Approve — Move to Vibhag Review",
    labelHi: "अनुमोदित — विभाग समीक्षा को भेजें",
  },
  {
    from: ["pending_vibhag_review"],
    to: "pending_prant_authorization",
    requiredRole: "vibhag_pramukh",
    label: "Approve — Send to Prant",
    labelHi: "अनुमोदित — प्रांत को भेजें",
  },
  {
    from: ["pending_prant_authorization"],
    to: "pending_prant_dual_authorization",
    requiredRole: "prant_sanyojak",
    label: "First Prant Authorization",
    labelHi: "प्रांत प्रथम प्राधिकरण",
  },
  {
    from: ["pending_prant_dual_authorization"],
    to: "authorized_public",
    requiredRole: "prant_aayam_pramukh",
    label: "Final Authorization — Publish",
    labelHi: "अंतिम प्राधिकरण — प्रकाशित करें",
  },

  // ── Lateral transitions (available at multiple stages) ────────────────────
  {
    from: [
      "submitted_by_unit",
      "pending_aayam_review",
      "pending_vibhag_review",
      "pending_prant_authorization",
      "pending_prant_dual_authorization",
    ],
    to: "returned_for_revision",
    requiredRole: "aayam_pramukh",
    noteRequired: true,
    label: "Return for Revision",
    labelHi: "संशोधन के लिए लौटाएं",
  },
  {
    from: [
      "submitted_by_unit",
      "pending_aayam_review",
      "pending_vibhag_review",
      "pending_prant_authorization",
      "pending_prant_dual_authorization",
    ],
    to: "rejected",
    requiredRole: "aayam_pramukh",
    noteRequired: true,
    label: "Reject",
    labelHi: "अस्वीकार करें",
  },
  {
    from: [
      "submitted_by_unit",
      "pending_aayam_review",
      "pending_vibhag_review",
      "pending_prant_authorization",
      "pending_prant_dual_authorization",
    ],
    to: "escalated_kshetra",
    requiredRole: "kshetra_reviewer",
    noteRequired: true,
    label: "Escalate to Kshetra",
    labelHi: "क्षेत्र को अग्रेषित करें",
  },
  {
    from: [
      "draft",
      "submitted_by_unit",
      "pending_aayam_review",
      "pending_vibhag_review",
      "returned_for_revision",
    ],
    to: "cancelled",
    requiredRole: "vibhag_pramukh",
    label: "Cancel Event",
    labelHi: "गतिविधि रद्द करें",
  },
];

/**
 * Find all valid transitions from a given status for a user's roles.
 */
export function getAvailableEventTransitions(
  currentStatus: EventStatus,
  effectiveRoles: RoleCode[]
): EventTransition[] {
  return EVENT_TRANSITIONS.filter(
    (t) =>
      t.from.includes(currentStatus) &&
      hasRoleOrAbove(effectiveRoles, t.requiredRole)
  );
}

/**
 * Validate a specific transition request.
 * Returns an error string if invalid, or null if valid.
 */
export function validateEventTransition(
  from: EventStatus,
  to: EventStatus,
  effectiveRoles: RoleCode[],
  note?: string
): string | null {
  const transition = EVENT_TRANSITIONS.find(
    (t) => t.from.includes(from) && t.to === to
  );

  if (!transition) {
    return `Transition from '${from}' to '${to}' is not defined.`;
  }

  if (!hasRoleOrAbove(effectiveRoles, transition.requiredRole)) {
    return `Insufficient role to perform this transition. Required: ${transition.requiredRole}.`;
  }

  if (transition.noteRequired && (!note || note.trim().length === 0)) {
    return `A review note is required for this transition.`;
  }

  return null;
}
