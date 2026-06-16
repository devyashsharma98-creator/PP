import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { conferenceStatus } from "./enums";
import { sessionType } from "./enums";
import { registrationCategory } from "./enums";
import { orgSettings, units, departmentsOrAayams, locations } from "./org";
import { profiles } from "./users";

export const conferences = pgTable(
  "conferences",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departmentsOrAayams.id, { onDelete: "set null" }),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    theme: text("theme"),
    themeHi: text("theme_hi"),
    description: text("description"),
    descriptionHi: text("description_hi"),
    venue: varchar("venue", { length: 512 }),
    venueHi: varchar("venue_hi", { length: 512 }),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    status: conferenceStatus("status").notNull().default("draft"),
    registrationEnabled: boolean("registration_enabled").notNull().default(false),
    maxRegistrations: integer("max_registrations"),
    metadata: jsonb("metadata"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("conferences_org_idx").on(t.orgId),
    index("conferences_status_idx").on(t.status),
    index("conferences_starts_at_idx").on(t.startsAt),
  ]
);

export const conferenceSessions = pgTable(
  "conference_sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    conferenceId: uuid("conference_id").notNull().references(() => conferences.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    description: text("description"),
    descriptionHi: text("description_hi"),
    sessionType: sessionType("session_type").notNull().default("other"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    venue: varchar("venue", { length: 256 }),
    venueHi: varchar("venue_hi", { length: 256 }),
    chairpersonName: varchar("chairperson_name", { length: 256 }),
    chairpersonNameHi: varchar("chairperson_name_hi", { length: 256 }),
    sortOrder: integer("sort_order").notNull().default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("cs_conf_idx").on(t.conferenceId),
    index("cs_session_type_idx").on(t.sessionType),
  ]
);

export const sessionSpeakers = pgTable(
  "session_speakers",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id").notNull().references(() => conferenceSessions.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    name: varchar("name", { length: 256 }).notNull(),
    nameHi: varchar("name_hi", { length: 256 }),
    bio: text("bio"),
    bioHi: text("bio_hi"),
    photoUrl: varchar("photo_url", { length: 1024 }),
    topic: varchar("topic", { length: 512 }),
    topicHi: varchar("topic_hi", { length: 512 }),
    affiliation: varchar("affiliation", { length: 256 }),
    affiliationHi: varchar("affiliation_hi", { length: 256 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("ss_session_idx").on(t.sessionId),
  ]
);

export const conferenceRegistrations = pgTable(
  "conference_registrations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    conferenceId: uuid("conference_id").notNull().references(() => conferences.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 256 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 24 }),
    organization: varchar("organization", { length: 256 }),
    category: registrationCategory("category").notNull().default("delegate"),
    isAttended: boolean("is_attended").notNull().default(false),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("cr_conf_idx").on(t.conferenceId),
  ]
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const conferencesRelations = relations(conferences, ({ one, many }) => ({
  org: one(orgSettings, { fields: [conferences.orgId], references: [orgSettings.id] }),
  unit: one(units, { fields: [conferences.unitId], references: [units.id] }),
  department: one(departmentsOrAayams, { fields: [conferences.departmentId], references: [departmentsOrAayams.id] }),
  location: one(locations, { fields: [conferences.locationId], references: [locations.id] }),
  createdByProfile: one(profiles, { fields: [conferences.createdBy], references: [profiles.id] }),
  sessions: many(conferenceSessions),
  registrations: many(conferenceRegistrations),
}));

export const conferenceSessionsRelations = relations(conferenceSessions, ({ one, many }) => ({
  conference: one(conferences, { fields: [conferenceSessions.conferenceId], references: [conferences.id] }),
  speakers: many(sessionSpeakers),
}));

export const sessionSpeakersRelations = relations(sessionSpeakers, ({ one }) => ({
  session: one(conferenceSessions, { fields: [sessionSpeakers.sessionId], references: [conferenceSessions.id] }),
  profile: one(profiles, { fields: [sessionSpeakers.profileId], references: [profiles.id] }),
}));

export const conferenceRegistrationsRelations = relations(conferenceRegistrations, ({ one }) => ({
  conference: one(conferences, { fields: [conferenceRegistrations.conferenceId], references: [conferences.id] }),
}));
