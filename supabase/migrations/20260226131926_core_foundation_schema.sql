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
  id uuid primary key references auth.users(id) on delete cascade,
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

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        updated_at = now();

  return new;
end;
$$;

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_created();

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
