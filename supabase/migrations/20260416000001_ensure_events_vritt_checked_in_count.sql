-- Ensure QR / public check-in counter column exists (idempotent).
-- Some environments may not have applied phase3 migration yet.

alter table public.events
  add column if not exists vritt_checked_in_count integer default 0;

comment on column public.events.vritt_checked_in_count is 'Count of verified venue check-ins via QR or public check-in endpoint.';
