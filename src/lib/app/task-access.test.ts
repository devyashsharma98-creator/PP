import { describe, expect, it } from "vitest";

import { resolveScopedAccess, type ScopedAccess } from "./scope";
import {
  canAssignToCandidate,
  canChangeTaskStatus,
  canCreateTask,
  canDeleteTask,
  canEditTaskDetails,
  canHardDeleteProject,
  canReadProject,
  canReadTask,
  canReassignTask,
  canUpdateProject,
  classifyTaskUpdate,
  isProjectManager,
  projectRelation,
  type ProjectRecord,
  type TaskAccessSubject,
  type TaskRecord,
} from "./task-access";

const ORG = "00000000-0000-0000-0000-0000000000aa";
const DEPT_A = "00000000-0000-0000-0000-0000000000d1";
const DEPT_B = "00000000-0000-0000-0000-0000000000d2";
const UNIT_A = "00000000-0000-0000-0000-0000000000u1".replace(/u/g, "1");

const WORKER = "00000000-0000-0000-0000-000000000001";
const OTHER_WORKER = "00000000-0000-0000-0000-000000000002";
const HEAD = "00000000-0000-0000-0000-000000000003";

function emptyScope(): ScopedAccess {
  return {
    orgWide: false,
    unitIds: new Set(),
    departmentIds: new Set(),
    eventIds: new Set(),
    articleIds: new Set(),
  };
}

/** A karyakarta with no scope beyond their own work. */
function worker(overrides: Partial<TaskAccessSubject> = {}): TaskAccessSubject {
  return {
    userId: WORKER,
    roleCodes: ["karyakarta"],
    scope: emptyScope(),
    assignedProjectIds: new Set(),
    ...overrides,
  };
}

/** A unit head responsible for department A. */
function unitHead(overrides: Partial<TaskAccessSubject> = {}): TaskAccessSubject {
  const scope = emptyScope();
  scope.departmentIds.add(DEPT_A);
  return {
    userId: HEAD,
    roleCodes: ["unit_head"],
    scope,
    assignedProjectIds: new Set(),
    ...overrides,
  };
}

function orgAdmin(): TaskAccessSubject {
  return {
    userId: "00000000-0000-0000-0000-00000000000f",
    roleCodes: ["org_admin"],
    scope: { ...emptyScope(), orgWide: true },
    assignedProjectIds: new Set(),
  };
}

const foreignProject: ProjectRecord = {
  id: "00000000-0000-0000-0000-0000000000p1".replace(/p/g, "9"),
  departmentId: DEPT_B,
  createdBy: OTHER_WORKER,
  ownerUserId: OTHER_WORKER,
};

const ownDeptProject: ProjectRecord = {
  id: "00000000-0000-0000-0000-0000000000a1",
  departmentId: DEPT_A,
  createdBy: OTHER_WORKER,
  ownerUserId: OTHER_WORKER,
};

const foreignTask: TaskRecord = {
  id: "00000000-0000-0000-0000-0000000000b1",
  projectId: foreignProject.id,
  assigneeUserId: OTHER_WORKER,
  createdBy: OTHER_WORKER,
};

describe("project relation", () => {
  it("gives an out-of-scope worker no relation to a foreign project", () => {
    expect(projectRelation(worker(), foreignProject)).toBeNull();
  });

  it("recognises org-wide reach first", () => {
    expect(projectRelation(orgAdmin(), foreignProject)).toBe("org_wide");
  });

  it("recognises a departmental unit head", () => {
    expect(projectRelation(unitHead(), ownDeptProject)).toBe("department");
  });

  it("recognises an assignee in a project they otherwise cannot see", () => {
    const subject = worker({ assignedProjectIds: new Set([foreignProject.id]) });
    expect(projectRelation(subject, foreignProject)).toBe("assignee");
  });
});

