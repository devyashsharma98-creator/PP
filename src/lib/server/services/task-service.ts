import "server-only";

import { NextResponse } from "next/server";
import { and, eq, ilike, count, desc, inArray, or, isNull, ne, isNotNull, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { projects, projectTasks, profiles } from "@/db/schema/index";
import { auditAndActivity } from "@/lib/audit";
import type { ScopedAccess } from "@/lib/app/scope";
import type { AuthContext } from "@/lib/middleware/with-auth";
import type { RoleCode } from "@/lib/permissions/index";
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
  hasProjectWideReach,
  type ProjectRecord,
  type TaskAccessSubject,
  type TaskRecord,
} from "@/lib/app/task-access";
import { getCurrentMembership } from "./membership-service";
import { calendarDateToInstant } from "@/lib/validators/tasks";
import type { CreateProjectInput, UpdateProjectInput, ListProjectsQuery, CreateTaskInput, UpdateTaskInput, ListTasksQuery } from "@/lib/validators/tasks";
import {
  apiSuccess, apiCreated, badRequest, forbidden, serverError, notFound, conflict,
} from "@/lib/response";

type Result<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function err(response: NextResponse): Result<never> { return { ok: false, response }; }

// ── Access subject construction ──────────────────────────────────────────────

/**
 * Build the access subject for a request. The extra query resolves which
 * projects the user is personally attached to through a task assignment, which
 * is what lets an assignee find work handed to them from a project outside
 * their own scope.
 */
export async function buildTaskAccessSubject(
  userId: string,
  roleCodes: RoleCode[],
  scope: ScopedAccess,
  orgId: string,
): Promise<TaskAccessSubject> {
  if (scope.orgWide) {
    return { userId, roleCodes, scope, assignedProjectIds: new Set<string>() };
  }

  const assignedRows = await db
    .selectDistinct({ projectId: projectTasks.projectId })
    .from(projectTasks)
    .innerJoin(projects, eq(projectTasks.projectId, projects.id))
    .where(and(eq(projectTasks.assigneeUserId, userId), eq(projects.orgId, orgId)));

  return {
    userId,
    roleCodes,
    scope,
    assignedProjectIds: new Set(assignedRows.map((r) => r.projectId)),
  };
}

function subjectFromContext(
  ctx: AuthContext,
  scope: ScopedAccess,
): Promise<TaskAccessSubject> {
  return buildTaskAccessSubject(ctx.session.userId, ctx.session.effectiveRoleCodes, scope, ctx.session.orgId);
}

/**
 * SQL predicate mirroring canReadProject(). Kept next to the pure rule it
 * mirrors so the two cannot drift apart unnoticed; the pure rule remains
 * authoritative and is re-applied on every single-record read.
 */
function projectVisibilityClause(subject: TaskAccessSubject): SQL<unknown> | undefined {
  if (subject.scope.orgWide) return undefined;

  const clauses: SQL<unknown>[] = [
    eq(projects.createdBy, subject.userId),
    eq(projects.ownerUserId, subject.userId),
  ];
  if (subject.scope.departmentIds.size > 0) {
    clauses.push(inArray(projects.departmentId, [...subject.scope.departmentIds]));
  }
  const assigned = subject.assignedProjectIds;
  if (assigned && assigned.size > 0) {
    clauses.push(inArray(projects.id, [...assigned]));
  }
  return or(...clauses);
}

