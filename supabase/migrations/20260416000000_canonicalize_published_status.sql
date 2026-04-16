-- Canonicalize legacy 'published' statuses to 'authorized_public'
-- This migration is idempotent and safe to rerun.

begin;

update public.events
set status = 'authorized_public'
where status = 'published';

update public.event_status_history
set to_status = 'authorized_public'
where to_status = 'published';

update public.event_status_history
set from_status = 'authorized_public'
where from_status = 'published';

update public.articles
set status = 'authorized_public'
where status = 'published';

commit;
