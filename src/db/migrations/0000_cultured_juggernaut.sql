CREATE TYPE "public"."article_review_decision" AS ENUM('approved', 'rejected', 'returned_for_revision');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('draft', 'pending_unit_head_review', 'pending_aayam_review', 'pending_vibhag_review', 'pending_prant_authorization', 'authorized_public', 'escalated_kshetra', 'returned_for_revision', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."assignment_scope_type" AS ENUM('org', 'unit', 'department', 'event', 'article');--> statement-breakpoint
CREATE TYPE "public"."attachment_visibility" AS ENUM('public', 'internal', 'private');--> statement-breakpoint
CREATE TYPE "public"."comment_visibility" AS ENUM('public', 'internal', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."department_kind" AS ENUM('vimarsh', 'shodh', 'prachar', 'yuva', 'mahila', 'other');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'submitted_by_unit', 'pending_aayam_review', 'pending_vibhag_review', 'pending_prant_authorization', 'pending_prant_dual_authorization', 'authorized_public', 'escalated_kshetra', 'returned_for_revision', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('event_status_change', 'article_status_change', 'review_assigned', 'review_completed', 'poll_finalized', 'registration_received', 'mention', 'system');--> statement-breakpoint
CREATE TYPE "public"."poll_type" AS ENUM('date', 'general');--> statement-breakpoint
CREATE TYPE "public"."prachar_platform" AS ENUM('whatsapp', 'facebook', 'instagram', 'telegram');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('text', 'yesno');--> statement-breakpoint
CREATE TYPE "public"."role_code" AS ENUM('super_admin', 'org_admin', 'vibhag_pramukh', 'aayam_pramukh', 'unit_head', 'karyakarta', 'prant_sanyojak', 'prant_aayam_pramukh', 'kshetra_reviewer');--> statement-breakpoint
CREATE TYPE "public"."unit_kind" AS ENUM('vibhag', 'prant', 'kshetra', 'shakha', 'other');--> statement-breakpoint
CREATE TYPE "public"."vritt_status" AS ENUM('draft', 'submitted', 'reviewed');--> statement-breakpoint
CREATE TABLE "departments_or_aayams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"unit_id" uuid,
	"code" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"name_hi" varchar(256),
	"department_kind" "department_kind" DEFAULT 'other' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"name_hi" varchar(256),
	"address" text,
	"city" varchar(128),
	"state" varchar(128),
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_code" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"name_hi" varchar(256),
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_settings_org_code_unique" UNIQUE("org_code")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"parent_unit_id" uuid,
	"unit_kind" "unit_kind" DEFAULT 'other' NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"name_hi" varchar(256),
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(256) NOT NULL,
	"display_name" varchar(256),
	"display_name_hi" varchar(256),
	"phone" varchar(24),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "role_code" NOT NULL,
	"name" varchar(128) NOT NULL,
	"name_hi" varchar(128),
	"description" text,
	"priority" varchar(4) DEFAULT '99' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope_type" "assignment_scope_type" DEFAULT 'org' NOT NULL,
	"org_id" uuid,
	"unit_id" uuid,
	"department_id" uuid,
	"scope_entity_id" uuid,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"is_primary" boolean DEFAULT false NOT NULL,
	"assigned_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_form_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"collect_phone" boolean DEFAULT true NOT NULL,
	"collect_city" boolean DEFAULT true NOT NULL,
	"collect_attending_count" boolean DEFAULT false NOT NULL,
	"collect_special_needs" boolean DEFAULT false NOT NULL,
	"collect_notes" boolean DEFAULT false NOT NULL,
	"allow_multiple_submissions" boolean DEFAULT false NOT NULL,
	"max_registrations" integer,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_form_configs_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "event_form_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"question_key" varchar(64) NOT NULL,
	"label" varchar(512) NOT NULL,
	"label_hi" varchar(512),
	"question_type" "question_type" DEFAULT 'text' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_poll_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"label" varchar(512) NOT NULL,
	"label_hi" varchar(512),
	"scheduled_at" timestamp with time zone,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_poll_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"submitted_by" uuid,
	"submitted_from_ip" varchar(64),
	"submitted_user_agent" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"question" varchar(1024) NOT NULL,
	"question_hi" varchar(1024),
	"poll_type" "poll_type" DEFAULT 'general' NOT NULL,
	"is_finalized" boolean DEFAULT false NOT NULL,
	"winner_option_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registration_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"question_key" varchar(64) NOT NULL,
	"answer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"phone" varchar(24),
	"email" varchar(320),
	"city" varchar(128),
	"attending_count" integer DEFAULT 1 NOT NULL,
	"has_special_needs" boolean DEFAULT false NOT NULL,
	"notes" text,
	"public_submission_key_hash" varchar(128),
	"is_checked_in" boolean DEFAULT false NOT NULL,
	"checked_in_at" timestamp with time zone,
	"submitted_from_ip" varchar(64),
	"submitted_user_agent" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"from_status" "event_status",
	"to_status" "event_status" NOT NULL,
	"actor_user_id" uuid,
	"actor_name_snapshot" varchar(256),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_vritt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"attendance_count" integer,
	"checked_in_count" integer,
	"media_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content" text,
	"content_hi" text,
	"status" "vritt_status" DEFAULT 'draft' NOT NULL,
	"submitted_by" uuid,
	"reviewed_by" uuid,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_vritt_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"unit_id" uuid,
	"department_id" uuid,
	"location_id" uuid,
	"title" varchar(512) NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"submitted_by_name_snapshot" varchar(256),
	"checklist" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"channel" varchar(64) NOT NULL,
	"published_by" uuid,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_url" varchar(2048),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"review_step" varchar(64) NOT NULL,
	"reviewer_user_id" uuid,
	"reviewer_name_snapshot" varchar(256),
	"decision" "article_review_decision" NOT NULL,
	"edits" text,
	"review_notes" text,
	"values_checklist_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"unit_id" uuid,
	"department_id" uuid,
	"title" varchar(1024) NOT NULL,
	"content" text,
	"summary" text,
	"category" varchar(64) DEFAULT 'other' NOT NULL,
	"author_user_id" uuid,
	"author_name_snapshot" varchar(256),
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"document_url" varchar(2048),
	"social_url" varchar(2048),
	"values_checklist" jsonb DEFAULT '{"rashtraPratham":false,"culturallyGrounded":false,"balancedTone":false,"noDivisiveContent":false}'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_stream" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"action" varchar(128) NOT NULL,
	"actor_user_id" uuid,
	"actor_name_snapshot" varchar(256),
	"entity_type" varchar(64),
	"entity_id" uuid,
	"payload" jsonb,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"owner_user_id" uuid,
	"bucket_name" varchar(128),
	"object_path" varchar(2048) NOT NULL,
	"original_file_name" varchar(512),
	"mime_type" varchar(128),
	"file_size_bytes" bigint,
	"entity_type" varchar(64),
	"entity_id" uuid,
	"visibility" "attachment_visibility" DEFAULT 'internal' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"action" varchar(128) NOT NULL,
	"actor_user_id" uuid,
	"actor_email" varchar(320),
	"actor_ip" varchar(64),
	"entity_type" varchar(64),
	"entity_id" uuid,
	"payload" jsonb,
	"change_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"author_user_id" uuid,
	"author_name_snapshot" varchar(256),
	"body" text NOT NULL,
	"parent_comment_id" uuid,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"visibility" "comment_visibility" DEFAULT 'internal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"title" varchar(512) NOT NULL,
	"body" text,
	"entity_type" varchar(64),
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prachar_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"entity_id" uuid NOT NULL,
	"platform" "prachar_platform" NOT NULL,
	"is_done" boolean DEFAULT false NOT NULL,
	"skip_reason" varchar(512),
	"template_ref" varchar(256),
	"done_at" timestamp with time zone,
	"done_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"category" varchar(64) DEFAULT 'other' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vimarsh_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"url" varchar(2048) NOT NULL,
	"resource_type" varchar(32) DEFAULT 'external_link' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vimarsh_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"description" text,
	"description_hi" text,
	"group" varchar(64) DEFAULT 'other' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "departments_or_aayams" ADD CONSTRAINT "departments_or_aayams_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments_or_aayams" ADD CONSTRAINT "departments_or_aayams_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_department_id_departments_or_aayams_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments_or_aayams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_assigned_by_profiles_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_form_configs" ADD CONSTRAINT "event_form_configs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_form_questions" ADD CONSTRAINT "event_form_questions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_poll_options" ADD CONSTRAINT "event_poll_options_poll_id_event_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."event_polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_poll_votes" ADD CONSTRAINT "event_poll_votes_poll_id_event_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."event_polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_poll_votes" ADD CONSTRAINT "event_poll_votes_option_id_event_poll_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."event_poll_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_poll_votes" ADD CONSTRAINT "event_poll_votes_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_polls" ADD CONSTRAINT "event_polls_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_polls" ADD CONSTRAINT "event_polls_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_answers" ADD CONSTRAINT "event_registration_answers_registration_id_event_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_answers" ADD CONSTRAINT "event_registration_answers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_status_history" ADD CONSTRAINT "event_status_history_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_status_history" ADD CONSTRAINT "event_status_history_actor_user_id_profiles_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vritt" ADD CONSTRAINT "event_vritt_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vritt" ADD CONSTRAINT "event_vritt_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vritt" ADD CONSTRAINT "event_vritt_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_department_id_departments_or_aayams_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments_or_aayams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_publications" ADD CONSTRAINT "article_publications_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_publications" ADD CONSTRAINT "article_publications_published_by_profiles_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_reviews" ADD CONSTRAINT "article_reviews_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_reviews" ADD CONSTRAINT "article_reviews_reviewer_user_id_profiles_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_department_id_departments_or_aayams_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments_or_aayams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_user_id_profiles_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_stream" ADD CONSTRAINT "activity_stream_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_stream" ADD CONSTRAINT "activity_stream_actor_user_id_profiles_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_owner_user_id_profiles_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_profiles_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_user_id_profiles_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_profiles_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prachar_statuses" ADD CONSTRAINT "prachar_statuses_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prachar_statuses" ADD CONSTRAINT "prachar_statuses_done_by_profiles_id_fk" FOREIGN KEY ("done_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vimarsh_resources" ADD CONSTRAINT "vimarsh_resources_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vimarsh_resources" ADD CONSTRAINT "vimarsh_resources_topic_id_vimarsh_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."vimarsh_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vimarsh_topics" ADD CONSTRAINT "vimarsh_topics_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_email_org_uidx" ON "profiles" USING btree ("email","org_id");--> statement-breakpoint
CREATE INDEX "profiles_org_idx" ON "profiles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ura_user_idx" ON "user_role_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ura_role_idx" ON "user_role_assignments" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "ura_scope_idx" ON "user_role_assignments" USING btree ("scope_type","org_id");--> statement-breakpoint
CREATE INDEX "efq_event_idx" ON "event_form_questions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "epo_poll_idx" ON "event_poll_options" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "epv_poll_idx" ON "event_poll_votes" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "ep_event_idx" ON "event_polls" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "era_reg_idx" ON "event_registration_answers" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "er_event_idx" ON "event_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "er_phone_event_idx" ON "event_registrations" USING btree ("phone","event_id");--> statement-breakpoint
CREATE INDEX "esh_event_idx" ON "event_status_history" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_org_idx" ON "events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "events_unit_idx" ON "events" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "ap_article_idx" ON "article_publications" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "ar_article_idx" ON "article_reviews" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "articles_org_idx" ON "articles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "articles_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "as_org_idx" ON "activity_stream" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "as_entity_idx" ON "activity_stream" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "as_created_idx" ON "activity_stream" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "att_entity_idx" ON "attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "att_org_idx" ON "attachments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "al_org_idx" ON "audit_logs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "al_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "al_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "al_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "comments_entity_idx" ON "comments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "comments_org_idx" ON "comments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "et_entity_idx" ON "entity_tags" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "et_tag_idx" ON "entity_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "notif_recipient_idx" ON "notifications" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "notif_read_idx" ON "notifications" USING btree ("recipient_user_id","is_read");--> statement-breakpoint
CREATE INDEX "ps_entity_idx" ON "prachar_statuses" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "ps_org_idx" ON "prachar_statuses" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tags_org_idx" ON "tags" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vr_topic_idx" ON "vimarsh_resources" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "vt_org_idx" ON "vimarsh_topics" USING btree ("org_id");