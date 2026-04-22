# Pragya Pravah ERP - Production-Grade Redesign Specification

## Executive Summary

This document provides a comprehensive redesign of the Pragya Pravah ERP system from a "half-baked" prototype to a production-grade enterprise solution. The redesign maintains the current Next.js + Neon stack while addressing critical architectural gaps, security vulnerabilities, and missing enterprise features.

---

## Part 1: Current State Analysis

### 1.1 Identified Modules

| Module | Path | Status | Issues |
|--------|------|--------|--------|
| Dashboard | `/dashboard` | Partial | Role-specific views hardcoded, mixed client/server logic |
| Aalekh (Articles) | `/aalekh` | Basic | Workflow states exist in DB but UI incomplete |
| Prachar (Publicity) | `/prachar` | Basic | Manual status toggle, no automation |
| Calendar | `/calendar` | UI Only | No backend integration |
| Vimarsh (Discussions) | `/vimarsh` | Basic | Topics exist in contracts, no full implementation |
| Dayitv (Activities) | `/dayitv` | Basic | Minimal functionality |
| Directory | `/directory` | Basic | Hardcoded user data |
| Vote | `/vote/[eventId]` | Partial | Poll voting works, no admin controls |
| Parichay (Identity) | `/parichay` | Partial | Profile management exists |
| Form | `/form/[eventId]` | Functional | Registration forms work |
| History | `/history` | UI Only | No backend |

### 1.2 Technology Stack (Current)

- **Frontend**: Next.js 16, React 19, TypeScript 6
- **Styling**: Tailwind CSS, Radix UI components, Framer Motion
- **Database**: Neon Serverless PostgreSQL
- **Auth**: Supabase Auth (via @supabase/ssr)
- **State Management**: React Context (AppContext.tsx)
- **Package Manager**: npm

### 1.3 Database Schema (Current Issues)

**Enums Defined**: event_status, article_status, poll_type, question_type, assignment_scope_type, attachment_visibility, notification_kind, comment_visibility, article_review_decision

**Tables**: org_settings, units, departments_or_aayams, locations, roles, profiles, user_role_assignments, workflow_templates, workflow_steps, tags, events, event_status_history, event_form_configs, event_form_questions, event_registrations, event_registration_answers, event_polls, event_poll_options, event_poll_votes, articles, article_reviews, article_publications, prachar_statuses, notifications, attachments, audit_logs, entity_tags, comments, activity_stream

**Critical Gaps**:
1. Missing: finance, inventory, HR/employee management, document management, messaging
2. Missing: RBAC table structure (only roles enum exists)
3. Missing: audit trail completeness
4. Missing: proper soft-delete patterns
5. Missing: data versioning/snapshots

### 1.4 Pain Points Identified

1. **Client-side demo data fallback** - AppContext has hardcoded demo data as fallback
2. **Role-based UI hardcoded** - Dashboard.tsx has role-switching with 500+ lines of inline code
3. **No proper API layer** - Mixed concerns in frontend components
4. **Permissions are simplistic** - Only 8 permission flags in contracts.ts
5. **No proper error handling** - try/catch everywhere but no standardized errors
6. **State management is fragile** - React Context with no persistence layer
7. **No caching strategy** - Every page load hits database
8. **Security gaps** - RLS policies exist but not fully enforced
9. **No proper testing** - Only Playwright e2e, no unit tests
10. **No monitoring/observability** - No error tracking, performance monitoring

---

## Part 2: Production-Grade Architecture Redesign

