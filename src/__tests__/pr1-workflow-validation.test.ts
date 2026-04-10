/**
 * PR-1 Hardening Tests
 *
 * Tests for:
 * - Event workflow validation (pure function, no DB)
 * - Article workflow validation (pure function, no DB)
 * - Zod request schema validation (no DB)
 *
 * Run with: npx vitest run src/__tests__/pr1-workflow-validation.test.ts
 */
import { describe, test, expect } from "vitest";
import {
  validateEventTransition,
  getAvailableEventTransitions,
} from "@/lib/permissions/event-workflow";
import {
  validateArticleTransition,
  isValuesChecklistComplete,
} from "@/lib/permissions/article-workflow";
import { appActionSchema } from "@/lib/validators/app-actions";

// ── Event Workflow Validation ─────────────────────────────────────────────────

describe("Event Workflow — Forward Chain", () => {
  test("unit_head can submit draft", () => {
    const err = validateEventTransition("draft", "submitted_by_unit", ["unit_head"]);
    expect(err).toBeNull();
  });

  test("aayam_pramukh can begin aayam review from submitted", () => {
    const err = validateEventTransition("submitted_by_unit", "pending_aayam_review", ["aayam_pramukh"]);
    expect(err).toBeNull();
  });

  test("aayam_pramukh can move to vibhag review", () => {
    const err = validateEventTransition("pending_aayam_review", "pending_vibhag_review", ["aayam_pramukh"]);
    expect(err).toBeNull();
  });

  test("vibhag_pramukh can send to prant", () => {
    const err = validateEventTransition("pending_vibhag_review", "pending_prant_authorization", ["vibhag_pramukh"]);
    expect(err).toBeNull();
  });

  test("prant_sanyojak gives first prant authorization", () => {
    const err = validateEventTransition("pending_prant_authorization", "pending_prant_dual_authorization", ["prant_sanyojak"]);
    expect(err).toBeNull();
  });

  test("prant_aayam_pramukh gives final authorization", () => {
    const err = validateEventTransition("pending_prant_dual_authorization", "authorized_public", ["prant_aayam_pramukh"]);
    expect(err).toBeNull();
  });
});

describe("Event Workflow — Invalid Transitions", () => {
  test("cannot jump from draft to authorized_public", () => {
    const err = validateEventTransition("draft", "authorized_public", ["super_admin"]);
    expect(err).not.toBeNull();
    expect(err).toContain("not defined");
  });

  test("cannot jump from draft to pending_vibhag_review", () => {
    const err = validateEventTransition("draft", "pending_vibhag_review", ["vibhag_pramukh"]);
    expect(err).not.toBeNull();
  });

  test("cannot move backwards: pending_vibhag_review → submitted_by_unit", () => {
    const err = validateEventTransition("pending_vibhag_review", "submitted_by_unit", ["vibhag_pramukh"]);
    expect(err).not.toBeNull();
  });
});

describe("Event Workflow — Role Enforcement", () => {
  test("karyakarta cannot approve at aayam level", () => {
    const err = validateEventTransition("submitted_by_unit", "pending_aayam_review", ["karyakarta"]);
    expect(err).not.toBeNull();
    expect(err).toContain("Insufficient role");
  });

  test("unit_head cannot approve at vibhag level", () => {
    const err = validateEventTransition("pending_aayam_review", "pending_vibhag_review", ["unit_head"]);
    expect(err).not.toBeNull();
    expect(err).toContain("Insufficient role");
  });

  test("higher role CAN perform lower role transition", () => {
    // vibhag_pramukh should be able to submit (unit_head level)
    const err = validateEventTransition("draft", "submitted_by_unit", ["vibhag_pramukh"]);
    expect(err).toBeNull();
  });

  test("org_admin can do any transition in the forward chain", () => {
    const err = validateEventTransition("pending_prant_dual_authorization", "authorized_public", ["org_admin"]);
    expect(err).toBeNull();
  });
});

describe("Event Workflow — Lateral Transitions", () => {
  test("return for revision requires a note", () => {
    const err = validateEventTransition("pending_aayam_review", "returned_for_revision", ["aayam_pramukh"]);
    expect(err).not.toBeNull();
    expect(err).toContain("review note");
  });

  test("return for revision with note passes", () => {
    const err = validateEventTransition(
      "pending_aayam_review",
      "returned_for_revision",
      ["aayam_pramukh"],
      "Needs changes to description",
    );
    expect(err).toBeNull();
  });

  test("rejection requires a note", () => {
    const err = validateEventTransition("pending_vibhag_review", "rejected", ["vibhag_pramukh"]);
    expect(err).not.toBeNull();
    expect(err).toContain("review note");
  });

  test("rejection with note passes", () => {
    const err = validateEventTransition(
      "pending_vibhag_review",
      "rejected",
      ["vibhag_pramukh"],
      "Does not meet guidelines",
    );
    expect(err).toBeNull();
  });

  test("resubmission after revision is allowed", () => {
    const err = validateEventTransition("returned_for_revision", "submitted_by_unit", ["unit_head"]);
    expect(err).toBeNull();
  });

  test("cancellation allowed by vibhag_pramukh", () => {
    const err = validateEventTransition("pending_aayam_review", "cancelled", ["vibhag_pramukh"]);
    expect(err).toBeNull();
  });
});