async function loadProject(projectId: string, orgId: string): Promise<ProjectRecord | null> {
  const [row] = await db
    .select({
      id: projects.id,
      departmentId: projects.departmentId,
      createdBy: projects.createdBy,
      ownerUserId: projects.ownerUserId,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
  return row ?? null;
}

async function loadTask(taskId: string, projectId: string, orgId: string): Promise<TaskRecord | null> {
  const [row] = await db
    .select({
      id: projectTasks.id,
      projectId: projectTasks.projectId,
      assigneeUserId: projectTasks.assigneeUserId,
      createdBy: projectTasks.createdBy,
      status: projectTasks.status,
    })
    .from(projectTasks)
    .innerJoin(projects, eq(projectTasks.projectId, projects.id))
    .where(
      and(
        eq(projectTasks.id, taskId),
        eq(projectTasks.projectId, projectId),
        eq(projects.orgId, orgId),
      ),
    );
  return row ?? null;
}

/**
 * Validate that a proposed assignee is an active member of the org and inside
 * the actor's assignable reach.
 */
async function validateAssignee(
  subject: TaskAccessSubject,
  assigneeUserId: string,
  orgId: string,
): Promise<NextResponse | null> {
  const [candidate] = await db
    .select({ id: profiles.id, orgId: profiles.orgId, isActive: profiles.isActive })
    .from(profiles)
    .where(eq(profiles.id, assigneeUserId));

  if (!candidate || candidate.orgId !== orgId) {
    return badRequest("The selected assignee is not a member of this organisation.");
  }
  if (!candidate.isActive) {
    return badRequest("The selected assignee is no longer an active member.");
  }

  // Only *current* placements count. A person who has moved on from a unit must
  // not still be assignable by that unit's head on the strength of an expired
  // role assignment.
  const membership = await getCurrentMembership(assigneeUserId);

  const allowed = canAssignToCandidate(
    subject,
    {
      id: candidate.id,
      orgId: candidate.orgId,
      isActive: candidate.isActive,
      departmentIds: membership.departmentIds,
      unitIds: membership.unitIds,
    },
    orgId,
  );

  if (!allowed) {
    return forbidden("You cannot assign work to this member.");
  }
  return null;
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function listProjects(
  q: ListProjectsQuery,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  page: number,
  limit: number,
  offset: number,
  roleCodes: RoleCode[] = [],
): Promise<Result<{ rows: unknown[]; total: number }>> {
  const subject = await buildTaskAccessSubject(userId, roleCodes, scopedAccess, orgId);

  const conditions: SQL<unknown>[] = [eq(projects.orgId, orgId)];
  if (q.status) conditions.push(eq(projects.status, q.status));
  if (q.departmentId) conditions.push(eq(projects.departmentId, q.departmentId));
  if (q.search) {
    // Bilingual by design: a Hindi query must match the Hindi name.
    const term = `%${q.search}%`;
    const nameClause = or(ilike(projects.name, term), ilike(projects.nameHi, term));
    if (nameClause) conditions.push(nameClause);
  }

  const visibility = projectVisibilityClause(subject);
  if (visibility) conditions.push(visibility);

  const whereClause = and(...conditions);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        nameHi: projects.nameHi,
        description: projects.description,
        departmentId: projects.departmentId,
        status: projects.status,
        ownerUserId: projects.ownerUserId,
        createdBy: projects.createdBy,
        deadline: projects.deadline,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(whereClause)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(projects).where(whereClause),
  ]);

  // Re-apply the authoritative rule so a drifting SQL predicate can never widen
  // what the user actually receives.
  const visible = rows.filter((row) => canReadProject(subject, row));

  return ok({ rows: visible, total: totalRow[0]?.total ?? 0 });
}

export async function getProject(
  projectId: string,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  roleCodes: RoleCode[] = [],
): Promise<Result<unknown>> {
  const subject = await buildTaskAccessSubject(userId, roleCodes, scopedAccess, orgId);

  const [row] = await db
    .select({
      id: projects.id,
      name: projects.name,
      nameHi: projects.nameHi,
      description: projects.description,
      departmentId: projects.departmentId,
      status: projects.status,
      ownerUserId: projects.ownerUserId,
      createdBy: projects.createdBy,
      deadline: projects.deadline,
      creatorName: profiles.displayName,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
    .leftJoin(profiles, eq(projects.createdBy, profiles.id));

  if (!row) return err(notFound("Project not found."));
  if (!canReadProject(subject, row)) {
    return err(forbidden("You do not have access to this project."));
  }
  return ok(row);
}

export async function createProject(
  input: CreateProjectInput,
  ctx: AuthContext,
): Promise<Result<{ id: string; name: string; status: string; createdAt: Date }>> {
  let newProject: { id: string; name: string; status: string; createdAt: Date } | undefined;
  try {
    [newProject] = await db
      .insert(projects)
      .values({
        orgId: ctx.session.orgId,
        name: input.name,
        nameHi: input.nameHi,
        description: input.description,
        departmentId: input.departmentId,
        deadline: input.deadline ? calendarDateToInstant(input.deadline) : undefined,
        metadata: input.metadata,
        createdBy: ctx.session.userId,
      })
      .returning({ id: projects.id, name: projects.name, status: projects.status, createdAt: projects.createdAt });
  } catch (e) {
    console.error("createProject error:", e);
    return err(serverError());
  }

  if (!newProject) return err(serverError("Failed to create project."));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "project.created", actorUserId: ctx.session.userId, entityType: "project", entityId: newProject.id },
    { summary: `Project "${input.name}" created.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(newProject);
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  ctx: AuthContext,
  scopedAccess: ScopedAccess,
): Promise<Result<{ id: string; name: string; status: string }>> {
  const subject = await subjectFromContext(ctx, scopedAccess);
  const existing = await loadProject(projectId, ctx.session.orgId);
  if (!existing) return err(notFound("Project not found."));

  if (!canUpdateProject(subject, existing)) {
    return err(forbidden("You do not have permission to update this project."));
  }

  const projectValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) projectValues.name = input.name;
  if (input.nameHi !== undefined) projectValues.nameHi = input.nameHi;
  if (input.description !== undefined) projectValues.description = input.description;
  if (input.departmentId !== undefined) projectValues.departmentId = input.departmentId;
  if (input.status !== undefined) projectValues.status = input.status;
  if (input.metadata !== undefined) projectValues.metadata = input.metadata;
  // `null` clears the deadline; `undefined` leaves it untouched.
  if (input.deadline !== undefined) {
    projectValues.deadline = input.deadline ? calendarDateToInstant(input.deadline) : null;
  }

  const [updated] = await db
    .update(projects)
    .set(projectValues)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.session.orgId)))
    .returning({ id: projects.id, name: projects.name, status: projects.status });

  if (!updated) return err(serverError("Failed to update project."));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "project.updated", actorUserId: ctx.session.userId, entityType: "project", entityId: projectId },
    { summary: `Project "${updated.name}" updated.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(updated);
}

export interface RemoveProjectOptions {
  /** Hard delete instead of archive. Requires elevated authority. */
  hardDelete: boolean;
  /**
   * Number of tasks the caller believes will be destroyed. Must match reality
   * for a hard delete to proceed — an explicit affected-record confirmation.
   */
  expectedTaskCount?: number;
}

export async function removeProject(
  projectId: string,
  ctx: AuthContext,
  scopedAccess: ScopedAccess,
  options: RemoveProjectOptions,
): Promise<Result<{ projectId: string; mode: "archived" | "deleted"; affectedTasks: number }>> {
  const subject = await subjectFromContext(ctx, scopedAccess);
  const existing = await loadProject(projectId, ctx.session.orgId);
  if (!existing) return err(notFound("Project not found."));

  const [taskCountRow] = await db
    .select({ total: count() })
    .from(projectTasks)
    .where(eq(projectTasks.projectId, projectId));
  const affectedTasks = taskCountRow?.total ?? 0;

  if (!options.hardDelete) {
    if (!canUpdateProject(subject, existing)) {
      return err(forbidden("You do not have permission to archive this project."));
    }
    await db
      .update(projects)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.session.orgId)));

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "project.archived", actorUserId: ctx.session.userId, entityType: "project", entityId: projectId, payload: { affectedTasks } },
      { summary: "Project archived.", actorNameSnapshot: ctx.session.displayName ?? undefined },
    );
    return ok({ projectId, mode: "archived", affectedTasks });
  }

  if (!canHardDeleteProject(subject, existing)) {
    return err(forbidden("Permanently deleting a project requires at least the 'aayam_pramukh' role."));
  }

  if (options.expectedTaskCount === undefined) {
    return err(
      conflict(
        `Permanent deletion destroys ${affectedTasks} task(s). Re-send with expectedTaskCount=${affectedTasks} to confirm.`,
      ),
    );
  }

  if (options.expectedTaskCount !== affectedTasks) {
    return err(
      conflict(
        `This project now holds ${affectedTasks} task(s), not ${options.expectedTaskCount}. Review the changes and confirm again.`,
      ),
    );
  }

  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.session.orgId)));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "project.deleted", actorUserId: ctx.session.userId, entityType: "project", entityId: projectId, payload: { affectedTasks } },
    { summary: `Project permanently deleted with ${affectedTasks} task(s).`, actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok({ projectId, mode: "deleted", affectedTasks });
}

