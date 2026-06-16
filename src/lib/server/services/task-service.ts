import "server-only";

import { NextResponse } from "next/server";
import { and, eq, ilike, count, desc, inArray, or, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { projects, projectTasks, taskDependencies } from "@/db/schema/index";
import { auditAndActivity } from "@/lib/audit";
import type { ScopedAccess } from "@/lib/app/scope";
import type { AuthContext } from "@/lib/middleware/with-auth";
import type { CreateProjectInput, UpdateProjectInput, ListProjectsQuery, CreateTaskInput, UpdateTaskInput, ListTasksQuery } from "@/lib/validators/tasks";
import {
  apiSuccess, apiCreated, badRequest, forbidden, serverError, notFound,
} from "@/lib/response";

type Result<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function err(response: NextResponse): Result<never> { return { ok: false, response }; }

// ── Projects ─────────────────────────────────────────────────────────────────

export async function listProjects(
  q: ListProjectsQuery,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  page: number,
  limit: number,
  offset: number,
): Promise<Result<{ rows: unknown[]; total: number }>> {
  const conditions: SQL<unknown>[] = [eq(projects.orgId, orgId)];
  if (q.status) conditions.push(eq(projects.status, q.status));
  if (q.departmentId) conditions.push(eq(projects.departmentId, q.departmentId));
  if (q.search) conditions.push(ilike(projects.name, `%${q.search}%`));

  if (!scopedAccess.orgWide) {
    const scopeConditions: SQL<unknown>[] = [eq(projects.createdBy, userId), eq(projects.ownerUserId, userId)];
    if (scopedAccess.departmentIds.size > 0) scopeConditions.push(inArray(projects.departmentId, [...scopedAccess.departmentIds]));
    const scopeClause = or(...scopeConditions);
    if (scopeClause) conditions.push(scopeClause);
  }

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

  return ok({ rows, total: totalRow[0]?.total ?? 0 });
}

export async function getProject(
  projectId: string,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
): Promise<Result<unknown>> {
  const [row] = await db
    .select({
      id: projects.id,
      name: projects.name,
      nameHi: projects.nameHi,
      description: projects.description,
      departmentId: projects.departmentId,
      status: projects.status,
      ownerUserId: projects.ownerUserId,
      deadline: projects.deadline,
      creatorName: profiles.displayName,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
    .leftJoin(profiles, eq(projects.createdBy, profiles.id));

  if (!row) return err(notFound("Project not found."));
  return ok(row);
}

import { profiles } from "@/db/schema/index";

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
        deadline: input.deadline ? new Date(input.deadline) : undefined,
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
): Promise<Result<{ id: string; name: string; status: string }>> {
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.session.orgId)));

  if (!existing) return err(notFound("Project not found."));

  const [updated] = await db
    .update(projects)
    .set({
      ...input,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning({ id: projects.id, name: projects.name, status: projects.status });

  if (!updated) return err(serverError("Failed to update project."));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "project.updated", actorUserId: ctx.session.userId, entityType: "project", entityId: projectId },
    { summary: `Project "${updated.name}" updated.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(updated);
}

export async function deleteProject(
  projectId: string,
  ctx: AuthContext,
): Promise<Result<void>> {
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.session.orgId)));

  if (!existing) return err(notFound("Project not found."));

  await db.delete(projects).where(eq(projects.id, projectId));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "project.deleted", actorUserId: ctx.session.userId, entityType: "project", entityId: projectId },
    { summary: "Project deleted.", actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(undefined);
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function listTasks(
  projectId: string,
  q: ListTasksQuery,
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  page: number,
  limit: number,
  offset: number,
): Promise<Result<{ rows: unknown[]; total: number }>> {
  const conditions: SQL<unknown>[] = [
    eq(projectTasks.projectId, projectId),
    eq(projects.orgId, orgId),
  ];

  if (q.status) conditions.push(eq(projectTasks.status, q.status));
  if (q.priority) conditions.push(eq(projectTasks.priority, q.priority));
  if (q.assigneeUserId) conditions.push(eq(projectTasks.assigneeUserId, q.assigneeUserId));
  if (q.search) conditions.push(ilike(projectTasks.title, `%${q.search}%`));

  if (!scopedAccess.orgWide) {
    const scopeConditions: SQL<unknown>[] = [eq(projectTasks.createdBy, userId), eq(projectTasks.assigneeUserId, userId)];
    const scopeClause = or(...scopeConditions);
    if (scopeClause) conditions.push(scopeClause);
  }

  const whereClause = and(...conditions);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: projectTasks.id,
        projectId: projectTasks.projectId,
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
      .where(whereClause)
      .orderBy(projectTasks.sortOrder, desc(projectTasks.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(projectTasks).innerJoin(projects, eq(projectTasks.projectId, projects.id)).where(whereClause),
  ]);

  return ok({ rows, total: totalRow[0]?.total ?? 0 });
}

export async function createTask(
  projectId: string,
  input: CreateTaskInput,
  ctx: AuthContext,
): Promise<Result<{ id: string; title: string; status: string }>> {
  let newTask: { id: string; title: string; status: string } | undefined;
  try {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.session.orgId)));

    if (!project) return err(notFound("Project not found."));

    [newTask] = await db
      .insert(projectTasks)
      .values({
        projectId,
        title: input.title,
        titleHi: input.titleHi,
        description: input.description,
        assigneeUserId: input.assigneeUserId,
        priority: input.priority ?? "medium",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        sortOrder: input.sortOrder ?? 0,
        metadata: input.metadata,
        createdBy: ctx.session.userId,
      })
      .returning({ id: projectTasks.id, title: projectTasks.title, status: projectTasks.status });

    if (!newTask) return err(serverError("Failed to create task."));
  } catch (e) {
    console.error("createTask error:", e);
    return err(serverError());
  }

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
): Promise<Result<{ id: string; title: string; status: string }>> {
  const [existing] = await db
    .select({ id: projectTasks.id })
    .from(projectTasks)
    .innerJoin(projects, eq(projectTasks.projectId, projects.id))
    .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, projectId), eq(projects.orgId, ctx.session.orgId)));

  if (!existing) return err(notFound("Task not found."));

  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) values.title = input.title;
  if (input.titleHi !== undefined) values.titleHi = input.titleHi;
  if (input.description !== undefined) values.description = input.description;
  if (input.assigneeUserId !== undefined) values.assigneeUserId = input.assigneeUserId;
  if (input.priority !== undefined) values.priority = input.priority;
  if (input.dueDate !== undefined) values.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.sortOrder !== undefined) values.sortOrder = input.sortOrder;
  if (input.status !== undefined) {
    values.status = input.status;
    if (input.status === "done") values.completedAt = new Date();
    if (input.status !== "done") values.completedAt = null;
  }
  if (input.completedAt !== undefined) values.completedAt = input.completedAt ? new Date(input.completedAt) : null;
  if (input.metadata !== undefined) values.metadata = input.metadata;

  const [updated] = await db
    .update(projectTasks)
    .set(values)
    .where(eq(projectTasks.id, taskId))
    .returning({ id: projectTasks.id, title: projectTasks.title, status: projectTasks.status });

  if (!updated) return err(serverError("Failed to update task."));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "task.updated", actorUserId: ctx.session.userId, entityType: "task", entityId: taskId },
    { summary: `Task "${updated.title}" updated.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(updated);
}

export async function deleteTask(
  projectId: string,
  taskId: string,
  ctx: AuthContext,
): Promise<Result<void>> {
  const [existing] = await db
    .select({ id: projectTasks.id })
    .from(projectTasks)
    .innerJoin(projects, eq(projectTasks.projectId, projects.id))
    .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, projectId), eq(projects.orgId, ctx.session.orgId)));

  if (!existing) return err(notFound("Task not found."));

  await db.delete(projectTasks).where(eq(projectTasks.id, taskId));

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
): Promise<Result<{ projects: unknown[]; unassignedTasks: unknown[] }>> {
  const projectConditions: SQL<unknown>[] = [
    eq(projects.orgId, orgId),
  ];

  if (!scopedAccess.orgWide) {
    const scopeConditions: SQL<unknown>[] = [eq(projects.createdBy, userId), eq(projects.ownerUserId, userId)];
    if (scopedAccess.departmentIds.size > 0) scopeConditions.push(inArray(projects.departmentId, [...scopedAccess.departmentIds]));
    const scopeClause = or(...scopeConditions);
    if (scopeClause) projectConditions.push(scopeClause);
  }

  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      nameHi: projects.nameHi,
      status: projects.status,
      ownerUserId: projects.ownerUserId,
      deadline: projects.deadline,
    })
    .from(projects)
    .where(and(...projectConditions))
    .orderBy(desc(projects.createdAt));

  const projectIds = projectRows.map((p) => p.id);

  const taskCounts = projectIds.length > 0
    ? await db
        .select({
          projectId: projectTasks.projectId,
          status: projectTasks.status,
          total: count(),
        })
        .from(projectTasks)
        .where(inArray(projectTasks.projectId, projectIds))
        .groupBy(projectTasks.projectId, projectTasks.status)
    : [];

  const countMap: Record<string, { todo: number; in_progress: number; done: number; blocked: number }> = {};
  for (const tc of taskCounts) {
    if (!countMap[tc.projectId]) countMap[tc.projectId] = { todo: 0, in_progress: 0, done: 0, blocked: 0 };
    countMap[tc.projectId][tc.status as keyof typeof countMap[string]] = tc.total;
  }

  const projectsWithCounts = projectRows.map((p) => ({
    ...p,
    taskCounts: countMap[p.id] ?? { todo: 0, in_progress: 0, done: 0, blocked: 0 },
  }));

  return ok({ projects: projectsWithCounts, unassignedTasks: [] });
}
