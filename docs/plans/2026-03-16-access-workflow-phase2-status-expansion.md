# Phase 2 Workflow Status Expansion (Planned)

Phase 1 hardening focused on real auth/session enforcement and permission checks. It does **not** change the existing `event_status` / `article_status` enums yet because that would be a cross-layer breaking change in the same release.

## Why deferred

Changing workflow enums now would require coordinated updates across:

- DB enum definitions and data migration
- access helper logic that branches on `published` vs non-published states
- server permission transition logic
- UI status unions and badges
- page-specific workflow action branches
- generated database types

This is better handled as a dedicated migration + application rollout.

## Target event workflow states (client-aligned)

- `draft`
- `submitted_by_unit`
- `pending_aayam_review`
- `pending_vibhag_review`
- `pending_prant_authorization`
- `pending_prant_dual_authorization`
- `authorized_public`
- `escalated_kshetra`
- `returned_for_revision`
- `rejected`
- `cancelled`

## Target article workflow states (client-aligned)

- `draft`
- `pending_unit_head_review`
- `pending_aayam_review`
- `pending_vibhag_review`
- `pending_prant_authorization`
- `pending_prant_dual_authorization`
- `authorized_public`
- `escalated_kshetra`
- `returned_for_revision`
- `rejected`
- `archived`

## Exact impact points in current repo

Database / migrations

- `scripts/neon-consolidated-migration.sql` (current enum definitions)
- `scripts/neon-consolidated-migration.sql` (helper functions that treat `published` as final public state)

Generated types

- `src/types/database.ts` (`event_status`, `article_status`)

Server mapping + transition logic

- `src/lib/server/app-repository.ts` (`dbToUiEventStatus`, `uiToDbEventStatus`, `dbToUiArticleStatus`, `uiToDbArticleStatus`)
- `src/lib/server/permissions.ts` (`canTransitionEventStatus`, `canTransitionArticleStatus`, publish/finalize checks)

Client contracts + context

- `src/lib/app/contracts.ts` (`EventStatus`, `ArticleStatus`)
- `src/context/AppContext.tsx` (UI status unions and local fallback seeded data)

UI workflow screens

- `src/components/pages/Dashboard.tsx` (event review/publish flow and status-based actions)
- `src/components/pages/Aalekh.tsx` (article review/publish flow)
- `src/components/pages/AnnualCalendar.tsx` (status labels/actions)
- `src/components/pages/ContentFeed.tsx` (published filtering)
- `src/components/Navbar.tsx` (notifications derived from workflow state)

## Recommended rollout sequence (Phase 2)

1. Add immutable approval-step records (including Prant dual-approval actors and remarks).
2. Introduce new statuses in DB enum migration and migrate existing rows (`published` -> `authorized_public`, etc.).
3. Update server permission transitions (`src/lib/server/permissions.ts`) before UI changes.
4. Update repository UI/DB mappings (`src/lib/server/app-repository.ts`).
5. Regenerate `src/types/database.ts`.
6. Update UI status labels/actions in `Dashboard` and `Aalekh`.
7. Add tests for Prant dual authorization and Kshetra escalation paths.
