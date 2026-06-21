import { pgTable, uuid, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { orgSettings } from "./org";

export const campusUnits = pgTable(
  "campus_units",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    name: varchar("name", { length: 256 }).notNull(),
    nameHi: varchar("name_hi", { length: 256 }).notNull(),
    unitType: varchar("unit_type", { length: 48 }).notNull().default("College"),
    city: varchar("city", { length: 128 }),
    state: varchar("state", { length: 128 }),
    coordinatorName: varchar("coordinator_name", { length: 256 }),
    coordinatorNameHi: varchar("coordinator_name_hi", { length: 256 }),
    coordinatorEmail: varchar("coordinator_email", { length: 320 }),
    coordinatorPhone: varchar("coordinator_phone", { length: 32 }),
    memberCount: integer("member_count").notNull().default(0),
    status: varchar("status", { length: 32 }).notNull().default("Active"),
    focusAreas: text("focus_areas").array().notNull().default(sql`'{}'::text[]`),
    establishedYear: varchar("established_year", { length: 16 }),
    description: text("description").notNull().default(""),
    descriptionHi: text("description_hi").notNull().default(""),
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("campus_units_org_idx").on(t.orgId),
    index("campus_units_status_idx").on(t.status),
    index("campus_units_sort_idx").on(t.sortOrder),
  ]
);

export const campusUnitsRelations = relations(campusUnits, ({ one }) => ({
  org: one(orgSettings, { fields: [campusUnits.orgId], references: [orgSettings.id] }),
}));
