/**
 * Pragya Pravah — Vishay (विषय) Taxonomy Schema
 *
 * A living subject-area taxonomy that connects content across modules:
 * articles (aalekh), events (calendar), scholars (vidvat mandal),
 * research projects (shodh), campus units (ikai), and publications (prakashan).
 *
 *   vishayas             — Master subject-area list (hierarchical, bilingual)
 *   content_vishaya_map  — Polymorphic many-to-many link between a vishay and
 *                          any taggable content row across the application.
 */
import { pgTable, uuid, varchar, text, timestamp, integer, boolean, index, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { orgSettings } from "./org";
import { profiles } from "./users";

// ── vishayas ────────────────────────────────────────────────────────────────
// Subject areas (e.g. Political Science, Economics, History). Supports a simple
// one-level hierarchy via parentVishayId so sub-areas can roll up to a parent.
export const vishayas = pgTable(
  "vishayas",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 160 }).notNull(),
    nameEn: varchar("name_en", { length: 256 }).notNull(),
    nameHi: varchar("name_hi", { length: 256 }).notNull(),
    description: text("description"),
    descriptionHi: text("description_hi"),
    // Self-reference for sub-vishayas. Nullable = top-level.
    parentVishayId: uuid("parent_vishay_id"),
    // UI accent colour token key (see VISHAYA_COLORS in the page component).
    color: varchar("color", { length: 32 }).notNull().default("slate"),
    // Lucide icon name resolved client-side (see VISHAYA_ICONS).
    icon: varchar("icon", { length: 48 }).notNull().default("Hash"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    unique("vishayas_org_slug_uq").on(t.orgId, t.slug),
    index("vishayas_org_idx").on(t.orgId),
    index("vishayas_parent_idx").on(t.parentVishayId),
    index("vishayas_sort_idx").on(t.sortOrder),
  ]
);

// ── content_vishaya_map ─────────────────────────────────────────────────────
// Links a vishay to any content row. contentType identifies the source module.
export const contentVishayaMap = pgTable(
  "content_vishaya_map",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    vishayId: uuid("vishay_id")
      .notNull()
      .references(() => vishayas.id, { onDelete: "cascade" }),
    // 'article' | 'event' | 'scholar' | 'project' | 'unit' | 'publication' | 'thread'
    contentType: varchar("content_type", { length: 32 }).notNull(),
    contentId: uuid("content_id").notNull(),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    unique("cvm_unique_link").on(t.vishayId, t.contentType, t.contentId),
    index("cvm_content_idx").on(t.contentType, t.contentId),
    index("cvm_vishay_idx").on(t.vishayId),
    index("cvm_org_idx").on(t.orgId),
  ]
);

// ── Relations ───────────────────────────────────────────────────────────────
export const vishayasRelations = relations(vishayas, ({ one, many }) => ({
  org: one(orgSettings, { fields: [vishayas.orgId], references: [orgSettings.id] }),
  parent: one(vishayas, {
    fields: [vishayas.parentVishayId],
    references: [vishayas.id],
    relationName: "vishaya_parent",
  }),
  children: many(vishayas, { relationName: "vishaya_parent" }),
  links: many(contentVishayaMap),
}));

export const contentVishayaMapRelations = relations(contentVishayaMap, ({ one }) => ({
  vishay: one(vishayas, { fields: [contentVishayaMap.vishayId], references: [vishayas.id] }),
  org: one(orgSettings, { fields: [contentVishayaMap.orgId], references: [orgSettings.id] }),
}));
