import { pgTable, uuid, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { orgSettings } from "./org";

/**
 * library_texts — curated repository of foundational Bharatiya Knowledge Systems
 * texts for the institutional E-Library.
 *
 * `readUrl` / `downloadUrl` hold external links (or signed storage URLs once R2 is
 * configured); the UI enables the Read/Download actions only when a URL is present.
 * `storageKey` is reserved for files uploaded to object storage.
 */
export const libraryTexts = pgTable(
  "library_texts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 256 }).notNull(),
    titleHi: varchar("title_hi", { length: 256 }).notNull(),
    author: varchar("author", { length: 256 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    pages: integer("pages").notNull().default(0),
    year: varchar("year", { length: 64 }).notNull().default(""),
    rating: integer("rating").notNull().default(0),
    description: text("description").notNull().default(""),
    descriptionHi: text("description_hi").notNull().default(""),
    coverColor: varchar("cover_color", { length: 128 }).notNull().default("from-amber-600 to-orange-700"),
    readUrl: text("read_url"),
    downloadUrl: text("download_url"),
    storageKey: varchar("storage_key", { length: 1024 }),
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("library_texts_org_idx").on(t.orgId),
    index("library_texts_category_idx").on(t.category),
    index("library_texts_published_idx").on(t.isPublished),
    index("library_texts_sort_idx").on(t.sortOrder),
  ]
);

export const libraryTextsRelations = relations(libraryTexts, ({ one }) => ({
  org: one(orgSettings, { fields: [libraryTexts.orgId], references: [orgSettings.id] }),
}));
