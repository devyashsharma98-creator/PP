import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { surveyStatusEnum, questionType } from "./enums";
import { orgSettings, units, departmentsOrAayams } from "./org";
import { profiles } from "./users";

export const surveys = pgTable(
  "surveys",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgSettings.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    titleHi: varchar("title_hi", { length: 512 }),
    description: text("description"),
    descriptionHi: text("description_hi"),
    status: surveyStatusEnum("status").notNull().default("draft"),
    scope: varchar("scope", { length: 32 }).notNull().default("org"),
    scopeEntityId: uuid("scope_entity_id"),
    allowMultipleSubmissions: boolean("allow_multiple_submissions").notNull().default(false),
    maxSubmissions: integer("max_submissions"),
    opensAt: timestamp("opens_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    isPublic: boolean("is_public").notNull().default(false),
    createdBy: uuid("created_by").notNull().references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("surveys_org_idx").on(t.orgId),
    index("surveys_status_idx").on(t.status),
    index("surveys_created_by_idx").on(t.createdBy),
  ]
);

export const surveyQuestions = pgTable(
  "survey_questions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    surveyId: uuid("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
    questionKey: varchar("question_key", { length: 64 }).notNull(),
    label: varchar("label", { length: 512 }).notNull(),
    labelHi: varchar("label_hi", { length: 512 }),
    questionType: questionType("question_type").notNull().default("text"),
    isRequired: boolean("is_required").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    optionsJson: jsonb("options_json"),
  },
  (t) => [
    index("survey_questions_survey_idx").on(t.surveyId),
  ]
);

export const surveySubmissions = pgTable(
  "survey_submissions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    surveyId: uuid("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
    respondentName: varchar("respondent_name", { length: 256 }),
    respondentEmail: varchar("respondent_email", { length: 256 }),
    respondentPhone: varchar("respondent_phone", { length: 24 }),
    submittedBy: uuid("submitted_by").references(() => profiles.id, { onDelete: "set null" }),
    metadata: jsonb("metadata"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("survey_submissions_survey_idx").on(t.surveyId),
    index("survey_submissions_submitted_by_idx").on(t.submittedBy),
  ]
);

export const surveyAnswers = pgTable(
  "survey_answers",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    submissionId: uuid("submission_id").notNull().references(() => surveySubmissions.id, { onDelete: "cascade" }),
    questionKey: varchar("question_key", { length: 64 }).notNull(),
    value: text("value"),
  },
  (t) => [
    index("survey_answers_submission_idx").on(t.submissionId),
  ]
);

// ── Relations ────────────────────────────────────────────────────────────────

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  org: one(orgSettings, { fields: [surveys.orgId], references: [orgSettings.id] }),
  creator: one(profiles, { fields: [surveys.createdBy], references: [profiles.id] }),
  unit: one(units, { fields: [surveys.scopeEntityId], references: [units.id] }),
  department: one(departmentsOrAayams, { fields: [surveys.scopeEntityId], references: [departmentsOrAayams.id] }),
  questions: many(surveyQuestions),
  submissions: many(surveySubmissions),
}));

export const surveyQuestionsRelations = relations(surveyQuestions, ({ one }) => ({
  survey: one(surveys, { fields: [surveyQuestions.surveyId], references: [surveys.id] }),
}));

export const surveySubmissionsRelations = relations(surveySubmissions, ({ one, many }) => ({
  survey: one(surveys, { fields: [surveySubmissions.surveyId], references: [surveys.id] }),
  submitter: one(profiles, { fields: [surveySubmissions.submittedBy], references: [profiles.id] }),
  answers: many(surveyAnswers),
}));

export const surveyAnswersRelations = relations(surveyAnswers, ({ one }) => ({
  submission: one(surveySubmissions, { fields: [surveyAnswers.submissionId], references: [surveySubmissions.id] }),
}));
