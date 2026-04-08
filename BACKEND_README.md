# Pragya Pravah — Backend (First Half) Reference

> **Stack**: Next.js 16 API Routes · TypeScript · Drizzle ORM · Neon Serverless Postgres · JWT (jose) · bcrypt · Zod

---

## Quick Start

```bash
# 1. Install dependencies (adds drizzle-orm, bcryptjs, drizzle-kit, tsx)
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in DATABASE_URL, DATABASE_URL_UNPOOLED, JWT_SECRET

# 3. Push schema to Neon (first-time or after schema changes)
npm run db:push

# 4. Seed roles + demo org (optional)
npm run db:seed

# 5. Start dev server
npm run dev
```

---

## Folder Structure (New Backend Files)

```
src/
├── db/
│   ├── client.ts               # Drizzle + Neon connection
│   ├── seed.ts                 # (to be written in second half)
│   └── schema/
│       ├── enums.ts            # All PostgreSQL enums
│       ├── org.ts              # org_settings, units, departments_or_aayams, locations
│       ├── users.ts            # profiles, roles, user_role_assignments
│       ├── events.ts           # events + all sub-tables (polls, registrations, vritt)
│       ├── articles.ts         # articles, article_reviews, article_publications
│       ├── shared.ts           # prachar, vimarsh, tags, comments, notifications, audit
│       └── index.ts            # barrel export

├── lib/
│   ├── auth/
│   │   ├── jwt.ts              # signJwt / verifyJwt (HS256)
│   │   ├── session.ts          # cookie read/write helpers
│   │   └── password.ts         # bcrypt hash/verify
│   ├── middleware/
│   │   ├── with-auth.ts        # withAuth / withRole / withPermission wrappers
│   │   └── rate-limit.ts       # in-memory rate limiter (2 presets: api + public)
│   ├── permissions/
│   │   ├── types.ts            # RoleCode, AppPermissions types + ROLE_PRIORITY
│   │   ├── index.ts            # resolvePermissions(), hasRoleOrAbove()
│   │   ├── event-workflow.ts   # Event state machine + validateEventTransition()
│   │   └── article-workflow.ts # Article state machine + validateArticleTransition()
│   ├── validators/
│   │   ├── auth.ts             # loginSchema, changePasswordSchema
│   │   ├── users.ts            # createUser, updateUser, assignRole, listUsers
│   │   ├── events.ts           # createEvent, updateEvent, workflow, polls, checklist, registration
│   │   └── articles.ts         # createArticle, updateArticle, workflow, review, publication
│   ├── audit.ts                # writeAuditLog() + writeActivity() + auditAndActivity()
│   └── response.ts             # apiSuccess/apiCreated/apiError/notFound/badRequest/...

└── app/api/
    ├── auth/
    │   ├── login/route.ts      # POST — email+password → JWT cookie
    │   ├── logout/route.ts     # POST — clear session
    │   └── me/route.ts         # GET  — current session context

    └── v1/
        ├── roles/route.ts      # GET  — list all roles
        ├── users/
        │   ├── route.ts        # GET list / POST create
        │   └── [userId]/
        │       ├── route.ts    # GET / PATCH
        │       └── roles/route.ts  # GET / POST assign
        ├── events/
        │   ├── route.ts        # GET list / POST create
        │   └── [eventId]/
        │       ├── route.ts        # GET / PATCH
        │       ├── workflow/route.ts    # POST — status transition
        │       ├── checklist/route.ts   # GET / PATCH — logistics checklist
        │       ├── polls/
        │       │   ├── route.ts         # GET list / POST create
        │       │   └── [pollId]/route.ts # POST vote / POST finalize
        │       └── registrations/route.ts  # GET — internal registration list
        └── articles/
            ├── route.ts        # GET list / POST create
            └── [articleId]/
                ├── route.ts        # GET / PATCH
                ├── workflow/route.ts    # POST — status transition
                └── reviews/route.ts    # GET history / POST review note or publication
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Email + password → session cookie |
| POST | `/api/auth/logout` | Cookie | Clear session |
| GET  | `/api/auth/me` | Cookie | Current user context |

### Users & Roles

| Method | Endpoint | Min Role | Description |
|--------|----------|----------|-------------|
| GET  | `/api/v1/roles` | any | List all role definitions |
| GET  | `/api/v1/users` | org_admin | List users with search/filters |
| POST | `/api/v1/users` | org_admin | Create user with initial role |
| GET  | `/api/v1/users/[id]` | self or org_admin | Get user + role assignments |
| PATCH | `/api/v1/users/[id]` | self or org_admin | Update profile |
| GET  | `/api/v1/users/[id]/roles` | self or org_admin | List role assignments |
| POST | `/api/v1/users/[id]/roles` | org_admin | Assign a role |

### Events (Gativiidhi)

| Method | Endpoint | Min Role | Description |
|--------|----------|----------|-------------|
| GET  | `/api/v1/events` | karyakarta | List events (scoped by role) |
| POST | `/api/v1/events` | unit_head | Create event |
| GET  | `/api/v1/events/[id]` | karyakarta | Full event with polls, history, form |
| PATCH | `/api/v1/events/[id]` | unit_head | Update event metadata |
| POST | `/api/v1/events/[id]/workflow` | varies | Trigger status transition |
| GET  | `/api/v1/events/[id]/checklist` | karyakarta | Get logistics checklist |
| PATCH | `/api/v1/events/[id]/checklist` | unit_head | Update checklist items |
| GET  | `/api/v1/events/[id]/polls` | karyakarta | List polls with vote counts |
| POST | `/api/v1/events/[id]/polls` | unit_head | Create a poll |
| POST | `/api/v1/events/[id]/polls/[pollId]` | any auth | Cast vote or finalize poll |
| GET  | `/api/v1/events/[id]/registrations` | unit_head | List public registrations |

#### Event Workflow Transitions

```
draft                         →  submitted_by_unit          [unit_head]
submitted_by_unit             →  pending_aayam_review       [aayam_pramukh]
pending_aayam_review          →  pending_vibhag_review      [aayam_pramukh]
pending_vibhag_review         →  pending_prant_authorization [vibhag_pramukh]
pending_prant_authorization   →  pending_prant_dual_auth    [prant_sanyojak]
pending_prant_dual_auth       →  authorized_public          [prant_aayam_pramukh]

