# Pragya Pravah UI (Next.js + Neon Postgres)

Next.js App Router frontend for Pragya Pravah workflow operations, wired to a Neon Postgres backend foundation, server routes, and generated DB types.

## Stack

- Next.js (App Router, TypeScript)
- React
- Tailwind CSS + shadcn/ui
- Neon Serverless Postgres (primary database)

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
- `src/types/` - Shared TypeScript definitions (including generated DB types)

## Documentation

Detailed architectural plans and design documents are available in the `docs/plans/` directory:

- [Aalekh Publication Pipeline](./docs/plans/2026-03-09-aalekh-publication-pipeline.md)
- [Prachar Campaign Control Room](./docs/plans/2026-03-09-prachar-campaign-control-room.md)
- [Institutional Planning Calendar](./docs/plans/2026-03-12-calendar-institutional-planning-panchang.md)
- [Phase 2 Expansion Plan](./docs/plans/2026-03-16-access-workflow-phase2-status-expansion.md)

## Environment

Copy `.env.example` to `.env.local` and set values.

Required keys:

- `DATABASE_URL` (Neon Postgres connection string)
- `JWT_SECRET` (min 32 chars; used for session signing)
- `APP_LOCAL_ADMIN_EMAIL` (default local admin seed email)
- `APP_LOCAL_ADMIN_PASSWORD` (default local admin seed password)
- `APP_LOCAL_ADMIN_NAME` (default local admin seed display name)
- `APP_ORG_CODE` (e.g., `bhopal_vibhag`)

Optional:

- `NEXT_PUBLIC_ENABLE_DEMO_DATA_FALLBACK=true` to show empty-state messages when APIs return no data
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` for file uploads

## Install / Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript check


## Current Backend Foundation Status

- Core workflow tables implemented (events, registrations, polls/votes, articles, prachar, notifications, attachments, audit logs)
- Future-ready foundation tables implemented (org settings, roles, units, departments/aayams, tags, workflow templates/steps, comments, activity stream, locations)
- Next.js API routes added for bootstrap/app actions and secure public registration/vote submission

## Notes / TODOs

- App action routes use authenticated session context.
- Real JWT auth is implemented.
- Presigned upload endpoint is implemented and UI hooks are available; full attachment integration remains in progress.

## Recently Fixed

### Data & APIs
- **Directory** page now fetches real member data from `/api/v1/directory` instead of a hardcoded array.
- **Dayitv** page now fetches real org structure from `/api/v1/org/structure` instead of hardcoded vibhag/aayam lists.
- **AnnualCalendar** no longer injects fake `STATIC_EVENTS`; it relies entirely on real event data from the API.
- **Vimarsh** page now fetches thematic topics from `/api/v1/vimarsh/topics` instead of static bindu arrays.
- **AapKaItihas** (history) page now fetches from `/api/v1/activity` instead of a hardcoded timeline.
- **AppContext** mock fallback data (`initialEvents`, `initialArticles`, `initialPracharStatuses`) has been removed. Empty states are shown when no data exists.

### Auth & Security
- Auth/session architecture uses authenticated session-aware server actions and route guards.
- `availableRoles` derived state exposed from `AppContext` so UI only shows switchable roles.

### Performance & Infra
- Cache headers in `next.config.mjs` split by route type: static assets get `immutable`, public pages get `stale-while-revalidate`, and protected/API routes stay `no-store`.
- `@types/react` upgraded to v19 to match React 19 runtime.
- PWA manifest (`manifest.json`) and service worker (`sw.js`) added with shell precaching.
- SEO metadata expanded: Open Graph, Twitter cards, keywords, authors, robots.

### Uploads & Attachments
- Upload signing scaffold replaced with a working `/api/v1/upload/presigned` endpoint and corresponding `usePresignedUpload` hook.
- File upload supports S3-compatible storage (Cloudflare R2) via dynamic AWS SDK imports with graceful fallback when not configured.

### Testing & Reliability
- E2E test stability: login retry loop (3 attempts), `test.slow()` on multi-step aalekh workflow tests, and explicit calendar button selectors via aria-label.
- `useSimulationWorkspace` mocks carry a warning comment to migrate to seeded DB data.
- Error boundaries (`error.tsx`) added to all major routes for graceful failure handling.
- Notifications polling interval standardized (30s) across list and unread-count hooks.
