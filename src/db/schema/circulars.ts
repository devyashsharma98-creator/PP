import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { circularPriorityEnum, circularScopeEnum } from "./enums";
import { orgSettings, units, departmentsOrAayams } from "./org";
import { profiles } from "./users";

export const circulars = pgTable(
  "circulars",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    body: text("body").notNull(),
    bodyHi: text("body_hi"),
    priority: circularPriorityEnum("priority").notNull().default("normal"),
    scope: circularScopeEnum("scope").notNull().default("org"),
    scopeEntityId: uuid("scope_entity_id"),
    authorUserId: uuid("author_user_id").notNull().references(() => profiles.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("circulars_org_idx").on(t.orgId),
    index("circulars_priority_idx").on(t.priority),
    index("circulars_published_at_idx").on(t.publishedAt),
  ]
);

export const circularReads = pgTable(
  "circular_reads",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    circularId: uuid("circular_id").notNull().references(() => circulars.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("circular_reads_circular_idx").on(t.circularId),
    index("circular_reads_user_idx").on(t.userId),
  ]
);

export const circularsRelations = relations(circulars, ({ one, many }) => ({
  org: one(orgSettings, { fields: [circulars.orgId], references: [orgSettings.id] }),
  author: one(profiles, { fields: [circulars.authorUserId], references: [profiles.id] }),
  unit: one(units, { fields: [circulars.scopeEntityId], references: [units.id] }),
  department: one(departmentsOrAayams, { fields: [circulars.scopeEntityId], references: [departmentsOrAayams.id] }),
  reads: many(circularReads),
}));

export const circularReadsRelations = relations(circularReads, ({ one }) => ({
  circular: one(circulars, { fields: [circularReads.circularId], references: [circulars.id] }),
  user: one(profiles, { fields: [circularReads.userId], references: [profiles.id] }),
}));
