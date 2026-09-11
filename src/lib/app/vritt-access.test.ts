import { describe, expect, it } from "vitest";

import type { ScopedAccess } from "./scope";
import {
  availableVrittActions,
  canAccessVrittEvent,
  canReviewVritt,
  decideVrittTransition,
  vrittFieldPolicy,
  vrittWritableFields,
  type VrittEventRecord,
  type VrittSubject,
} from "./vritt-access";

const EDITOR = "00000000-0000-0000-0000-000000000001";
const UNIT_A = "00000000-0000-0000-0000-0000000000a1";
const UNIT_B = "00000000-0000-0000-0000-0000000000b1";

function scope(overrides: Partial<ScopedAccess> = {}): ScopedAccess {
  return {
    orgWide: false,
    unitIds: new Set(),
    departmentIds: new Set(),
    eventIds: new Set(),
    articleIds: new Set(),
    ...overrides,
  };
}

/** A unit head who organises events but reviews nothing. */
function editor(): VrittSubject {
  return {
    userId: EDITOR,
    roleCodes: ["unit_head"],
    scope: scope({ unitIds: new Set([UNIT_A]) }),
  };
}

function reviewer(): VrittSubject {
  return {
    userId: "00000000-0000-0000-0000-000000000002",
    roleCodes: ["aayam_pramukh"],
    scope: scope({ unitIds: new Set([UNIT_A]) }),
  };
}

const ownEvent: VrittEventRecord = {
  id: "00000000-0000-0000-0000-0000000000e1",
  unitId: UNIT_A,
  departmentId: null,
  createdBy: EDITOR,
};

const foreignEvent: VrittEventRecord = {
  id: "00000000-0000-0000-0000-0000000000e2",
  unitId: UNIT_B,
  departmentId: null,
  createdBy: "00000000-0000-0000-0000-0000000000ff",
};

describe("event scope", () => {
  it("admits an event in the editor's unit", () => {
    expect(canAccessVrittEvent(editor(), ownEvent)).toBe(true);
  });

  it("refuses an event outside the editor's scope", () => {
    expect(canAccessVrittEvent(editor(), foreignEvent)).toBe(false);
  });
});

describe("review authority", () => {
  it("is not held by a unit head", () => {
    expect(canReviewVritt(editor())).toBe(false);
  });

  it("is held from aayam_pramukh upward", () => {
    expect(canReviewVritt(reviewer())).toBe(true);
  });
});

describe("an event editor without review authority", () => {
  const subject = editor();

  it("may draft their own unit's vritt", () => {
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: null,
      next: "draft",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(true);
  });

  it("may submit it", () => {
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: "draft",
      next: "submitted",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(true);
  });

  it("cannot mark it reviewed", () => {
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: "submitted",
      next: "reviewed",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/aayam_pramukh/);
  });

  it("cannot jump straight from draft to reviewed", () => {
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: "draft",
      next: "reviewed",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
  });

  it("cannot create a vritt already marked reviewed", () => {
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: null,
      next: "reviewed",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
  });

  it("cannot reopen a reviewed vritt", () => {
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: "reviewed",
      next: "draft",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
  });

  it("cannot pull a submitted vritt back to draft", () => {
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: "submitted",
      next: "draft",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
  });

  it("cannot keep editing a submitted vritt in place", () => {
    // submitted -> submitted was the hole: it looked like a no-op transition but
    // carried a fresh content payload, so the report stayed editable after it
    // had been handed upward.
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: "submitted",
      next: "submitted",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/reopen/i);
  });

  it("cannot rewrite a reviewed vritt in place", () => {
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: "reviewed",
      next: "reviewed",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
  });

  it("may keep editing while still a draft", () => {
    expect(
      decideVrittTransition({
        subject,
        event: ownEvent,
        current: "draft",
        next: "draft",
        hasEditPermission: true,
      }).allowed,
    ).toBe(true);
  });

  it("cannot touch a vritt on an event outside their scope", () => {
    const decision = decideVrittTransition({
      subject,
      event: foreignEvent,
      current: "draft",
      next: "submitted",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/access/i);
  });
});

