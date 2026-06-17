/**
 * Pragya Pravah — PostgreSQL Enum Definitions
 *
 * All enums are defined here and re-used across table schemas.
 * Workflow enums encode the full multi-level approval chains for
 * both Events (Gativiidhi) and Articles (Aalekh).
 */
import { pgEnum } from "drizzle-orm/pg-core";

// ── Roles ─────────────────────────────────────────────────────────────────────
// Hierarchical role codes. Scope is set separately in user_role_assignments.
export const roleCodes = [
  "super_admin",
  "org_admin",
  "vibhag_pramukh",      // Divisional head (Vibhag = Division)
  "aayam_pramukh",       // Department head (Aayam = Dimension/Dept)
  "unit_head",           // Local unit head
  "karyakarta",          // Field worker / grassroots organiser
  "prant_sanyojak",      // State coordinator (Prant = Province/State)
  "prant_aayam_pramukh", // State department head
  "kshetra_reviewer",    // Regional reviewer / escalation handler
] as const;
export type RoleCode = (typeof roleCodes)[number];
export const roleCodeEnum = pgEnum("role_code", roleCodes);

// ── Assignment Scope ──────────────────────────────────────────────────────────
// Roles can be scoped to org, unit, department, or entity-level
export const assignmentScopeType = pgEnum("assignment_scope_type", [
  "org",
  "unit",
  "department",
  "event",
  "article",
]);

// ── Event Workflow Statuses ───────────────────────────────────────────────────
// Full approval chain: Unit → Aayam → Vibhag → Prant (single) → Prant (dual) → Public
export const eventStatusValues = [
  "draft",
  "submitted_by_unit",
  "pending_aayam_review",
  "pending_vibhag_review",
  "pending_prant_authorization",
  "pending_prant_dual_authorization",
  "authorized_public",
  "escalated_kshetra",      // Escalated to regional reviewer
  "returned_for_revision",  // Sent back with notes
  "rejected",
  "cancelled",
] as const;
export type EventStatus = (typeof eventStatusValues)[number];
export const eventStatusEnum = pgEnum("event_status", eventStatusValues);

// ── Article Workflow Statuses (Aalekh) ────────────────────────────────────────
// Articles go through editorial + values review before publication
export const articleStatusValues = [
  "draft",
  "pending_unit_head_review",
  "pending_aayam_review",
  "pending_vibhag_review",
  "pending_prant_authorization",
  "authorized_public",
  "escalated_kshetra",
  "returned_for_revision",
  "rejected",
  "archived",
] as const;
export type ArticleStatus = (typeof articleStatusValues)[number];
export const articleStatusEnum = pgEnum("article_status", articleStatusValues);

// ── Article Review Decision ───────────────────────────────────────────────────
export const articleReviewDecision = pgEnum("article_review_decision", [
  "approved",
  "rejected",
  "returned_for_revision",
]);

// ── Poll Types ────────────────────────────────────────────────────────────────
// date: scheduling poll (pick an event date)
// general: yes/no or option vote
export const pollType = pgEnum("poll_type", ["date", "general"]);

// ── Event Form Question Types ─────────────────────────────────────────────────
export const questionType = pgEnum("question_type", [
  "text",
  "yesno",
  "select",
  "multiselect",
  "textarea",
  "number",
  "email",
  "rating",
  "date",
  "checkbox_group",
  "radio_group",
]);
export type QuestionType = (typeof questionType.enumValues)[number];

// ── Vritt (Event Report) Status ───────────────────────────────────────────────
// Post-event report lifecycle
export const vrittStatus = pgEnum("vritt_status", [
  "draft",
  "submitted",
  "reviewed",
]);

// ── Attachment Visibility ─────────────────────────────────────────────────────
export const attachmentVisibility = pgEnum("attachment_visibility", [
  "public",
  "internal",
  "private",
]);

// ── Comment Visibility ────────────────────────────────────────────────────────
export const commentVisibility = pgEnum("comment_visibility", [
  "public",
  "internal",
  "restricted",
]);

