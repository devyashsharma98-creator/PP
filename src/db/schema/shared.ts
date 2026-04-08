/**
 * Pragya Pravah — Shared / Cross-Cutting Schema
 *
 * Tables used across multiple modules:
 *   prachar_statuses   — Social media outreach tracking per event/article
 *   vimarsh_topics     — Discourse topic library (Vimarsh Aayam)
 *   vimarsh_resources  — Resources linked to discourse topics
 *   tags / entity_tags — Flexible tagging system
 *   comments           — Threaded comments on any entity
 *   attachments        — File references (stored externally)
 *   notifications      — User notification inbox
 *   activity_stream    — Public activity feed
 *   audit_logs         — Immutable security audit trail
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import {
  pracharPlatform,
  attachmentVisibility,
  commentVisibility,
  notificationKind,
} from "./enums";
import { orgSettings, units } from "./org";
import { profiles } from "./users";
import { events } from "./events";
import { articles } from "./articles";

// ── prachar_statuses ──────────────────────────────────────────────────────────
// Tracks which social/messaging platforms have distributed a given event/article.
// Aayam Pramukh updates these; Vibhag Pramukh can review.
export const pracharStatuses = pgTable(
  "prachar_statuses",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 32 }).notNull(), // "event" | "article"
    entityId: uuid("entity_id").notNull(),
    platform: pracharPlatform("platform").notNull(),
    isDone: boolean("is_done").notNull().default(false),
    skipReason: varchar("skip_reason", { length: 512 }),
    templateRef: varchar("template_ref", { length: 256 }), // reference to message template used
    doneAt: timestamp("done_at", { withTimezone: true }),
    doneBy: uuid("done_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("ps_entity_idx").on(t.entityType, t.entityId),
    index("ps_org_idx").on(t.orgId),
  ]
);

// ── vimarsh_topics ────────────────────────────────────────────────────────────
// Discourse topics maintained by the Vimarsh Aayam.
// Structured around Atma Bodh (self-awareness), counter-narratives, etc.
export const vimarshTopics = pgTable(
  "vimarsh_topics",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    description: text("description"),
    descriptionHi: text("description_hi"),
    // Grouping: atma_bodh | forces_of_division | targeted_groups | targeted_regions | other
    group: varchar("group", { length: 64 }).notNull().default("other"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("vt_org_idx").on(t.orgId)]
);

// ── vimarsh_resources ─────────────────────────────────────────────────────────
// Resources (articles, videos, PDFs) linked to Vimarsh topics
export const vimarshResources = pgTable(
  "vimarsh_resources",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => vimarshTopics.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    url: varchar("url", { length: 2048 }).notNull(),
    // resource_type: article | video | pdf | audio | external_link
    resourceType: varchar("resource_type", { length: 32 }).notNull().default("external_link"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("vr_topic_idx").on(t.topicId)]
);

// ── tags ──────────────────────────────────────────────────────────────────────
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    // category: aayam | topic | event | geography | other
    category: varchar("category", { length: 64 }).notNull().default("other"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("tags_org_idx").on(t.orgId)]
);

// ── entity_tags ───────────────────────────────────────────────────────────────
// Polymorphic tagging — attach any tag to any entity
export const entityTags = pgTable(
  "entity_tags",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    entityId: uuid("entity_id").notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(), // "event" | "article" | "user"
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("et_entity_idx").on(t.entityType, t.entityId),
    index("et_tag_idx").on(t.tagId),
  ]
);

// ── comments ──────────────────────────────────────────────────────────────────
// Threaded comments on events, articles, or any entity.
// Supports internal-only and restricted visibility tiers.
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    authorUserId: uuid("author_user_id").references(() => profiles.id, { onDelete: "set null" }),
    authorNameSnapshot: varchar("author_name_snapshot", { length: 256 }),
    body: text("body").notNull(),
    parentCommentId: uuid("parent_comment_id"), // threading
    isDeleted: boolean("is_deleted").notNull().default(false),
    visibility: commentVisibility("visibility").notNull().default("internal"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("comments_entity_idx").on(t.entityType, t.entityId),
    index("comments_org_idx").on(t.orgId),
  ]
);

// ── attachments ───────────────────────────────────────────────────────────────
// File metadata (actual files stored in Neon/S3/Cloudflare R2 externally)
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id").references(() => profiles.id, { onDelete: "set null" }),
    bucketName: varchar("bucket_name", { length: 128 }),
    objectPath: varchar("object_path", { length: 2048 }).notNull(),
    originalFileName: varchar("original_file_name", { length: 512 }),
    mimeType: varchar("mime_type", { length: 128 }),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: uuid("entity_id"),
    visibility: attachmentVisibility("visibility").notNull().default("internal"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("att_entity_idx").on(t.entityType, t.entityId),
    index("att_org_idx").on(t.orgId),
  ]
);

// ── notifications ─────────────────────────────────────────────────────────────
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: notificationKind("kind").notNull(),
    title: varchar("title", { length: 512 }).notNull(),
    body: text("body"),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: uuid("entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("notif_recipient_idx").on(t.recipientUserId),
    index("notif_read_idx").on(t.recipientUserId, t.isRead),
  ]
);

// ── activity_stream ───────────────────────────────────────────────────────────
// Public-facing activity feed (visible to authenticated users in the org)
export const activityStream = pgTable(
  "activity_stream",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 128 }).notNull(), // e.g. "event.status_changed"
    actorUserId: uuid("actor_user_id").references(() => profiles.id, { onDelete: "set null" }),
    actorNameSnapshot: varchar("actor_name_snapshot", { length: 256 }),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: uuid("entity_id"),
    payload: jsonb("payload"),   // structured event payload
    summary: text("summary"),    // human-readable summary
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("as_org_idx").on(t.orgId),
    index("as_entity_idx").on(t.entityType, t.entityId),
    index("as_created_idx").on(t.createdAt),
  ]
);

// ── audit_logs ────────────────────────────────────────────────────────────────
// Immutable security audit trail. Never updated or deleted.
// Written synchronously on all state-changing operations.
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 128 }).notNull(),
    actorUserId: uuid("actor_user_id").references(() => profiles.id, { onDelete: "set null" }),
    actorEmail: varchar("actor_email", { length: 320 }),
    actorIp: varchar("actor_ip", { length: 64 }),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: uuid("entity_id"),
    payload: jsonb("payload"),        // full before/after snapshot
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("al_org_idx").on(t.orgId),
    index("al_actor_idx").on(t.actorUserId),
    index("al_entity_idx").on(t.entityType, t.entityId),
    index("al_created_idx").on(t.createdAt),
  ]
);

// ── Relations ─────────────────────────────────────────────────────────────────
export const vimarshTopicsRelations = relations(vimarshTopics, ({ one, many }) => ({
  org: one(orgSettings, { fields: [vimarshTopics.orgId], references: [orgSettings.id] }),
  resources: many(vimarshResources),
}));

export const vimarshResourcesRelations = relations(vimarshResources, ({ one }) => ({
  topic: one(vimarshTopics, { fields: [vimarshResources.topicId], references: [vimarshTopics.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(profiles, { fields: [notifications.recipientUserId], references: [profiles.id] }),
}));
