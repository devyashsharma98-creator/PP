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
  where ura.user_id = auth.uid()
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
         and e.submitted_by_user_id = auth.uid()
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
         and a.author_user_id = auth.uid()
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
      and e.status = 'published'
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
      and e.status = 'published'
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
using (id = auth.uid() or public.is_manager());

drop policy if exists p_profiles_self_or_manager_update on public.profiles;
create policy p_profiles_self_or_manager_update
on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_manager())
with check (id = auth.uid() or public.is_manager());

drop policy if exists p_profiles_self_insert on public.profiles;
create policy p_profiles_self_insert
on public.profiles
for insert to authenticated
with check (id = auth.uid() or public.is_manager());

-- Role assignments
drop policy if exists p_user_roles_self_or_manager_read on public.user_role_assignments;
create policy p_user_roles_self_or_manager_read
on public.user_role_assignments
for select to authenticated
using (user_id = auth.uid() or public.is_manager());

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
  registrant_user_id = auth.uid()
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
using (registrant_user_id = auth.uid() or public.can_manage_event(event_id))
with check (registrant_user_id = auth.uid() or public.can_manage_event(event_id));

drop policy if exists p_event_registration_answers_auth_read on public.event_registration_answers;
create policy p_event_registration_answers_auth_read
on public.event_registration_answers
for select to authenticated
using (
  exists (
    select 1
    from public.event_registrations er
    where er.id = registration_id
      and (er.registrant_user_id = auth.uid() or public.can_manage_event(er.event_id))
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
using (public.poll_public_voting_open(id) or (is_finalized and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.voting_public_enabled)));

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
  actor_user_id = auth.uid()
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
with check (author_user_id = auth.uid() or author_user_id is null);

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
using (exists (select 1 from public.articles a where a.id = article_id and (public.can_manage_article(a.id) or a.author_user_id = auth.uid())));

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
using (exists (select 1 from public.articles a where a.id = article_id and a.status = 'published'));

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
using (recipient_user_id = auth.uid() or public.is_manager());
drop policy if exists p_notifications_recipient_update on public.notifications;
create policy p_notifications_recipient_update
on public.notifications for update to authenticated
using (recipient_user_id = auth.uid() or public.is_manager())
with check (recipient_user_id = auth.uid() or public.is_manager());
drop policy if exists p_notifications_manager_insert on public.notifications;
create policy p_notifications_manager_insert
on public.notifications for insert to authenticated
with check (public.is_manager());

drop policy if exists p_attachments_owner_or_manager_read on public.attachments;
create policy p_attachments_owner_or_manager_read
on public.attachments for select to authenticated
using (owner_user_id = auth.uid() or public.is_manager());
drop policy if exists p_attachments_owner_or_manager_write on public.attachments;
create policy p_attachments_owner_or_manager_write
on public.attachments for all to authenticated
using (owner_user_id = auth.uid() or public.is_manager())
with check (owner_user_id = auth.uid() or public.is_manager());

drop policy if exists p_audit_logs_manager_read on public.audit_logs;
create policy p_audit_logs_manager_read on public.audit_logs for select to authenticated using (public.is_manager());
drop policy if exists p_audit_logs_manager_insert on public.audit_logs;
create policy p_audit_logs_manager_insert on public.audit_logs for insert to authenticated with check (public.is_manager());

drop policy if exists p_comments_auth_read on public.comments;
create policy p_comments_auth_read on public.comments for select to authenticated using (true);
drop policy if exists p_comments_auth_insert on public.comments;
create policy p_comments_auth_insert on public.comments for insert to authenticated with check (author_user_id = auth.uid() or author_user_id is null);
drop policy if exists p_comments_author_or_manager_update on public.comments;
create policy p_comments_author_or_manager_update on public.comments for update to authenticated using (author_user_id = auth.uid() or public.is_manager()) with check (author_user_id = auth.uid() or public.is_manager());
drop policy if exists p_comments_author_or_manager_delete on public.comments;
create policy p_comments_author_or_manager_delete on public.comments for delete to authenticated using (author_user_id = auth.uid() or public.is_manager());

drop policy if exists p_activity_stream_auth_read on public.activity_stream;
create policy p_activity_stream_auth_read on public.activity_stream for select to authenticated using (true);
drop policy if exists p_activity_stream_manager_insert on public.activity_stream;
create policy p_activity_stream_manager_insert on public.activity_stream for insert to authenticated with check (public.is_manager());
drop policy if exists p_activity_stream_manager_update on public.activity_stream;
create policy p_activity_stream_manager_update on public.activity_stream for update to authenticated using (public.is_manager()) with check (public.is_manager());