### 2.1 Architectural Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                         │
│  Next.js App Router │ Components │ Hooks │ Context Providers   │
├─────────────────────────────────────────────────────────────────┤
│                       API LAYER (BFF)                          │
│  Route Handlers │ Middleware │ Validation │ Rate Limiting      │
├─────────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                             │
│  Business Logic │ Validation │ Transactions │ Events          │
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                │
│  Repositories │ Queries │ Migrations │ Schema                 │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                              │
│  Neon DB │ Hosting │ CI/CD │ Monitoring │ Security              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group
│   │   ├── login/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Authenticated group
│   │   ├── dashboard/
│   │   ├── aalekh/
│   │   ├── prachar/
│   │   ├── calendar/
│   │   └── ...other modules
│   ├── (public)/                 # Public group
│   │   ├── form/[eventId]/
│   │   ├── vote/[eventId]/
│   │   └── events/[eventId]/
│   └── api/
│       ├── v1/                   # Versioned API
│       │   ├── events/
│       │   ├── users/
│       │   ├── articles/
│       │   └── auth/
│       └── webhooks/
├── components/
│   ├── ui/                       # Shadcn/UI components
│   ├── forms/                    # Form components with react-hook-form
│   ├── layouts/                  # Layout components
│   └── modules/                  # Module-specific components
│       ├── dashboard/
│       ├── aalekh/
│       └── ...
├── lib/
│   ├── server/                   # Server-only utilities
│   │   ├── services/             # Business logic services
│   │   ├── repositories/         # Data access
│   │   └── middleware/           # Custom middleware
│   ├── client/                   # Client utilities
│   ├── shared/                   # Shared types, utils
│   └── constants/               # App constants
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
├── context/                      # React contexts
└── styles/                       # Global styles
```

### 2.3 Core Services Architecture

```typescript
// src/lib/server/services/types.ts
export interface IService<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export interface IEventService extends IService<CreateEventInput, Event> {
  getById(id: string): Promise<Event | null>;
  list(filters: EventFilters): Promise<PaginatedResult<Event>>;
  updateStatus(id: string, status: EventStatus): Promise<Event>;
  delete(id: string): Promise<void>;
}

export interface IArticleService extends IService<CreateArticleInput, Article> {
  submitForReview(id: string): Promise<Article>;
  approve(id: string, reviewerId: string): Promise<Article>;
  reject(id: string, reviewerId: string, reason: string): Promise<Article>;
  publish(id: string): Promise<Article>;
}

export interface IUserService extends IService<UserInput, User> {
  assignRole(userId: string, role: RoleCode, scope: Scope): Promise<void>;
  removeRole(userId: string, roleId: string): Promise<void>;
  getPermissions(userId: string): Promise<Permission[]>;
}
```

### 2.4 Repository Pattern

```typescript
// src/lib/server/repositories/base.ts
export abstract class BaseRepository<T> {
  protected tableName: string;
  
  abstract mapToEntity(row: unknown): T;
  
  async findById(id: string): Promise<T | null> {
    const { data } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    return data ? this.mapToEntity(data) : null;
  }
  
  async findMany(filters: Record<string, unknown>): Promise<T[]> {
    const { data } = await this.db
      .from(this.tableName)
      .select('*')
      .match(filters);
    return data?.map(this.mapToEntity) ?? [];
  }
  
  async create(input: Partial<T>): Promise<T> {
    const { data } = await this.db
      .from(this.tableName)
      .insert(input)
      .select()
      .single();
    return this.mapToEntity(data);
  }
}

// src/lib/server/repositories/event.repository.ts
export class EventRepository extends BaseRepository<Event> {
  constructor() {
    super('events');
  }
  
  async findWithRelations(id: string): Promise<EventWithRelations> {
    const { data } = await this.db
      .from('events')
      .select(`
        *,
        unit:units(name),
        department:departments_or_aayams(name),
        location:locations(name, city),
        registrations:event_registrations(*),
        polls:event_polls(*, options:event_poll_options(*))
      `)
      .eq('id', id)
      .single();
    return this.mapToEntity(data);
  }
}
```

---

## Part 3: Database Schema Expansion

### 3.1 New Schema Additions

```sql
-- NEW TABLES FOR PRODUCTION ERP

-- 1. RBAC: Role-based Access Control
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_code text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  is_granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_code, resource_type, resource_id)
);

CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  device_info jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Finance Module (Minimal)
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  fiscal_year integer NOT NULL,
  category text NOT NULL,
  allocated_amount numeric(15,2) NOT NULL,
  spent_amount numeric(15,2) NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, unit_id, fiscal_year, category)
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(15,2) NOT NULL,
  expense_date date NOT NULL,
  receipt_url text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Document Management
CREATE TABLE public.document_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
  parent_folder_id uuid REFERENCES public.document_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  path text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, parent_folder_id, name)
);

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES public.document_folders(id) ON DELETE SET NULL,
  owner_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  file_size_bytes bigint,
  version integer NOT NULL DEFAULT 1,
  is_latest boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Messaging (Internal)
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
  conversation_type text NOT NULL DEFAULT 'direct',
  title text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  attachments jsonb DEFAULT '[]'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Audit & Compliance
