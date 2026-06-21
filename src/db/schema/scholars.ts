import { pgTable, uuid, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { orgSettings } from "./org";
import { profiles } from "./users";

export const scholars = pgTable(
  "scholars",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    name: varchar("name", { length: 256 }).notNull(),
    nameHi: varchar("name_hi", { length: 256 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 32 }),
    expertise: text("expertise").array().notNull().default(sql`'{}'::text[]`),
    affiliation: varchar("affiliation", { length: 256 }),
    affiliationHi: varchar("affiliation_hi", { length: 256 }),
    designation: varchar("designation", { length: 128 }),
    city: varchar("city", { length: 128 }),
    bio: text("bio").notNull().default(""),
    bioHi: text("bio_hi").notNull().default(""),
    availableFor: text("available_for").array().notNull().default(sql`'{}'::text[]`),
    photoUrl: text("photo_url"),
    linkedProfileId: uuid("linked_profile_id").references(() => profiles.id, { onDelete: "set null" }),
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("scholars_org_idx").on(t.orgId),
    index("scholars_published_idx").on(t.isPublished),
    index("scholars_sort_idx").on(t.sortOrder),
  ]
);

export const scholarsRelations = relations(scholars, ({ one }) => ({
  org: one(orgSettings, { fields: [scholars.orgId], references: [orgSettings.id] }),
  linkedProfile: one(profiles, { fields: [scholars.linkedProfileId], references: [profiles.id] }),
}));
