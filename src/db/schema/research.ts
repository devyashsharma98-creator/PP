/**
 * Pragya Pravah — Shodh (Research) Schema
 *
 * Tracks the research lifecycle that neither "events" nor "articles" capture:
 * civilisational studies, geopolitics, history, philosophy, Sanskrit sciences.
 *
 *   research_projects    — A research project with a lead, team, and timeline.
 *   research_milestones  — Weighted milestones that roll up into project progress.
 *
 * Projects are vishay-taggable via content_vishaya_map (contentType "project").
 */
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { orgSettings } from "./org";
import { profiles } from "./users";
import { scholars } from "./scholars";

// ── research_projects ────────────────────────────────────────────────────────
export const researchProjects = pgTable(
  "research_projects",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    objective: text("objective"),
    objectiveHi: text("objective_hi"),
    methodology: text("methodology"),
    methodologyHi: text("methodology_hi"),

    // proposed | active | under_review | completed | published
    status: varchar("status", { length: 24 }).notNull().default("proposed"),

    leadResearcherId: uuid("lead_researcher_id").references(() => scholars.id, { onDelete: "set null" }),
    teamIds: jsonb("team_ids").$type<string[]>(),

    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    budget: varchar("budget", { length: 128 }),

    expectedOutputs: jsonb("expected_outputs"),
    actualOutputs: jsonb("actual_outputs"),
    progress: integer("progress").notNull().default(0), // 0-100, derived from milestones

    submittedBy: uuid("submitted_by").references(() => profiles.id, { onDelete: "set null" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().default(sql`now()`),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewComment: text("review_comment"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("research_org_idx").on(t.orgId),
    index("research_status_idx").on(t.status),
    index("research_lead_idx").on(t.leadResearcherId),
  ]
);

// ── research_milestones ──────────────────────────────────────────────────────
export const researchMilestones = pgTable(
  "research_milestones",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull().references(() => researchProjects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    weight: integer("weight").notNull().default(0), // % of project
    // report | article | presentation | data
    deliverableType: varchar("deliverable_type", { length: 24 }),
    deliverableUrl: varchar("deliverable_url", { length: 2048 }),
    // pending | in_progress | completed
    status: varchar("status", { length: 24 }).notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("milestones_project_idx").on(t.projectId),
    index("milestones_org_idx").on(t.orgId),
  ]
);

// ── Relations ────────────────────────────────────────────────────────────────
export const researchProjectsRelations = relations(researchProjects, ({ one, many }) => ({
  org: one(orgSettings, { fields: [researchProjects.orgId], references: [orgSettings.id] }),
  lead: one(scholars, { fields: [researchProjects.leadResearcherId], references: [scholars.id] }),
  milestones: many(researchMilestones),
}));

export const researchMilestonesRelations = relations(researchMilestones, ({ one }) => ({
  project: one(researchProjects, { fields: [researchMilestones.projectId], references: [researchProjects.id] }),
}));
