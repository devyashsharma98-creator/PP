-- Pragya Pravah: Consolidated Neon Migration
-- Source: supabase/migrations/* merged into one migration for Neon Postgres.
-- Neon adaptation notes:
-- 1) No dependency on Supabase auth.users.
-- 2) No usage of auth.uid(); policies use public.current_app_user_id() via current_setting.
-- 3) Supabase storage policies are optional and guarded (only run if storage schema exists).

-- Session context contract (set by app per request):
--   set local app.current_user_id = '<uuid>';

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Optional role shims so existing policy targets keep working outside Supabase.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end $$;

create or replace function public.current_app_user_id()
returns uuid
language plpgsql
stable
as $$
declare
  raw text;
begin
  raw := nullif(current_setting('app.current_user_id', true), '');
  if raw is null then
    return null;
  end if;
  return raw::uuid;
exception
  when others then
    return null;
end;
$$;

-- ===== BEGIN supabase/migrations/20260226131926_core_foundation_schema.sql =====
-- Pragya Pravah Ops foundational schema
-- Workflow platform today, ERP-expandable base later.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.event_status as enum ('draft','pending_aayam_review','pending_final_approval','published','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.article_status as enum ('draft','pending_unit_head_review','pending_aayam_review','published','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.poll_type as enum ('date','general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.question_type as enum ('text','yesno','single_choice','multi_choice','number');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assignment_scope_type as enum ('org','unit','department','event','article');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attachment_visibility as enum ('private','org','public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_kind as enum ('workflow','event_review','article_review','registration','poll_result','reminder','system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.comment_visibility as enum ('org','internal','public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.article_review_decision as enum ('approved','forwarded','changes_requested','rejected');
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.org_settings (
  id uuid primary key default gen_random_uuid(),
  org_code text not null unique,
  org_name text not null,
  default_timezone text not null default 'Asia/Kolkata',
  feature_flags jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org_settings(id) on delete cascade,
  parent_unit_id uuid references public.units(id) on delete set null,
  code text not null,
  name text not null,
  name_hi text,
  unit_kind text not null default 'unit',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);

create table if not exists public.departments_or_aayams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org_settings(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  code text not null,
  name text not null,
  name_hi text,
  department_kind text not null default 'aayam',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org_settings(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  name text not null,
  city text,
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_hi text,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  org_id uuid references public.org_settings(id) on delete set null,
  default_unit_id uuid references public.units(id) on delete set null,
  default_department_id uuid references public.departments_or_aayams(id) on delete set null,
  email text,
  phone text,
  display_name text,
  preferred_language text not null default 'en',
  is_active boolean not null default true,
  profile_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_preferred_language_chk check (preferred_language in ('en','hi'))
);

create or replace view public.app_users as
select
  id,
  org_id,
  default_unit_id,
  default_department_id,
  email,
  phone,
  display_name,
  preferred_language,
  is_active,
  profile_metadata,
  created_at,
  updated_at
from public.profiles;

create table if not exists public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  scope_type public.assignment_scope_type not null default 'org',
  org_id uuid references public.org_settings(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  department_id uuid references public.departments_or_aayams(id) on delete cascade,
  scope_entity_id uuid,
  is_primary boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_role_assignments_window_chk check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org_settings(id) on delete cascade,
  code text not null,
  name text not null,
  entity_type text not null,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);

create table if not exists public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workflow_templates(id) on delete cascade,
  step_order integer not null,
  step_key text not null,
  step_name text not null,
  required_role_id uuid references public.roles(id) on delete set null,
  is_required boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, step_order),
  unique (template_id, step_key)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org_settings(id) on delete cascade,
  tag_type text not null default 'general',
  tag_key text not null,
  label text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, tag_type, tag_key)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org_settings(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  department_id uuid references public.departments_or_aayams(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  workflow_template_id uuid references public.workflow_templates(id) on delete set null,
  title text not null,
  description text,
  status public.event_status not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'Asia/Kolkata',
  date_label_override text,
  date_source text not null default 'manual',
  submitted_by_user_id uuid references public.profiles(id) on delete set null,
  submitted_by_name_snapshot text,
  checklist jsonb not null default '{}'::jsonb,
  report text,
  image_url text,
  video_url text,
  registration_public_enabled boolean not null default false,
  voting_public_enabled boolean not null default false,
  public_page_enabled boolean not null default false,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_window_chk check (ends_at is null or ends_at >= starts_at)
);

create table if not exists public.event_status_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  old_status public.event_status,
  new_status public.event_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_form_configs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  is_enabled boolean not null default true,
  is_public boolean not null default true,
  opens_at timestamptz,
  closes_at timestamptz,
  max_registrations integer,
  allow_multiple_submissions boolean not null default false,
  collect_phone boolean not null default true,
  collect_city boolean not null default true,
  collect_attending_count boolean not null default true,
  collect_special_needs boolean not null default true,
  collect_notes boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_form_configs_window_chk check (closes_at is null or opens_at is null or closes_at >= opens_at)
);

create table if not exists public.event_form_questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  form_config_id uuid not null references public.event_form_configs(id) on delete cascade,
  question_key text not null,
  label text not null,
  label_hi text,
  question_type public.question_type not null default 'text',
  is_required boolean not null default false,
  display_order integer not null default 0,
  options_json jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_config_id, question_key)
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  registrant_user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone text,
  city text,
  attending_count integer not null default 1,
  has_special_needs boolean not null default false,
  notes text,
  answers_payload jsonb not null default '{}'::jsonb,
  public_submission_key_hash text,
  submitted_from_ip inet,
  submitted_user_agent text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registrations_attending_count_chk check (attending_count > 0)
);

create table if not exists public.event_registration_answers (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations(id) on delete cascade,
  question_id uuid not null references public.event_form_questions(id) on delete cascade,
  answer_text text,
  answer_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id, question_id)
);

create table if not exists public.event_polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  question text not null,
  question_hi text,
  poll_type public.poll_type not null default 'general',
  is_public_voting boolean not null default true,
  opens_at timestamptz,
  closes_at timestamptz,
  is_finalized boolean not null default false,
  finalized_at timestamptz,
  finalized_by uuid references public.profiles(id) on delete set null,
  winner_option_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_polls_window_chk check (closes_at is null or opens_at is null or closes_at >= opens_at)
);

create table if not exists public.event_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.event_polls(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  scheduled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_id, sort_order)
);

alter table public.event_polls
  drop constraint if exists event_polls_winner_option_fk,
  add constraint event_polls_winner_option_fk
  foreign key (winner_option_id) references public.event_poll_options(id) on delete set null;

create table if not exists public.event_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.event_polls(id) on delete cascade,
  option_id uuid not null references public.event_poll_options(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  voter_fingerprint_hash text,
  submitted_from_ip inet,
  submitted_user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_event_poll_votes_auth on public.event_poll_votes(poll_id, actor_user_id) where actor_user_id is not null;
create unique index if not exists uq_event_poll_votes_fingerprint on public.event_poll_votes(poll_id, voter_fingerprint_hash) where voter_fingerprint_hash is not null;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org_settings(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  department_id uuid references public.departments_or_aayams(id) on delete set null,
  title text not null,
  content text not null,
  summary text,
  category text not null,
  status public.article_status not null default 'draft',
  author_user_id uuid references public.profiles(id) on delete set null,
  author_name_snapshot text,
  social_url text,
  values_checklist jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_reviews (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  reviewer_user_id uuid references public.profiles(id) on delete set null,
  review_step text,
  decision public.article_review_decision not null,
  review_notes text,
  edits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_publications (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  channel text not null default 'feed',
  published_url text,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prachar_statuses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  whatsapp_done boolean not null default false,
  facebook_done boolean not null default false,
  instagram_done boolean not null default false,
  telegram_done boolean not null default false,
  last_updated_by uuid references public.profiles(id) on delete set null,
  last_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.org_settings(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  kind public.notification_kind not null default 'workflow',
  title text not null,
  body text,
  link_path text,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.org_settings(id) on delete cascade,
  owner_user_id uuid references public.profiles(id) on delete set null,
  bucket_name text not null,
  object_path text not null,
  original_file_name text,
  mime_type text,
  file_size_bytes bigint,
  visibility public.attachment_visibility not null default 'private',
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_name, object_path)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.org_settings(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  change_summary jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.entity_tags (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references public.tags(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tag_id, entity_type, entity_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.org_settings(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  author_user_id uuid references public.profiles(id) on delete set null,
  visibility public.comment_visibility not null default 'org',
  body text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_stream (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.org_settings(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Supabase auth.users trigger removed for Neon (profiles are managed by application/auth service).
create or replace function public.validate_event_poll_vote()
returns trigger
language plpgsql
as $$
declare
  poll_rec public.event_polls%rowtype;
  option_poll_id uuid;
begin
  select * into poll_rec from public.event_polls where id = new.poll_id;
  if not found then
    raise exception 'Poll % does not exist', new.poll_id;
  end if;

  if poll_rec.is_finalized then
    raise exception 'Poll % is finalized and cannot accept votes', new.poll_id;
  end if;

  if poll_rec.opens_at is not null and now() < poll_rec.opens_at then
    raise exception 'Poll % is not open yet', new.poll_id;
  end if;

  if poll_rec.closes_at is not null and now() > poll_rec.closes_at then
    raise exception 'Poll % is closed', new.poll_id;
  end if;

  select poll_id into option_poll_id from public.event_poll_options where id = new.option_id;
  if option_poll_id is distinct from new.poll_id then
    raise exception 'Option % does not belong to poll %', new.option_id, new.poll_id;
  end if;

  if new.actor_user_id is null and coalesce(new.voter_fingerprint_hash, '') = '' then
    raise exception 'Anonymous votes require voter_fingerprint_hash';
  end if;

  return new;
end;
$$;

create or replace function public.validate_poll_finalization_and_sync_event()
returns trigger
language plpgsql
as $$
declare
  winner_poll_id uuid;
  winner_scheduled_at timestamptz;
begin
  if new.winner_option_id is not null then
    select poll_id, scheduled_at
      into winner_poll_id, winner_scheduled_at
    from public.event_poll_options
    where id = new.winner_option_id;

    if winner_poll_id is distinct from new.id then
      raise exception 'Winner option % does not belong to poll %', new.winner_option_id, new.id;
    end if;
  end if;

  if new.is_finalized and new.winner_option_id is null then
    raise exception 'Finalized poll must have winner option';
  end if;

  if new.is_finalized and new.finalized_at is null then
    new.finalized_at := now();
  end if;

  if tg_when = 'BEFORE' then
    return new;
  end if;

  if new.is_finalized and new.poll_type = 'date' and new.winner_option_id is not null and winner_scheduled_at is not null then
    update public.events
      set starts_at = winner_scheduled_at,
          date_source = 'poll_finalized',
          updated_at = now()
    where id = new.event_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_event_poll_vote on public.event_poll_votes;
create trigger trg_validate_event_poll_vote
before insert or update on public.event_poll_votes
for each row
execute function public.validate_event_poll_vote();

drop trigger if exists trg_validate_poll_finalization on public.event_polls;
create trigger trg_validate_poll_finalization
before insert or update on public.event_polls
for each row
execute function public.validate_poll_finalization_and_sync_event();

drop trigger if exists trg_sync_event_from_finalized_poll on public.event_polls;
create trigger trg_sync_event_from_finalized_poll
after insert or update on public.event_polls
for each row
execute function public.validate_poll_finalization_and_sync_event();

do $$
declare
  t text;
begin
  foreach t in array array[
    'org_settings','units','departments_or_aayams','locations','roles','profiles','user_role_assignments',
    'workflow_templates','workflow_steps','tags','events','event_status_history','event_form_configs',
    'event_form_questions','event_registrations','event_registration_answers','event_polls','event_poll_options',
    'event_poll_votes','articles','article_reviews','article_publications','prachar_statuses','notifications',
    'attachments','entity_tags','comments','activity_stream'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'trg_set_updated_at_' || t, t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'trg_set_updated_at_' || t,
      t
    );
  end loop;
end $$;

create index if not exists idx_user_role_assignments_user_id on public.user_role_assignments(user_id);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_starts_at on public.events(starts_at);
create index if not exists idx_event_registrations_event_id on public.event_registrations(event_id);
create index if not exists idx_event_polls_event_id on public.event_polls(event_id);
create index if not exists idx_event_poll_votes_poll_id on public.event_poll_votes(poll_id);
create index if not exists idx_articles_status on public.articles(status);
create index if not exists idx_notifications_recipient_user_id on public.notifications(recipient_user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_activity_stream_entity on public.activity_stream(entity_type, entity_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

insert into public.roles (code, name, name_hi, description, is_system)
values
  ('super_admin', 'Super Admin', 'सुपर एडमिन', 'Platform super administrator', true),
  ('org_admin', 'Org Admin', 'संगठन एडमिन', 'Organization administrator', true),
  ('vibhag_pramukh', 'Vibhag Pramukh', 'विभाग प्रमुख', 'Divisional reviewer/approver', true),
  ('aayam_pramukh', 'Aayam Pramukh', 'आयाम प्रमुख', 'Aayam reviewer', true),
  ('unit_head', 'Unit Head', 'यूनिट प्रमुख', 'Unit reviewer', true),
  ('karyakarta', 'Karyakarta', 'कार्यकर्ता', 'Contributor/member', true)
on conflict (code) do update
set name = excluded.name,
    name_hi = excluded.name_hi,
    description = excluded.description,
    updated_at = now();

insert into public.org_settings (org_code, org_name, default_timezone)
values ('pragya-pravah', 'Pragya Pravah', 'Asia/Kolkata')
on conflict (org_code) do nothing;

-- ===== END supabase/migrations/20260226131926_core_foundation_schema.sql =====

-- ===== BEGIN supabase/migrations/20260226131927_rls_and_security.sql =====
-- Row Level Security and helper policy functions

create or replace function public.current_role_codes()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(r.code), '{}'::text[])
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = public.current_app_user_id()
    and (ura.starts_at is null or ura.starts_at <= now())
    and (ura.ends_at is null or ura.ends_at >= now());
$$;

create or replace function public.has_any_role(codes text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from unnest(public.current_role_codes()) rc
    where rc = any(codes)
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array[
    'super_admin',
    'org_admin',
    'vibhag_pramukh',
    'aayam_pramukh',
    'unit_head'
  ]);
$$;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_manager()
     or exists (
       select 1
       from public.events e
       where e.id = p_event_id
         and e.submitted_by_user_id = public.current_app_user_id()
         and e.status in ('draft', 'pending_aayam_review', 'pending_final_approval')
     );
$$;

create or replace function public.can_manage_article(p_article_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_manager()
     or exists (
       select 1
       from public.articles a
       where a.id = p_article_id
         and a.author_user_id = public.current_app_user_id()
     );
$$;

create or replace function public.event_public_registration_open(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    left join public.event_form_configs fc on fc.event_id = e.id
    where e.id = p_event_id
      and e.status in ('published','authorized_public')
      and e.registration_public_enabled = true
      and coalesce(fc.is_enabled, true) = true
      and coalesce(fc.is_public, true) = true
      and (fc.opens_at is null or fc.opens_at <= now())
      and (fc.closes_at is null or fc.closes_at >= now())
  );
$$;

create or replace function public.poll_public_voting_open(p_poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_polls p
    join public.events e on e.id = p.event_id
    where p.id = p_poll_id
      and e.status in ('published','authorized_public')
      and e.voting_public_enabled = true
      and p.is_public_voting = true
      and p.is_finalized = false
      and (p.opens_at is null or p.opens_at <= now())
      and (p.closes_at is null or p.closes_at >= now())
  );
$$;

grant execute on function public.current_role_codes() to anon, authenticated;
grant execute on function public.has_any_role(text[]) to anon, authenticated;
grant execute on function public.is_manager() to anon, authenticated;
grant execute on function public.can_manage_event(uuid) to anon, authenticated;
grant execute on function public.can_manage_article(uuid) to anon, authenticated;
grant execute on function public.event_public_registration_open(uuid) to anon, authenticated;
grant execute on function public.poll_public_voting_open(uuid) to anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'org_settings','units','departments_or_aayams','locations','roles','profiles','user_role_assignments',
    'workflow_templates','workflow_steps','tags','events','event_status_history','event_form_configs',
    'event_form_questions','event_registrations','event_registration_answers','event_polls','event_poll_options',
    'event_poll_votes','articles','article_reviews','article_publications','prachar_statuses','notifications',
    'attachments','audit_logs','entity_tags','comments','activity_stream'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Generic internal/reference tables: authenticated read, manager write
do $$
declare
  t text;
begin
  foreach t in array array[
    'org_settings','units','departments_or_aayams','locations','roles',
    'workflow_templates','workflow_steps','tags','entity_tags'
  ] loop
    execute format('drop policy if exists p_auth_read on public.%I', t);
    execute format('drop policy if exists p_manager_write on public.%I', t);
    execute format('create policy p_auth_read on public.%I for select to authenticated using (true)', t);
    execute format('create policy p_manager_write on public.%I for all to authenticated using (public.is_manager()) with check (public.is_manager())', t);
  end loop;
end $$;

-- Profiles
drop policy if exists p_profiles_self_or_manager_read on public.profiles;
create policy p_profiles_self_or_manager_read
on public.profiles
for select to authenticated
using (id = public.current_app_user_id() or public.is_manager());

drop policy if exists p_profiles_self_or_manager_update on public.profiles;
create policy p_profiles_self_or_manager_update
on public.profiles
for update to authenticated
using (id = public.current_app_user_id() or public.is_manager())
with check (id = public.current_app_user_id() or public.is_manager());

drop policy if exists p_profiles_self_insert on public.profiles;
create policy p_profiles_self_insert
on public.profiles
for insert to authenticated
with check (id = public.current_app_user_id() or public.is_manager());

-- Role assignments
drop policy if exists p_user_roles_self_or_manager_read on public.user_role_assignments;
create policy p_user_roles_self_or_manager_read
on public.user_role_assignments
for select to authenticated
using (user_id = public.current_app_user_id() or public.is_manager());

drop policy if exists p_user_roles_manager_write on public.user_role_assignments;
create policy p_user_roles_manager_write
on public.user_role_assignments
for all to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Events
drop policy if exists p_events_auth_read on public.events;
create policy p_events_auth_read
on public.events
for select to authenticated
using (true);

drop policy if exists p_events_public_read on public.events;
create policy p_events_public_read
on public.events
for select to anon
using (
  status = 'published'
  and (public_page_enabled or registration_public_enabled or voting_public_enabled)
);

drop policy if exists p_events_auth_insert on public.events;
create policy p_events_auth_insert
on public.events
for insert to authenticated
with check (
  public.has_any_role(array['super_admin','org_admin','vibhag_pramukh','aayam_pramukh','unit_head','karyakarta'])
);

drop policy if exists p_events_manage_update on public.events;
create policy p_events_manage_update
on public.events
for update to authenticated
using (public.can_manage_event(id))
with check (public.can_manage_event(id));

drop policy if exists p_events_manager_delete on public.events;
create policy p_events_manager_delete
on public.events
for delete to authenticated
using (public.is_manager());

-- Event status history / form config / questions
drop policy if exists p_event_status_history_read on public.event_status_history;
create policy p_event_status_history_read
on public.event_status_history
for select to authenticated
using (exists (select 1 from public.events e where e.id = event_id));

drop policy if exists p_event_status_history_write on public.event_status_history;
create policy p_event_status_history_write
on public.event_status_history
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

drop policy if exists p_event_form_configs_auth_read on public.event_form_configs;
create policy p_event_form_configs_auth_read
on public.event_form_configs
for select to authenticated
using (exists (select 1 from public.events e where e.id = event_id));

drop policy if exists p_event_form_configs_public_read on public.event_form_configs;
create policy p_event_form_configs_public_read
on public.event_form_configs
for select to anon
using (is_public and public.event_public_registration_open(event_id));

drop policy if exists p_event_form_configs_write on public.event_form_configs;
create policy p_event_form_configs_write
on public.event_form_configs
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

drop policy if exists p_event_form_questions_auth_read on public.event_form_questions;
create policy p_event_form_questions_auth_read
on public.event_form_questions
for select to authenticated
using (exists (select 1 from public.events e where e.id = event_id));

drop policy if exists p_event_form_questions_public_read on public.event_form_questions;
create policy p_event_form_questions_public_read
on public.event_form_questions
for select to anon
using (public.event_public_registration_open(event_id));

drop policy if exists p_event_form_questions_write on public.event_form_questions;
create policy p_event_form_questions_write
on public.event_form_questions
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

-- Event registrations and custom answers
drop policy if exists p_event_registrations_auth_read on public.event_registrations;
create policy p_event_registrations_auth_read
on public.event_registrations
for select to authenticated
using (
  registrant_user_id = public.current_app_user_id()
  or public.can_manage_event(event_id)
);

drop policy if exists p_event_registrations_public_insert on public.event_registrations;
create policy p_event_registrations_public_insert
on public.event_registrations
for insert to anon
with check (public.event_public_registration_open(event_id));

drop policy if exists p_event_registrations_auth_insert on public.event_registrations;
create policy p_event_registrations_auth_insert
on public.event_registrations
for insert to authenticated
with check (public.event_public_registration_open(event_id) or public.can_manage_event(event_id));

drop policy if exists p_event_registrations_auth_update on public.event_registrations;
create policy p_event_registrations_auth_update
on public.event_registrations
for update to authenticated
using (registrant_user_id = public.current_app_user_id() or public.can_manage_event(event_id))
with check (registrant_user_id = public.current_app_user_id() or public.can_manage_event(event_id));

drop policy if exists p_event_registration_answers_auth_read on public.event_registration_answers;
create policy p_event_registration_answers_auth_read
on public.event_registration_answers
for select to authenticated
using (
  exists (
    select 1
    from public.event_registrations er
    where er.id = registration_id
      and (er.registrant_user_id = public.current_app_user_id() or public.can_manage_event(er.event_id))
  )
);

drop policy if exists p_event_registration_answers_public_insert on public.event_registration_answers;
create policy p_event_registration_answers_public_insert
on public.event_registration_answers
for insert to anon
with check (
  exists (
    select 1
    from public.event_registrations er
    where er.id = registration_id
      and public.event_public_registration_open(er.event_id)
  )
);

drop policy if exists p_event_registration_answers_auth_insert on public.event_registration_answers;
create policy p_event_registration_answers_auth_insert
on public.event_registration_answers
for insert to authenticated
with check (
  exists (
    select 1
    from public.event_registrations er
    where er.id = registration_id
      and (public.event_public_registration_open(er.event_id) or public.can_manage_event(er.event_id))
  )
);

-- Polls / options / votes
drop policy if exists p_event_polls_auth_read on public.event_polls;
create policy p_event_polls_auth_read
on public.event_polls
for select to authenticated
using (exists (select 1 from public.events e where e.id = event_id));

drop policy if exists p_event_polls_public_read on public.event_polls;
create policy p_event_polls_public_read
on public.event_polls
for select to anon
using (public.poll_public_voting_open(id) or (is_finalized and exists (select 1 from public.events e where e.id = event_id and e.status in ('published','authorized_public') and e.voting_public_enabled)));

drop policy if exists p_event_polls_write on public.event_polls;
create policy p_event_polls_write
on public.event_polls
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

drop policy if exists p_event_poll_options_auth_read on public.event_poll_options;
create policy p_event_poll_options_auth_read
on public.event_poll_options
for select to authenticated
using (exists (select 1 from public.event_polls p where p.id = poll_id));

drop policy if exists p_event_poll_options_public_read on public.event_poll_options;
create policy p_event_poll_options_public_read
on public.event_poll_options
for select to anon
using (exists (select 1 from public.event_polls p where p.id = poll_id and (public.poll_public_voting_open(p.id) or p.is_finalized)));

drop policy if exists p_event_poll_options_write on public.event_poll_options;
create policy p_event_poll_options_write
on public.event_poll_options
for all to authenticated
using (exists (select 1 from public.event_polls p where p.id = poll_id and public.can_manage_event(p.event_id)))
with check (exists (select 1 from public.event_polls p where p.id = poll_id and public.can_manage_event(p.event_id)));

drop policy if exists p_event_poll_votes_auth_read on public.event_poll_votes;
create policy p_event_poll_votes_auth_read
on public.event_poll_votes
for select to authenticated
using (
  actor_user_id = public.current_app_user_id()
  or exists (
    select 1
    from public.event_polls p
    where p.id = poll_id and public.can_manage_event(p.event_id)
  )
);

drop policy if exists p_event_poll_votes_public_insert on public.event_poll_votes;
create policy p_event_poll_votes_public_insert
on public.event_poll_votes
for insert to anon
with check (public.poll_public_voting_open(poll_id));

drop policy if exists p_event_poll_votes_auth_insert on public.event_poll_votes;
create policy p_event_poll_votes_auth_insert
on public.event_poll_votes
for insert to authenticated
with check (
  public.poll_public_voting_open(poll_id)
  or exists (select 1 from public.event_polls p where p.id = poll_id and public.can_manage_event(p.event_id))
);

-- Articles
drop policy if exists p_articles_auth_read on public.articles;
create policy p_articles_auth_read
on public.articles
for select to authenticated
using (true);

drop policy if exists p_articles_public_read on public.articles;
create policy p_articles_public_read
on public.articles
for select to anon
using (status = 'published');

drop policy if exists p_articles_auth_insert on public.articles;
create policy p_articles_auth_insert
on public.articles
for insert to authenticated
with check (author_user_id = public.current_app_user_id() or author_user_id is null);

drop policy if exists p_articles_manage_update on public.articles;
create policy p_articles_manage_update
on public.articles
for update to authenticated
using (public.can_manage_article(id))
with check (public.can_manage_article(id));

drop policy if exists p_articles_manager_delete on public.articles;
create policy p_articles_manager_delete
on public.articles
for delete to authenticated
using (public.is_manager());

drop policy if exists p_article_reviews_auth_read on public.article_reviews;
create policy p_article_reviews_auth_read
on public.article_reviews
for select to authenticated
using (exists (select 1 from public.articles a where a.id = article_id and (public.can_manage_article(a.id) or a.author_user_id = public.current_app_user_id())));

drop policy if exists p_article_reviews_manager_write on public.article_reviews;
create policy p_article_reviews_manager_write
on public.article_reviews
for all to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists p_article_publications_auth_read on public.article_publications;
create policy p_article_publications_auth_read
on public.article_publications
for select to authenticated
using (true);

drop policy if exists p_article_publications_public_read on public.article_publications;
create policy p_article_publications_public_read
on public.article_publications
for select to anon
using (exists (select 1 from public.articles a where a.id = article_id and a.status in ('published','authorized_public')));

drop policy if exists p_article_publications_manager_write on public.article_publications;
create policy p_article_publications_manager_write
on public.article_publications
for all to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Prachar, notifications, attachments, audit, collaboration
drop policy if exists p_prachar_auth_read on public.prachar_statuses;
create policy p_prachar_auth_read on public.prachar_statuses for select to authenticated using (true);
drop policy if exists p_prachar_write on public.prachar_statuses;
create policy p_prachar_write on public.prachar_statuses for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists p_notifications_recipient_read on public.notifications;
create policy p_notifications_recipient_read
on public.notifications for select to authenticated
using (recipient_user_id = public.current_app_user_id() or public.is_manager());
drop policy if exists p_notifications_recipient_update on public.notifications;
create policy p_notifications_recipient_update
on public.notifications for update to authenticated
using (recipient_user_id = public.current_app_user_id() or public.is_manager())
with check (recipient_user_id = public.current_app_user_id() or public.is_manager());
drop policy if exists p_notifications_manager_insert on public.notifications;
create policy p_notifications_manager_insert
on public.notifications for insert to authenticated
with check (public.is_manager());

drop policy if exists p_attachments_owner_or_manager_read on public.attachments;
create policy p_attachments_owner_or_manager_read
on public.attachments for select to authenticated
using (owner_user_id = public.current_app_user_id() or public.is_manager());
drop policy if exists p_attachments_owner_or_manager_write on public.attachments;
create policy p_attachments_owner_or_manager_write
on public.attachments for all to authenticated
using (owner_user_id = public.current_app_user_id() or public.is_manager())
with check (owner_user_id = public.current_app_user_id() or public.is_manager());

drop policy if exists p_audit_logs_manager_read on public.audit_logs;
create policy p_audit_logs_manager_read on public.audit_logs for select to authenticated using (public.is_manager());
drop policy if exists p_audit_logs_manager_insert on public.audit_logs;
create policy p_audit_logs_manager_insert on public.audit_logs for insert to authenticated with check (public.is_manager());

drop policy if exists p_comments_auth_read on public.comments;
create policy p_comments_auth_read on public.comments for select to authenticated using (true);
drop policy if exists p_comments_auth_insert on public.comments;
create policy p_comments_auth_insert on public.comments for insert to authenticated with check (author_user_id = public.current_app_user_id() or author_user_id is null);
drop policy if exists p_comments_author_or_manager_update on public.comments;
create policy p_comments_author_or_manager_update on public.comments for update to authenticated using (author_user_id = public.current_app_user_id() or public.is_manager()) with check (author_user_id = public.current_app_user_id() or public.is_manager());
drop policy if exists p_comments_author_or_manager_delete on public.comments;
create policy p_comments_author_or_manager_delete on public.comments for delete to authenticated using (author_user_id = public.current_app_user_id() or public.is_manager());

drop policy if exists p_activity_stream_auth_read on public.activity_stream;
create policy p_activity_stream_auth_read on public.activity_stream for select to authenticated using (true);
drop policy if exists p_activity_stream_manager_insert on public.activity_stream;
create policy p_activity_stream_manager_insert on public.activity_stream for insert to authenticated with check (public.is_manager());
drop policy if exists p_activity_stream_manager_update on public.activity_stream;
create policy p_activity_stream_manager_update on public.activity_stream for update to authenticated using (public.is_manager()) with check (public.is_manager());

-- ===== END supabase/migrations/20260226131927_rls_and_security.sql =====

-- ===== BEGIN supabase/migrations/20260226131928_storage_buckets_and_policies.sql =====
-- Supabase Storage is optional on Neon. Run these statements only when storage tables exist.
do $$
begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets (id, name, public, file_size_limit)
    values
      ('event-media', 'event-media', false, 52428800),
      ('article-media', 'article-media', false, 52428800),
      ('documents', 'documents', false, 104857600),
      ('avatars', 'avatars', false, 10485760)
    on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit;

    drop policy if exists p_storage_authenticated_read on storage.objects;
    create policy p_storage_authenticated_read
    on storage.objects
    for select to authenticated
    using (
      bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
      and (
        public.is_manager()
        or (storage.foldername(name))[1] = public.current_app_user_id()::text
      )
    );

    drop policy if exists p_storage_authenticated_insert on storage.objects;
    create policy p_storage_authenticated_insert
    on storage.objects
    for insert to authenticated
    with check (
      bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
      and (
        public.is_manager()
        or (storage.foldername(name))[1] = public.current_app_user_id()::text
      )
    );

    drop policy if exists p_storage_authenticated_update on storage.objects;
    create policy p_storage_authenticated_update
    on storage.objects
    for update to authenticated
    using (
      bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
      and (
        public.is_manager()
        or (storage.foldername(name))[1] = public.current_app_user_id()::text
      )
    )
    with check (
      bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
      and (
        public.is_manager()
        or (storage.foldername(name))[1] = public.current_app_user_id()::text
      )
    );

    drop policy if exists p_storage_authenticated_delete on storage.objects;
    create policy p_storage_authenticated_delete
    on storage.objects
    for delete to authenticated
    using (
      bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
      and (
        public.is_manager()
        or (storage.foldername(name))[1] = public.current_app_user_id()::text
      )
    );
  end if;
end $$;
-- ===== END supabase/migrations/20260226131928_storage_buckets_and_policies.sql =====

-- ===== BEGIN supabase/migrations/20260226160158_phase1_access_hardening_rls.sql =====
-- Phase 1 access hardening:
-- 1) add missing hierarchy roles required for future workflow phases
-- 2) make RLS helper logic scope-aware (user_role_assignments + unit hierarchy)
-- 3) narrow overbroad authenticated read/write policies for event/article/prachar data

insert into public.roles (code, name, name_hi, description, is_system)
values
  ('prant_sanyojak', 'Prant Sanyojak', 'प्रांत संयोजक', 'Prant-level coordinator authorization role', true),
  ('prant_aayam_pramukh', 'Prant Aayam Pramukh', 'प्रांत आयाम प्रमुख', 'Prant-level aayam approval role', true),
  ('kshetra_reviewer', 'Kshetra Reviewer', 'क्षेत्र समीक्षक', 'Kshetra-level escalation reviewer', true)
on conflict (code) do update
set
  name = excluded.name,
  name_hi = excluded.name_hi,
  description = excluded.description,
  is_system = excluded.is_system,
  updated_at = now();

create or replace function public.unit_is_ancestor_or_self(p_ancestor_unit_id uuid, p_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when p_ancestor_unit_id is null or p_unit_id is null then false
      when p_ancestor_unit_id = p_unit_id then true
      else exists (
        with recursive chain as (
          select u.id, u.parent_unit_id
          from public.units u
          where u.id = p_unit_id
          union all
          select parent_u.id, parent_u.parent_unit_id
          from public.units parent_u
          join chain c on c.parent_unit_id = parent_u.id
        )
        select 1 from chain where id = p_ancestor_unit_id
      )
    end;
$$;

create or replace function public.has_scoped_role(
  p_role_codes text[],
  p_org_id uuid,
  p_unit_id uuid default null,
  p_department_id uuid default null,
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_user_id() is not null and exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = public.current_app_user_id()
      and r.code = any(p_role_codes)
      and (ura.starts_at is null or ura.starts_at <= now())
      and (ura.ends_at is null or ura.ends_at >= now())
      and (p_org_id is null or ura.org_id is null or ura.org_id = p_org_id)
      and (
        ura.scope_type = 'org'
        or (
          ura.scope_type = 'unit'
          and public.unit_is_ancestor_or_self(coalesce(ura.unit_id, ura.scope_entity_id), p_unit_id)
        )
        or (
          ura.scope_type = 'department'
          and p_department_id is not null
          and coalesce(ura.department_id, ura.scope_entity_id) = p_department_id
          and (
            ura.unit_id is null
            or p_unit_id is null
            or public.unit_is_ancestor_or_self(ura.unit_id, p_unit_id)
          )
        )
        or (
          ura.scope_type = 'event'
          and p_entity_type = 'event'
          and ura.scope_entity_id = p_entity_id
        )
        or (
          ura.scope_type = 'article'
          and p_entity_type = 'article'
          and ura.scope_entity_id = p_entity_id
        )
      )
  ), false);
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Phase 1 hardening: "manager" now means org-wide admin only.
  -- Scoped workflow roles are evaluated via has_scoped_role()/can_* helpers.
  select public.has_scoped_role(array['super_admin','org_admin'], null, null, null, null, null);
$$;

create or replace function public.can_create_event_for_scope(p_org_id uuid, p_unit_id uuid, p_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_scoped_role(
    array[
      'super_admin',
      'org_admin',
      'unit_head',
      'aayam_pramukh',
      'vibhag_pramukh',
      'prant_sanyojak',
      'prant_aayam_pramukh'
    ],
    p_org_id,
    p_unit_id,
    p_department_id,
    'event',
    null
  );
$$;

create or replace function public.can_publish_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and public.has_scoped_role(
        array[
          'super_admin',
          'org_admin',
          'kshetra_reviewer',
          'prant_sanyojak',
          'prant_aayam_pramukh',
          'vibhag_pramukh'
        ],
        e.org_id,
        e.unit_id,
        e.department_id,
        'event',
        e.id
      )
  );
$$;

create or replace function public.can_read_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and (
        e.submitted_by_user_id = public.current_app_user_id()
        or (
          e.status in ('published','authorized_public')
          and public.has_scoped_role(
            array[
              'super_admin',
              'org_admin',
              'kshetra_reviewer',
              'prant_sanyojak',
              'prant_aayam_pramukh',
              'vibhag_pramukh',
              'aayam_pramukh',
              'unit_head',
              'karyakarta'
            ],
            e.org_id,
            e.unit_id,
            e.department_id,
            'event',
            e.id
          )
        )
        or (
          e.status not in ('published','authorized_public')
          and public.has_scoped_role(
            array[
              'super_admin',
              'org_admin',
              'kshetra_reviewer',
              'prant_sanyojak',
              'prant_aayam_pramukh',
              'vibhag_pramukh',
              'aayam_pramukh',
              'unit_head'
            ],
            e.org_id,
            e.unit_id,
            e.department_id,
            'event',
            e.id
          )
        )
      )
  );
$$;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and (
        (
          e.submitted_by_user_id = public.current_app_user_id()
          and e.status in ('draft', 'pending_aayam_review', 'pending_final_approval')
        )
        or public.has_scoped_role(
          array[
            'super_admin',
            'org_admin',
            'kshetra_reviewer',
            'prant_sanyojak',
            'prant_aayam_pramukh',
            'vibhag_pramukh',
            'aayam_pramukh',
            'unit_head'
          ],
          e.org_id,
          e.unit_id,
          e.department_id,
          'event',
          e.id
        )
      )
  );
$$;

create or replace function public.can_create_article_for_scope(p_org_id uuid, p_unit_id uuid, p_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_scoped_role(
    array[
      'super_admin',
      'org_admin',
      'karyakarta',
      'unit_head',
      'aayam_pramukh',
      'vibhag_pramukh',
      'prant_sanyojak',
      'prant_aayam_pramukh'
    ],
    p_org_id,
    p_unit_id,
    p_department_id,
    'article',
    null
  );
$$;

create or replace function public.can_publish_article(p_article_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.articles a
    where a.id = p_article_id
      and public.has_scoped_role(
        array[
          'super_admin',
          'org_admin',
          'kshetra_reviewer',
          'prant_sanyojak',
          'prant_aayam_pramukh',
          'vibhag_pramukh',
          'aayam_pramukh'
        ],
        a.org_id,
        a.unit_id,
        a.department_id,
        'article',
        a.id
      )
  );
$$;

create or replace function public.can_read_article(p_article_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.articles a
    where a.id = p_article_id
      and (
        a.author_user_id = public.current_app_user_id()
        or (
          a.status in ('published','authorized_public')
          and public.has_scoped_role(
            array[
              'super_admin',
              'org_admin',
              'kshetra_reviewer',
              'prant_sanyojak',
              'prant_aayam_pramukh',
              'vibhag_pramukh',
              'aayam_pramukh',
              'unit_head',
              'karyakarta'
            ],
            a.org_id,
            a.unit_id,
            a.department_id,
            'article',
            a.id
          )
        )
        or (
          a.status not in ('published','authorized_public')
          and public.has_scoped_role(
            array[
              'super_admin',
              'org_admin',
              'kshetra_reviewer',
              'prant_sanyojak',
              'prant_aayam_pramukh',
              'vibhag_pramukh',
              'aayam_pramukh',
              'unit_head'
            ],
            a.org_id,
            a.unit_id,
            a.department_id,
            'article',
            a.id
          )
        )
      )
  );
$$;

create or replace function public.can_manage_article(p_article_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.articles a
    where a.id = p_article_id
      and (
        a.author_user_id = public.current_app_user_id()
        or public.has_scoped_role(
          array[
            'super_admin',
            'org_admin',
            'kshetra_reviewer',
            'prant_sanyojak',
            'prant_aayam_pramukh',
            'vibhag_pramukh',
            'aayam_pramukh',
            'unit_head'
          ],
          a.org_id,
          a.unit_id,
          a.department_id,
          'article',
          a.id
        )
      )
  );
$$;

create or replace function public.can_read_prachar(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and public.has_scoped_role(
        array[
          'super_admin',
          'org_admin',
          'kshetra_reviewer',
          'prant_sanyojak',
          'prant_aayam_pramukh',
          'vibhag_pramukh',
          'aayam_pramukh',
          'unit_head'
        ],
        e.org_id,
        e.unit_id,
        e.department_id,
        'event',
        e.id
      )
  );
$$;

create or replace function public.can_update_prachar(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and public.has_scoped_role(
        array[
          'super_admin',
          'org_admin',
          'kshetra_reviewer',
          'prant_sanyojak',
          'prant_aayam_pramukh',
          'vibhag_pramukh',
          'aayam_pramukh'
        ],
        e.org_id,
        e.unit_id,
        e.department_id,
        'event',
        e.id
      )
  );
$$;

grant execute on function public.unit_is_ancestor_or_self(uuid, uuid) to anon, authenticated;
grant execute on function public.has_scoped_role(text[], uuid, uuid, uuid, text, uuid) to anon, authenticated;
grant execute on function public.can_create_event_for_scope(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.can_publish_event(uuid) to anon, authenticated;
grant execute on function public.can_read_event(uuid) to anon, authenticated;
grant execute on function public.can_manage_event(uuid) to anon, authenticated;
grant execute on function public.can_create_article_for_scope(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.can_publish_article(uuid) to anon, authenticated;
grant execute on function public.can_read_article(uuid) to anon, authenticated;
grant execute on function public.can_manage_article(uuid) to anon, authenticated;
grant execute on function public.can_read_prachar(uuid) to anon, authenticated;
grant execute on function public.can_update_prachar(uuid) to anon, authenticated;

-- Event and related workflow policies
drop policy if exists p_events_auth_read on public.events;
create policy p_events_auth_read
on public.events
for select to authenticated
using (public.can_read_event(id));

drop policy if exists p_events_auth_insert on public.events;
create policy p_events_auth_insert
on public.events
for insert to authenticated
with check (
  public.can_create_event_for_scope(org_id, unit_id, department_id)
  and (submitted_by_user_id = public.current_app_user_id() or submitted_by_user_id is null)
);

drop policy if exists p_event_status_history_read on public.event_status_history;
create policy p_event_status_history_read
on public.event_status_history
for select to authenticated
using (public.can_read_event(event_id));

drop policy if exists p_event_form_configs_auth_read on public.event_form_configs;
create policy p_event_form_configs_auth_read
on public.event_form_configs
for select to authenticated
using (public.can_read_event(event_id));

drop policy if exists p_event_form_questions_auth_read on public.event_form_questions;
create policy p_event_form_questions_auth_read
on public.event_form_questions
for select to authenticated
using (public.can_read_event(event_id));

drop policy if exists p_event_polls_auth_read on public.event_polls;
create policy p_event_polls_auth_read
on public.event_polls
for select to authenticated
using (public.can_read_event(event_id));

drop policy if exists p_event_poll_options_auth_read on public.event_poll_options;
create policy p_event_poll_options_auth_read
on public.event_poll_options
for select to authenticated
using (
  exists (
    select 1
    from public.event_polls p
    where p.id = poll_id
      and public.can_read_event(p.event_id)
  )
);

-- Articles and related workflow policies
drop policy if exists p_articles_auth_read on public.articles;
create policy p_articles_auth_read
on public.articles
for select to authenticated
using (public.can_read_article(id));

drop policy if exists p_articles_auth_insert on public.articles;
create policy p_articles_auth_insert
on public.articles
for insert to authenticated
with check (
  (author_user_id = public.current_app_user_id() or author_user_id is null)
  and public.can_create_article_for_scope(org_id, unit_id, department_id)
);

drop policy if exists p_article_reviews_manager_write on public.article_reviews;
create policy p_article_reviews_manager_write
on public.article_reviews
for all to authenticated
using (
  exists (
    select 1
    from public.articles a
    where a.id = article_id
      and public.can_manage_article(a.id)
  )
)
with check (
  exists (
    select 1
    from public.articles a
    where a.id = article_id
      and public.can_manage_article(a.id)
  )
);

drop policy if exists p_article_publications_auth_read on public.article_publications;
create policy p_article_publications_auth_read
on public.article_publications
for select to authenticated
using (public.can_read_article(article_id));

drop policy if exists p_article_publications_manager_write on public.article_publications;
create policy p_article_publications_manager_write
on public.article_publications
for all to authenticated
using (public.can_publish_article(article_id))
with check (public.can_publish_article(article_id));

-- Prachar
drop policy if exists p_prachar_auth_read on public.prachar_statuses;
create policy p_prachar_auth_read
on public.prachar_statuses
for select to authenticated
using (public.can_read_prachar(event_id));

drop policy if exists p_prachar_write on public.prachar_statuses;
create policy p_prachar_write
on public.prachar_statuses
for all to authenticated
using (public.can_update_prachar(event_id))
with check (public.can_update_prachar(event_id));

-- Note: workflow enum/status expansion (Prant/Kshetra/dual-authorization) is deferred to a dedicated
-- migration because it impacts application status mappings, UI unions, DB enum casts, and RLS helpers.

-- ===== END supabase/migrations/20260226160158_phase1_access_hardening_rls.sql =====

-- ===== BEGIN supabase/migrations/20260227000000_bhopal_v1_rollout.sql =====
-- Pragya Pravah ERP: Bhopal Vibhag V1 Rollout Alignment
-- Target: production-ready, additive, idempotent migration.

BEGIN;

-- ==========================================
-- 1. EXTEND UNITS HIERARCHY
-- ==========================================
DO $$ 
BEGIN
    -- Detect and drop the existing constraint if it exists
    ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_unit_kind_check;
    
    -- Add the expanded hierarchy constraint
    ALTER TABLE public.units ADD CONSTRAINT units_unit_kind_check 
        CHECK (unit_kind IN ('kshetra', 'prant', 'vibhag', 'zila', 'unit'));
EXCEPTION 
    WHEN undefined_object THEN 
        -- If for some reason it wasn't there, just add it
        ALTER TABLE public.units ADD CONSTRAINT units_unit_kind_check 
            CHECK (unit_kind IN ('kshetra', 'prant', 'vibhag', 'zila', 'unit'));
END $$;


-- ==========================================
-- 2. EXTEND EVENTS WITH STRUCTURED VRITT
-- ==========================================
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS vritt_attendance_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vritt_media_urls text[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS vritt_content text,
    ADD COLUMN IF NOT EXISTS vritt_status text DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS vritt_updated_at timestamptz DEFAULT now();

-- Add Vritt status check constraint
DO $$ BEGIN
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_vritt_status_check;
    ALTER TABLE public.events ADD CONSTRAINT events_vritt_status_check 
        CHECK (vritt_status IN ('draft', 'submitted', 'reviewed'));
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Backfill: Copy legacy report text into the new structured content column
UPDATE public.events 
SET vritt_content = report 
WHERE (vritt_content IS NULL OR vritt_content = '') 
  AND (report IS NOT NULL AND report <> '');


-- ==========================================
-- 3. EXTEND ARTICLES
-- ==========================================
ALTER TABLE public.articles 
    ADD COLUMN IF NOT EXISTS document_url text;


-- ==========================================
-- 4. EXTEND PRACHAR_STATUSES
-- ==========================================
ALTER TABLE public.prachar_statuses
    ADD COLUMN IF NOT EXISTS whatsapp_skip_reason text,
    ADD COLUMN IF NOT EXISTS facebook_skip_reason text,
    ADD COLUMN IF NOT EXISTS instagram_skip_reason text,
    ADD COLUMN IF NOT EXISTS telegram_skip_reason text,
    ADD COLUMN IF NOT EXISTS template_reference text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- ==========================================
-- 5. CREATE VIMARSH KNOWLEDGE HUB
-- ==========================================
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


-- ==========================================
-- 6. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_vimarsh_topics_org_id ON public.vimarsh_topics(org_id);
CREATE INDEX IF NOT EXISTS idx_vimarsh_resources_topic_id ON public.vimarsh_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_events_vritt_status ON public.events(vritt_status);


-- ==========================================
-- 7. RLS ENABLEMENT & POLICIES
-- ==========================================
ALTER TABLE public.vimarsh_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vimarsh_resources ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for Vimarsh Topics
DROP POLICY IF EXISTS p_vimarsh_topics_read ON public.vimarsh_topics;
CREATE POLICY p_vimarsh_topics_read ON public.vimarsh_topics
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_vimarsh_topics_manage ON public.vimarsh_topics;
CREATE POLICY p_vimarsh_topics_manage ON public.vimarsh_topics
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

-- Idempotent Policy Creation for Vimarsh Resources
DROP POLICY IF EXISTS p_vimarsh_resources_read ON public.vimarsh_resources;
CREATE POLICY p_vimarsh_resources_read ON public.vimarsh_resources
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_vimarsh_resources_manage ON public.vimarsh_resources;
CREATE POLICY p_vimarsh_resources_manage ON public.vimarsh_resources
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());


-- ==========================================
-- 8. TRIGGERS
-- ==========================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_vimarsh_topics') THEN
        CREATE TRIGGER trg_set_updated_at_vimarsh_topics 
        BEFORE UPDATE ON public.vimarsh_topics 
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;


-- ==========================================
-- 9. SEED CANONICAL AAYAMS
-- ==========================================
-- We find the org_id dynamically using the confirmed 'pragya-pravah' code
INSERT INTO public.departments_or_aayams (org_id, code, name, name_hi, department_kind)
SELECT id, code, name, name_hi, 'aayam'
FROM (
    SELECT id FROM public.org_settings WHERE org_code = 'pragya-pravah' LIMIT 1
) AS org,
(VALUES 
    ('yuva', 'Yuva', 'युवा'),
    ('mahila', 'Mahila', 'महिला'),
    ('shodh', 'Shodh', 'शोध'),
    ('prachar', 'Prachar', 'प्रचार'),
    ('vimarsh', 'Vimarsh', 'विमर्श')
) AS v(code, name, name_hi)
ON CONFLICT (org_id, code) DO UPDATE 
SET name = EXCLUDED.name, 
    name_hi = EXCLUDED.name_hi,
    updated_at = now();

COMMIT;

-- ===== END supabase/migrations/20260227000000_bhopal_v1_rollout.sql =====

-- ===== BEGIN supabase/migrations/20260319000000_phase2_workflow_approvals.sql =====
-- Phase 2: Workflow Approvals and Dual Authorization
-- Introducing immutable records for workflow steps, remarks, and multi-actor authorizations.

create table if not exists public.workflow_approvals (
  id uuid primary key default gen_random_uuid(),
  
  -- Polymorphic target (supports both events and articles)
  entity_type text not null check (entity_type in ('event', 'article')),
  entity_id uuid not null,
  
  -- The state transition this approval represents
  from_status text,
  to_status text not null,
  
  -- The actor who performed this specific step
  actor_id uuid not null references public.profiles(id) on delete restrict,
  actor_role text not null, -- Captured at time of approval for audit integrity
  
  -- Metadata for the step
  step_label text, -- e.g., 'Prant Authorization 1', 'Vibhag Review'
  is_final_step boolean default false,
  
  -- The content of the approval
  remarks text,
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now()
);

-- Ensure immutability via trigger (no updates or deletes allowed)
create or replace function public.fn_prevent_workflow_approval_modification()
returns trigger as $$
begin
  raise exception 'Workflow approval records are immutable and cannot be modified or deleted.';
end;
$$ language plpgsql;

drop trigger if exists tr_workflow_approvals_immutable_update on public.workflow_approvals;
create trigger tr_workflow_approvals_immutable_update
before update on public.workflow_approvals
for each row execute function public.fn_prevent_workflow_approval_modification();

drop trigger if exists tr_workflow_approvals_immutable_delete on public.workflow_approvals;
create trigger tr_workflow_approvals_immutable_delete
before delete on public.workflow_approvals
for each row execute function public.fn_prevent_workflow_approval_modification();

-- RLS for workflow_approvals
alter table public.workflow_approvals enable row level security;

-- Policies:
-- 1. Anyone with access to the entity can read the approval history.
-- 2. Actors can insert records (further restricted by server logic).

drop policy if exists p_workflow_approvals_read on public.workflow_approvals;
create policy p_workflow_approvals_read
on public.workflow_approvals
for select
to authenticated
using (
  case 
    when entity_type = 'event' then 
      exists (select 1 from public.events e where e.id = entity_id)
    when entity_type = 'article' then 
      exists (select 1 from public.articles a where a.id = entity_id)
    else false
  end
);

drop policy if exists p_workflow_approvals_insert on public.workflow_approvals;
create policy p_workflow_approvals_insert
on public.workflow_approvals
for insert
to authenticated
with check (public.current_app_user_id() = actor_id);

-- Add comments for postgraphile / generated types
comment on table public.workflow_approvals is 'Immutable audit log of workflow approval steps and remarks.';

-- ===== END supabase/migrations/20260319000000_phase2_workflow_approvals.sql =====

-- ===== BEGIN supabase/migrations/20260319000001_phase2_enum_expansion.sql =====
-- Phase 2: Enum Expansion and Workflow State Migration
-- Expanding event_status and article_status to support granular review pipelines.

-- 1. Expand event_status enum
-- Postgres does not allow ALTER TYPE ... ADD VALUE inside a transaction block in older versions, 
-- but Supabase/Postgres 15+ handles this in migrations generally if not wrapped in explicit BEGIN/COMMIT.
alter type public.event_status add value if not exists 'submitted_by_unit';
alter type public.event_status add value if not exists 'pending_vibhag_review';
alter type public.event_status add value if not exists 'pending_prant_authorization';
alter type public.event_status add value if not exists 'pending_prant_dual_authorization';
alter type public.event_status add value if not exists 'authorized_public';
alter type public.event_status add value if not exists 'escalated_kshetra';
alter type public.event_status add value if not exists 'returned_for_revision';
alter type public.event_status add value if not exists 'rejected';

-- 2. Expand article_status enum
alter type public.article_status add value if not exists 'pending_vibhag_review';
alter type public.article_status add value if not exists 'pending_prant_authorization';
alter type public.article_status add value if not exists 'pending_prant_dual_authorization';
alter type public.article_status add value if not exists 'authorized_public';
alter type public.article_status add value if not exists 'escalated_kshetra';
alter type public.article_status add value if not exists 'returned_for_revision';
alter type public.article_status add value if not exists 'rejected';

-- 3. Data Migration: Map existing 'published' to 'authorized_public'
-- We keep 'published' in the enum for now to avoid breaking existing code that might still reference it,
-- but we move all data to the new canonical Phase 2 status.

update public.events 
set status = 'authorized_public' 
where status = 'published';

update public.articles 
set status = 'authorized_public' 
where status = 'published';

-- Update history records to maintain consistency
update public.event_status_history 
set new_status = 'authorized_public' 
where new_status = 'published';

update public.event_status_history 
set old_status = 'authorized_public' 
where old_status = 'published';

update public.workflow_approvals
set to_status = 'authorized_public'
where to_status = 'published';

update public.workflow_approvals
set from_status = 'authorized_public'
where from_status = 'published';

comment on type public.event_status is 'Expanded workflow states for institutional event authorization.';
comment on type public.article_status is 'Expanded workflow states for institutional article publication.';

-- ===== END supabase/migrations/20260319000001_phase2_enum_expansion.sql =====

-- ===== BEGIN supabase/migrations/20260319000002_phase3_qr_attendance.sql =====
-- Phase 3: QR Check-in and Real-time Attendance
-- Adding verified checked-in count to events for precision reporting.

alter table public.events 
add column if not exists vritt_checked_in_count integer default 0;

comment on column public.events.vritt_checked_in_count is 'Count of verified venue check-ins via QR code.';

-- ===== END supabase/migrations/20260319000002_phase3_qr_attendance.sql =====