describe("a worker and another unit's task", () => {
  const subject = worker();

  it("cannot read the project", () => {
    expect(canReadProject(subject, foreignProject)).toBe(false);
  });

  it("cannot read the task", () => {
    expect(canReadTask(subject, foreignTask, foreignProject)).toBe(false);
  });

  it("cannot change its status", () => {
    expect(canChangeTaskStatus(subject, foreignTask, foreignProject)).toBe(false);
  });

  it("cannot reassign it", () => {
    expect(canReassignTask(subject, foreignTask, foreignProject)).toBe(false);
  });

  it("cannot delete it", () => {
    expect(canDeleteTask(subject, foreignTask, foreignProject)).toBe(false);
  });

  it("cannot edit its details", () => {
    expect(canEditTaskDetails(subject, foreignTask, foreignProject)).toBe(false);
  });

  it("cannot update or delete the project", () => {
    expect(canUpdateProject(subject, foreignProject)).toBe(false);
    expect(canHardDeleteProject(subject, foreignProject)).toBe(false);
  });
});

describe("a task assigned from someone else's project", () => {
  const assignedTask: TaskRecord = {
    id: "00000000-0000-0000-0000-0000000000c1",
    projectId: foreignProject.id,
    assigneeUserId: WORKER,
    createdBy: OTHER_WORKER,
  };
  const subject = worker({ assignedProjectIds: new Set([foreignProject.id]) });

  it("is readable by the assignee", () => {
    expect(canReadTask(subject, assignedTask, foreignProject)).toBe(true);
  });

  it("can have its status reported by the assignee", () => {
    expect(canChangeTaskStatus(subject, assignedTask, foreignProject)).toBe(true);
  });

  it("does not let the assignee hand it on", () => {
    expect(canReassignTask(subject, assignedTask, foreignProject)).toBe(false);
  });

  it("does not let the assignee rewrite it", () => {
    expect(canEditTaskDetails(subject, assignedTask, foreignProject)).toBe(false);
  });

  it("does not let the assignee delete it", () => {
    expect(canDeleteTask(subject, assignedTask, foreignProject)).toBe(false);
  });

  it("does not give the assignee authority over the rest of the project", () => {
    expect(isProjectManager(subject, foreignProject)).toBe(false);
    expect(canCreateTask(subject, foreignProject)).toBe(false);
    expect(canUpdateProject(subject, foreignProject)).toBe(false);

    const someoneElsesTask: TaskRecord = {
      id: "00000000-0000-0000-0000-0000000000c2",
      projectId: foreignProject.id,
      assigneeUserId: OTHER_WORKER,
      createdBy: OTHER_WORKER,
    };
    expect(canReadTask(subject, someoneElsesTask, foreignProject)).toBe(false);
  });
});

describe("a unit head in their own department", () => {
  const subject = unitHead();
  const task: TaskRecord = {
    id: "00000000-0000-0000-0000-0000000000e1",
    projectId: ownDeptProject.id,
    assigneeUserId: OTHER_WORKER,
    createdBy: OTHER_WORKER,
  };

  it("manages the project", () => {
    expect(isProjectManager(subject, ownDeptProject)).toBe(true);
    expect(canCreateTask(subject, ownDeptProject)).toBe(true);
    expect(canUpdateProject(subject, ownDeptProject)).toBe(true);
  });

  it("may reassign work within it", () => {
    expect(canReassignTask(subject, task, ownDeptProject)).toBe(true);
  });

  it("may archive but not permanently delete the project", () => {
    expect(canUpdateProject(subject, ownDeptProject)).toBe(true);
    expect(canHardDeleteProject(subject, ownDeptProject)).toBe(false);
  });

  it("has no reach into another department", () => {
    expect(canReadProject(subject, foreignProject)).toBe(false);
    expect(canReassignTask(subject, foreignTask, foreignProject)).toBe(false);
  });
});

describe("departmental reach without a responsible role", () => {
  it("does not by itself confer project authority", () => {
    const scope = emptyScope();
    scope.departmentIds.add(DEPT_A);
    const subject = worker({ scope });

    // The worker can see the department's project...
    expect(canReadProject(subject, ownDeptProject)).toBe(true);
    // ...but managing it needs a role that carries responsibility.
    expect(isProjectManager(subject, ownDeptProject)).toBe(false);
    expect(canUpdateProject(subject, ownDeptProject)).toBe(false);
  });
});

