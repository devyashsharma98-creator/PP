CREATE TABLE "content_vishaya_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"vishay_id" uuid NOT NULL,
	"content_type" varchar(32) NOT NULL,
	"content_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cvm_unique_link" UNIQUE("vishay_id","content_type","content_id")
);
--> statement-breakpoint
CREATE TABLE "vishayas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name_en" varchar(256) NOT NULL,
	"name_hi" varchar(256) NOT NULL,
	"description" text,
	"description_hi" text,
	"parent_vishay_id" uuid,
	"color" varchar(32) DEFAULT 'slate' NOT NULL,
	"icon" varchar(48) DEFAULT 'Hash' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vishayas_org_slug_uq" UNIQUE("org_id","slug")
);
--> statement-breakpoint
CREATE TABLE "outreach_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"outreach_type" varchar(32) NOT NULL,
	"related_type" varchar(32),
	"related_id" uuid,
	"title" varchar(512) NOT NULL,
	"description" text,
	"unit_id" uuid,
	"department_id" uuid,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"assigned_to" uuid,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"skip_reason" varchar(512),
	"template_reference" varchar(256),
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_type_config" (
	"type" varchar(32) PRIMARY KEY NOT NULL,
	"org_id" uuid,
	"label_en" varchar(128) NOT NULL,
	"label_hi" varchar(128) NOT NULL,
	"icon" varchar(48),
	"color" varchar(32),
	"fields" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publication_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"publication_id" uuid,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"abstract" text,
	"abstract_hi" text,
	"body" text DEFAULT '' NOT NULL,
	"body_hi" text,
	"author_ids" jsonb,
	"references" text,
	"attachments" jsonb,
	"status" varchar(32) DEFAULT 'submitted' NOT NULL,
	"submitted_by" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewer_id" uuid,
	"review_due_date" timestamp with time zone,
	"review_comment" text,
	"review_comment_hi" text,
	"recommendation" varchar(24),
	"rating" integer,
	"reviewed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512) NOT NULL,
	"subtitle" varchar(512),
	"subtitle_hi" varchar(512),
	"issue_number" varchar(64),
	"publish_date" timestamp with time zone,
	"cover_image_url" varchar(2048),
	"description" text,
	"description_hi" text,
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"visibility" varchar(24) DEFAULT 'public' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"weight" integer DEFAULT 0 NOT NULL,
	"deliverable_type" varchar(24),
	"deliverable_url" varchar(2048),
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"objective" text,
	"objective_hi" text,
	"methodology" text,
	"methodology_hi" text,
	"status" varchar(24) DEFAULT 'proposed' NOT NULL,
	"lead_researcher_id" uuid,
	"team_ids" jsonb,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"budget" varchar(128),
	"expected_outputs" jsonb,
	"actual_outputs" jsonb,
	"progress" integer DEFAULT 0 NOT NULL,
	"submitted_by" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campus_outreach_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"outreach_type" varchar(24) NOT NULL,
	"title" varchar(512) NOT NULL,
	"conducted_by" varchar(256),
	"conducted_date" timestamp with time zone NOT NULL,
	"attendance" integer,
	"follow_up_needed" boolean DEFAULT false NOT NULL,
	"next_planned_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campus_resource_distribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"resource_type" varchar(24) NOT NULL,
	"resource_ref_id" uuid,
	"resource_name" varchar(512) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"distributed_by" uuid,
	"distributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"feedback_received" boolean DEFAULT false NOT NULL,
	"feedback_notes" text
);
--> statement-breakpoint
CREATE TABLE "campus_study_circles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"title_hi" varchar(512),
	"description" text,
	"frequency" varchar(16) DEFAULT 'one_time' NOT NULL,
	"scheduled_date" timestamp with time zone NOT NULL,
	"scheduled_time" varchar(16),
	"assigned_to" uuid,
	"reading_material" text,
	"topic" varchar(512),
	"completed" boolean DEFAULT false NOT NULL,
	"attendance" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_vishaya_map" ADD CONSTRAINT "content_vishaya_map_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_vishaya_map" ADD CONSTRAINT "content_vishaya_map_vishay_id_vishayas_id_fk" FOREIGN KEY ("vishay_id") REFERENCES "public"."vishayas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_vishaya_map" ADD CONSTRAINT "content_vishaya_map_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vishayas" ADD CONSTRAINT "vishayas_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_items" ADD CONSTRAINT "outreach_items_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_items" ADD CONSTRAINT "outreach_items_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_items" ADD CONSTRAINT "outreach_items_department_id_departments_or_aayams_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments_or_aayams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_items" ADD CONSTRAINT "outreach_items_assigned_to_profiles_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_items" ADD CONSTRAINT "outreach_items_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_type_config" ADD CONSTRAINT "outreach_type_config_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_articles" ADD CONSTRAINT "publication_articles_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_articles" ADD CONSTRAINT "publication_articles_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_articles" ADD CONSTRAINT "publication_articles_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_articles" ADD CONSTRAINT "publication_articles_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_milestones" ADD CONSTRAINT "research_milestones_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_milestones" ADD CONSTRAINT "research_milestones_project_id_research_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."research_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_lead_researcher_id_scholars_id_fk" FOREIGN KEY ("lead_researcher_id") REFERENCES "public"."scholars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_outreach_log" ADD CONSTRAINT "campus_outreach_log_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_outreach_log" ADD CONSTRAINT "campus_outreach_log_unit_id_campus_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."campus_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_resource_distribution" ADD CONSTRAINT "campus_resource_distribution_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_resource_distribution" ADD CONSTRAINT "campus_resource_distribution_unit_id_campus_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."campus_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_resource_distribution" ADD CONSTRAINT "campus_resource_distribution_distributed_by_profiles_id_fk" FOREIGN KEY ("distributed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_study_circles" ADD CONSTRAINT "campus_study_circles_org_id_org_settings_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_study_circles" ADD CONSTRAINT "campus_study_circles_unit_id_campus_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."campus_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_study_circles" ADD CONSTRAINT "campus_study_circles_assigned_to_profiles_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cvm_content_idx" ON "content_vishaya_map" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "cvm_vishay_idx" ON "content_vishaya_map" USING btree ("vishay_id");--> statement-breakpoint
CREATE INDEX "cvm_org_idx" ON "content_vishaya_map" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vishayas_org_idx" ON "vishayas" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vishayas_parent_idx" ON "vishayas" USING btree ("parent_vishay_id");--> statement-breakpoint
CREATE INDEX "vishayas_sort_idx" ON "vishayas" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "outreach_org_idx" ON "outreach_items" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "outreach_type_idx" ON "outreach_items" USING btree ("outreach_type");--> statement-breakpoint
CREATE INDEX "outreach_status_idx" ON "outreach_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outreach_related_idx" ON "outreach_items" USING btree ("related_type","related_id");--> statement-breakpoint
CREATE INDEX "outreach_due_idx" ON "outreach_items" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "pub_articles_org_idx" ON "publication_articles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pub_articles_pub_idx" ON "publication_articles" USING btree ("publication_id");--> statement-breakpoint
CREATE INDEX "pub_articles_status_idx" ON "publication_articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pub_articles_submitter_idx" ON "publication_articles" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "publications_org_idx" ON "publications" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "publications_status_idx" ON "publications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "milestones_project_idx" ON "research_milestones" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "milestones_org_idx" ON "research_milestones" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "research_org_idx" ON "research_projects" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "research_status_idx" ON "research_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "research_lead_idx" ON "research_projects" USING btree ("lead_researcher_id");--> statement-breakpoint
CREATE INDEX "campus_outreach_unit_idx" ON "campus_outreach_log" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "campus_outreach_org_idx" ON "campus_outreach_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "campus_outreach_date_idx" ON "campus_outreach_log" USING btree ("conducted_date");--> statement-breakpoint
CREATE INDEX "campus_resources_unit_idx" ON "campus_resource_distribution" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "campus_resources_org_idx" ON "campus_resource_distribution" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "study_circles_unit_idx" ON "campus_study_circles" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "study_circles_org_idx" ON "campus_study_circles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "study_circles_date_idx" ON "campus_study_circles" USING btree ("scheduled_date");