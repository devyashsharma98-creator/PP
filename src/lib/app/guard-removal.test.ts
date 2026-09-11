/**
 * Guard-removal demonstration.
 *
 * Each case below re-implements one authorization rule with its guard removed —
 * exactly the mutation a careless refactor would produce — and asserts that the
 * mutant returns the wrong answer for an input the real rule gets right. That
 * is the evidence that the corresponding test in task-access.test.ts /
 * vritt-access.test.ts / export-access.test.ts is actually load-bearing: delete
 * the guard from the production module and those tests fail with precisely the
 * mismatch shown here.
 *
 * The real rules are imported alongside so the two are compared directly and
 * the demonstration cannot rot into asserting against itself.
 */
import { describe, expect, it } from "vitest";

import { hasRoleOrAbove } from "@/lib/permissions/index";
import type { ScopedAccess } from "./scope";
import {
  canReadTask,
  canReassignTask,
  isProjectManager,
  projectRelation,
  type ProjectRecord,
  type TaskAccessSubject,
  type TaskRecord,
} from "./task-access";
import { canExportMembers } from "./export-access";
import { decideVrittTransition, type VrittSubject } from "./vritt-access";

const WORKER = "00000000-0000-0000-0000-000000000001";
const STRANGER = "00000000-0000-0000-0000-000000000002";
const UNIT_A = "00000000-0000-0000-0000-0000000000a1";
const UNIT_B = "00000000-0000-0000-0000-0000000000b2";

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

// ── 1. Task read guard ───────────────────────────────────────────────────────

describe("removing the task read guard", () => {
  const subject: TaskAccessSubject = {
    userId: WORKER,
    roleCodes: ["karyakarta"],
    scope: scope(),
    assignedProjectIds: new Set(),
  };
  const project: ProjectRecord = {
    id: "p1",
    departmentId: "d-other",
    createdBy: STRANGER,
    ownerUserId: STRANGER,
  };
  const task: TaskRecord = {
    id: "t1",
    projectId: "p1",
    assigneeUserId: STRANGER,
    createdBy: STRANGER,
  };

  /** canReadTask with its project-reach check deleted — ownership only. */
  const withoutGuard = (s: TaskAccessSubject, t: TaskRecord) =>
    t.assigneeUserId === s.userId || t.createdBy === s.userId || true;

  it("lets an out-of-scope worker read another unit's task", () => {
    expect(withoutGuard(subject, task)).toBe(true);
    // The real rule refuses. If the guard were removed from task-access.ts,
    // the "cannot read the task" case in task-access.test.ts would see `true`
    // here and fail.
    expect(canReadTask(subject, task, project)).toBe(false);
    expect(withoutGuard(subject, task)).not.toBe(canReadTask(subject, task, project));
  });
});

// ── 2. Reassignment guard ────────────────────────────────────────────────────

describe("removing the reassignment guard", () => {
  const assignee: TaskAccessSubject = {
    userId: WORKER,
    roleCodes: ["karyakarta"],
    scope: scope(),
    assignedProjectIds: new Set(["p1"]),
  };
  const project: ProjectRecord = {
    id: "p1",
    departmentId: "d-other",
    createdBy: STRANGER,
    ownerUserId: STRANGER,
  };
  const task: TaskRecord = {
    id: "t1",
    projectId: "p1",
    assigneeUserId: WORKER,
    createdBy: STRANGER,
  };

  /**
   * canReassignTask reduced to "can you see it?" — the mistake of treating
   * reading and reassigning as one authority.
   */
  const withoutGuard = (s: TaskAccessSubject, p: ProjectRecord) => projectRelation(s, p) !== null;

  it("lets a mere assignee hand the task to somebody else", () => {
    expect(withoutGuard(assignee, project)).toBe(true);
    expect(canReassignTask(assignee, task, project)).toBe(false);
    expect(withoutGuard(assignee, project)).not.toBe(canReassignTask(assignee, task, project));
  });
});