CREATE TABLE public.audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.org_settings(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id uuid REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Soft Delete Support
ALTER TABLE public.events ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.articles ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.articles ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN deleted_at timestamptz;

-- 7. Indexes for Performance
CREATE INDEX idx_events_unit_status ON public.events(unit_id, status);
CREATE INDEX idx_events_date_range ON public.events(starts_at, ends_at);
CREATE INDEX idx_articles_author_status ON public.articles(author_user_id, status);
CREATE INDEX idx_registrations_event_date ON public.event_registrations(event_id, created_at);
CREATE INDEX idx_notifications_user_read ON public.notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX idx_audit_trail_resource ON public.audit_trail(resource_type, resource_id, created_at DESC);
```

---

## Part 4: API Design (RESTful with versioning)

### 4.1 API Structure

```
Base URL: /api/v1

Authentication:
- POST   /auth/login          - Login with email/password
- POST   /auth/logout         - Logout
- POST   /auth/refresh        - Refresh token
- GET    /auth/me             - Current user info

Users:
- GET    /users               - List users (admin)
- GET    /users/:id           - Get user details
- PATCH  /users/:id           - Update user
- DELETE /users/:id           - Soft delete user
- POST   /users/:id/roles     - Assign role to user
- DELETE /users/:id/roles/:roleId - Remove role

Events:
- GET    /events              - List events (with filters)
- POST   /events              - Create event
- GET    /events/:id          - Get event details
- PATCH  /events/:id          - Update event
- DELETE /events/:id          - Soft delete event
- POST   /events/:id/submit   - Submit for review
- POST   /events/:id/approve  - Approve event
- POST   /events/:id/reject   - Reject event
- POST   /events/:id/publish  - Publish event

Articles (Aalekh):
- GET    /articles            - List articles
- POST   /articles            - Create article
- GET    /articles/:id       - Get article
- PATCH  /articles/:id       - Update article
- DELETE /articles/:id       - Soft delete
- POST   /articles/:id/submit    - Submit for review
- POST   /articles/:id/approve   - Approve
- POST   /articles/:id/publish   - Publish

Registrations:
- GET    /events/:id/registrations     - List registrations
- POST   /events/:id/registrations     - Create registration (public)
- GET    /events/:id/registrations/:regId - Get registration

Polls:
- GET    /events/:id/polls           - List polls
- POST   /events/:id/polls           - Create poll
- POST   /polls/:id/vote             - Cast vote
- POST   /polls/:id/finalize         - Finalize poll

Prachar:
- GET    /events/:id/prachar         - Get prachar status
- PATCH  /events/:id/prachar         - Update prachar status

Reports:
- GET    /reports/events             - Event reports
- GET    /reports/registrations      - Registration reports
- GET    /reports/analytics          - Analytics data
```

### 4.2 API Response Format

```typescript
// Standard API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// Example Response
{
  "success": true,
  "data": {
    "events": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "hasMore": true
    }
  }
}
```

### 4.3 Error Handling

```typescript
// src/lib/server/errors/app-errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'RESOURCE_NOT_FOUND', `${resource} with id ${id} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

// Middleware handler
export function withErrorHandling(handler: RequestHandler): RequestHandler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      }
      // Log unexpected errors
      console.error('Unexpected error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  };
}
```

---

## Part 5: Security Architecture

### 5.1 Authentication Flow

```typescript
// src/lib/server/auth/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-in-production'
);

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

// src/middleware.ts - Request authentication
import { verifyToken } from '@/lib/server/auth/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value 
    || request.headers.get('authorization')?.replace('Bearer ', '');
    
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Add user info to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-roles', JSON.stringify(payload.roles));
  requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions));
  
  return NextResponse.next({
    request: { headers: requestHeaders }
  });
}
```

### 5.2 Permission System

```typescript
// src/lib/server/permissions/guard.ts
export type Permission =
  | 'event:create'
  | 'event:read'
  | 'event:update'
  | 'event:delete'
  | 'event:approve'
  | 'event:publish'
  | 'article:create'
  | 'article:read'
  | 'article:update'
  | 'article:delete'
  | 'article:approve'
  | 'article:publish'
  | 'user:create'
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  | 'report:read'
  | 'admin:full';

export function checkPermission(
  userPermissions: Permission[],
  required: Permission | Permission[]
): boolean {
  const requiredPermissions = Array.isArray(required) ? required : [required];
  return requiredPermissions.every(p => userPermissions.includes(p));
}

