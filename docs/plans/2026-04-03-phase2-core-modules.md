# Phase 2: Core Modules Implementation Plan

> **Based on research:** Next.js App Router best practices + Neon patterns + React Hook Form + Zod

**Goal:** Implement Events CRUD, Articles (Aalekh), Users, Notifications APIs

**Tech Stack:** Next.js 16, Neon PostgreSQL, Zod validation, React Hook Form

---

## Best Practices Research Summary

### 1. API Route Patterns (from research)
- Versioned routes: `/api/v1/{resource}`
- Standardized response: `{ success, data, error, meta }`
- HTTP method handlers in single route file
- Input validation BEFORE business logic
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500)

### 2. Neon Serverless Patterns
- Use `sql` tagged template literals (parameterized)
- Prepared statements for performance
- Transaction support for multi-step ops
- database access checks for security

### 3. Form Validation (from research)
- Client: React Hook Form + Zod + Shadcn
- Server: Zod schema validation (backup)
- Consistent error format

---

## Task 1: Validation Schema (Zod)

### Files:
- Create: `src/lib/server/validation/events.ts`
- Create: `src/lib/server/validation/articles.ts`
- Create: `src/lib/server/validation/users.ts`

### Implementation:
```typescript
// src/lib/server/validation/events.ts
import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().optional(),
  unit_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventFiltersSchema = z.object({
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
  unit_id: z.string().uuid().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
```

---

## Task 2: Events API Routes

### Files:
- Modify: `src/app/api/v1/events/route.ts` (add PUT)
- Modify: `src/app/api/v1/events/[eventId]/route.ts` (add PUT, DELETE logic)
- Create: `src/app/api/v1/events/[eventId]/status/route.ts` (workflow)

### Implementation:
```typescript
// GET /api/v1/events - List with filters
// POST /api/v1/events - Create new event
// PUT /api/v1/events - Bulk update
```

---

## Task 3: Articles (Aalekh) API

### Files:
- Create: `src/lib/server/services/article.service.ts`
- Create: `src/lib/server/repositories/article.repository.ts`
- Create: `src/app/api/v1/articles/route.ts`
- Create: `src/app/api/v1/articles/[articleId]/route.ts`

### Schema:
```sql
-- From existing migrations, articles table has:
-- id, title, content, summary, category, status, author_user_id,
-- values_checklist, published_at, social_url, document_url
```

### Routes:
- `GET /api/v1/articles` - List with filters
- `POST /api/v1/articles` - Create
- `GET /api/v1/articles/[id]` - Get by ID
- `PATCH /api/v1/articles/[id]` - Update
- `POST /api/v1/articles/[id]/submit` - Submit for review
- `POST /api/v1/articles/[id]/publish` - Publish

---

## Task 4: Users API

### Files:
- Create: `src/lib/server/services/user.service.ts`
- Create: `src/lib/server/repositories/user.repository.ts`
- Create: `src/app/api/v1/users/route.ts`
- Create: `src/app/api/v1/users/[userId]/route.ts`
- Create: `src/app/api/v1/users/[userId]/roles/route.ts`

### Routes:
- `GET /api/v1/users` - List users
- `GET /api/v1/users/[id]` - Get profile
- `PATCH /api/v1/users/[id]` - Update profile
- `POST /api/v1/users/[id]/roles` - Assign role

---

## Task 5: Notifications API

### Files:
- Create: `src/lib/server/services/notification.service.ts`
- Create: `src/app/api/v1/notifications/route.ts`
- Create: `src/app/api/v1/notifications/[notificationId]/route.ts`

### Routes:
- `GET /api/v1/notifications` - List user notifications
- `PATCH /api/v1/notifications/[id]/read` - Mark as read
- `PATCH /api/v1/notifications/read-all` - Mark all as read

---

## Task 6: Service Layer Refactoring

### Refactor existing services to use Zod:
- Update EventService with validation
- Add error handling middleware patterns
- Add logging

---

## Implementation Order

```
1. Validation Schemas (Zod)
2. Events API completion  
3. Articles API
4. Users API
5. Notifications API
6. Testing & Integration
```

---

## Response Format Standard

```typescript
// All API responses follow this format:
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-----------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | No permission |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Duplicate/conflict |
| DB_ERROR | 500 | Database error |
| INTERNAL_ERROR | 500 | Server error |
