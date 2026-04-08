/**
 * Pragya Pravah — Organisational Structure Tables
 *
 * Hierarchy: Org → Units → Departments/Aayams → Locations
 *
 * The Bhopal Vibhag instance is a single Org with multiple Units (shakhas,
 * prant sub-units) and Aayams (Vimarsh, Shodh, Prachar, Yuva, Mahila).
 */
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  jsonb,
  timestamp,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { unitKind, departmentKind } from "./enums";

// ── org_settings ──────────────────────────────────────────────────────────────
// Top-level organisation record. One per deployment.
export const orgSettings = pgTable("org_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgCode: varchar("org_code", { length: 64 }).notNull().unique(), // e.g. "bhopal_vibhag"
  name: varchar("name", { length: 256 }).notNull(),
  nameHi: varchar("name_hi", { length: 256 }),                    // Hindi name
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),                                      // flexible config bag
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ── units ─────────────────────────────────────────────────────────────────────
// Hierarchical units within an org (Vibhag, Prant, Kshetra, Shakha…)
// Self-referencing via parent_unit_id for nested structures.
export const units = pgTable("units", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgSettings.id, { onDelete: "cascade" }),
  parentUnitId: uuid("parent_unit_id"), // nullable — top-level units have no parent
  unitKind: unitKind("unit_kind").notNull().default("other"),
  code: varchar("code", { length: 64 }).notNull(),               // unique within org
  name: varchar("name", { length: 256 }).notNull(),
  nameHi: varchar("name_hi", { length: 256 }),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ── departments_or_aayams ─────────────────────────────────────────────────────
// Aayams = thematic dimensions within units.
// Pragya Pravah Aayams: Vimarsh, Shodh, Prachar, Yuva, Mahila
export const departmentsOrAayams = pgTable("departments_or_aayams", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgSettings.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id")
    .references(() => units.id, { onDelete: "set null" }),
  code: varchar("code", { length: 64 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  nameHi: varchar("name_hi", { length: 256 }),
  departmentKind: departmentKind("department_kind").notNull().default("other"),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ── locations ─────────────────────────────────────────────────────────────────
// Physical or virtual venues for events
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgSettings.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  nameHi: varchar("name_hi", { length: 256 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 128 }),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ── Relations ─────────────────────────────────────────────────────────────────
export const orgSettingsRelations = relations(orgSettings, ({ many }) => ({
  units: many(units),
  aayams: many(departmentsOrAayams),
  locations: many(locations),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  org: one(orgSettings, { fields: [units.orgId], references: [orgSettings.id] }),
  aayams: many(departmentsOrAayams),
}));

export const aayamsRelations = relations(departmentsOrAayams, ({ one }) => ({
  org: one(orgSettings, { fields: [departmentsOrAayams.orgId], references: [orgSettings.id] }),
  unit: one(units, { fields: [departmentsOrAayams.unitId], references: [units.id] }),
}));
