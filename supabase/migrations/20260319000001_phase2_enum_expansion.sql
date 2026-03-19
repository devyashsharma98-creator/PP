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
