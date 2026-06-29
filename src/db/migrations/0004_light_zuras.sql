CREATE TYPE "public"."circular_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."circular_scope" AS ENUM('org', 'unit', 'department');--> statement-breakpoint
CREATE TYPE "public"."conference_status" AS ENUM('draft', 'planning', 'registration_open', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planned', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."registration_category" AS ENUM('delegate', 'student', 'speaker', 'vip', 'media', 'other');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('keynote', 'panel', 'paper_presentation', 'workshop', 'cultural', 'other');--> statement-breakpoint
CREATE TYPE "public"."survey_status" AS ENUM('draft', 'published', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."volunteer_activity_type" AS ENUM('shakha_attendance', 'event_duty', 'training', 'outreach', 'admin', 'other');--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"description" text,
	"assignee_user_id" uuid,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"due_date" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(512) NOT NULL,
	"name_hi" varchar(512),
	"description" text,
	"department_id" uuid,
	"status" "project_status" DEFAULT 'planned' NOT NULL,
	"owner_user_id" uuid,
	"deadline" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"depends_on_task_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circular_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circular_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circulars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"body" text NOT NULL,
	"body_hi" text,
	"priority" "circular_priority" DEFAULT 'normal' NOT NULL,
	"scope" "circular_scope" DEFAULT 'org' NOT NULL,
	"scope_entity_id" uuid,
	"author_user_id" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"volunteer_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"activity_type" "volunteer_activity_type" DEFAULT 'other' NOT NULL,
	"description" text,
	"hours_logged" integer,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"event_id" uuid,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"skills" text[],
	"availability" jsonb,
	"joined_at" timestamp with time zone,
	"service_span_months" integer,
	"emergency_contact" varchar(64),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "volunteer_profiles_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"filename" varchar(512) NOT NULL,
	"storage_key" varchar(1024) NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"size_bytes" integer NOT NULL,
	"bucket" varchar(128) DEFAULT 'media',
	"category" varchar(64) DEFAULT 'other' NOT NULL,
	"alt_text" text,
	"alt_text_hi" text,
	"tags" text[],
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conference_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conference_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(320),
	"phone" varchar(24),
	"organization" varchar(256),
	"category" "registration_category" DEFAULT 'delegate' NOT NULL,
	"is_attended" boolean DEFAULT false NOT NULL,
	"notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conference_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conference_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"description" text,
	"description_hi" text,
	"session_type" "session_type" DEFAULT 'other' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"venue" varchar(256),
	"venue_hi" varchar(256),
	"chairperson_name" varchar(256),
	"chairperson_name_hi" varchar(256),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"unit_id" uuid,
	"department_id" uuid,
	"location_id" uuid,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"theme" text,
	"theme_hi" text,
	"description" text,
	"description_hi" text,
	"venue" varchar(512),
	"venue_hi" varchar(512),
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"status" "conference_status" DEFAULT 'draft' NOT NULL,
	"registration_enabled" boolean DEFAULT false NOT NULL,
	"max_registrations" integer,
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"profile_id" uuid,
	"name" varchar(256) NOT NULL,
	"name_hi" varchar(256),
	"bio" text,
	"bio_hi" text,
	"photo_url" varchar(1024),
	"topic" varchar(512),
	"topic_hi" varchar(512),
	"affiliation" varchar(256),
	"affiliation_hi" varchar(256),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"question_key" varchar(64) NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"question_key" varchar(64) NOT NULL,
	"label" varchar(512) NOT NULL,
	"label_hi" varchar(512),
	"question_type" "question_type" DEFAULT 'text' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"options_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "survey_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"respondent_name" varchar(256),
	"respondent_email" varchar(256),
	"respondent_phone" varchar(24),
	"submitted_by" uuid,
	"metadata" jsonb,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"description" text,
	"description_hi" text,
	"status" "survey_status" DEFAULT 'draft' NOT NULL,
	"scope" varchar(32) DEFAULT 'org' NOT NULL,
	"scope_entity_id" uuid,
	"allow_multiple_submissions" boolean DEFAULT false NOT NULL,
	"max_submissions" integer,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(256) NOT NULL,
	"title_hi" varchar(256) NOT NULL,
	"author" varchar(256) NOT NULL,
	"category" varchar(64) NOT NULL,
	"pages" integer DEFAULT 0 NOT NULL,
	"year" varchar(64) DEFAULT '' NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"description_hi" text DEFAULT '' NOT NULL,
	"cover_color" varchar(128) DEFAULT 'from-amber-600 to-orange-700' NOT NULL,
	"read_url" text,
	"download_url" text,
	"storage_key" varchar(1024),
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_texts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "scholars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" varchar(256) NOT NULL,
	"name_hi" varchar(256) NOT NULL,
	"email" varchar(320),
	"phone" varchar(32),
	"expertise" text[] DEFAULT '{}'::text[] NOT NULL,
	"affiliation" varchar(256),
	"affiliation_hi" varchar(256),
	"designation" varchar(128),
	"city" varchar(128),
	"bio" text DEFAULT '' NOT NULL,
	"bio_hi" text DEFAULT '' NOT NULL,
	"available_for" text[] DEFAULT '{}'::text[] NOT NULL,
	"photo_url" text,
	"linked_profile_id" uuid,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scholars_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "campus_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" varchar(256) NOT NULL,
	"name_hi" varchar(256) NOT NULL,
	"unit_type" varchar(48) DEFAULT 'College' NOT NULL,
	"city" varchar(128),
	"state" varchar(128),
	"coordinator_name" varchar(256),
	"coordinator_name_hi" varchar(256),
	"coordinator_email" varchar(320),
	"coordinator_phone" varchar(32),
	"member_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(32) DEFAULT 'Active' NOT NULL,
	"focus_areas" text[] DEFAULT '{}'::text[] NOT NULL,
	"established_year" varchar(16),
	"description" text DEFAULT '' NOT NULL,
	"description_hi" text DEFAULT '' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campus_units_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "vimarsh_thread_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_user_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vimarsh_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(300) NOT NULL,
	"title_hi" varchar(300) NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"body_hi" text DEFAULT '' NOT NULL,
	"category" varchar(64) DEFAULT 'General' NOT NULL,
	"author_user_id" uuid,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vimarsh_threads_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "featured_image" varchar(2048);--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assignee_user_id_profiles_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_department_id_departments_or_aayams_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments_or_aayams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_user_id_profiles_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_project_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_project_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."project_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circular_reads" ADD CONSTRAINT "circular_reads_circular_id_circulars_id_fk" FOREIGN KEY ("circular_id") REFERENCES "public"."circulars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circular_reads" ADD CONSTRAINT "circular_reads_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circulars" ADD CONSTRAINT "circulars_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circulars" ADD CONSTRAINT "circulars_author_user_id_profiles_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_activities" ADD CONSTRAINT "volunteer_activities_volunteer_id_volunteer_profiles_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_activities" ADD CONSTRAINT "volunteer_activities_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_activities" ADD CONSTRAINT "volunteer_activities_recorded_by_profiles_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_registrations" ADD CONSTRAINT "conference_registrations_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_sessions" ADD CONSTRAINT "conference_sessions_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_department_id_departments_or_aayams_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments_or_aayams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_speakers" ADD CONSTRAINT "session_speakers_session_id_conference_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."conference_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_speakers" ADD CONSTRAINT "session_speakers_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_submission_id_survey_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."survey_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_texts" ADD CONSTRAINT "library_texts_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholars" ADD CONSTRAINT "scholars_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholars" ADD CONSTRAINT "scholars_linked_profile_id_profiles_id_fk" FOREIGN KEY ("linked_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_units" ADD CONSTRAINT "campus_units_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vimarsh_thread_replies" ADD CONSTRAINT "vimarsh_thread_replies_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vimarsh_thread_replies" ADD CONSTRAINT "vimarsh_thread_replies_thread_id_vimarsh_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."vimarsh_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vimarsh_thread_replies" ADD CONSTRAINT "vimarsh_thread_replies_author_user_id_profiles_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vimarsh_threads" ADD CONSTRAINT "vimarsh_threads_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vimarsh_threads" ADD CONSTRAINT "vimarsh_threads_author_user_id_profiles_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_tasks_project_idx" ON "project_tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_tasks_status_idx" ON "project_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_tasks_assignee_idx" ON "project_tasks" USING btree ("assignee_user_id");--> statement-breakpoint
CREATE INDEX "projects_org_idx" ON "projects" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_dependencies_task_idx" ON "task_dependencies" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_dependencies_depends_idx" ON "task_dependencies" USING btree ("depends_on_task_id");--> statement-breakpoint
CREATE INDEX "circular_reads_circular_idx" ON "circular_reads" USING btree ("circular_id");--> statement-breakpoint
CREATE INDEX "circular_reads_user_idx" ON "circular_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "circulars_org_idx" ON "circulars" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "circulars_priority_idx" ON "circulars" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "circulars_published_at_idx" ON "circulars" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "volunteer_activities_volunteer_idx" ON "volunteer_activities" USING btree ("volunteer_id");--> statement-breakpoint
CREATE INDEX "volunteer_activities_org_idx" ON "volunteer_activities" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "volunteer_profiles_org_idx" ON "volunteer_profiles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "volunteer_profiles_profile_idx" ON "volunteer_profiles" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "media_assets_org_idx" ON "media_assets" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "media_assets_uploader_idx" ON "media_assets" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "media_assets_category_idx" ON "media_assets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "media_assets_created_at_idx" ON "media_assets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cr_conf_idx" ON "conference_registrations" USING btree ("conference_id");--> statement-breakpoint
CREATE INDEX "cs_conf_idx" ON "conference_sessions" USING btree ("conference_id");--> statement-breakpoint
CREATE INDEX "cs_session_type_idx" ON "conference_sessions" USING btree ("session_type");--> statement-breakpoint
CREATE INDEX "conferences_org_idx" ON "conferences" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "conferences_status_idx" ON "conferences" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conferences_starts_at_idx" ON "conferences" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "ss_session_idx" ON "session_speakers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "survey_answers_submission_idx" ON "survey_answers" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "survey_questions_survey_idx" ON "survey_questions" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_submissions_survey_idx" ON "survey_submissions" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_submissions_submitted_by_idx" ON "survey_submissions" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "surveys_org_idx" ON "surveys" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "surveys_status_idx" ON "surveys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "surveys_created_by_idx" ON "surveys" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "library_texts_org_idx" ON "library_texts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "library_texts_category_idx" ON "library_texts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "library_texts_published_idx" ON "library_texts" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "library_texts_sort_idx" ON "library_texts" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "scholars_org_idx" ON "scholars" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "scholars_published_idx" ON "scholars" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "scholars_sort_idx" ON "scholars" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "campus_units_org_idx" ON "campus_units" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "campus_units_status_idx" ON "campus_units" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campus_units_sort_idx" ON "campus_units" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "vimarsh_replies_thread_idx" ON "vimarsh_thread_replies" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "vimarsh_replies_org_idx" ON "vimarsh_thread_replies" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vimarsh_threads_org_idx" ON "vimarsh_threads" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vimarsh_threads_category_idx" ON "vimarsh_threads" USING btree ("category");--> statement-breakpoint
CREATE INDEX "vimarsh_threads_created_at_idx" ON "vimarsh_threads" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "epv_poll_submitted_by_uidx" ON "event_poll_votes" USING btree ("poll_id","submitted_by") WHERE "event_poll_votes"."submitted_by" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "epv_poll_public_client_uidx" ON "event_poll_votes" USING btree ("poll_id","submitted_from_ip","submitted_user_agent") WHERE ("event_poll_votes"."submitted_by" is null and "event_poll_votes"."submitted_from_ip" is not null and "event_poll_votes"."submitted_user_agent" is not null);