export function withPermission(
  required: Permission | Permission[],
  handler: RequestHandler
): RequestHandler {
  return async (req, res) => {
    const userPermissions = JSON.parse(req.headers.get('x-user-permissions') || '[]');
    
    if (!checkPermission(userPermissions, required)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }
    
    await handler(req, res);
  };
}
```

### 5.3 Rate Limiting

```typescript
// src/lib/server/middleware/rate-limit.ts
import LRU from 'lru-cache';

const rateLimiter = new LRU<string, { count: number; resetAt: number }>({
  max: 1000,
  ttl: 60 * 1000 // 1 minute
});

export function rateLimit(maxRequests: number = 100) {
  return async (req: NextRequest): Promise<{ allowed: boolean; remaining: number }> => {
    const ip = req.ip || 'unknown';
    const key = `rate-limit:${ip}`;
    
    const current = rateLimiter.get(key) || { count: 0, resetAt: Date.now() + 60000 };
    
    if (Date.now() > current.resetAt) {
      current.count = 1;
      current.resetAt = Date.now() + 60000;
    } else {
      current.count++;
    }
    
    rateLimiter.set(key, current);
    
    return {
      allowed: current.count <= maxRequests,
      remaining: Math.max(0, maxRequests - current.count)
    };
  };
}
```

---

## Part 6: State Management Architecture

### 6.1 Recommended State Layers

```
┌─────────────────────────────────────────────┐
│           UI State (Zustand)                │
│  - UI preferences, modals, toasts          │
│  - Theme, language, sidebar state          │
└─────────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────────┐
│        Server State (TanStack Query)        │
│  - Events, articles, users from API        │
│  - Caching, invalidation, refetching       │
└─────────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────────┐
│          Auth State (Context + Cookie)      │
│  - User, roles, permissions                 │
│  - Token management                         │
└─────────────────────────────────────────────┘
```

### 6.2 Zustand Store Example

```typescript
// src/stores/ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'hi';
  activeModal: string | null;
  
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      language: 'en',
      activeModal: null,
      
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      openModal: (activeModal) => set({ activeModal }),
      closeModal: () => set({ activeModal: null }),
    }),
    { name: 'ui-storage' }
  )
);
```

### 6.3 TanStack Query Setup

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Custom hooks
export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => fetchEvents(filters),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
```

---

## Part 7: AI/ML Integration (Light Features)

### 7.1 AI Feature Roadmap

```
Phase 1 (MVP):
├── Smart Content Suggestions
│   └── Analyze article content → suggest tags, categories
├── Auto-generated Vritt Drafts
│   └── Generate from event data + registrations
├── Intelligent Event Scheduling
│   └── Suggest optimal dates based on calendar conflicts
└── Pattern Recognition
    └── Identify popular event types, peak registration times

Phase 2 (Enhanced):
├── Content Recommendations
│   └── Recommend articles based on user role
├── Predictive Analytics
│   └── Forecast attendance, engagement
├── Automated Workflow Routing
│   └── Route events to appropriate reviewers
└── Natural Language Search
    └── Search across events, articles, users
```

### 7.2 AI Service Architecture

```typescript
// src/lib/server/services/ai.service.ts
export interface AIService {
  generateVrittDraft(event: Event): Promise<string>;
  suggestTags(content: string): Promise<string[]>;
  suggestCategory(content: string): Promise<string>;
  suggestOptimalDate(event: CreateEventInput): Promise<Date>;
  analyzeSentiment(text: string): Promise<{ score: number; label: string }>;
}

// Implementation with fallback for when AI is unavailable
export class LiteAIService implements AIService {
  async generateVrittDraft(event: Event): Promise<string> {
    // Template-based generation with event data
    const template = this.getVrittTemplate(event.type);
    return this.fillTemplate(template, event);
  }
  
  private getVrittTemplate(type: string): string {
    const templates: Record<string, string> = {
      seminar: `।। वृत्त : {title} ।।
