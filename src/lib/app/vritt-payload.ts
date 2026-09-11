/**
 * Pragya Pravah — Vritt request contract (client side)
 *
 * The single place a vritt request body is built. The server treats saving a
 * draft and moving the report between hands as different operations — only a
 * draft save may carry content, and review notes travel only with a review — so
 * each action produces a differently shaped payload here rather than one form
 * object being posted with a status dropdown attached.
 */
import type { VrittAction, VrittStatus } from "./vritt-access";

/** The editable part of the report, as the sheet holds it. */
export interface VrittFormState {
  content: string;
  attendanceCount: number;
  mediaUrls: string[];
}

/** The report as the server stored it. */
export interface StoredVritt {
  status: VrittStatus;
  content: string | null;
  contentHi: string | null;
  attendanceCount: number | null;
  mediaUrls: string[];
  reviewNotes: string | null;
  updatedAt: string | null;
}

export type VrittRequestBody =
  | {
      status: "draft";
      expectedStatus: VrittStatus | null;
      content: string;
      attendanceCount: number;
      mediaUrls: string[];
    }
  | { status: "submitted"; expectedStatus: VrittStatus | null }
  | { status: "reviewed"; expectedStatus: VrittStatus | null; reviewNotes?: string }
  | { status: "draft"; expectedStatus: VrittStatus | null };

export const EMPTY_VRITT_FORM: VrittFormState = { content: "", attendanceCount: 0, mediaUrls: [""] };

/** Blank rows are an editing affordance, not data. */
export function cleanMediaUrls(urls: readonly string[]): string[] {
  return urls.map((u) => u.trim()).filter((u) => u.length > 0);
}

export function vrittFormFromStored(stored: StoredVritt | null): VrittFormState {
  if (!stored) return { ...EMPTY_VRITT_FORM, mediaUrls: [""] };
  return {
    content: stored.content ?? "",
    attendanceCount: stored.attendanceCount ?? 0,
    mediaUrls: stored.mediaUrls.length > 0 ? [...stored.mediaUrls] : [""],
  };
}

/**
 * Whether the sheet holds edits the server does not have. Compared on the
 * values that would actually be sent, so an added-then-emptied media row does
 * not count as a change.
 */
export function isVrittFormDirty(form: VrittFormState, stored: StoredVritt | null): boolean {
  const saved = vrittFormFromStored(stored);
  if (form.content !== saved.content) return true;
  if ((form.attendanceCount || 0) !== (saved.attendanceCount || 0)) return true;
  const a = cleanMediaUrls(form.mediaUrls);
  const b = cleanMediaUrls(saved.mediaUrls);
  return a.length !== b.length || a.some((url, i) => url !== b[i]);
}

/**
 * Build the body for one action.
 *
 * `expectedStatus` is the status the sheet was showing when the person acted.
 * The server refuses the request if the vritt has moved since, instead of
 * applying a decision made against a report that no longer looks like that.
 */
export function buildVrittRequest(
  action: VrittAction,
  args: { form: VrittFormState; expectedStatus: VrittStatus | null; reviewNotes?: string },
): VrittRequestBody {
  const { form, expectedStatus } = args;

  switch (action) {
    case "saveDraft":
      return {
        status: "draft",
        expectedStatus,
        content: form.content,
        attendanceCount: Math.max(0, Math.trunc(form.attendanceCount || 0)),
        mediaUrls: cleanMediaUrls(form.mediaUrls),
      };
    case "submit":
      return { status: "submitted", expectedStatus };
    case "review": {
      const notes = args.reviewNotes?.trim();
      return notes
        ? { status: "reviewed", expectedStatus, reviewNotes: notes }
        : { status: "reviewed", expectedStatus };
    }
    case "reopen":
      return { status: "draft", expectedStatus };
  }
}