describe("a reviewer", () => {
  const subject = reviewer();

  it("may mark a submitted vritt reviewed", () => {
    expect(
      decideVrittTransition({
        subject,
        event: ownEvent,
        current: "submitted",
        next: "reviewed",
        hasEditPermission: true,
      }).allowed,
    ).toBe(true);
  });

  it("must reopen to draft rather than overwrite a submitted report", () => {
    const decision = decideVrittTransition({
      subject,
      event: ownEvent,
      current: "submitted",
      next: "submitted",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/reopen/i);
  });

  it("may return a submitted vritt to draft", () => {
    expect(
      decideVrittTransition({
        subject,
        event: ownEvent,
        current: "submitted",
        next: "draft",
        hasEditPermission: true,
      }).allowed,
    ).toBe(true);
  });

  it("still cannot review an out-of-scope event", () => {
    expect(
      decideVrittTransition({
        subject,
        event: foreignEvent,
        current: "submitted",
        next: "reviewed",
        hasEditPermission: true,
      }).allowed,
    ).toBe(false);
  });
});

describe("someone without edit permission", () => {
  it("cannot draft even inside their own scope", () => {
    const decision = decideVrittTransition({
      subject: editor(),
      event: ownEvent,
      current: null,
      next: "draft",
      hasEditPermission: false,
    });
    expect(decision.allowed).toBe(false);
  });
});

describe("attribution columns", () => {
  it("stamps submittedBy only on submission", () => {
    expect(vrittWritableFields("submitted")).toEqual({ setSubmittedBy: true, setReviewedBy: false });
  });

  it("stamps reviewedBy only on review", () => {
    expect(vrittWritableFields("reviewed")).toEqual({ setSubmittedBy: false, setReviewedBy: true });
  });

  it("stamps neither on a draft", () => {
    expect(vrittWritableFields("draft")).toEqual({ setSubmittedBy: false, setReviewedBy: false });
  });
});

describe("which fields a transition may write", () => {
  it("lets a first draft carry content", () => {
    expect(vrittFieldPolicy(null, "draft").contentWritable).toBe(true);
  });

  it("lets an ongoing draft edit carry content", () => {
    expect(vrittFieldPolicy("draft", "draft").contentWritable).toBe(true);
  });

  it("makes submission a status-only operation", () => {
    const policy = vrittFieldPolicy("draft", "submitted");
    expect(policy.contentWritable).toBe(false);
    expect(policy.setSubmittedBy).toBe(true);
    expect(policy.setReviewedBy).toBe(false);
  });

  it("makes review a status-only operation, so sign-off cannot rewrite the report", () => {
    const policy = vrittFieldPolicy("submitted", "reviewed");
    expect(policy.contentWritable).toBe(false);
    expect(policy.reviewNotesWritable).toBe(true);
    expect(policy.setReviewedBy).toBe(true);
    expect(policy.setSubmittedBy).toBe(false);
  });

  it("makes reopening a status-only operation too", () => {
    // The rewrite happens in the draft that follows, not in the reopening.
    expect(vrittFieldPolicy("submitted", "draft").contentWritable).toBe(false);
    expect(vrittFieldPolicy("reviewed", "draft").contentWritable).toBe(false);
  });

  it("allows review notes only when reviewing", () => {
    expect(vrittFieldPolicy("draft", "submitted").reviewNotesWritable).toBe(false);
    expect(vrittFieldPolicy(null, "draft").reviewNotesWritable).toBe(false);
  });
});

describe("submitting with nothing saved", () => {
  it("is refused, since submission carries no content", () => {
    const decision = decideVrittTransition({
      subject: editor(),
      event: ownEvent,
      current: null,
      next: "submitted",
      hasEditPermission: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/draft/i);
  });
});

describe("actions offered to the sheet", () => {
  const offered = (subject: VrittSubject, current: "draft" | "submitted" | "reviewed" | null, edit = true) => {
    const actions = availableVrittActions({ subject, event: ownEvent, current, hasEditPermission: edit });
    return (Object.keys(actions) as Array<keyof typeof actions>).filter((a) => actions[a].allowed).sort();
  };

  it("a unit head with no report yet may only save a draft", () => {
    expect(offered(editor(), null)).toEqual(["saveDraft"]);
  });

  it("a unit head with a draft may save or submit it", () => {
    expect(offered(editor(), "draft")).toEqual(["saveDraft", "submit"]);
  });

  it("a unit head may do nothing to a submitted report", () => {
    expect(offered(editor(), "submitted")).toEqual([]);
  });

  it("a unit head may do nothing to a reviewed report", () => {
    expect(offered(editor(), "reviewed")).toEqual([]);
  });

  it("a reviewer may review or reopen a submitted report", () => {
    expect(offered(reviewer(), "submitted")).toEqual(["reopen", "review"]);
  });

  it("a reviewer may only reopen a reviewed report", () => {
    expect(offered(reviewer(), "reviewed")).toEqual(["reopen"]);
  });

  it("nobody is offered anything on an event outside their scope", () => {
    for (const current of [null, "draft", "submitted", "reviewed"] as const) {
      const actions = availableVrittActions({ subject: reviewer(), event: foreignEvent, current, hasEditPermission: true });
      expect(Object.values(actions).some((a) => a.allowed)).toBe(false);
    }
  });

  it("someone without edit permission may not draft", () => {
    expect(offered(editor(), "draft", false)).toEqual([]);
  });

  it("explains every refusal", () => {
    const actions = availableVrittActions({ subject: editor(), event: ownEvent, current: "submitted", hasEditPermission: true });
    expect(actions.review.reason).toBeTruthy();
    expect(actions.reopen.reason).toMatch(/reviewer/i);
  });

  it("never offers what decideVrittTransition would refuse", () => {
    const targets = { saveDraft: "draft", submit: "submitted", review: "reviewed", reopen: "draft" } as const;
    for (const subject of [editor(), reviewer()]) {
      for (const current of [null, "draft", "submitted", "reviewed"] as const) {
        const actions = availableVrittActions({ subject, event: ownEvent, current, hasEditPermission: true });
        for (const action of Object.keys(targets) as Array<keyof typeof targets>) {
          if (!actions[action].allowed) continue;
          const decision = decideVrittTransition({
            subject, event: ownEvent, current, next: targets[action], hasEditPermission: true,
          });
          expect(decision.allowed, `${action} from ${current}`).toBe(true);
        }
      }
    }
  });
});