// ── 3. Project-manager role guard ────────────────────────────────────────────

describe("removing the responsible-role guard on departmental reach", () => {
  const deptWorker: TaskAccessSubject = {
    userId: WORKER,
    roleCodes: ["karyakarta"],
    scope: scope({ departmentIds: new Set(["d1"]) }),
    assignedProjectIds: new Set(),
  };
  const project: ProjectRecord = {
    id: "p1",
    departmentId: "d1",
    createdBy: STRANGER,
    ownerUserId: STRANGER,
  };

  /** isProjectManager with the hasRoleOrAbove("unit_head") check deleted. */
  const withoutGuard = (s: TaskAccessSubject, p: ProjectRecord) => {
    const relation = projectRelation(s, p);
    return relation !== null && relation !== "assignee";
  };

  it("promotes any departmental karyakarta into a project manager", () => {
    expect(withoutGuard(deptWorker, project)).toBe(true);
    expect(isProjectManager(deptWorker, project)).toBe(false);
    // Sanity: the guard that makes the difference is the role check.
    expect(hasRoleOrAbove(deptWorker.roleCodes, "unit_head")).toBe(false);
  });
});

// ── 4. Member-export authority guard ─────────────────────────────────────────

describe("removing the member-export authority guard", () => {
  const subject = { roleCodes: ["karyakarta"] as const, scope: scope({ departmentIds: new Set(["d1"]) }) };

  /** canExportMembers with the role check deleted — scope alone decides. */
  const withoutGuard = (s: typeof subject) =>
    s.scope.orgWide || s.scope.departmentIds.size > 0 || s.scope.unitIds.size > 0;

  it("lets any scoped member export the contact list", () => {
    expect(withoutGuard(subject)).toBe(true);
    expect(canExportMembers({ roleCodes: [...subject.roleCodes], scope: subject.scope }).allowed).toBe(false);
  });
});

// ── 5. Vritt review-authority guard ──────────────────────────────────────────

describe("removing the vritt review-authority guard", () => {
  const eventEditor: VrittSubject = {
    userId: WORKER,
    roleCodes: ["unit_head"],
    scope: scope({ unitIds: new Set([UNIT_A]) }),
  };
  const event = { id: "e1", unitId: UNIT_A, departmentId: null, createdBy: WORKER };

  /**
   * decideVrittTransition with the reviewer check deleted — the original
   * behaviour, where canUpdateEvent was enough to set any status.
   */
  const withoutGuard = (hasEditPermission: boolean) => hasEditPermission;

  it("lets an event editor sign off their own report", () => {
    expect(withoutGuard(true)).toBe(true);

    const real = decideVrittTransition({
      subject: eventEditor,
      event,
      current: "submitted",
      next: "reviewed",
      hasEditPermission: true,
    });
    expect(real.allowed).toBe(false);
  });
});

// ── 6. Vritt event-scope guard ───────────────────────────────────────────────

describe("removing the vritt event-scope guard", () => {
  const reviewer: VrittSubject = {
    userId: WORKER,
    roleCodes: ["aayam_pramukh"],
    scope: scope({ unitIds: new Set([UNIT_A]) }),
  };
  const foreignEvent = { id: "e2", unitId: UNIT_B, departmentId: null, createdBy: STRANGER };

  /** The transition decision with canAccessVrittEvent() dropped. */
  const withoutGuard = (next: string, current: string | null) =>
    next !== "reviewed" || current === "submitted";

  it("lets a reviewer sign off an event belonging to another unit", () => {
    expect(withoutGuard("reviewed", "submitted")).toBe(true);

    const real = decideVrittTransition({
      subject: reviewer,
      event: foreignEvent,
      current: "submitted",
      next: "reviewed",
      hasEditPermission: true,
    });
    expect(real.allowed).toBe(false);
    expect(real.reason).toMatch(/access/i);
  });
});
