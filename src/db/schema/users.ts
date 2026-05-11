/**
 * Pragya Pravah — Users, Roles & RBAC Tables
 *
 * RBAC model:
 *   profiles          — one row per authenticated user
 *   roles             — canonical role definitions (seeded, not user-created)
 *   user_role_assignments — M:M join with scope metadata
 *
 * Scope types allow the same role to be scoped at different levels:
 *   org | unit | department | event | article
 *
 * Role assignments are time-bounded (starts_at / ends_at) to support
 * temporary delegations during large events or transitions.
 */
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import { roleCodeEnum, assignmentScopeType } from "./enums";
import { orgSettings, units, departmentsOrAayams } from "./org";

// ── roles ─────────────────────────────────────────────────────────────────────
// Seeded canonical roles — not user-created.
// role_code is the stable programmatic key used everywhere.
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: roleCodeEnum("code").notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  nameHi: varchar("name_hi", { length: 128 }),
  description: text("description"),
  // Priority determines hierarchy: lower = more powerful
  priority: varchar("priority", { length: 4 }).notNull().default("99"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ── profiles ──────────────────────────────────────────────────────────────────
// One row per user. Email is the login identifier.
// password_hash stores bcrypt hash (server-only, never sent to client).
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: varchar("password_hash", { length: 256 }).notNull(),
    displayName: varchar("display_name", { length: 256 }),
    displayNameHi: varchar("display_name_hi", { length: 256 }),
    phone: varchar("phone", { length: 24 }),
    responsibility: text("responsibility"),
    responsibilityHi: text("responsibility_hi"),
    isActive: boolean("is_active").notNull().default(true),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    requiresPasswordChange: boolean("requires_password_change").notNull().default(false),
    // Timestamps for account management
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    uniqueIndex("profiles_email_org_uidx").on(t.email, t.orgId),
    index("profiles_org_idx").on(t.orgId),
  ]
);

// ── user_role_assignments ─────────────────────────────────────────────────────
// Links profiles to roles with scope + time-bounding.
// A user can hold multiple roles at different scopes simultaneously.
export const userRoleAssignments = pgTable(
  "user_role_assignments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    // Scope type defines which entity the role applies to
    scopeType: assignmentScopeType("scope_type").notNull().default("org"),
    // Scope entity IDs — only the relevant one is set for the scope type
    orgId: uuid("org_id").references(() => orgSettings.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departmentsOrAayams.id, { onDelete: "cascade" }),
    scopeEntityId: uuid("scope_entity_id"), // generic fallback (event, article)
    // Time-bounded assignments
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().default(sql`now()`),
    endsAt: timestamp("ends_at", { withTimezone: true }), // null = no expiry
    isPrimary: boolean("is_primary").notNull().default(false),
    assignedBy: uuid("assigned_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("ura_user_idx").on(t.userId),
    index("ura_role_idx").on(t.roleId),
    index("ura_scope_idx").on(t.scopeType, t.orgId),
  ]
);

// ── Relations ─────────────────────────────────────────────────────────────────
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  org: one(orgSettings, { fields: [profiles.orgId], references: [orgSettings.id] }),
  roleAssignments: many(userRoleAssignments),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  assignments: many(userRoleAssignments),
}));

export const userRoleAssignmentsRelations = relations(userRoleAssignments, ({ one }) => ({
  user: one(profiles, { fields: [userRoleAssignments.userId], references: [profiles.id] }),
  role: one(roles, { fields: [userRoleAssignments.roleId], references: [roles.id] }),
  org: one(orgSettings, { fields: [userRoleAssignments.orgId], references: [orgSettings.id] }),
  unit: one(units, { fields: [userRoleAssignments.unitId], references: [units.id] }),
  department: one(departmentsOrAayams, {
    fields: [userRoleAssignments.departmentId],
    references: [departmentsOrAayams.id],
  }),
}));
