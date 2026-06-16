import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { projectStatusEnum, taskStatusEnum, taskPriorityEnum } from "./enums";
import { orgSettings, departmentsOrAayams } from "./org";
import { profiles } from "./users";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 512 }).notNull(),
    nameHi: varchar("name_hi", { length: 512 }),
    description: text("description"),
    departmentId: uuid("department_id").references(() => departmentsOrAayams.id, { onDelete: "set null" }),
    status: projectStatusEnum("status").notNull().default("planned"),
    ownerUserId: uuid("owner_user_id").references(() => profiles.id, { onDelete: "set null" }),
    deadline: timestamp("deadline", { withTimezone: true }),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("projects_org_idx").on(t.orgId),
    index("projects_status_idx").on(t.status),
  ]
);

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    description: text("description"),
    assigneeUserId: uuid("assignee_user_id").references(() => profiles.id, { onDelete: "set null" }),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("project_tasks_project_idx").on(t.projectId),
    index("project_tasks_status_idx").on(t.status),
    index("project_tasks_assignee_idx").on(t.assigneeUserId),
  ]
);

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    taskId: uuid("task_id").notNull().references(() => projectTasks.id, { onDelete: "cascade" }),
    dependsOnTaskId: uuid("depends_on_task_id").notNull().references(() => projectTasks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("task_dependencies_task_idx").on(t.taskId),
    index("task_dependencies_depends_idx").on(t.dependsOnTaskId),
  ]
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  org: one(orgSettings, { fields: [projects.orgId], references: [orgSettings.id] }),
  department: one(departmentsOrAayams, { fields: [projects.departmentId], references: [departmentsOrAayams.id] }),
  owner: one(profiles, { fields: [projects.ownerUserId], references: [profiles.id] }),
  creator: one(profiles, { fields: [projects.createdBy], references: [profiles.id] }),
  tasks: many(projectTasks),
}));

export const projectTasksRelations = relations(projectTasks, ({ one, many }) => ({
  project: one(projects, { fields: [projectTasks.projectId], references: [projects.id] }),
  assignee: one(profiles, { fields: [projectTasks.assigneeUserId], references: [profiles.id] }),
  creator: one(profiles, { fields: [projectTasks.createdBy], references: [profiles.id] }),
  dependencies: many(taskDependencies),
}));

export const taskDependenciesRelations = relations(taskDependencies, ({ one }) => ({
  task: one(projectTasks, { fields: [taskDependencies.taskId], references: [projectTasks.id], relationName: "task" }),
  dependsOn: one(projectTasks, { fields: [taskDependencies.dependsOnTaskId], references: [projectTasks.id], relationName: "dependsOn" }),
}));
