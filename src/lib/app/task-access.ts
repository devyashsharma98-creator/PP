/**
 * Pragya Pravah — Centralized Project / Task Access Rules
 *
 * Single source of truth for who may read, create, edit, restatus, reassign,
 * archive or delete a project or task. Pure functions only — no DB, no request
 * objects — so every rule is directly testable and every call site (list,
 * detail, create, update, delete, reminders) shares one decision.
 *
 * Two independent inputs decide access:
 *   1. Organisational scope  — resolveScopedAccess() over role assignments.
 *   2. Personal attachment   — ownership, authorship, or being the assignee.
 *
 * Personal attachment is deliberately allowed to cross scope: a karyakarta must
 * be able to see a task handed to them from a project in another department,
 * without gaining any authority over the rest of that project.
 */
import { hasRoleOrAbove, type RoleCode } from "@/lib/permissions/index";
import type { ScopedAccess } from "./scope";

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface TaskAccessSubject {
  userId: string;
  roleCodes: RoleCode[];
  scope: ScopedAccess;
  /**
   * Projects the subject is personally attached to through a task assignment.
   * Populated by the service layer from project_tasks.assignee_user_id so that
   * assignees discover their work across projects they otherwise cannot see.
   */
  assignedProjectIds?: ReadonlySet<string>;
}

export interface ProjectRecord {
  id: string;
  departmentId?: string | null;
  createdBy?: string | null;
  ownerUserId?: string | null;
}

export interface TaskRecord {
  id: string;
  projectId: string;
  assigneeUserId?: string | null;
  createdBy?: string | null;
}

/** How the subject reaches a project. Ordered strongest to weakest. */
export type ProjectRelation = "org_wide" | "department" | "owner" | "creator" | "assignee" | null;

// ── Relation resolution ──────────────────────────────────────────────────────

export function projectRelation(
  subject: TaskAccessSubject,
  project: ProjectRecord,
): ProjectRelation {
  if (subject.scope.orgWide) return "org_wide";
  if (project.ownerUserId && project.ownerUserId === subject.userId) return "owner";
  if (project.createdBy && project.createdBy === subject.userId) return "creator";
  if (project.departmentId && subject.scope.departmentIds.has(project.departmentId)) {
    return "department";
  }
  if (subject.assignedProjectIds?.has(project.id)) return "assignee";
  return null;
}

/**
 * Managing a project means changing the project itself, or anything inside it
 * that is not one's own task. Being merely the assignee of a task never confers
 * it — that is the whole point of the "assignee" relation being separate.
 */
export function isProjectManager(subject: TaskAccessSubject, project: ProjectRecord): boolean {
  const relation = projectRelation(subject, project);
  if (relation === null || relation === "assignee") return false;
  if (relation === "org_wide" || relation === "owner" || relation === "creator") return true;
  // Departmental reach alone is not authority — it must be paired with a role
  // that carries project responsibility.
  return hasRoleOrAbove(subject.roleCodes, "unit_head");
}

// ── Project rules ────────────────────────────────────────────────────────────

export function canReadProject(subject: TaskAccessSubject, project: ProjectRecord): boolean {
  return projectRelation(subject, project) !== null;
}

/**
 * Whether the subject sees the project as a whole, rather than only as the
 * container of a task handed to them. Being someone's assignee reveals the
 * project's existence — never the rest of its board.
 */
export function hasProjectWideReach(subject: TaskAccessSubject, project: ProjectRecord): boolean {
  const relation = projectRelation(subject, project);
  return relation !== null && relation !== "assignee";
}

export function canUpdateProject(subject: TaskAccessSubject, project: ProjectRecord): boolean {
  return isProjectManager(subject, project);
}

/** Reversible removal — the default destructive action. */
export function canArchiveProject(subject: TaskAccessSubject, project: ProjectRecord): boolean {
  return isProjectManager(subject, project);
}

/**
 * Irreversible removal, cascading to every task in the project. Held above
 * ordinary project management on purpose.
 */
export function canHardDeleteProject(subject: TaskAccessSubject, project: ProjectRecord): boolean {
  return isProjectManager(subject, project) && hasRoleOrAbove(subject.roleCodes, "aayam_pramukh");
}

