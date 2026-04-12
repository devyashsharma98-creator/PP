# Pragya Pravah UI (Next.js + Supabase)

Next.js App Router frontend for Pragya Pravah workflow operations, now wired to a Supabase backend foundation (schema, RLS, storage policies, server routes, and generated DB types).

## Stack

- Next.js (App Router, TypeScript)
- React
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Storage, Edge Functions scaffold)

## Project Structure

### Frontend

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
  - `ui/` - Shared atomic UI components (shadcn/ui)
  - `pages/` - Page-specific complex views and logic
- `src/context/` - Global application state and providers (`AppContext`)
- `src/lib/` - Shared utilities and domain logic
  - `app/` - Core contracts, types, and constants
  - `server/` - Server-side repositories, permissions, and business logic
  - `supabase/` - Supabase client configurations (browser/server)
- `src/types/` - Shared TypeScript definitions (including generated DB types)

### Supabase (Backend)

- `supabase/config.toml` - local Supabase CLI config
- `supabase/migrations/` - SQL source of truth (schema + RLS + storage policies)
- `supabase/seed.sql` - idempotent local/dev seed
- `supabase/functions/` - Edge Function scaffolds

## Documentation

Detailed architectural plans and design documents are available in the `docs/plans/` directory:

- [Demo Role Collapse Design](./docs/plans/2026-03-08-demo-role-collapse-design.md)
- [Aalekh Publication Pipeline](./docs/plans/2026-03-09-aalekh-publication-pipeline.md)
- [Prachar Campaign Control Room](./docs/plans/2026-03-09-prachar-campaign-control-room.md)
- [Institutional Planning Calendar](./docs/plans/2026-03-12-calendar-institutional-planning-panchang.md)
- [Phase 2 Expansion Plan](./docs/plans/2026-03-16-access-workflow-phase2-status-expansion.md)
- [Client Mobile Guide](./CLIENT_MOBILE_GUIDE.md)

## Environment

Copy `.env.example` to `.env.local` and set values.

Required keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD` (for CLI `db push` / `link`)

Optional:

- `NEXT_PUBLIC_ENABLE_DEMO_ROLE_SWITCH=true` for prototype role switching in the navbar

## Install / Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase CLI Workflow

### 1. Login

```bash
supabase login
```

### 2. Link this repo to a project

```bash
supabase link --project-ref <project-ref>
```

If prompted, provide the remote DB password (or use `-p`).

### 3. Push migrations

```bash
npm run supabase:db:push
```

### 4. Generate database types

```bash
npm run supabase:types
```

This updates `src/types/database.ts` from the linked project.

## Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript check
- `npm run supabase:login` - Supabase CLI login
- `npm run supabase:link` - link local repo to a Supabase project
- `npm run supabase:db:push` - push local SQL migrations to linked project
- `npm run supabase:types` - generate TS DB types from linked project

## Current Backend Foundation Status

- Core workflow tables implemented (events, registrations, polls/votes, articles, prachar, notifications, attachments, audit logs)
- Future-ready foundation tables implemented (org settings, roles, units, departments/aayams, tags, workflow templates/steps, comments, activity stream, locations)
- RLS enabled across public workflow tables with helper-role functions and public registration/vote policies
- Storage buckets created private by default with restrictive object policies
- Next.js API routes added for bootstrap/app actions and secure public registration/vote submission

## Notes / TODOs

- Internal app action routes currently use server-side service role for prototype continuity. Replace with authenticated session-aware server actions/route guards before production launch.
- Auth UI/session flows are not fully implemented yet; role switching remains demo-only and is env-gated.
- Upload signing + attachment flows are scaffolded conceptually but not fully implemented in the UI.