दिनांक: {date} | इकाई: {unit}
मुख्य उद्देश्य: {description}
उपस्थिति: {attendance}
निष्कर्ष: [लिखें]`,
      // ...
    };
    return templates[type] || templates.default;
  }
  
  private fillTemplate(template: string, event: Event): string {
    return template
      .replace('{title}', event.title)
      .replace('{date}', event.starts_at)
      .replace('{unit}', event.unit?.name || '')
      .replace('{description}', event.description || '')
      .replace('{attendance}', event.registrations?.length?.toString() || '0');
  }
  
  async suggestTags(content: string): Promise<string[]> {
    // Simple keyword extraction
    const keywords = this.extractKeywords(content);
    return keywords.slice(0, 5);
  }
  
  async suggestCategory(content: string): Promise<string> {
    // Rule-based categorization
    if (content.includes('वेद') || content.includes('वैदिक')) return 'Shodh';
    if (content.includes('चर्चा') || content.includes('विमर्श')) return 'Vimarsh';
    return 'General';
  }
  
  async suggestOptimalDate(event: CreateEventInput): Promise<Date> {
    // Check for conflicts in calendar
    const conflicts = await this.checkConflicts(event);
    // Return next available slot
    return this.findNextSlot(conflicts);
  }
  
  async analyzeSentiment(text: string): Promise<{ score: number; label: string }> {
    // Simple positive/negative word matching
    const score = this.calculateSentimentScore(text);
    return { score, label: score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral' };
  }
}
```

---

## Part 8: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

| Task | Description | Priority |
|------|-------------|----------|
| Error Handling | Standardize API errors | P0 |
| Auth Refactor | JWT-based auth with proper middleware | P0 |
| API Versioning | Set up /api/v1 structure | P0 |
| Repository Pattern | Refactor data access layer | P1 |
| TypeScript Strict | Enable strict mode, fix type errors | P1 |

### Phase 2: Core Modules (Weeks 3-4)

| Task | Description | Priority |
|------|-------------|----------|
| Events API | CRUD with proper permissions | P0 |
| Articles API | Workflow management | P0 |
| RBAC System | Role-permission matrix | P1 |
| Dashboard Refactor | Extract role-specific views | P1 |

### Phase 3: Features (Weeks 5-6)

| Task | Description | Priority |
|------|-------------|----------|
| Registration System | Full form builder + management | P0 |
| Poll/Voting System | Admin controls + analytics | P1 |
| Prachar Module | Status tracking + automation | P1 |
| Notifications | In-app + email notifications | P2 |

### Phase 4: Polish (Weeks 7-8)

| Task | Description | Priority |
|------|-------------|----------|
| Testing | Unit tests + integration tests | P1 |
| Documentation | API docs + setup guide | P1 |
| Performance | Query optimization + caching | P1 |
| Monitoring | Error tracking + logging | P2 |

### Phase 5: AI Features (Weeks 9-10)

| Task | Description | Priority |
|------|-------------|----------|
| Smart Vritt | Auto-draft generation | P2 |
| Content Suggestions | Tag/category recommendations | P2 |
| Search | Full-text search implementation | P2 |

---

## Part 9: Code Quality Standards

### 9.1 ESLint & Prettier Config

```javascript
// eslint.config.js
export default tseslint.config(
  { ignores: ['dist', '.next', 'node_modules'] },
  {
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react-hooks/recommended',
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: ['react-refresh'],
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
);
```

### 9.2 Required Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "prebuild": "npm run typecheck && npm run lint"
  }
}
```

---

## Part 10: Key Gaps to Address

### Immediate Actions

1. **Remove demo data fallback** - Stop using hardcoded initialEvents in AppContext
2. **Add proper loading states** - Every async operation needs loading/error states
3. **Implement error boundaries** - React error boundaries for graceful failures
4. **Add input validation** - All forms need Zod + react-hook-form validation
5. **Fix role-based UI** - Extract to proper components, not 500+ line switch

### Security Hardening

1. **RLS policies review** - Audit all table RLS policies
2. **API rate limiting** - Implement per-user rate limits
3. **CORS configuration** - Restrict to known origins
4. **Secret management** - Move secrets to environment, never commit

### Performance

1. **Add database indexes** - Queries identified in schema section
2. **Implement caching** - TanStack Query for server state
3. **Optimize re-renders** - Use React.memo, useMemo where needed
4. **Lazy loading** - Code splitting for heavy modules

---

## Conclusion

This redesign transforms the Pragya Pravah ERP from a prototype to a production-grade system while maintaining the Next.js + Neon stack. The architecture emphasizes:

- **Clean separation of concerns** - Services, repositories, API routes
- **Type safety** - Full TypeScript with strict mode
- **Security** - JWT auth, RBAC, rate limiting
- **Maintainability** - Repository pattern, service layer
- **AI-ready** - Foundation for intelligent features
- **Scalability** - Proper state management, caching

The implementation should proceed incrementally, starting with foundation work before adding features.