// ── Task rules ───────────────────────────────────────────────────────────────

export function isTaskOwner(subject: TaskAccessSubject, task: TaskRecord): boolean {
  return (
    (!!task.assigneeUserId && task.assigneeUserId === subject.userId) ||
    (!!task.createdBy && task.createdBy === subject.userId)
  );
}

export function canReadTask(
  subject: TaskAccessSubject,
  task: TaskRecord,
  project: ProjectRecord,
): boolean {
  if (isTaskOwner(subject, task)) return true;
  // Deliberately not canReadProject(): reaching a project only because a task
  // in it was assigned to you must not expose everybody else's tasks.
  return hasProjectWideReach(subject, project);
}

export function canCreateTask(subject: TaskAccessSubject, project: ProjectRecord): boolean {
  return isProjectManager(subject, project);
}

/** Title, description, priority, due date, sort order. */
export function canEditTaskDetails(
  subject: TaskAccessSubject,
  task: TaskRecord,
  project: ProjectRecord,
): boolean {
  if (isProjectManager(subject, project)) return true;
  return !!task.createdBy && task.createdBy === subject.userId;
}

/**
 * Moving a task through todo / in_progress / done / blocked. Distinct from
 * editing details: the assignee reports their own progress but may not rewrite
 * the task or hand it on.
 */
export function canChangeTaskStatus(
  subject: TaskAccessSubject,
  task: TaskRecord,
  project: ProjectRecord,
): boolean {
  if (isProjectManager(subject, project)) return true;
  return isTaskOwner(subject, task);
}

/** Handing a task to somebody else — always a management act. */
export function canReassignTask(
  subject: TaskAccessSubject,
  _task: TaskRecord,
  project: ProjectRecord,
): boolean {
  return isProjectManager(subject, project) && hasRoleOrAbove(subject.roleCodes, "unit_head");
}

export function canDeleteTask(
  subject: TaskAccessSubject,
  task: TaskRecord,
  project: ProjectRecord,
): boolean {
  if (isProjectManager(subject, project)) return true;
  return !!task.createdBy && task.createdBy === subject.userId;
}

// ── Assignment targets ───────────────────────────────────────────────────────

export interface AssignableCandidate {
  id: string;
  orgId: string;
  isActive: boolean;
  /** Departments the candidate holds a live role assignment in. */
  departmentIds?: readonly string[];
  /** Units the candidate holds a live role assignment in. */
  unitIds?: readonly string[];
}

/**
 * Whether `subject` may hand work to `candidate`. Membership must be active and
 * in the same org, and the candidate must fall inside the subject's own reach —
 * so a unit head can staff their unit without ever seeing the org user list.
 */
export function canAssignToCandidate(
  subject: TaskAccessSubject,
  candidate: AssignableCandidate,
  orgId: string,
): boolean {
  if (candidate.orgId !== orgId) return false;
  if (!candidate.isActive) return false;
  if (candidate.id === subject.userId) return true;
  if (subject.scope.orgWide) return true;
  if (candidate.departmentIds?.some((d) => subject.scope.departmentIds.has(d))) return true;
  if (candidate.unitIds?.some((u) => subject.scope.unitIds.has(u))) return true;
  return false;
}

// ── Update-shape classification ──────────────────────────────────────────────

export type TaskUpdateIntent = "status" | "reassign" | "details";

/**
 * Split an incoming task patch into the authorities it actually requires, so a
 * single PATCH cannot smuggle a reassignment through a status-change check.
 */
export function classifyTaskUpdate(
  input: Record<string, unknown>,
  current: TaskRecord,
): TaskUpdateIntent[] {
  const intents = new Set<TaskUpdateIntent>();
  const detailKeys = [
    "title",
    "titleHi",
    "description",
    "priority",
    "dueDate",
    "sortOrder",
    "metadata",
  ];

  if (input.status !== undefined || input.completedAt !== undefined) intents.add("status");
  if (detailKeys.some((k) => input[k] !== undefined)) intents.add("details");

  if (input.assigneeUserId !== undefined) {
    const next = (input.assigneeUserId ?? null) as string | null;
    const now = current.assigneeUserId ?? null;
    if (next !== now) intents.add("reassign");
  }

  return [...intents];
}
