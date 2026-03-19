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

create trigger tr_workflow_approvals_immutable_update
before update on public.workflow_approvals
for each row execute function public.fn_prevent_workflow_approval_modification();

create trigger tr_workflow_approvals_immutable_delete
before delete on public.workflow_approvals
for each row execute function public.fn_prevent_workflow_approval_modification();

-- RLS for workflow_approvals
alter table public.workflow_approvals enable row level security;

-- Policies:
-- 1. Anyone with access to the entity can read the approval history.
-- 2. Actors can insert records (further restricted by server logic).

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

create policy p_workflow_approvals_insert
on public.workflow_approvals
for insert
to authenticated
with check (auth.uid() = actor_id);

-- Add comments for postgraphile / generated types
comment on table public.workflow_approvals is 'Immutable audit log of workflow approval steps and remarks.';