describe("Event Workflow — getAvailableEventTransitions", () => {
  test("karyakarta sees no transitions from draft", () => {
    const transitions = getAvailableEventTransitions("draft", ["karyakarta"]);
    expect(transitions).toHaveLength(0);
  });

  test("unit_head sees submit from draft", () => {
    const transitions = getAvailableEventTransitions("draft", ["unit_head"]);
    const targetStatuses = transitions.map((t) => t.to);
    expect(targetStatuses).toContain("submitted_by_unit");
  });

  test("vibhag_pramukh sees multiple options at pending_aayam_review", () => {
    const transitions = getAvailableEventTransitions("pending_aayam_review", ["vibhag_pramukh"]);
    const targetStatuses = transitions.map((t) => t.to);
    // Should be able to: forward to vibhag, return for revision, reject, cancel
    expect(targetStatuses).toContain("pending_vibhag_review");
    expect(targetStatuses).toContain("returned_for_revision");
    expect(targetStatuses).toContain("rejected");
    expect(targetStatuses).toContain("cancelled");
  });
});

// ── Article Workflow Validation ───────────────────────────────────────────────

describe("Article Workflow — Forward Chain", () => {
  const fullChecklist = {
    rashtraPratham: true,
    culturallyGrounded: true,
    balancedTone: true,
    noDivisiveContent: true,
  };

  test("karyakarta can submit draft with complete checklist", () => {
    const err = validateArticleTransition("draft", "pending_unit_head_review", ["karyakarta"], {
      valuesChecklist: fullChecklist,
    });
    expect(err).toBeNull();
  });

  test("unit_head can move to aayam review", () => {
    const err = validateArticleTransition("pending_unit_head_review", "pending_aayam_review", ["unit_head"]);
    expect(err).toBeNull();
  });

  test("aayam_pramukh can move to vibhag review", () => {
    const err = validateArticleTransition("pending_aayam_review", "pending_vibhag_review", ["aayam_pramukh"]);
    expect(err).toBeNull();
  });

  test("vibhag_pramukh can send to prant authorization", () => {
    const err = validateArticleTransition("pending_vibhag_review", "pending_prant_authorization", ["vibhag_pramukh"]);
    expect(err).toBeNull();
  });

  test("prant_sanyojak can authorize for publication", () => {
    const err = validateArticleTransition("pending_prant_authorization", "authorized_public", ["prant_sanyojak"]);
    expect(err).toBeNull();
  });
});

describe("Article Workflow — Values Checklist Enforcement", () => {
  test("incomplete checklist blocks submission", () => {
    const err = validateArticleTransition("draft", "pending_unit_head_review", ["karyakarta"], {
      valuesChecklist: {
        rashtraPratham: true,
        culturallyGrounded: false,
        balancedTone: true,
        noDivisiveContent: true,
      },
    });
    expect(err).not.toBeNull();
    expect(err).toContain("values checklist");
  });

  test("missing checklist blocks submission", () => {
    const err = validateArticleTransition("draft", "pending_unit_head_review", ["karyakarta"], {});
    expect(err).not.toBeNull();
    expect(err).toContain("checklist");
  });

  test("isValuesChecklistComplete returns true for full checklist", () => {
    expect(
      isValuesChecklistComplete({
        rashtraPratham: true,
        culturallyGrounded: true,
        balancedTone: true,
        noDivisiveContent: true,
      }),
    ).toBe(true);
  });

  test("isValuesChecklistComplete returns false for partial checklist", () => {
    expect(
      isValuesChecklistComplete({
        rashtraPratham: true,
        culturallyGrounded: true,
        balancedTone: false,
        noDivisiveContent: true,
      }),
    ).toBe(false);
  });
});

