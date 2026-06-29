/**
 * Pragya Pravah — Prachar (Academic Outreach) Schema
 *
 * Replaces the old social-media campaign tracker. Prajna Pravah's "prachar" is
 * scholarly outreach: distributing journals, running conferences/seminars,
 * campus programmes, and newsletters — not WhatsApp/Facebook post tracking.
 *
 *   outreach_items        — One outreach task (a journal distribution, a
 *                           conference push, a campus follow-up, etc.)
 *   outreach_type_config  — Per-type bilingual labels + field definitions,
 *                           seeded from src/lib/app/outreach-types.ts.
 */
import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { orgSettings, units, departmentsOrAayams } from "./org";
import { profiles } from "./users";

// ── outreach_items ──────────────────────────────────────────────────────────
export const outreachItems = pgTable(
  "outreach_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),

    // What kind of outreach: journal | conference | campus | newsletter | seminar
    outreachType: varchar("outreach_type", { length: 32 }).notNull(),

    // Optional link to the originating content (event/article/publication).
    relatedType: varchar("related_type", { length: 32 }), // event | article | publication | conference
    relatedId: uuid("related_id"),

    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),

    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departmentsOrAayams.id, { onDelete: "set null" }),

    // pending | in_progress | completed | skipped
    status: varchar("status", { length: 24 }).notNull().default("pending"),

    assignedTo: uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    skipReason: varchar("skip_reason", { length: 512 }),
    templateReference: varchar("template_reference", { length: 256 }),

    // Type-specific fields (issueName, venue, distributionList, etc.)
    metadata: jsonb("metadata"),

    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("outreach_org_idx").on(t.orgId),
    index("outreach_type_idx").on(t.outreachType),
    index("outreach_status_idx").on(t.status),
    index("outreach_related_idx").on(t.relatedType, t.relatedId),
    index("outreach_due_idx").on(t.dueDate),
  ]
);

// ── outreach_type_config ────────────────────────────────────────────────────
export const outreachTypeConfig = pgTable("outreach_type_config", {
  type: varchar("type", { length: 32 }).primaryKey(),
  orgId: uuid("org_id").references(() => orgSettings.id, { onDelete: "cascade" }),
  labelEn: varchar("label_en", { length: 128 }).notNull(),
  labelHi: varchar("label_hi", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 48 }),
  color: varchar("color", { length: 32 }),
  // Field definitions: [{ key, labelEn, labelHi, type, required, options? }]
  fields: jsonb("fields").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ── Relations ───────────────────────────────────────────────────────────────
export const outreachItemsRelations = relations(outreachItems, ({ one }) => ({
  org: one(orgSettings, { fields: [outreachItems.orgId], references: [orgSettings.id] }),
  unit: one(units, { fields: [outreachItems.unitId], references: [units.id] }),
  department: one(departmentsOrAayams, { fields: [outreachItems.departmentId], references: [departmentsOrAayams.id] }),
  assignee: one(profiles, { fields: [outreachItems.assignedTo], references: [profiles.id] }),
}));
