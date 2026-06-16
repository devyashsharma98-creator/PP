import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { orgSettings } from "./org";
import { profiles } from "./users";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by").notNull().references(() => profiles.id, { onDelete: "set null" }),
    filename: varchar("filename", { length: 512 }).notNull(),
    storageKey: varchar("storage_key", { length: 1024 }).notNull(),
    mimeType: varchar("mime_type", { length: 128 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    bucket: varchar("bucket", { length: 128 }).default("media"),
    category: varchar("category", { length: 64 }).notNull().default("other"),
    altText: text("alt_text"),
    altTextHi: text("alt_text_hi"),
    tags: text("tags").array(),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("media_assets_org_idx").on(t.orgId),
    index("media_assets_uploader_idx").on(t.uploadedBy),
    index("media_assets_category_idx").on(t.category),
    index("media_assets_created_at_idx").on(t.createdAt),
  ]
);

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  org: one(orgSettings, { fields: [mediaAssets.orgId], references: [orgSettings.id] }),
  uploader: one(profiles, { fields: [mediaAssets.uploadedBy], references: [profiles.id] }),
}));
