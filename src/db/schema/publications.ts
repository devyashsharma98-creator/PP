/**
 * Pragya Pravah — Prakashan (Publications) Schema
 *
 * Scholarly publishing: issue-based publications with article submissions and a
 * peer-review lifecycle. Distinct from Aalekh (an administrative approval chain)
 * — this is editorial: submit → review → revise → accept → publish.
 *
 *   publications          — An issue (journal volume, monograph, compendium).
 *   publication_articles  — A submitted article, optionally assigned to an issue,
 *                           carrying its own review state.
 *
 * Articles are vishay-taggable via content_vishaya_map (contentType "publication").
 */
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { orgSettings } from "./org";
import { profiles } from "./users";

// ── publications (issues) ────────────────────────────────────────────────────
export const publications = pgTable(
  "publications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }).notNull(),
    subtitle: varchar("subtitle", { length: 512 }),
    subtitleHi: varchar("subtitle_hi", { length: 512 }),
    issueNumber: varchar("issue_number", { length: 64 }),
    publishDate: timestamp("publish_date", { withTimezone: true }),
    coverImageUrl: varchar("cover_image_url", { length: 2048 }),
    description: text("description"),
    descriptionHi: text("description_hi"),
    // draft | preparing | reviewing | published
    status: varchar("status", { length: 24 }).notNull().default("draft"),
    // public | restricted | internal
    visibility: varchar("visibility", { length: 24 }).notNull().default("public"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("publications_org_idx").on(t.orgId),
    index("publications_status_idx").on(t.status),
  ]
);

// ── publication_articles ─────────────────────────────────────────────────────
export const publicationArticles = pgTable(
  "publication_articles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    publicationId: uuid("publication_id").references(() => publications.id, { onDelete: "set null" }),

    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    abstract: text("abstract"),
    abstractHi: text("abstract_hi"),
    body: text("body").notNull().default(""),
    bodyHi: text("body_hi"),

    authorIds: jsonb("author_ids").$type<string[]>(),
    references: text("references"),
    attachments: jsonb("attachments"),

    // submitted | under_review | revision_requested | accepted | rejected | published | withdrawn
    status: varchar("status", { length: 32 }).notNull().default("submitted"),

    submittedBy: uuid("submitted_by").references(() => profiles.id, { onDelete: "set null" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().default(sql`now()`),

    reviewerId: uuid("reviewer_id").references(() => profiles.id, { onDelete: "set null" }),
    reviewDueDate: timestamp("review_due_date", { withTimezone: true }),
    reviewComment: text("review_comment"),
    reviewCommentHi: text("review_comment_hi"),
    // accept | minor_revision | major_revision | reject
    recommendation: varchar("recommendation", { length: 24 }),
    rating: integer("rating"), // 1-5
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

    version: integer("version").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("pub_articles_org_idx").on(t.orgId),
    index("pub_articles_pub_idx").on(t.publicationId),
    index("pub_articles_status_idx").on(t.status),
    index("pub_articles_submitter_idx").on(t.submittedBy),
  ]
);

// ── Relations ────────────────────────────────────────────────────────────────
export const publicationsRelations = relations(publications, ({ one, many }) => ({
  org: one(orgSettings, { fields: [publications.orgId], references: [orgSettings.id] }),
  articles: many(publicationArticles),
}));

export const publicationArticlesRelations = relations(publicationArticles, ({ one }) => ({
  publication: one(publications, { fields: [publicationArticles.publicationId], references: [publications.id] }),
  submitter: one(profiles, { fields: [publicationArticles.submittedBy], references: [profiles.id] }),
  reviewer: one(profiles, { fields: [publicationArticles.reviewerId], references: [profiles.id] }),
}));
