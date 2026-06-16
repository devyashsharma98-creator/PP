import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { volunteerActivityTypeEnum } from "./enums";
import { orgSettings } from "./org";
import { profiles } from "./users";

export const volunteerProfiles = pgTable(
  "volunteer_profiles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    profileId: uuid("profile_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    skills: text("skills").array(),
    availability: jsonb("availability"), // weekly schedule
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    serviceSpanMonths: integer("service_span_months"),
    emergencyContact: varchar("emergency_contact", { length: 64 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("volunteer_profiles_org_idx").on(t.orgId),
    index("volunteer_profiles_profile_idx").on(t.profileId),
  ]
);

export const volunteerActivities = pgTable(
  "volunteer_activities",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    volunteerId: uuid("volunteer_id").notNull().references(() => volunteerProfiles.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    activityType: volunteerActivityTypeEnum("activity_type").notNull().default("other"),
    description: text("description"),
    hoursLogged: integer("hours_logged"),
    date: timestamp("date", { withTimezone: true }).notNull().default(sql`now()`),
    eventId: uuid("event_id"),
    recordedBy: uuid("recorded_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("volunteer_activities_volunteer_idx").on(t.volunteerId),
    index("volunteer_activities_org_idx").on(t.orgId),
  ]
);

export const volunteerProfilesRelations = relations(volunteerProfiles, ({ one, many }) => ({
  org: one(orgSettings, { fields: [volunteerProfiles.orgId], references: [orgSettings.id] }),
  profile: one(profiles, { fields: [volunteerProfiles.profileId], references: [profiles.id] }),
  activities: many(volunteerActivities),
}));

export const volunteerActivitiesRelations = relations(volunteerActivities, ({ one }) => ({
  org: one(orgSettings, { fields: [volunteerActivities.orgId], references: [orgSettings.id] }),
  volunteer: one(volunteerProfiles, { fields: [volunteerActivities.volunteerId], references: [volunteerProfiles.id] }),
  recorder: one(profiles, { fields: [volunteerActivities.recordedBy], references: [profiles.id] }),
}));
