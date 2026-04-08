/**
 * Pragya Pravah — Articles (Aalekh) Schema
 *
 * Articles flow through a multi-level editorial review chain before public
 * authorization. Every article must pass a values checklist before submission.
 *
 * Values checklist (enforced at review):
 *   rashtraPratham      — Nation first
 *   culturallyGrounded  — Rooted in Bharatiya civilisational memory
 *   balancedTone        — Measured, not inflammatory
 *   noDivisiveContent   — No content that creates divisions
 *
 * Article categories align with the Aayam workstreams:
 *   Vimarsh (discourse), Shodh (research), Prachar (outreach), Yuva (youth)
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import { articleStatusEnum, articleReviewDecision } from "./enums";
import { orgSettings, units, departmentsOrAayams } from "./org";
import { profiles } from "./users";

// ── articles ──────────────────────────────────────────────────────────────────
export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departmentsOrAayams.id, { onDelete: "set null" }),

    title: varchar("title", { length: 1024 }).notNull(),
    content: text("content"),
    summary: text("summary"),

    // Aayam-aligned categories: vimarsh | shodh | prachar | yuva | mahila | other
    category: varchar("category", { length: 64 }).notNull().default("other"),

    // Author info — foreign key + denormalised snapshot for audit
    authorUserId: uuid("author_user_id").references(() => profiles.id, { onDelete: "set null" }),
    authorNameSnapshot: varchar("author_name_snapshot", { length: 256 }),

    status: articleStatusEnum("status").notNull().default("draft"),

    // External URLs
    documentUrl: varchar("document_url", { length: 2048 }),  // Google Doc, PDF, etc.
    socialUrl: varchar("social_url", { length: 2048 }),      // Published social post URL

    // Values checklist — all four must be true for authorized_public
    // { rashtraPratham, culturallyGrounded, balancedTone, noDivisiveContent }
    valuesChecklist: jsonb("values_checklist").notNull().default(
      sql`'{"rashtraPratham":false,"culturallyGrounded":false,"balancedTone":false,"noDivisiveContent":false}'::jsonb`
    ),

    // Publication timestamp (set when status → authorized_public)
    publishedAt: timestamp("published_at", { withTimezone: true }),

    // Audit columns
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("articles_org_idx").on(t.orgId),
    index("articles_status_idx").on(t.status),
    index("articles_author_idx").on(t.authorUserId),
    index("articles_category_idx").on(t.category),
  ]
);

// ── article_reviews ───────────────────────────────────────────────────────────
// One row per review step in the article's workflow.
// Provides a complete editorial audit trail.
export const articleReviews = pgTable(
  "article_reviews",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    // Step label mirrors the status it moves FROM
    // e.g. "pending_unit_head_review" → unit head reviews → moves to pending_aayam_review
    reviewStep: varchar("review_step", { length: 64 }).notNull(),
    reviewerUserId: uuid("reviewer_user_id").references(() => profiles.id, { onDelete: "set null" }),
    reviewerNameSnapshot: varchar("reviewer_name_snapshot", { length: 256 }),
    decision: articleReviewDecision("decision").notNull(),
    // Suggested edits (structured or plain text)
    edits: text("edits"),
    reviewNotes: text("review_notes"),
    // Values checklist state at time of review
    valuesChecklistSnapshot: jsonb("values_checklist_snapshot"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("ar_article_idx").on(t.articleId)]
);

// ── article_publications ──────────────────────────────────────────────────────
// Tracks where and when an article was published externally.
// An article can be published on multiple channels.
export const articlePublications = pgTable(
  "article_publications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    // Channel: website | facebook | instagram | whatsapp | telegram | print | other
    channel: varchar("channel", { length: 64 }).notNull(),
    publishedBy: uuid("published_by").references(() => profiles.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().default(sql`now()`),
    publishedUrl: varchar("published_url", { length: 2048 }),
    // Additional platform-specific metadata
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("ap_article_idx").on(t.articleId)]
);

// ── Relations ─────────────────────────────────────────────────────────────────
export const articlesRelations = relations(articles, ({ one, many }) => ({
  org: one(orgSettings, { fields: [articles.orgId], references: [orgSettings.id] }),
  unit: one(units, { fields: [articles.unitId], references: [units.id] }),
  department: one(departmentsOrAayams, { fields: [articles.departmentId], references: [departmentsOrAayams.id] }),
  author: one(profiles, { fields: [articles.authorUserId], references: [profiles.id], relationName: "author" }),
  createdByProfile: one(profiles, { fields: [articles.createdBy], references: [profiles.id], relationName: "creator" }),
  reviews: many(articleReviews),
  publications: many(articlePublications),
}));

export const articleReviewsRelations = relations(articleReviews, ({ one }) => ({
  article: one(articles, { fields: [articleReviews.articleId], references: [articles.id] }),
  reviewer: one(profiles, { fields: [articleReviews.reviewerUserId], references: [profiles.id] }),
}));

export const articlePublicationsRelations = relations(articlePublications, ({ one }) => ({
  article: one(articles, { fields: [articlePublications.articleId], references: [articles.id] }),
  publisher: one(profiles, { fields: [articlePublications.publishedBy], references: [profiles.id] }),
}));
