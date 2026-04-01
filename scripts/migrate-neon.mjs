import pg from 'pg';
const { Client } = pg;

const NEON_URL = 'postgresql://neondb_owner:npg_DpuA4BbyTzC0@ep-ancient-night-aehdo40b.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({ connectionString: NEON_URL });

async function run() {
  await client.connect();
  console.log('Connected to Neon!');

  // Step 1: Auth schema placeholder (replaces Supabase auth.uid())
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS auth;

    -- Supabase-compatible roles (for RLS policies)
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
      END IF;
    END $$;

    -- Grant anon/authenticated to neondb_owner
    GRANT anon, authenticated, service_role TO neondb_owner;

    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE,
      raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $$
      SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
    $$;
  `);
  console.log('Auth schema created');

  // Step 2: Extensions
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS extensions;
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
  `);
  console.log('Extensions installed');

  // Step 3: Custom types
  await client.query(`
    DO $$ BEGIN CREATE TYPE public.event_status AS ENUM ('draft','pending_aayam_review','pending_final_approval','published','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE public.article_status AS ENUM ('draft','pending_unit_head_review','pending_aayam_review','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE public.poll_type AS ENUM ('date','general'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE public.question_type AS ENUM ('text','yesno','single_choice','multi_choice','number'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE public.assignment_scope_type AS ENUM ('org','unit','department','event','article'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE public.attachment_visibility AS ENUM ('private','org','public'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE public.notification_kind AS ENUM ('workflow','event_review','article_review','registration','poll_result','reminder','system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE public.comment_visibility AS ENUM ('org','internal','public'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE public.article_review_decision AS ENUM ('approved','forwarded','changes_requested','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  console.log('Custom types created');

  // Step 4: Updated_at trigger function
  await client.query(`
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN new.updated_at := now(); RETURN new; END; $$;
  `);

  // Step 5: Core tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.org_settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_code text NOT NULL UNIQUE,
      org_name text NOT NULL,
      default_timezone text NOT NULL DEFAULT 'Asia/Kolkata',
      feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
      settings jsonb NOT NULL DEFAULT '{}'::jsonb,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.units (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
      parent_unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
      code text NOT NULL,
      name text NOT NULL,
      name_hi text,
      unit_kind text NOT NULL DEFAULT 'unit',
      is_active boolean NOT NULL DEFAULT true,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (org_id, code)
    );

    CREATE TABLE IF NOT EXISTS public.departments_or_aayams (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
      unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
      code text NOT NULL,
      name text NOT NULL,
      name_hi text,
      department_kind text NOT NULL DEFAULT 'aayam',
      is_active boolean NOT NULL DEFAULT true,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (org_id, code)
    );

    CREATE TABLE IF NOT EXISTS public.locations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
      unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
      name text NOT NULL,
      city text,
      address text,
      latitude numeric(9,6),
      longitude numeric(9,6),
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL UNIQUE,
      name text NOT NULL,
      name_hi text,
      description text,
      is_system boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      org_id uuid REFERENCES public.org_settings(id) ON DELETE SET NULL,
      default_unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
      default_department_id uuid REFERENCES public.departments_or_aayams(id) ON DELETE SET NULL,
      email text,
      phone text,
      display_name text,
      preferred_language text NOT NULL DEFAULT 'en',
      is_active boolean NOT NULL DEFAULT true,
      profile_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT profiles_preferred_language_chk CHECK (preferred_language IN ('en','hi'))
    );

    CREATE OR REPLACE VIEW public.app_users AS
    SELECT id, org_id, default_unit_id, default_department_id, email, phone,
           display_name, preferred_language, is_active, profile_metadata, created_at, updated_at
    FROM public.profiles;

    CREATE TABLE IF NOT EXISTS public.user_role_assignments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
      scope_type public.assignment_scope_type NOT NULL DEFAULT 'org',
      org_id uuid REFERENCES public.org_settings(id) ON DELETE CASCADE,
      unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
      department_id uuid REFERENCES public.departments_or_aayams(id) ON DELETE CASCADE,
      scope_entity_id uuid,
      is_primary boolean NOT NULL DEFAULT false,
      starts_at timestamptz,
      ends_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT user_role_assignments_window_chk CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
    );

    CREATE TABLE IF NOT EXISTS public.workflow_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
      code text NOT NULL,
      name text NOT NULL,
      entity_type text NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      config jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (org_id, code)
    );

    CREATE TABLE IF NOT EXISTS public.workflow_steps (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      template_id uuid NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
      step_order integer NOT NULL,
      step_key text NOT NULL,
      step_name text NOT NULL,
      required_role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
      is_required boolean NOT NULL DEFAULT true,
      config jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (template_id, step_order),
      UNIQUE (template_id, step_key)
    );

    CREATE TABLE IF NOT EXISTS public.tags (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
      tag_type text NOT NULL DEFAULT 'general',
      tag_key text NOT NULL,
      label text NOT NULL,
      color text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (org_id, tag_type, tag_key)
    );

    CREATE TABLE IF NOT EXISTS public.events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
      unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
      department_id uuid REFERENCES public.departments_or_aayams(id) ON DELETE SET NULL,
      location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
      workflow_template_id uuid REFERENCES public.workflow_templates(id) ON DELETE SET NULL,
      title text NOT NULL,
      description text,
      status public.event_status NOT NULL DEFAULT 'draft',
      starts_at timestamptz NOT NULL,
      ends_at timestamptz,
      timezone text NOT NULL DEFAULT 'Asia/Kolkata',
      date_label_override text,
      date_source text NOT NULL DEFAULT 'manual',
      submitted_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      submitted_by_name_snapshot text,
      checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
      report text,
      image_url text,
      video_url text,
      registration_public_enabled boolean NOT NULL DEFAULT false,
      voting_public_enabled boolean NOT NULL DEFAULT false,
      public_page_enabled boolean NOT NULL DEFAULT false,
      published_at timestamptz,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT events_time_window_chk CHECK (ends_at IS NULL OR ends_at >= starts_at)
    );

    CREATE TABLE IF NOT EXISTS public.event_status_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      old_status public.event_status,
      new_status public.event_status NOT NULL,
      changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      reason text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.event_form_configs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
      is_enabled boolean NOT NULL DEFAULT true,
      is_public boolean NOT NULL DEFAULT true,
      opens_at timestamptz,
      closes_at timestamptz,
      max_registrations integer,
      allow_multiple_submissions boolean NOT NULL DEFAULT false,
      collect_phone boolean NOT NULL DEFAULT true,
      collect_city boolean NOT NULL DEFAULT true,
      collect_attending_count boolean NOT NULL DEFAULT true,
      collect_special_needs boolean NOT NULL DEFAULT true,
      collect_notes boolean NOT NULL DEFAULT true,
      created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT event_form_configs_window_chk CHECK (closes_at IS NULL OR opens_at IS NULL OR closes_at >= opens_at)
    );

    CREATE TABLE IF NOT EXISTS public.event_form_questions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      form_config_id uuid NOT NULL REFERENCES public.event_form_configs(id) ON DELETE CASCADE,
      question_key text NOT NULL,
      label text NOT NULL,
      label_hi text,
      question_type public.question_type NOT NULL DEFAULT 'text',
      is_required boolean NOT NULL DEFAULT false,
      display_order integer NOT NULL DEFAULT 0,
      options_json jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (form_config_id, question_key)
    );

    CREATE TABLE IF NOT EXISTS public.event_registrations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      registrant_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      name text NOT NULL,
      phone text,
      city text,
      attending_count integer NOT NULL DEFAULT 1,
      has_special_needs boolean NOT NULL DEFAULT false,
      notes text,
      answers_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      public_submission_key_hash text,
      submitted_from_ip inet,
      submitted_user_agent text,
      created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT event_registrations_attending_count_chk CHECK (attending_count > 0)
    );

    CREATE TABLE IF NOT EXISTS public.event_registration_answers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
      question_id uuid NOT NULL REFERENCES public.event_form_questions(id) ON DELETE CASCADE,
      answer_text text,
      answer_json jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (registration_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS public.event_polls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      question text NOT NULL,
      question_hi text,
      poll_type public.poll_type NOT NULL DEFAULT 'general',
      is_public_voting boolean NOT NULL DEFAULT true,
      opens_at timestamptz,
      closes_at timestamptz,
      is_finalized boolean NOT NULL DEFAULT false,
      finalized_at timestamptz,
      finalized_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      winner_option_id uuid,
      created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT event_polls_window_chk CHECK (closes_at IS NULL OR opens_at IS NULL OR closes_at >= opens_at)
    );

    CREATE TABLE IF NOT EXISTS public.event_poll_options (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id uuid NOT NULL REFERENCES public.event_polls(id) ON DELETE CASCADE,
      label text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      scheduled_at timestamptz,
      created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (poll_id, sort_order)
    );

    ALTER TABLE public.event_polls
      DROP CONSTRAINT IF EXISTS event_polls_winner_option_fk,
      ADD CONSTRAINT event_polls_winner_option_fk
      FOREIGN KEY (winner_option_id) REFERENCES public.event_poll_options(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS public.event_poll_votes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id uuid NOT NULL REFERENCES public.event_polls(id) ON DELETE CASCADE,
      option_id uuid NOT NULL REFERENCES public.event_poll_options(id) ON DELETE CASCADE,
      actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      voter_fingerprint_hash text,
      submitted_from_ip inet,
      submitted_user_agent text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_event_poll_votes_auth ON public.event_poll_votes(poll_id, actor_user_id) WHERE actor_user_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS uq_event_poll_votes_fingerprint ON public.event_poll_votes(poll_id, voter_fingerprint_hash) WHERE voter_fingerprint_hash IS NOT NULL;

    CREATE TABLE IF NOT EXISTS public.articles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
      unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
      department_id uuid REFERENCES public.departments_or_aayams(id) ON DELETE SET NULL,
      title text NOT NULL,
      content text NOT NULL,
      summary text,
      category text NOT NULL,
      status public.article_status NOT NULL DEFAULT 'draft',
      author_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      author_name_snapshot text,
      social_url text,
      values_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
      published_at timestamptz,
      created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.article_reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
      reviewer_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      review_step text,
      decision public.article_review_decision NOT NULL,
      review_notes text,
      edits jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.article_publications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
      channel text NOT NULL DEFAULT 'feed',
      published_url text,
      published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      published_at timestamptz NOT NULL DEFAULT now(),
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.prachar_statuses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
      whatsapp_done boolean NOT NULL DEFAULT false,
      facebook_done boolean NOT NULL DEFAULT false,
      instagram_done boolean NOT NULL DEFAULT false,
      telegram_done boolean NOT NULL DEFAULT false,
      last_updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      last_updated_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid REFERENCES public.org_settings(id) ON DELETE CASCADE,
      recipient_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      kind public.notification_kind NOT NULL DEFAULT 'workflow',
      title text NOT NULL,
      body text,
      link_path text,
      entity_type text,
      entity_id uuid,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      is_read boolean NOT NULL DEFAULT false,
      read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.attachments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid REFERENCES public.org_settings(id) ON DELETE CASCADE,
      owner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      bucket_name text NOT NULL,
      object_path text NOT NULL,
      original_file_name text,
      mime_type text,
      file_size_bytes bigint,
      visibility public.attachment_visibility NOT NULL DEFAULT 'private',
      entity_type text,
      entity_id uuid,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (bucket_name, object_path)
    );

    CREATE TABLE IF NOT EXISTS public.audit_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid REFERENCES public.org_settings(id) ON DELETE CASCADE,
      actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      action text NOT NULL,
      entity_type text NOT NULL,
      entity_id uuid,
      change_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.entity_tags (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
      entity_type text NOT NULL,
      entity_id uuid NOT NULL,
      created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tag_id, entity_type, entity_id)
    );

    CREATE TABLE IF NOT EXISTS public.comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid REFERENCES public.org_settings(id) ON DELETE CASCADE,
      entity_type text NOT NULL,
      entity_id uuid NOT NULL,
      parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
      author_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      visibility public.comment_visibility NOT NULL DEFAULT 'org',
      body text NOT NULL,
      is_deleted boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.activity_stream (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid REFERENCES public.org_settings(id) ON DELETE CASCADE,
      actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      action text NOT NULL,
      entity_type text NOT NULL,
      entity_id uuid,
      summary text,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log('Core tables created');

  // Step 6: Phase 2 - Workflow Approvals
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.workflow_approvals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type text NOT NULL CHECK (entity_type IN ('event', 'article')),
      entity_id uuid NOT NULL,
      from_status text,
      to_status text NOT NULL,
      actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
      actor_role text NOT NULL,
      step_label text,
      is_final_step boolean DEFAULT false,
      remarks text,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE OR REPLACE FUNCTION public.fn_prevent_workflow_approval_modification()
    RETURNS trigger AS $$
    BEGIN RAISE EXCEPTION 'Workflow approval records are immutable.'; END;
    $$ LANGUAGE plpgsql;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_workflow_approvals_immutable_update') THEN
        CREATE TRIGGER tr_workflow_approvals_immutable_update
        BEFORE UPDATE ON public.workflow_approvals
        FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_workflow_approval_modification();
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_workflow_approvals_immutable_delete') THEN
        CREATE TRIGGER tr_workflow_approvals_immutable_delete
        BEFORE DELETE ON public.workflow_approvals
        FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_workflow_approval_modification();
      END IF;
    END $$;

    ALTER TABLE public.workflow_approvals ENABLE ROW LEVEL SECURITY;
  `);
  console.log('Phase 2 workflow_approvals created');

  // Step 7: Phase 2 - Enum expansion
  await client.query(`
    ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'submitted_by_unit';
    ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'pending_vibhag_review';
    ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'pending_prant_authorization';
    ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'pending_prant_dual_authorization';
    ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'authorized_public';
    ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'escalated_kshetra';
    ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'returned_for_revision';
    ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'rejected';
    ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'pending_vibhag_review';
    ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'pending_prant_authorization';
    ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'pending_prant_dual_authorization';
    ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'authorized_public';
    ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'escalated_kshetra';
    ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'returned_for_revision';
    ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'rejected';
  `);
  console.log('Phase 2 enums expanded');

  // Step 8: Bhopal rollout - extend units, events, articles, prachar
  await client.query(`
    ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_unit_kind_check;
    ALTER TABLE public.units ADD CONSTRAINT units_unit_kind_check
      CHECK (unit_kind IN ('kshetra', 'prant', 'vibhag', 'zila', 'unit'));

    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS vritt_attendance_count integer DEFAULT 0;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS vritt_media_urls text[] DEFAULT '{}'::text[];
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS vritt_content text;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS vritt_status text DEFAULT 'draft';
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS vritt_updated_at timestamptz DEFAULT now();
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS vritt_checked_in_count integer DEFAULT 0;

    DO $$ BEGIN
      ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_vritt_status_check;
      ALTER TABLE public.events ADD CONSTRAINT events_vritt_status_check
        CHECK (vritt_status IN ('draft', 'submitted', 'reviewed'));
    EXCEPTION WHEN undefined_object THEN NULL; END $$;

    ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS document_url text;

    ALTER TABLE public.prachar_statuses ADD COLUMN IF NOT EXISTS whatsapp_skip_reason text;
    ALTER TABLE public.prachar_statuses ADD COLUMN IF NOT EXISTS facebook_skip_reason text;
    ALTER TABLE public.prachar_statuses ADD COLUMN IF NOT EXISTS instagram_skip_reason text;
    ALTER TABLE public.prachar_statuses ADD COLUMN IF NOT EXISTS telegram_skip_reason text;
    ALTER TABLE public.prachar_statuses ADD COLUMN IF NOT EXISTS template_reference text;
    ALTER TABLE public.prachar_statuses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

    CREATE TABLE IF NOT EXISTS public.vimarsh_topics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
      title text NOT NULL,
      title_hi text,
      description text,
      sort_order integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.vimarsh_resources (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_id uuid NOT NULL REFERENCES public.vimarsh_topics(id) ON DELETE CASCADE,
      resource_type text NOT NULL CHECK (resource_type IN ('link', 'video', 'book')),
      title text NOT NULL,
      url text NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_vimarsh_topics_org_id ON public.vimarsh_topics(org_id);
    CREATE INDEX IF NOT EXISTS idx_vimarsh_resources_topic_id ON public.vimarsh_resources(topic_id);
    CREATE INDEX IF NOT EXISTS idx_events_vritt_status ON public.events(vritt_status);

    ALTER TABLE public.vimarsh_topics ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.vimarsh_resources ENABLE ROW LEVEL SECURITY;
  `);
  console.log('Bhopal rollout + Vimarsh tables created');

  // Step 9: Indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
    CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events(starts_at);
    CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
    CREATE INDEX IF NOT EXISTS idx_event_polls_event_id ON public.event_polls(event_id);
    CREATE INDEX IF NOT EXISTS idx_event_poll_votes_poll_id ON public.event_poll_votes(poll_id);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON public.notifications(recipient_user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at desc);
    CREATE INDEX IF NOT EXISTS idx_activity_stream_entity ON public.activity_stream(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
  `);
  console.log('Indexes created');

  // Step 10: Updated_at triggers for all tables
  await client.query(`
    DO $$ DECLARE t text;
    BEGIN
      FOREACH t IN ARRAY ARRAY[
        'org_settings','units','departments_or_aayams','locations','roles','profiles','user_role_assignments',
        'workflow_templates','workflow_steps','tags','events','event_status_history','event_form_configs',
        'event_form_questions','event_registrations','event_registration_answers','event_polls','event_poll_options',
        'event_poll_votes','articles','article_reviews','article_publications','prachar_statuses','notifications',
        'attachments','entity_tags','comments','activity_stream','vimarsh_topics'
      ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_set_updated_at_' || t, t);
        EXECUTE format(
          'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
          'trg_set_updated_at_' || t, t
        );
      END LOOP;
    END $$;
  `);
  console.log('Updated_at triggers created');

  // Step 11: RLS helper functions
  await client.query(`
    CREATE OR REPLACE FUNCTION public.current_role_codes()
    RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$
      SELECT COALESCE(array_agg(r.code), '{}'::text[])
      FROM public.user_role_assignments ura
      JOIN public.roles r ON r.id = ura.role_id
      WHERE ura.user_id = auth.uid()
        AND (ura.starts_at IS NULL OR ura.starts_at <= now())
        AND (ura.ends_at IS NULL OR ura.ends_at >= now());
    $$;

    CREATE OR REPLACE FUNCTION public.has_any_role(codes text[])
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$
      SELECT EXISTS (
        SELECT 1 FROM unnest(public.current_role_codes()) rc WHERE rc = ANY(codes)
      );
    $$;

    CREATE OR REPLACE FUNCTION public.is_manager()
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$
      SELECT public.has_any_role(array['super_admin','org_admin','vibhag_pramukh','aayam_pramukh','unit_head']);
    $$;

    CREATE OR REPLACE FUNCTION public.can_manage_event(p_event_id uuid)
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$
      SELECT public.is_manager() OR EXISTS (
        SELECT 1 FROM public.events e WHERE e.id = p_event_id
          AND e.submitted_by_user_id = auth.uid()
          AND e.status IN ('draft','pending_aayam_review','pending_final_approval')
      );
    $$;

    CREATE OR REPLACE FUNCTION public.can_manage_article(p_article_id uuid)
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$
      SELECT public.is_manager() OR EXISTS (
        SELECT 1 FROM public.articles a WHERE a.id = p_article_id AND a.author_user_id = auth.uid()
      );
    $$;

    CREATE OR REPLACE FUNCTION public.event_public_registration_open(p_event_id uuid)
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$
      SELECT EXISTS (
        SELECT 1 FROM public.events e
        LEFT JOIN public.event_form_configs fc ON fc.event_id = e.id
        WHERE e.id = p_event_id AND e.status = 'published'
          AND e.registration_public_enabled = true
          AND COALESCE(fc.is_enabled, true) = true
          AND COALESCE(fc.is_public, true) = true
          AND (fc.opens_at IS NULL OR fc.opens_at <= now())
          AND (fc.closes_at IS NULL OR fc.closes_at >= now())
      );
    $$;

    CREATE OR REPLACE FUNCTION public.poll_public_voting_open(p_poll_id uuid)
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$
      SELECT EXISTS (
        SELECT 1 FROM public.event_polls p
        JOIN public.events e ON e.id = p.event_id
        WHERE p.id = p_poll_id AND e.status = 'published'
          AND e.voting_public_enabled = true AND p.is_public_voting = true
          AND p.is_finalized = false
          AND (p.opens_at IS NULL OR p.opens_at <= now())
          AND (p.closes_at IS NULL OR p.closes_at >= now())
      );
    $$;

    GRANT EXECUTE ON FUNCTION public.current_role_codes() TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.has_any_role(text[]) TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.is_manager() TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.can_manage_event(uuid) TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.can_manage_article(uuid) TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.event_public_registration_open(uuid) TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.poll_public_voting_open(uuid) TO anon, authenticated;
  `);
  console.log('RLS helper functions created');

  // Step 12: Enable RLS on core tables
  await client.query(`
    DO $$ DECLARE t text;
    BEGIN
      FOREACH t IN ARRAY ARRAY[
        'org_settings','units','departments_or_aayams','locations','roles','profiles','user_role_assignments',
        'workflow_templates','workflow_steps','tags','events','event_status_history','event_form_configs',
        'event_form_questions','event_registrations','event_registration_answers','event_polls','event_poll_options',
        'event_poll_votes','articles','article_reviews','article_publications','prachar_statuses','notifications',
        'attachments','audit_logs','entity_tags','comments','activity_stream','workflow_approvals'
      ] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      END LOOP;
    END $$;
  `);

  // Step 13: Seed data
  await client.query(`
    INSERT INTO public.roles (code, name, name_hi, description, is_system) VALUES
      ('super_admin', 'Super Admin', 'सुपर एडमिन', 'Platform super administrator', true),
      ('org_admin', 'Org Admin', 'संगठन एडमिन', 'Organization administrator', true),
      ('vibhag_pramukh', 'Vibhag Pramukh', 'विभाग प्रमुख', 'Divisional reviewer/approver', true),
      ('aayam_pramukh', 'Aayam Pramukh', 'आयाम प्रमुख', 'Aayam reviewer', true),
      ('unit_head', 'Unit Head', 'यूनिट प्रमुख', 'Unit reviewer', true),
      ('karyakarta', 'Karyakarta', 'कार्यकर्ता', 'Contributor/member', true),
      ('prant_sanyojak', 'Prant Sanyojak', 'प्रांत संयोजक', 'Prant-level coordinator', true),
      ('prant_aayam_pramukh', 'Prant Aayam Pramukh', 'प्रांत आयाम प्रमुख', 'Prant-level aayam approval', true),
      ('kshetra_reviewer', 'Kshetra Reviewer', 'क्षेत्र समीक्षक', 'Kshetra-level escalation reviewer', true)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, name_hi = EXCLUDED.name_hi, description = EXCLUDED.description, updated_at = now();

    INSERT INTO public.org_settings (org_code, org_name, default_timezone)
    VALUES ('pragya-pravah', 'Pragya Pravah', 'Asia/Kolkata')
    ON CONFLICT (org_code) DO NOTHING;

    WITH org_row AS (SELECT id FROM public.org_settings WHERE org_code = 'pragya-pravah')
    INSERT INTO public.units (org_id, code, name, unit_kind)
    SELECT org_row.id, v.code, v.name, v.unit_kind
    FROM org_row CROSS JOIN (
      VALUES ('bhopal-vibhag', 'Bhopal Vibhag', 'vibhag'), ('bhopal-shahar', 'Bhopal Shahar', 'unit')
    ) AS v(code, name, unit_kind)
    ON CONFLICT (org_id, code) DO NOTHING;

    WITH org_row AS (SELECT id FROM public.org_settings WHERE org_code = 'pragya-pravah'),
    bhopal_unit AS (SELECT u.id, u.org_id FROM public.units u JOIN org_row o ON o.id = u.org_id WHERE u.code = 'bhopal-shahar')
    INSERT INTO public.departments_or_aayams (org_id, unit_id, code, name, department_kind)
    SELECT b.org_id, b.id, v.code, v.name, 'aayam'
    FROM bhopal_unit b CROSS JOIN (
      VALUES ('prachar', 'Prachar Aayam'), ('aalekh', 'Aalekh Aayam'), ('vimarsh', 'Vimarsh Aayam')
    ) AS v(code, name)
    ON CONFLICT (org_id, code) DO NOTHING;

    WITH org_row AS (SELECT id FROM public.org_settings WHERE org_code = 'pragya-pravah')
    INSERT INTO public.tags (org_id, tag_type, tag_key, label, color)
    SELECT org_row.id, v.tag_type, v.tag_key, v.label, v.color
    FROM org_row CROSS JOIN (
      VALUES ('module', 'events', 'Events', '#d97706'), ('module', 'articles', 'Articles', '#2563eb'), ('module', 'prachar', 'Prachar', '#16a34a')
    ) AS v(tag_type, tag_key, label, color)
    ON CONFLICT (org_id, tag_type, tag_key) DO NOTHING;

    WITH org_row AS (SELECT id FROM public.org_settings WHERE org_code = 'pragya-pravah')
    INSERT INTO public.departments_or_aayams (org_id, code, name, name_hi, department_kind)
    SELECT id, code, name, name_hi, 'aayam'
    FROM org_row CROSS JOIN (
      VALUES ('yuva', 'Yuva', 'युवा'), ('mahila', 'Mahila', 'महिला'), ('shodh', 'Shodh', 'शोध'),
             ('prachar', 'Prachar', 'प्रचार'), ('vimarsh', 'Vimarsh', 'विमर्श')
    ) AS v(code, name, name_hi)
    ON CONFLICT (org_id, code) DO UPDATE SET name = EXCLUDED.name, name_hi = EXCLUDED.name_hi, updated_at = now();
  `);
  console.log('Seed data inserted');

  console.log('\nAll migrations applied successfully!');
  await client.end();
}

run().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