Any active stage → returned_for_revision  [aayam_pramukh+, note required]
Any active stage → rejected               [aayam_pramukh+, note required]
Any active stage → escalated_kshetra      [kshetra_reviewer, note required]
Any stage        → cancelled              [vibhag_pramukh]
```

### Articles (Aalekh)

| Method | Endpoint | Min Role | Description |
|--------|----------|----------|-------------|
| GET  | `/api/v1/articles` | karyakarta | List articles (scoped by role) |
| POST | `/api/v1/articles` | karyakarta | Create article draft |
| GET  | `/api/v1/articles/[id]` | karyakarta | Full article with reviews + publications |
| PATCH | `/api/v1/articles/[id]` | karyakarta (own) | Update article |
| POST | `/api/v1/articles/[id]/workflow` | varies | Trigger status transition |
| GET  | `/api/v1/articles/[id]/reviews` | karyakarta | Review history + publications |
| POST | `/api/v1/articles/[id]/reviews` | unit_head | Add review note or publication record |

#### Article Workflow Transitions

```
draft / returned_for_revision  →  pending_unit_head_review   [karyakarta, checklist required]
pending_unit_head_review       →  pending_aayam_review       [unit_head]
pending_aayam_review           →  pending_vibhag_review      [aayam_pramukh]
pending_vibhag_review          →  pending_prant_authorization [vibhag_pramukh]
pending_prant_authorization    →  authorized_public          [prant_sanyojak]

Any review stage → returned_for_revision  [unit_head+, note required]
Any review stage → rejected               [unit_head+, note required]
Any review stage → escalated_kshetra      [kshetra_reviewer, note required]
authorized_public → archived              [vibhag_pramukh]
```

#### Values Checklist (required before submission)
All four must be `true`:
- `rashtraPratham` — Nation first
- `culturallyGrounded` — Rooted in Bharatiya culture
- `balancedTone` — Measured, not inflammatory
- `noDivisiveContent` — No divisive content

---

## Standard Response Format

```typescript
// Success
{ "success": true, "data": {...}, "meta"?: { page, limit, total, hasMore } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

---

## Role Hierarchy

```
super_admin (0)           — Full system control
org_admin (1)             — Full org control
kshetra_reviewer (2)      — Regional escalation reviewer
prant_sanyojak (3)        — State coordinator
prant_aayam_pramukh (4)   — State department head
vibhag_pramukh (5)        — Division head
aayam_pramukh (6)         — Department/Aayam head
unit_head (7)             — Local unit head
karyakarta (8)            — Field worker (floor role)
```

---

## Security

- **JWT**: HS256, 24h expiry, httpOnly session cookie (`pp_session`)
- **Passwords**: bcrypt, cost factor 12
- **Rate limiting**: 60 req/min (API), 10 req/min (public submissions)
- **IP tracking**: All public submissions + login failures log IP
- **Audit trail**: Every state change written to `audit_logs` (immutable)
- **RBAC**: Role hierarchy enforced at middleware + state machine level
- **Session scope**: JWT encodes orgId — users cannot access cross-org data

---

## Drizzle Commands

```bash
npm run db:generate    # Generate migration files from schema changes
npm run db:push        # Push schema directly to Neon (dev)
npm run db:migrate     # Run pending migrations (production)
npm run db:studio      # Open Drizzle Studio (visual DB browser)
```

---

## What's in the Second Half

- Prachar coordination API (`/api/v1/prachar/`)
- Vimarsh topics + resources API (`/api/v1/vimarsh/`)
- Notifications API (`/api/v1/notifications/`)
- Public event registration + voting endpoints (`/api/public/`)
- Search API (`/api/v1/search/`)
- Org settings + units + aayams management API
- DB seed script (`src/db/seed.ts`) — demo org, roles, users
- Dayitv (responsibility) API
- Attachments/upload signing API
- Vritt (event report) API
