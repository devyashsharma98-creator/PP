/**
 * Pragya Pravah — Events (Gativiidhi) Schema
 *
 * Complete event lifecycle:
 *   events                  — core event record
 *   event_status_history    — immutable audit trail of all status transitions
 *   event_form_configs      — per-event public registration form configuration
 *   event_form_questions    — custom questions added to registration forms
 *   event_registrations     — public registrations (IP-tracked)
 *   event_registration_answers — answers to custom questions
 *   event_polls             — scheduling or general polls attached to events
 *   event_poll_options      — options within each poll
 *   event_poll_votes        — individual votes (IP-tracked)
 *   event_vritt             — post-event report (Vritt = event account/record)
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import {
  eventStatusEnum,
  pollType,
  questionType,
  vrittStatus,
} from "./enums";
import { orgSettings, units, departmentsOrAayams, locations } from "./org";
import { profiles } from "./users";

// ── events ────────────────────────────────────────────────────────────────────
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgSettings.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departmentsOrAayams.id, { onDelete: "set null" }),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),

    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),

    status: eventStatusEnum("status").notNull().default("draft"),

    // Snapshot of submitter name at time of submission (denormalised for audit)
    submittedByNameSnapshot: varchar("submitted_by_name_snapshot", { length: 256 }),

    // Logistics checklist — stored as a JSONB object for flexibility
    // { designing, food, seating, transport, accommodation, soundMic, camera, screen, lights }
    checklist: jsonb("checklist").notNull().default(sql`'{}'::jsonb`),

    // Metadata — future extensibility (e.g. expected_attendees, entry_fee)
    metadata: jsonb("metadata"),

    // Audit columns
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("events_org_idx").on(t.orgId),
    index("events_unit_idx").on(t.unitId),
    index("events_status_idx").on(t.status),
    index("events_starts_at_idx").on(t.startsAt),
  ]
);

// ── event_status_history ──────────────────────────────────────────────────────
// Immutable log of every status transition. Never deleted or updated.
export const eventStatusHistory = pgTable(
  "event_status_history",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    fromStatus: eventStatusEnum("from_status"),  // null on creation
    toStatus: eventStatusEnum("to_status").notNull(),
    actorUserId: uuid("actor_user_id").references(() => profiles.id, { onDelete: "set null" }),
    actorNameSnapshot: varchar("actor_name_snapshot", { length: 256 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("esh_event_idx").on(t.eventId)]
);

// ── event_form_configs ────────────────────────────────────────────────────────
// Controls which fields appear on the public registration form for this event
export const eventFormConfigs = pgTable("event_form_configs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id")
    .notNull()
    .unique()
    .references(() => events.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(false),

  // Standard optional fields
  collectPhone: boolean("collect_phone").notNull().default(true),
  collectCity: boolean("collect_city").notNull().default(true),
  collectAttendingCount: boolean("collect_attending_count").notNull().default(false),
  collectSpecialNeeds: boolean("collect_special_needs").notNull().default(false),
  collectNotes: boolean("collect_notes").notNull().default(false),

  // Submission constraints
  allowMultipleSubmissions: boolean("allow_multiple_submissions").notNull().default(false),
  maxRegistrations: integer("max_registrations"), // null = unlimited

  // Availability window
  opensAt: timestamp("opens_at", { withTimezone: true }),
  closesAt: timestamp("closes_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ── event_form_questions ──────────────────────────────────────────────────────
// Custom questions appended to the registration form
export const eventFormQuestions = pgTable(
  "event_form_questions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    questionKey: varchar("question_key", { length: 64 }).notNull(),  // stable key for answers
    label: varchar("label", { length: 512 }).notNull(),
    labelHi: varchar("label_hi", { length: 512 }),
    questionType: questionType("question_type").notNull().default("text"),
    isRequired: boolean("is_required").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    optionsJson: jsonb("options_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("efq_event_idx").on(t.eventId)]
);

// ── event_registrations ───────────────────────────────────────────────────────
// Public registrations submitted via /form/[eventId]
// IP + user-agent captured for spam/fraud detection
export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 256 }).notNull(),
    phone: varchar("phone", { length: 24 }),
    email: varchar("email", { length: 320 }),
    city: varchar("city", { length: 128 }),
    attendingCount: integer("attending_count").notNull().default(1),
    hasSpecialNeeds: boolean("has_special_needs").notNull().default(false),
    notes: text("notes"),

    // Stable public key for check-in (hashed, not the raw submission ID)
    publicSubmissionKeyHash: varchar("public_submission_key_hash", { length: 128 }),
    isCheckedIn: boolean("is_checked_in").notNull().default(false),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),

    // IP tracking (GDPR note: anonymise after retention period in production)
    submittedFromIp: varchar("submitted_from_ip", { length: 64 }),
    submittedUserAgent: text("submitted_user_agent"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("er_event_idx").on(t.eventId),
    index("er_phone_event_idx").on(t.phone, t.eventId),
  ]
);

// ── event_registration_answers ────────────────────────────────────────────────
// Answers to custom questions — keyed by question_key
export const eventRegistrationAnswers = pgTable(
  "event_registration_answers",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => eventRegistrations.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    questionKey: varchar("question_key", { length: 64 }).notNull(),
    answer: text("answer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("era_reg_idx").on(t.registrationId)]
);

// ── event_polls ───────────────────────────────────────────────────────────────
export const eventPolls = pgTable(
  "event_polls",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    question: varchar("question", { length: 1024 }).notNull(),
    questionHi: varchar("question_hi", { length: 1024 }),
    pollType: pollType("poll_type").notNull().default("general"),
    isFinalized: boolean("is_finalized").notNull().default(false),
    winnerOptionId: uuid("winner_option_id"), // set after finalization
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("ep_event_idx").on(t.eventId)]
);

// ── event_poll_options ────────────────────────────────────────────────────────
export const eventPollOptions = pgTable(
  "event_poll_options",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => eventPolls.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 512 }).notNull(),
    labelHi: varchar("label_hi", { length: 512 }),
    // For date-type polls, stores the proposed datetime
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("epo_poll_idx").on(t.pollId)]
);

// ── event_poll_votes ──────────────────────────────────────────────────────────
// IP-tracked votes. One vote per IP per poll (enforced at API layer).
export const eventPollVotes = pgTable(
  "event_poll_votes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => eventPolls.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => eventPollOptions.id, { onDelete: "cascade" }),
    submittedBy: uuid("submitted_by").references(() => profiles.id, { onDelete: "set null" }),
    submittedFromIp: varchar("submitted_from_ip", { length: 64 }),
    submittedUserAgent: text("submitted_user_agent"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("epv_poll_idx").on(t.pollId)]
);

// ── event_vritt ───────────────────────────────────────────────────────────────
// Post-event report. Vritt = account/record of what happened at the event.
export const eventVritt = pgTable("event_vritt", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id")
    .notNull()
    .unique()
    .references(() => events.id, { onDelete: "cascade" }),
  attendanceCount: integer("attendance_count"),
  checkedInCount: integer("checked_in_count"),
  // Array of media URLs (photos, videos)
  mediaUrls: jsonb("media_urls").notNull().default(sql`'[]'::jsonb`),
  content: text("content"),
  contentHi: text("content_hi"),
  status: vrittStatus("status").notNull().default("draft"),
  submittedBy: uuid("submitted_by").references(() => profiles.id, { onDelete: "set null" }),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id, { onDelete: "set null" }),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ── Relations ─────────────────────────────────────────────────────────────────
export const eventsRelations = relations(events, ({ one, many }) => ({
  org: one(orgSettings, { fields: [events.orgId], references: [orgSettings.id] }),
  unit: one(units, { fields: [events.unitId], references: [units.id] }),
  department: one(departmentsOrAayams, { fields: [events.departmentId], references: [departmentsOrAayams.id] }),
  location: one(locations, { fields: [events.locationId], references: [locations.id] }),
  createdByProfile: one(profiles, { fields: [events.createdBy], references: [profiles.id] }),
  statusHistory: many(eventStatusHistory),
  formConfig: one(eventFormConfigs, {
    fields: [events.id],
    references: [eventFormConfigs.eventId],
  }),
  formQuestions: many(eventFormQuestions),
  registrations: many(eventRegistrations),
  polls: many(eventPolls),
  vritt: one(eventVritt, {
    fields: [events.id],
    references: [eventVritt.eventId],
  }),
}));

export const eventStatusHistoryRelations = relations(eventStatusHistory, ({ one }) => ({
  event: one(events, { fields: [eventStatusHistory.eventId], references: [events.id] }),
  actor: one(profiles, { fields: [eventStatusHistory.actorUserId], references: [profiles.id] }),
}));

export const eventFormConfigsRelations = relations(eventFormConfigs, ({ one }) => ({
  event: one(events, { fields: [eventFormConfigs.eventId], references: [events.id] }),
}));

export const eventFormQuestionsRelations = relations(eventFormQuestions, ({ one }) => ({
  event: one(events, { fields: [eventFormQuestions.eventId], references: [events.id] }),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one, many }) => ({
  event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
  answers: many(eventRegistrationAnswers),
}));

export const eventRegistrationAnswersRelations = relations(eventRegistrationAnswers, ({ one }) => ({
  registration: one(eventRegistrations, {
    fields: [eventRegistrationAnswers.registrationId],
    references: [eventRegistrations.id],
  }),
  event: one(events, { fields: [eventRegistrationAnswers.eventId], references: [events.id] }),
}));

export const eventPollsRelations = relations(eventPolls, ({ one, many }) => ({
  event: one(events, { fields: [eventPolls.eventId], references: [events.id] }),
  options: many(eventPollOptions),
  votes: many(eventPollVotes),
}));

export const eventPollOptionsRelations = relations(eventPollOptions, ({ one, many }) => ({
  poll: one(eventPolls, { fields: [eventPollOptions.pollId], references: [eventPolls.id] }),
  votes: many(eventPollVotes),
}));

export const eventPollVotesRelations = relations(eventPollVotes, ({ one }) => ({
  poll: one(eventPolls, { fields: [eventPollVotes.pollId], references: [eventPolls.id] }),
  option: one(eventPollOptions, { fields: [eventPollVotes.optionId], references: [eventPollOptions.id] }),
  submittedByProfile: one(profiles, { fields: [eventPollVotes.submittedBy], references: [profiles.id] }),
}));

export const eventVrittRelations = relations(eventVritt, ({ one }) => ({
  event: one(events, { fields: [eventVritt.eventId], references: [events.id] }),
  submittedByProfile: one(profiles, { fields: [eventVritt.submittedBy], references: [profiles.id] }),
  reviewedByProfile: one(profiles, { fields: [eventVritt.reviewedBy], references: [profiles.id] }),
}));