// ── Notification Kind ─────────────────────────────────────────────────────────
export const notificationKind = pgEnum("notification_kind", [
  "event_status_change",
  "article_status_change",
  "review_assigned",
  "review_completed",
  "poll_finalized",
  "registration_received",
  "mention",
  "system",
]);

// ── Prachar Platform ──────────────────────────────────────────────────────────
// Social/messaging platforms tracked in outreach coordination
export const pracharPlatform = pgEnum("prachar_platform", [
  "whatsapp",
  "facebook",
  "instagram",
  "telegram",
]);

// ── Unit Kind ─────────────────────────────────────────────────────────────────
export const unitKind = pgEnum("unit_kind", [
  "vibhag",  // Division
  "prant",   // Province/State
  "kshetra", // Region
  "shakha",  // Branch
  "other",
]);

// ── Aayam / Department Kind ───────────────────────────────────────────────────
export const departmentKind = pgEnum("department_kind", [
  "vimarsh",  // Discourse
  "shodh",    // Research
  "prachar",  // Outreach/Publicity
  "yuva",     // Youth
  "mahila",   // Women
  "other",
]);

// ── Task/Project Enums ────────────────────────────────────────────────────────
export const projectStatusValues = ["planned", "active", "completed", "archived"] as const;
export type ProjectStatus = (typeof projectStatusValues)[number];
export const projectStatusEnum = pgEnum("project_status", projectStatusValues);

export const taskStatusValues = ["todo", "in_progress", "done", "blocked"] as const;
export type TaskStatus = (typeof taskStatusValues)[number];
export const taskStatusEnum = pgEnum("task_status", taskStatusValues);

export const taskPriorityValues = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof taskPriorityValues)[number];
export const taskPriorityEnum = pgEnum("task_priority", taskPriorityValues);

// ── Circular Enums ────────────────────────────────────────────────────────────
export const circularPriorityValues = ["low", "normal", "high", "urgent"] as const;
export type CircularPriority = (typeof circularPriorityValues)[number];
export const circularPriorityEnum = pgEnum("circular_priority", circularPriorityValues);

export const circularScopeValues = ["org", "unit", "department"] as const;
export type CircularScope = (typeof circularScopeValues)[number];
export const circularScopeEnum = pgEnum("circular_scope", circularScopeValues);

// ── Volunteer Enums ───────────────────────────────────────────────────────────
export const volunteerActivityTypeValues = ["shakha_attendance", "event_duty", "training", "outreach", "admin", "other"] as const;
export type VolunteerActivityType = (typeof volunteerActivityTypeValues)[number];
export const volunteerActivityTypeEnum = pgEnum("volunteer_activity_type", volunteerActivityTypeValues);

// ── Survey Status ─────────────────────────────────────────────────────────────
export const surveyStatusValues = ["draft", "published", "closed", "archived"] as const;
export type SurveyStatus = (typeof surveyStatusValues)[number];
export const surveyStatusEnum = pgEnum("survey_status", surveyStatusValues);

// ── Media Category ────────────────────────────────────────────────────────────
export const mediaCategoryValues = ["image", "document", "video", "audio", "other"] as const;
export type MediaCategory = (typeof mediaCategoryValues)[number];

// ── Conference Enums ──────────────────────────────────────────────────────────
export const conferenceStatusValues = ["draft", "planning", "registration_open", "ongoing", "completed", "cancelled"] as const;
export type ConferenceStatus = (typeof conferenceStatusValues)[number];
export const conferenceStatus = pgEnum("conference_status", conferenceStatusValues);

export const sessionTypeValues = ["keynote", "panel", "paper_presentation", "workshop", "cultural", "other"] as const;
export type SessionType = (typeof sessionTypeValues)[number];
export const sessionType = pgEnum("session_type", sessionTypeValues);

export const registrationCategoryValues = ["delegate", "student", "speaker", "vip", "media", "other"] as const;
export type RegistrationCategory = (typeof registrationCategoryValues)[number];
export const registrationCategory = pgEnum("registration_category", registrationCategoryValues);
