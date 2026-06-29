/**
 * Pragya Pravah — Campus Ikai Workflows Schema
 *
 * Turns the campus-unit registry into an engagement system:
 *   campus_study_circles         — scheduled study circles per unit
 *   campus_outreach_log          — record of outreach conducted at a unit
 *   campus_resource_distribution — resources distributed to a unit
 *
 * Together these feed a per-unit activation score.
 */
import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { orgSettings } from "./org";
import { profiles } from "./users";
import { campusUnits } from "./campus";

// ── campus_study_circles ─────────────────────────────────────────────────────
export const campusStudyCircles = pgTable(
  "campus_study_circles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id").notNull().references(() => campusUnits.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    description: text("description"),
    // weekly | biweekly | monthly | one_time
    frequency: varchar("frequency", { length: 16 }).notNull().default("one_time"),
    scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
    scheduledTime: varchar("scheduled_time", { length: 16 }),
    assignedTo: uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
    readingMaterial: text("reading_material"),
    topic: varchar("topic", { length: 512 }),
    completed: boolean("completed").notNull().default(false),
    attendance: integer("attendance"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("study_circles_unit_idx").on(t.unitId),
    index("study_circles_org_idx").on(t.orgId),
    index("study_circles_date_idx").on(t.scheduledDate),
  ]
);

// ── campus_outreach_log ──────────────────────────────────────────────────────
export const campusOutreachLog = pgTable(
  "campus_outreach_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id").notNull().references(() => campusUnits.id, { onDelete: "cascade" }),
    // seminar | lecture | workshop | book_discussion
    outreachType: varchar("outreach_type", { length: 24 }).notNull(),
    title: varchar("title", { length: 512 }).notNull(),
    conductedBy: varchar("conducted_by", { length: 256 }),
    conductedDate: timestamp("conducted_date", { withTimezone: true }).notNull(),
    attendance: integer("attendance"),
    followUpNeeded: boolean("follow_up_needed").notNull().default(false),
    nextPlannedDate: timestamp("next_planned_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("campus_outreach_unit_idx").on(t.unitId),
    index("campus_outreach_org_idx").on(t.orgId),
    index("campus_outreach_date_idx").on(t.conductedDate),
  ]
);

// ── campus_resource_distribution ─────────────────────────────────────────────
export const campusResourceDistribution = pgTable(
  "campus_resource_distribution",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id").notNull().references(() => campusUnits.id, { onDelete: "cascade" }),
    // book | journal | digital | study_material
    resourceType: varchar("resource_type", { length: 24 }).notNull(),
    resourceRefId: uuid("resource_ref_id"),
    resourceName: varchar("resource_name", { length: 512 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    distributedBy: uuid("distributed_by").references(() => profiles.id, { onDelete: "set null" }),
    distributedAt: timestamp("distributed_at", { withTimezone: true }).notNull().default(sql`now()`),
    feedbackReceived: boolean("feedback_received").notNull().default(false),
    feedbackNotes: text("feedback_notes"),
  },
  (t) => [
    index("campus_resources_unit_idx").on(t.unitId),
    index("campus_resources_org_idx").on(t.orgId),
  ]
);

// ── Relations ────────────────────────────────────────────────────────────────
export const campusStudyCirclesRelations = relations(campusStudyCircles, ({ one }) => ({
  unit: one(campusUnits, { fields: [campusStudyCircles.unitId], references: [campusUnits.id] }),
}));
export const campusOutreachLogRelations = relations(campusOutreachLog, ({ one }) => ({
  unit: one(campusUnits, { fields: [campusOutreachLog.unitId], references: [campusUnits.id] }),
}));
export const campusResourceDistributionRelations = relations(campusResourceDistribution, ({ one }) => ({
  unit: one(campusUnits, { fields: [campusResourceDistribution.unitId], references: [campusUnits.id] }),
}));