// ── Tasks ────────────────────────────────────────────────────────────────────

/**
 * What this particular user may do to this particular task. Returned with every
 * task row so the UI can offer exactly the actions that will be accepted,
 * instead of inferring them from coarse role flags and being refused on save.
 */
export interface TaskCapabilities {
  canEditDetails: boolean;
  canChangeStatus: boolean;
  canReassign: boolean;
  canDelete: boolean;
}

function taskCapabilities(
  subject: TaskAccessSubject,
  task: TaskRecord,
  project: ProjectRecord,
): TaskCapabilities {
  return {
    canEditDetails: canEditTaskDetails(subject, task, project),
    canChangeStatus: canChangeTaskStatus(subject, task, project),
    canReassign: canReassignTask(subject, task, project),
    canDelete: canDeleteTask(subject, task, project),
  };
}

const TASK_COLUMNS = {
  id: projectTasks.id,
  projectId: projectTasks.projectId,
  title: projectTasks.title,
  titleHi: projectTasks.titleHi,
  description: projectTasks.description,
  assigneeUserId: projectTasks.assigneeUserId,
  assigneeName: profiles.displayName,
  createdBy: projectTasks.createdBy,
  status: projectTasks.status,
  priority: projectTasks.priority,
  dueDate: projectTasks.dueDate,
  sortOrder: projectTasks.sortOrder,
  completedAt: projectTasks.completedAt,
  createdAt: projectTasks.createdAt,
} as const;

