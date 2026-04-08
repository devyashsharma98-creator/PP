/**
 * Pragya Pravah — Article Workflow State Machine (Aalekh)
 *
 * Articles go through an editorial review chain before public authorization.
 * All four values-checklist items must be checked before an article can
 * move past the unit_head_review stage.
 *
 * Full chain:
 *   draft
 *   → pending_unit_head_review   (karyakarta, unit_head)
 *   → pending_aayam_review       (unit_head, aayam_pramukh)
 *   → pending_vibhag_review      (aayam_pramukh, vibhag_pramukh)
 *   → pending_prant_authorization (vibhag_pramukh, prant_sanyojak, org_admin)
 *   → authorized_public          (prant_sanyojak, org_admin)
 *
 *   Any stage → returned_for_revision (reviewer at that stage or above)
 *   Any stage → rejected               (reviewer at that stage or above)
 *   Any stage → escalated_kshetra     (kshetra_reviewer, org_admin)
 *   authorized_public → archived       (vibhag_pramukh, org_admin)
 */
import type { RoleCode } from "./types";
import { hasRoleOrAbove } from "./index";

export type ArticleStatus =
  | "draft"
  | "pending_unit_head_review"
  | "pending_aayam_review"
  | "pending_vibhag_review"
  | "pending_prant_authorization"
  | "authorized_public"
  | "escalated_kshetra"
  | "returned_for_revision"
  | "rejected"
  | "archived";

export interface ArticleTransition {
  from: ArticleStatus[];
  to: ArticleStatus;
  requiredRole: RoleCode;
  noteRequired?: boolean;
  /** If true, values checklist must be fully checked before this transition */
  requiresValuesChecklist?: boolean;
  label: string;
  labelHi: string;
}

export interface ValuesChecklist {
  rashtraPratham: boolean;
  culturallyGrounded: boolean;
  balancedTone: boolean;
  noDivisiveContent: boolean;
}

export const ARTICLE_TRANSITIONS: ArticleTransition[] = [
  // ── Forward chain ────────────────────────────────────────────────────────
  {
    from: ["draft", "returned_for_revision"],
    to: "pending_unit_head_review",
    requiredRole: "karyakarta",
    requiresValuesChecklist: true,
    label: "Submit for Unit Review",
    labelHi: "इकाई समीक्षा के लिए प्रस्तुत करें",
  },
  {
    from: ["pending_unit_head_review"],
    to: "pending_aayam_review",
    requiredRole: "unit_head",
    label: "Approve — Move to Aayam Review",
    labelHi: "अनुमोदित — आयाम समीक्षा को भेजें",
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
    to: "authorized_public",
    requiredRole: "prant_sanyojak",
    label: "Authorize for Publication",
    labelHi: "प्रकाशन हेतु प्राधिकृत करें",
  },

  // ── Lateral transitions ───────────────────────────────────────────────────
  {
    from: [
      "pending_unit_head_review",
      "pending_aayam_review",
      "pending_vibhag_review",
      "pending_prant_authorization",
    ],
    to: "returned_for_revision",
    requiredRole: "unit_head",
    noteRequired: true,
    label: "Return for Revision",
    labelHi: "संशोधन के लिए लौटाएं",
  },
  {
    from: [
      "pending_unit_head_review",
      "pending_aayam_review",
      "pending_vibhag_review",
      "pending_prant_authorization",
    ],
    to: "rejected",
    requiredRole: "unit_head",
    noteRequired: true,
    label: "Reject Article",
    labelHi: "आलेख अस्वीकार करें",
  },
  {
    from: [
      "pending_unit_head_review",
      "pending_aayam_review",
      "pending_vibhag_review",
      "pending_prant_authorization",
    ],
    to: "escalated_kshetra",
    requiredRole: "kshetra_reviewer",
    noteRequired: true,
    label: "Escalate to Kshetra",
    labelHi: "क्षेत्र को अग्रेषित करें",
  },
  {
    from: ["authorized_public"],
    to: "archived",
    requiredRole: "vibhag_pramukh",
    label: "Archive Article",
    labelHi: "आलेख संग्रहीत करें",
  },
];

/**
 * Get all valid transitions from current status given user's roles.
 */
export function getAvailableArticleTransitions(
  currentStatus: ArticleStatus,
  effectiveRoles: RoleCode[]
): ArticleTransition[] {
  return ARTICLE_TRANSITIONS.filter(
    (t) =>
      t.from.includes(currentStatus) &&
      hasRoleOrAbove(effectiveRoles, t.requiredRole)
  );
}

/**
 * Check if a values checklist is fully ticked.
 */
export function isValuesChecklistComplete(checklist: ValuesChecklist): boolean {
  return (
    checklist.rashtraPratham &&
    checklist.culturallyGrounded &&
    checklist.balancedTone &&
    checklist.noDivisiveContent
  );
}

/**
 * Validate a specific article transition request.
 */
export function validateArticleTransition(
  from: ArticleStatus,
  to: ArticleStatus,
  effectiveRoles: RoleCode[],
  options: { note?: string; valuesChecklist?: ValuesChecklist } = {}
): string | null {
  const transition = ARTICLE_TRANSITIONS.find(
    (t) => t.from.includes(from) && t.to === to
  );

  if (!transition) {
    return `Transition from '${from}' to '${to}' is not defined.`;
  }

  if (!hasRoleOrAbove(effectiveRoles, transition.requiredRole)) {
    return `Insufficient role. Required: ${transition.requiredRole}.`;
  }

  if (transition.noteRequired && (!options.note || options.note.trim().length === 0)) {
    return `A review note is required for this transition.`;
  }

  if (transition.requiresValuesChecklist) {
    if (!options.valuesChecklist) {
      return `Values checklist must be provided for this transition.`;
    }
    if (!isValuesChecklistComplete(options.valuesChecklist)) {
      return `All four values checklist items must be checked before submission: Rashtra Pratham, Culturally Grounded, Balanced Tone, No Divisive Content.`;
    }
  }

  return null;
}
