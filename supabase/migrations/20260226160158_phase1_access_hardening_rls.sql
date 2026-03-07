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
  select coalesce(auth.uid() is not null and exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid()
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
        e.submitted_by_user_id = auth.uid()
        or (
          e.status = 'published'
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
          e.status <> 'published'
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
          e.submitted_by_user_id = auth.uid()
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
        a.author_user_id = auth.uid()
        or (
          a.status = 'published'
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
          a.status <> 'published'
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
        a.author_user_id = auth.uid()
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
  and (submitted_by_user_id = auth.uid() or submitted_by_user_id is null)
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
  (author_user_id = auth.uid() or author_user_id is null)
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