export async function listTasks(
  projectId: string,
  q: ListTasksQuery,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  page: number,
  limit: number,
  offset: number,
  roleCodes: RoleCode[] = [],
): Promise<Result<{ rows: unknown[]; total: number }>> {
  const subject = await buildTaskAccessSubject(userId, roleCodes, scopedAccess, orgId);

  const project = await loadProject(projectId, orgId);
  if (!project) return err(notFound("Project not found."));
  if (!canReadProject(subject, project)) {
    return err(forbidden("You do not have access to this project."));
  }

  const conditions: SQL<unknown>[] = [
    eq(projectTasks.projectId, projectId),
    eq(projects.orgId, orgId),
  ];

  if (q.status) conditions.push(eq(projectTasks.status, q.status));
  if (q.priority) conditions.push(eq(projectTasks.priority, q.priority));
  if (q.assigneeUserId) conditions.push(eq(projectTasks.assigneeUserId, q.assigneeUserId));
  if (q.search) {
    // Bilingual by design: a Hindi query must match the Hindi title.
    const term = `%${q.search}%`;
    const titleClause = or(ilike(projectTasks.title, term), ilike(projectTasks.titleHi, term));
    if (titleClause) conditions.push(titleClause);
  }

  // Reaching the project only as an assignee shows the assignee their own work,
  // not the whole board.
  if (!hasProjectWideReach(subject, project)) {
    const ownClause = or(
      eq(projectTasks.assigneeUserId, subject.userId),
      eq(projectTasks.createdBy, subject.userId),
    );
    if (ownClause) conditions.push(ownClause);
  }

  const whereClause = and(...conditions);

  const [rows, totalRow] = await Promise.all([
    db
      .select(TASK_COLUMNS)
      .from(projectTasks)
      .innerJoin(projects, eq(projectTasks.projectId, projects.id))
      .leftJoin(profiles, eq(projectTasks.assigneeUserId, profiles.id))
      .where(whereClause)
      .orderBy(projectTasks.sortOrder, desc(projectTasks.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(projectTasks)
      .innerJoin(projects, eq(projectTasks.projectId, projects.id))
      .where(whereClause),
  ]);

  const visible = rows
    .filter((row) => canReadTask(subject, row, project))
    .map((row) => ({ ...row, capabilities: taskCapabilities(subject, row, project) }));

  return ok({ rows: visible, total: totalRow[0]?.total ?? 0 });
}

/**
 * Every task assigned to the caller, across every project — including projects
 * the caller has no scope over. This is how handed-off work is discovered.
 */
export async function listMyTasks(
  orgId: string,
  userId: string,
  q: { status?: string; search?: string },
): Promise<Result<{ rows: unknown[]; total: number }>> {
  const conditions: SQL<unknown>[] = [
    eq(projects.orgId, orgId),
    eq(projectTasks.assigneeUserId, userId),
  ];
  if (q.status) conditions.push(eq(projectTasks.status, q.status as never));
  if (q.search) {
    // Bilingual by design: a Hindi query must match the Hindi title.
    const term = `%${q.search}%`;
    const titleClause = or(ilike(projectTasks.title, term), ilike(projectTasks.titleHi, term));
    if (titleClause) conditions.push(titleClause);
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select({
      id: projectTasks.id,
      projectId: projectTasks.projectId,
      projectName: projects.name,
      projectNameHi: projects.nameHi,
      title: projectTasks.title,
      titleHi: projectTasks.titleHi,
      description: projectTasks.description,
      assigneeUserId: projectTasks.assigneeUserId,
      createdBy: projectTasks.createdBy,
      status: projectTasks.status,
      priority: projectTasks.priority,
      dueDate: projectTasks.dueDate,
      sortOrder: projectTasks.sortOrder,
      completedAt: projectTasks.completedAt,
      createdAt: projectTasks.createdAt,
    })
    .from(projectTasks)
    .innerJoin(projects, eq(projectTasks.projectId, projects.id))
    .where(whereClause)
    .orderBy(projectTasks.dueDate, desc(projectTasks.createdAt));

  // An assignee always reports their own progress; everything else about the
  // task belongs to whoever manages the project, which this view does not load.
  const withCapabilities = rows.map((row) => ({
    ...row,
    capabilities: {
      canEditDetails: row.createdBy === userId,
      canChangeStatus: true,
      canReassign: false,
      canDelete: row.createdBy === userId,
    },
  }));

  return ok({ rows: withCapabilities, total: withCapabilities.length });
}

export async function getTask(
  projectId: string,
  taskId: string,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  roleCodes: RoleCode[] = [],
): Promise<Result<unknown>> {
  const subject = await buildTaskAccessSubject(userId, roleCodes, scopedAccess, orgId);
  const project = await loadProject(projectId, orgId);
  if (!project) return err(notFound("Task not found."));

  const [row] = await db
    .select(TASK_COLUMNS)
    .from(projectTasks)
    .innerJoin(projects, eq(projectTasks.projectId, projects.id))
    .leftJoin(profiles, eq(projectTasks.assigneeUserId, profiles.id))
    .where(
      and(
        eq(projectTasks.id, taskId),
        eq(projectTasks.projectId, projectId),
        eq(projects.orgId, orgId),
      ),
    );

  if (!row) return err(notFound("Task not found."));
  if (!canReadTask(subject, row, project)) {
    return err(forbidden("You do not have access to this task."));
  }
  return ok({ ...row, capabilities: taskCapabilities(subject, row, project) });
}

export async function createTask(
  projectId: string,
  input: CreateTaskInput,
  ctx: AuthContext,
  scopedAccess: ScopedAccess,
): Promise<Result<{ id: string; title: string; status: string }>> {
  const subject = await subjectFromContext(ctx, scopedAccess);
  const project = await loadProject(projectId, ctx.session.orgId);
  if (!project) return err(notFound("Project not found."));

  if (!canCreateTask(subject, project)) {
    return err(forbidden("You do not have permission to add tasks to this project."));
  }

  if (input.assigneeUserId) {
    const assigneeError = await validateAssignee(subject, input.assigneeUserId, ctx.session.orgId);
    if (assigneeError) return err(assigneeError);
  }

  let newTask: { id: string; title: string; status: string } | undefined;
  try {
    [newTask] = await db
      .insert(projectTasks)
      .values({
        projectId,
        title: input.title,
        titleHi: input.titleHi,
        description: input.description,
        assigneeUserId: input.assigneeUserId ?? null,
        priority: input.priority ?? "medium",
        dueDate: input.dueDate ? calendarDateToInstant(input.dueDate) : null,
        sortOrder: input.sortOrder ?? 0,
        metadata: input.metadata,
        createdBy: ctx.session.userId,
      })
      .returning({ id: projectTasks.id, title: projectTasks.title, status: projectTasks.status });
  } catch (e) {
    console.error("createTask error:", e);
    return err(serverError());
  }

  if (!newTask) return err(serverError("Failed to create task."));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "task.created", actorUserId: ctx.session.userId, entityType: "task", entityId: newTask.id },
    { summary: `Task "${input.title}" created.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(newTask);
}

export async function updateTask(
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
  ctx: AuthContext,
  scopedAccess: ScopedAccess,
): Promise<Result<{ id: string; title: string; status: string }>> {
  const subject = await subjectFromContext(ctx, scopedAccess);
  const project = await loadProject(projectId, ctx.session.orgId);
  if (!project) return err(notFound("Task not found."));

  const existing = await loadTask(taskId, projectId, ctx.session.orgId);
  if (!existing) return err(notFound("Task not found."));

  // Reading the task is a precondition for changing it, and produces a 404-like
  // 403 rather than leaking that an out-of-scope task exists.
  if (!canReadTask(subject, existing, project)) {
    return err(forbidden("You do not have access to this task."));
  }

  // Each kind of change is checked against its own authority.
  const intents = classifyTaskUpdate(input as Record<string, unknown>, existing);

  if (intents.includes("status") && !canChangeTaskStatus(subject, existing, project)) {
    return err(forbidden("You do not have permission to change this task's status."));
  }
  if (intents.includes("details") && !canEditTaskDetails(subject, existing, project)) {
    return err(forbidden("You do not have permission to edit this task."));
  }
  if (intents.includes("reassign")) {
    if (!canReassignTask(subject, existing, project)) {
      return err(forbidden("You do not have permission to reassign this task."));
    }
    if (input.assigneeUserId) {
      const assigneeError = await validateAssignee(subject, input.assigneeUserId, ctx.session.orgId);
      if (assigneeError) return err(assigneeError);
    }
  }

  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) values.title = input.title;
  if (input.titleHi !== undefined) values.titleHi = input.titleHi;
  if (input.description !== undefined) values.description = input.description;
  if (input.assigneeUserId !== undefined) values.assigneeUserId = input.assigneeUserId ?? null;
  if (input.priority !== undefined) values.priority = input.priority;
  if (input.dueDate !== undefined) values.dueDate = input.dueDate ? calendarDateToInstant(input.dueDate) : null;
  if (input.sortOrder !== undefined) values.sortOrder = input.sortOrder;
  if (input.status !== undefined) {
    values.status = input.status;
    values.completedAt = input.status === "done" ? new Date() : null;
  }
  if (input.completedAt !== undefined) values.completedAt = input.completedAt ? new Date(input.completedAt) : null;
  if (input.metadata !== undefined) values.metadata = input.metadata;

  const [updated] = await db
    .update(projectTasks)
    .set(values)
    .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, projectId)))
    .returning({ id: projectTasks.id, title: projectTasks.title, status: projectTasks.status });

  if (!updated) return err(serverError("Failed to update task."));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "task.updated", actorUserId: ctx.session.userId, entityType: "task", entityId: taskId, payload: { intents } },
    { summary: `Task "${updated.title}" updated.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(updated);
}

export async function deleteTask(
  projectId: string,
  taskId: string,
  ctx: AuthContext,
  scopedAccess: ScopedAccess,
): Promise<Result<void>> {
  const subject = await subjectFromContext(ctx, scopedAccess);
  const project = await loadProject(projectId, ctx.session.orgId);
  if (!project) return err(notFound("Task not found."));

  const existing = await loadTask(taskId, projectId, ctx.session.orgId);
  if (!existing) return err(notFound("Task not found."));

  if (!canReadTask(subject, existing, project)) {
    return err(forbidden("You do not have access to this task."));
  }
  if (!canDeleteTask(subject, existing, project)) {
    return err(forbidden("You do not have permission to delete this task."));
  }

  await db
    .delete(projectTasks)
    .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, projectId)));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "task.deleted", actorUserId: ctx.session.userId, entityType: "task", entityId: taskId },
    { summary: "Task deleted.", actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(undefined);
}