describe("Article Workflow — Lateral Transitions", () => {
  test("return for revision requires a note", () => {
    const err = validateArticleTransition("pending_aayam_review", "returned_for_revision", ["aayam_pramukh"], {});
    expect(err).not.toBeNull();
    expect(err).toContain("review note");
  });

  test("return with note passes", () => {
    const err = validateArticleTransition("pending_aayam_review", "returned_for_revision", ["aayam_pramukh"], {
      note: "Tone needs adjustment",
    });
    expect(err).toBeNull();
  });

  test("archiving is allowed by vibhag_pramukh after publication", () => {
    const err = validateArticleTransition("authorized_public", "archived", ["vibhag_pramukh"]);
    expect(err).toBeNull();
  });
});

// ── Zod Request Validation ────────────────────────────────────────────────────

describe("Zod — createEvent", () => {
  test("valid createEvent passes", () => {
    const result = appActionSchema.safeParse({
      action: "createEvent",
      payload: { title: "Test Seminar", description: "About the event" },
    });
    expect(result.success).toBe(true);
  });

  test("empty title fails", () => {
    const result = appActionSchema.safeParse({
      action: "createEvent",
      payload: { title: "" },
    });
    expect(result.success).toBe(false);
  });

  test("missing payload fails", () => {
    const result = appActionSchema.safeParse({
      action: "createEvent",
    });
    expect(result.success).toBe(false);
  });

  test("extra fields in payload pass through", () => {
    const result = appActionSchema.safeParse({
      action: "createEvent",
      payload: { title: "Test", unknownField: "should be allowed" },
    });
    expect(result.success).toBe(true);
  });
});

describe("Zod — updateEventStatus", () => {
  test("valid status passes", () => {
    const result = appActionSchema.safeParse({
      action: "updateEventStatus",
      payload: { id: "00000000-0000-0000-0000-000000000001", status: "Pending Aayam Review" },
    });
    expect(result.success).toBe(true);
  });

  test("invalid status fails", () => {
    const result = appActionSchema.safeParse({
      action: "updateEventStatus",
      payload: { id: "00000000-0000-0000-0000-000000000001", status: "SuperPublished" },
    });
    expect(result.success).toBe(false);
  });

  test("non-UUID id fails", () => {
    const result = appActionSchema.safeParse({
      action: "updateEventStatus",
      payload: { id: "not-a-uuid", status: "Published" },
    });
    expect(result.success).toBe(false);
  });
});

describe("Zod — updateArticleStatus", () => {
  test("valid article status passes", () => {
    const result = appActionSchema.safeParse({
      action: "updateArticleStatus",
      payload: {
        id: "00000000-0000-0000-0000-000000000001",
        status: "Published",
        reviewNotes: "Looks great",
      },
    });
    expect(result.success).toBe(true);
  });

  test("invalid article status fails", () => {
    const result = appActionSchema.safeParse({
      action: "updateArticleStatus",
      payload: { id: "00000000-0000-0000-0000-000000000001", status: "SuperArchived" },
    });
    expect(result.success).toBe(false);
  });
});

describe("Zod — Unknown actions", () => {
  test("unknown action fails", () => {
    const result = appActionSchema.safeParse({
      action: "deleteEverything",
      payload: {},
    });
    expect(result.success).toBe(false);
  });

  test("empty object fails", () => {
    const result = appActionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test("non-object fails", () => {
    const result = appActionSchema.safeParse("not an object");
    expect(result.success).toBe(false);
  });
});

describe("Zod — addArticle", () => {
  test("valid article passes", () => {
    const result = appActionSchema.safeParse({
      action: "addArticle",
      payload: {
        title: "Test Aalekh",
        content: "Full article content here",
        summary: "Brief summary",
        category: "vimarsh",
        valuesChecklist: {
          rashtraPratham: true,
          culturallyGrounded: true,
          balancedTone: true,
          noDivisiveContent: true,
        },
      },
    });
    expect(result.success).toBe(true);
  });

  test("missing valuesChecklist fails", () => {
    const result = appActionSchema.safeParse({
      action: "addArticle",
      payload: {
        title: "Test",
        content: "Content",
        summary: "Summary",
        category: "vimarsh",
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("Zod — castVote", () => {
  test("valid vote passes", () => {
    const result = appActionSchema.safeParse({
      action: "castVote",
      payload: {
        eventId: "00000000-0000-0000-0000-000000000001",
        pollId: "00000000-0000-0000-0000-000000000002",
        optionId: "00000000-0000-0000-0000-000000000003",
      },
    });
    expect(result.success).toBe(true);
  });

  test("non-UUID pollId fails", () => {
    const result = appActionSchema.safeParse({
      action: "castVote",
      payload: {
        eventId: "00000000-0000-0000-0000-000000000001",
        pollId: "bad-id",
        optionId: "00000000-0000-0000-0000-000000000003",
      },
    });
    expect(result.success).toBe(false);
  });
});
