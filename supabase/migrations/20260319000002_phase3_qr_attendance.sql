-- Phase 3: QR Check-in and Real-time Attendance
-- Adding verified checked-in count to events for precision reporting.

alter table public.events 
add column if not exists vritt_checked_in_count integer default 0;

comment on column public.events.vritt_checked_in_count is 'Count of verified venue check-ins via QR code.';