// ── Dashboard aggregations ───────────────────────────────────────────────────

export async function getTaskboardData(
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  roleCodes: RoleCode[] = [],
): Promise<Result<{ projects: unknown[]; unassignedTasks: unknown[]; myTasks: unknown[] }>> {
  const subject = await buildTaskAccessSubject(userId, roleCodes, scopedAccess, orgId);

  const projectConditions: SQL<unknown>[] = [eq(projects.orgId, orgId)];
  const visibility = projectVisibilityClause(subject);
  if (visibility) projectConditions.push(visibility);

  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      nameHi: projects.nameHi,
      status: projects.status,
      ownerUserId: projects.ownerUserId,
      createdBy: projects.createdBy,
      departmentId: projects.departmentId,
      deadline: projects.deadline,
    })
    .from(projects)
    .where(and(...projectConditions))
    .orderBy(desc(projects.createdAt));

  const visibleProjects = projectRows.filter((p) => canReadProject(subject, p));
  const projectIds = visibleProjects.map((p) => p.id);

  // Task counts are only meaningful, and only authorized, for projects the user
  // actually manages. Assignee-only projects report the user's own task counts.
  const managedProjectIds = visibleProjects.filter((p) => canCreateTask(subject, p)).map((p) => p.id);

  const assigneeOnlyProjectIds = projectIds.filter((id) => !managedProjectIds.includes(id));

  const countRows = await Promise.all([
    managedProjectIds.length > 0
      ? db
          .select({ projectId: projectTasks.projectId, status: projectTasks.status, total: count() })
          .from(projectTasks)
          .where(inArray(projectTasks.projectId, managedProjectIds))
          .groupBy(projectTasks.projectId, projectTasks.status)
      : Promise.resolve([]),
    // In a project reached only through an assignment, the counts describe the
    // user's own tasks — never the rest of somebody else's board.
    assigneeOnlyProjectIds.length > 0
      ? db
          .select({ projectId: projectTasks.projectId, status: projectTasks.status, total: count() })
          .from(projectTasks)
          .where(
            and(
              inArray(projectTasks.projectId, assigneeOnlyProjectIds),
              or(eq(projectTasks.assigneeUserId, userId), eq(projectTasks.createdBy, userId)),
            ),
          )
          .groupBy(projectTasks.projectId, projectTasks.status)
      : Promise.resolve([]),
  ]);

  const countMap: Record<string, { todo: number; in_progress: number; done: number; blocked: number }> = {};
  for (const tc of countRows.flat()) {
    countMap[tc.projectId] ??= { todo: 0, in_progress: 0, done: 0, blocked: 0 };
    countMap[tc.projectId][tc.status as keyof typeof countMap[string]] = tc.total;
  }

  const projectsWithCounts = visibleProjects.map((p) => ({
    ...p,
    canManage: canCreateTask(subject, p),
    taskCounts: countMap[p.id] ?? { todo: 0, in_progress: 0, done: 0, blocked: 0 },
  }));

  // Unassigned work is a staffing prompt — only for projects the user manages.
  const unassignedTasks = managedProjectIds.length > 0
    ? await db
        .select({
          id: projectTasks.id,
          projectId: projectTasks.projectId,
          projectName: projects.name,
          title: projectTasks.title,
          titleHi: projectTasks.titleHi,
          description: projectTasks.description,
          assigneeUserId: projectTasks.assigneeUserId,
          assigneeName: profiles.displayName,
          status: projectTasks.status,
          priority: projectTasks.priority,
          dueDate: projectTasks.dueDate,
          sortOrder: projectTasks.sortOrder,
          completedAt: projectTasks.completedAt,
          createdAt: projectTasks.createdAt,
        })
        .from(projectTasks)
        .innerJoin(projects, eq(projectTasks.projectId, projects.id))
        .leftJoin(profiles, eq(projectTasks.assigneeUserId, profiles.id))
        .where(
          and(
            inArray(projectTasks.projectId, managedProjectIds),
            isNull(projectTasks.assigneeUserId),
          ),
        )
        .orderBy(projectTasks.sortOrder, desc(projectTasks.createdAt))
    : [];

  const myTasksResult = await listMyTasks(orgId, userId, {});

  return ok({
    projects: projectsWithCounts,
    unassignedTasks,
    myTasks: myTasksResult.ok ? myTasksResult.data.rows : [],
  });
}

