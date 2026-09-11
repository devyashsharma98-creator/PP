/**
 * Pragya Pravah — Vritt (event report) Authority Rules
 *
 * A vritt moves draft → submitted → reviewed. Those are three different acts:
 *   draft      — the organising unit writes up what happened
 *   submitted  — the unit hands the report upward, closing it to further edits
 *   reviewed   — a reviewer above the unit accepts the report as the record
 *
 * Holding canUpdateEvent lets someone write and submit their own unit's report.
 * It must not let them sign it off, and it must not reach events outside their
 * scope.
 */
import { hasRoleOrAbove, type RoleCode } from "@/lib/permissions/index";
import { rowMatchesScope, type ScopedAccess, type ScopedRowLike } from "./scope";

export type VrittStatus = "draft" | "submitted" | "reviewed";

export interface VrittSubject {
  userId: string;
  roleCodes: RoleCode[];
  scope: ScopedAccess;
}

export interface VrittEventRecord extends ScopedRowLike {
  id: string;
  status?: string | null;
}

export interface VrittDecision {
  allowed: boolean;
  reason?: string;
}

const ALLOW: VrittDecision = { allowed: true };
const deny = (reason: string): VrittDecision => ({ allowed: false, reason });

/** Every vritt action first requires the event itself to be in scope. */
export function canAccessVrittEvent(subject: VrittSubject, event: VrittEventRecord): boolean {
  return rowMatchesScope(subject.scope, event, subject.userId);
}

/** Signing a report off as the institutional record. */
export function canReviewVritt(subject: VrittSubject): boolean {
  return hasRoleOrAbove(subject.roleCodes, "aayam_pramukh");
}

/**
 * Decide whether `subject` may move a vritt from `current` to `next`.
 * `current` is null when no vritt row exists yet.
 */
export function decideVrittTransition(args: {
  subject: VrittSubject;
  event: VrittEventRecord;
  current: VrittStatus | null;
  next: VrittStatus;
  hasEditPermission: boolean;
}): VrittDecision {
  const { subject, event, current, next, hasEditPermission } = args;

  if (!canAccessVrittEvent(subject, event)) {
    return deny("You do not have access to this event.");
  }

  const reviewer = canReviewVritt(subject);

  if (next === "reviewed") {
    if (!reviewer) {
      return deny("Marking a vritt reviewed requires at least the 'aayam_pramukh' role.");
    }
    if (current !== "submitted") {
      return deny("A vritt must be submitted before it can be reviewed.");
    }
    return ALLOW;
  }

  // draft and submitted both require ordinary event-edit authority.
  if (!hasEditPermission) {
    return deny("You do not have permission to edit this event's vritt.");
  }

  // Submission carries no content (see vrittFieldPolicy), so submitting with no
  // saved draft would hand upward an empty report.
  if (next === "submitted" && current === null) {
    return deny("Save the report as a draft before submitting it.");
  }

  // ── Content locking ──────────────────────────────────────────────────────
  // Submitting hands the report upward; reviewing accepts it as the record.
  // Either way the content stops being the unit's to rewrite. Every write goes
  // through this function, so refusing the transition here is what stops the
  // content being overwritten — the write itself carries no separate check.
  if (current === "submitted" || current === "reviewed") {
    if (!reviewer) {
      return deny(
        current === "reviewed"
          ? "This vritt has been reviewed and can only be reopened by a reviewer."
          : "This vritt has been submitted and can only be reopened by a reviewer.",
      );
    }
    // A reviewer reopens by returning it to draft — not by writing over a
    // submitted or reviewed report in place.
    if (next !== "draft") {
      return deny("Reopen this vritt to draft before changing its content.");
    }
    return ALLOW;
  }

  return ALLOW;
}

/**
 * Fields the actor is allowed to set for this transition. Keeps reviewer-only
 * columns (reviewedBy) out of reach of an ordinary editor even if the request
 * body names them.
 */
export function vrittWritableFields(next: VrittStatus): {
  setSubmittedBy: boolean;
  setReviewedBy: boolean;
} {
  return {
    setSubmittedBy: next === "submitted",
    setReviewedBy: next === "reviewed",
  };
}

export interface VrittFieldPolicy {
  /** May this request change the report's text, attendance and media? */
  contentWritable: boolean;
  /** May it set review notes? */
  reviewNotesWritable: boolean;
  setSubmittedBy: boolean;
  setReviewedBy: boolean;
}

/**
 * Which fields a given transition may write.
 *
 * Submitting, reviewing and reopening are *status* operations: they move the
 * report between hands without altering it. Only an edit that leaves the vritt
 * in draft may change content. This is what stops a reviewer from replacing the
 * text as they sign it off — review accepts what was submitted — and it is why
 * reopening to draft is required before any rewrite.
 */
export function vrittFieldPolicy(
  current: VrittStatus | null,
  next: VrittStatus,
): VrittFieldPolicy {
  const { setSubmittedBy, setReviewedBy } = vrittWritableFields(next);
  const editingDraft = next === "draft" && (current === null || current === "draft");

  return {
    contentWritable: editingDraft,
    reviewNotesWritable: next === "reviewed",
    setSubmittedBy,
    setReviewedBy,
  };
}

// ── Actions offered to the UI ────────────────────────────────────────────────

/**
 * The four things a person can do to a vritt. Each is a distinct request with a
 * distinct payload: only saveDraft carries content.
 */
export type VrittAction = "saveDraft" | "submit" | "review" | "reopen";

/** The status each action moves the vritt to. */
export const VRITT_ACTION_TARGET: Record<VrittAction, VrittStatus> = {
  saveDraft: "draft",
  submit: "submitted",
  review: "reviewed",
  reopen: "draft",
};

export interface VrittActionAvailability {
  allowed: boolean;
  /** Why the action is unavailable — shown to the user, not guessed by the UI. */
  reason?: string;
}

export type VrittActions = Record<VrittAction, VrittActionAvailability>;

/** Which statuses each action starts from. */
const ACTION_FROM: Record<VrittAction, ReadonlyArray<VrittStatus | null>> = {
  saveDraft: [null, "draft"],
  submit: ["draft"],
  review: ["submitted"],
  reopen: ["submitted", "reviewed"],
};

/**
 * What this person may do to this vritt right now.
 *
 * Derived by asking decideVrittTransition() — the same function that authorizes
 * the write — about each action in turn, so the buttons offered can never
 * disagree with what the server will accept.
 */
export function availableVrittActions(args: {
  subject: VrittSubject;
  event: VrittEventRecord;
  current: VrittStatus | null;
  hasEditPermission: boolean;
}): VrittActions {
  const result = {} as VrittActions;

  for (const action of Object.keys(ACTION_FROM) as VrittAction[]) {
    if (!ACTION_FROM[action].includes(args.current)) {
      result[action] = { allowed: false, reason: "Not available at this stage." };
      continue;
    }
    const decision = decideVrittTransition({ ...args, next: VRITT_ACTION_TARGET[action] });
    result[action] = decision.allowed ? { allowed: true } : { allowed: false, reason: decision.reason };
  }

  return result;
}