describe("task creators", () => {
  it("may edit and delete what they raised, without managing the project", () => {
    const subject = worker({ assignedProjectIds: new Set([foreignProject.id]) });
    const ownTask: TaskRecord = {
      id: "00000000-0000-0000-0000-0000000000f1",
      projectId: foreignProject.id,
      assigneeUserId: OTHER_WORKER,
      createdBy: WORKER,
    };
    expect(canEditTaskDetails(subject, ownTask, foreignProject)).toBe(true);
    expect(canDeleteTask(subject, ownTask, foreignProject)).toBe(true);
    expect(canReassignTask(subject, ownTask, foreignProject)).toBe(false);
  });
});

describe("assignee validation", () => {
  const subject = unitHead();

  it("rejects a member of another organisation", () => {
    expect(
      canAssignToCandidate(
        subject,
        { id: OTHER_WORKER, orgId: "other-org", isActive: true, departmentIds: [DEPT_A] },
        ORG,
      ),
    ).toBe(false);
  });

  it("rejects a deactivated member", () => {
    expect(
      canAssignToCandidate(
        subject,
        { id: OTHER_WORKER, orgId: ORG, isActive: false, departmentIds: [DEPT_A] },
        ORG,
      ),
    ).toBe(false);
  });

  it("rejects an active member outside the assigner's scope", () => {
    expect(
      canAssignToCandidate(
        subject,
        { id: OTHER_WORKER, orgId: ORG, isActive: true, departmentIds: [DEPT_B] },
        ORG,
      ),
    ).toBe(false);
  });

  it("accepts an active member inside the assigner's department", () => {
    expect(
      canAssignToCandidate(
        subject,
        { id: OTHER_WORKER, orgId: ORG, isActive: true, departmentIds: [DEPT_A] },
        ORG,
      ),
    ).toBe(true);
  });

  it("accepts an active member inside the assigner's unit", () => {
    const scope = emptyScope();
    scope.unitIds.add(UNIT_A);
    expect(
      canAssignToCandidate(
        unitHead({ scope }),
        { id: OTHER_WORKER, orgId: ORG, isActive: true, unitIds: [UNIT_A] },
        ORG,
      ),
    ).toBe(true);
  });

  it("lets anyone take their own work", () => {
    expect(
      canAssignToCandidate(worker(), { id: WORKER, orgId: ORG, isActive: true }, ORG),
    ).toBe(true);
  });
});

describe("update classification", () => {
  const current: TaskRecord = {
    id: "t",
    projectId: "p",
    assigneeUserId: OTHER_WORKER,
    createdBy: OTHER_WORKER,
  };

  it("treats a status-only patch as a status change", () => {
    expect(classifyTaskUpdate({ status: "done" }, current)).toEqual(["status"]);
  });

  it("detects a reassignment hidden inside a status patch", () => {
    expect(classifyTaskUpdate({ status: "done", assigneeUserId: WORKER }, current).sort()).toEqual([
      "reassign",
      "status",
    ]);
  });

  it("does not call a no-op assignee field a reassignment", () => {
    expect(classifyTaskUpdate({ assigneeUserId: OTHER_WORKER }, current)).toEqual([]);
  });

  it("treats clearing the assignee as a reassignment", () => {
    expect(classifyTaskUpdate({ assigneeUserId: null }, current)).toEqual(["reassign"]);
  });

  it("separates detail edits from status changes", () => {
    expect(classifyTaskUpdate({ title: "New title" }, current)).toEqual(["details"]);
  });
});

describe("scope resolution feeding the rules", () => {
  it("gives an org_admin org-wide reach", () => {
    const scope = resolveScopedAccess([{ roleCode: "org_admin", scopeType: "org" }]);
    expect(scope.orgWide).toBe(true);
  });

  it("does not give a karyakarta org-wide reach from an org-scoped assignment", () => {
    const scope = resolveScopedAccess([{ roleCode: "karyakarta", scopeType: "org" }]);
    expect(scope.orgWide).toBe(false);
  });
});