// ── Reminders ────────────────────────────────────────────────────────────────

/**
 * Task and event rows the user is entitled to be reminded about. Both the rows
 * and the counts derived from them come from this one authorized query, so the
 * counts cannot reveal records the list withholds.
 */
export async function listReminderTasks(
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  roleCodes: RoleCode[] = [],
): Promise<Array<{
  id: string;
  projectId: string;
  title: string;
  titleHi: string | null;
  dueDate: Date | string | null;
  status: string;
}>> {
  const subject = await buildTaskAccessSubject(userId, roleCodes, scopedAccess, orgId);

  const conditions: SQL<unknown>[] = [
    eq(projects.orgId, orgId),
    isNotNull(projectTasks.dueDate),
    ne(projectTasks.status, "done"),
  ];

  if (!subject.scope.orgWide) {
    const reach: SQL<unknown>[] = [
      eq(projectTasks.assigneeUserId, userId),
      eq(projectTasks.createdBy, userId),
      eq(projects.createdBy, userId),
      eq(projects.ownerUserId, userId),
    ];
    if (subject.scope.departmentIds.size > 0) {
      reach.push(inArray(projects.departmentId, [...subject.scope.departmentIds]));
    }
    const reachClause = or(...reach);
    if (reachClause) conditions.push(reachClause);
  }

  const rows = await db
    .select({
      id: projectTasks.id,
      projectId: projectTasks.projectId,
      title: projectTasks.title,
      titleHi: projectTasks.titleHi,
      dueDate: projectTasks.dueDate,
      status: projectTasks.status,
      assigneeUserId: projectTasks.assigneeUserId,
      createdBy: projectTasks.createdBy,
      projectDepartmentId: projects.departmentId,
      projectCreatedBy: projects.createdBy,
      projectOwnerUserId: projects.ownerUserId,
    })
    .from(projectTasks)
    .innerJoin(projects, eq(projectTasks.projectId, projects.id))
    .where(and(...conditions));

  return rows
    .filter((row) =>
      canReadTask(
        subject,
        row,
        {
          id: row.projectId,
          departmentId: row.projectDepartmentId,
          createdBy: row.projectCreatedBy,
          ownerUserId: row.projectOwnerUserId,
        },
      ),
    )
    .map((row) => ({
      id: row.id,
      projectId: row.projectId,
      title: row.title,
      titleHi: row.titleHi,
      dueDate: row.dueDate,
      status: row.status,
    }));
}
