import { pgTable, uuid, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { orgSettings } from "./org";
import { profiles } from "./users";

export const vimarshThreads = pgTable(
  "vimarsh_threads",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 180 }).notNull().unique(),
    title: varchar("title", { length: 300 }).notNull(),
    titleHi: varchar("title_hi", { length: 300 }).notNull(),
    body: text("body").notNull().default(""),
    bodyHi: text("body_hi").notNull().default(""),
    category: varchar("category", { length: 64 }).notNull().default("General"),
    authorUserId: uuid("author_user_id").references(() => profiles.id, { onDelete: "set null" }),
    isPinned: boolean("is_pinned").notNull().default(false),
    isClosed: boolean("is_closed").notNull().default(false),
    replyCount: integer("reply_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("vimarsh_threads_org_idx").on(t.orgId),
    index("vimarsh_threads_category_idx").on(t.category),
    index("vimarsh_threads_created_at_idx").on(t.createdAt),
  ]
);

export const vimarshThreadReplies = pgTable(
  "vimarsh_thread_replies",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").notNull().references(() => vimarshThreads.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id").references(() => profiles.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("vimarsh_replies_thread_idx").on(t.threadId),
    index("vimarsh_replies_org_idx").on(t.orgId),
  ]
);

export const vimarshThreadsRelations = relations(vimarshThreads, ({ one, many }) => ({
  org: one(orgSettings, { fields: [vimarshThreads.orgId], references: [orgSettings.id] }),
  author: one(profiles, { fields: [vimarshThreads.authorUserId], references: [profiles.id] }),
  replies: many(vimarshThreadReplies),
}));

export const vimarshThreadRepliesRelations = relations(vimarshThreadReplies, ({ one }) => ({
  thread: one(vimarshThreads, { fields: [vimarshThreadReplies.threadId], references: [vimarshThreads.id] }),
  author: one(profiles, { fields: [vimarshThreadReplies.authorUserId], references: [profiles.id] }),
}));
