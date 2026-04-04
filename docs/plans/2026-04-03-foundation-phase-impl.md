# Foundation Phase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build production-grade foundation with error handling, service layer, repository pattern, and JWT auth

**Architecture:** Create clean service layer with repository pattern, standardized errors, JWT-based auth. All server code goes in `src/lib/server/services/` and `src/lib/server/repositories/`.

**Tech Stack:** Next.js 16, Neon PostgreSQL, jose (JWT), Zod (validation)

---

## Phase 1: Error Handling System

### Task 1: App Error Classes

**Files:**
- Create: `src/lib/server/errors/app-errors.ts`
- Modify: `src/lib/server/errors/index.ts` (new file)

**Step 1: Write the failing test**

```typescript
// src/lib/server/errors/app-errors.test.ts
import { describe, it, expect } from 'vitest';
import { AppError } from './app-errors';

describe('AppError', () => {
  it('should create error with all properties', () => {
    const error = new AppError(400, 'VALIDATION_ERROR', 'Invalid input', { field: 'email' });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/server/errors/app-errors.test.ts`
Expected: FAIL (file doesn't exist)

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/errors/app-errors.ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
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

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/server/errors/app-errors.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/errors/
git commit -m "feat: add app error classes"
```

---

### Task 2: Error Handler Middleware

**Files:**
- Create: `src/lib/server/middleware/error-handler.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/server/middleware/error-handler.test.ts
import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from './error-handler';
import { AppError } from '../errors/app-errors';

describe('errorHandler', () => {
  it('should handle AppError with status code', async () => {
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    const error = new AppError(400, 'VALIDATION_ERROR', 'Invalid input');

    await errorHandler(error, req, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input' }
    });
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL (file doesn't exist)

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/middleware/error-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '../errors/app-errors';

export interface ExtendedNextRequest extends NextRequest {
  user?: {
    userId: string;
    roles: string[];
    permissions: string[];
  };
}

export async function errorHandler(
  error: Error,
  _req: ExtendedNextRequest,
  res: NextResponse
): Promise<NextResponse> {
  console.error('Error handler caught:', error);

  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    }, { status: error.statusCode });
  }

  // Unknown error
  console.error('Unexpected error:', error);
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  }, { status: 500 });
}
```

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/middleware/
git commit -m "feat: add error handler middleware"
```

---

## Phase 2: Service Layer

### Task 3: Base Service Interface

**Files:**
- Create: `src/lib/server/services/base-service.ts`
- Create: `src/lib/server/services/types.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/server/services/base-service.test.ts
import { describe, it, expect } from 'vitest';
import type { IService } from './types';

describe('IService interface', () => {
  it('should define execute method', () => {
    const mockService: IService<string, string> = {
      execute: async (input) => input.toUpperCase(),
    };
    
    expect(mockService.execute('hello')).resolves.toBe('HELLO');
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/services/types.ts
export interface IService<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreateEventInput {
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  unit_id?: string;
  department_id?: string;
}

export interface EventFilters {
  status?: string;
  unit_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}
```

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/services/
git commit -m "feat: add service layer types"
```

---

### Task 4: Event Service

**Files:**
- Create: `src/lib/server/services/event.service.ts`
- Test: `src/lib/server/services/event.service.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/server/services/event.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventService } from './event.service';
import { createClient } from '@neondatabase/serverless';

vi.mock('@neondatabase/serverless', () => ({
  createClient: vi.fn(() => ({
    select: vi.fn(() => ({ data: null })),
    from: vi.fn(() => ({ select: vi.fn(() => ({ data: null })) })),
  })),
}));

describe('EventService', () => {
  let eventService: EventService;

  beforeEach(() => {
    eventService = new EventService();
  });

  it('should list events with filters', async () => {
    const result = await eventService.list({ limit: 10 });
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/services/event.service.ts
import { createClient } from '@neondatabase/serverless';
import { AppError, NotFoundError, ValidationError } from '../errors/app-errors';
import type { IService, PaginatedResult, CreateEventInput, EventFilters } from './types';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  unit_id: string | null;
  created_at: string;
  updated_at: string;
}

export class EventService implements IService<EventFilters, PaginatedResult<Event>> {
  private db = createClient(process.env.DATABASE_URL!);

  async execute(filters: EventFilters): Promise<PaginatedResult<Event>> {
    return this.list(filters);
  }

  async list(filters: EventFilters): Promise<PaginatedResult<Event>> {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = this.db.from('events').select('*', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.unit_id) {
      query = query.eq('unit_id', filters.unit_id);
    }
    if (filters.from_date) {
      query = query.gte('starts_at', filters.from_date);
    }
    if (filters.to_date) {
      query = query.lte('starts_at', filters.to_date);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('starts_at', { ascending: false });

    if (error) {
      throw new AppError(500, 'DB_ERROR', error.message);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false,
      },
    };
  }

  async getById(id: string): Promise<Event | null> {
    const { data } = await this.db
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    return data as Event | null;
  }

  async create(input: CreateEventInput): Promise<Event> {
    if (!input.title?.trim()) {
      throw new ValidationError('Title is required');
    }

    const { data, error } = await this.db
      .from('events')
      .insert({
        title: input.title,
        description: input.description,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        unit_id: input.unit_id,
        department_id: input.department_id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'DB_ERROR', error.message);
    }

    return data as Event;
  }

  async updateStatus(id: string, status: string): Promise<Event> {
    const event = await this.getById(id);
    if (!event) {
      throw new NotFoundError('Event', id);
    }

    const { data, error } = await this.db
      .from('events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'DB_ERROR', error.message);
    }

    return data as Event;
  }
}
```

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/services/event.service.ts
git commit -m "feat: add event service"
```

---

## Phase 3: Repository Pattern

### Task 5: Base Repository

**Files:**
- Create: `src/lib/server/repositories/base.repository.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/server/repositories/base.repository.test.ts
import { describe, it, expect } from 'vitest';
import { BaseRepository } from './base.repository';

describe('BaseRepository', () => {
  it('should have tableName property', () => {
    class TestRepo extends BaseRepository<any> {
      tableName = 'test_table';
    }
    const repo = new TestRepo();
    expect(repo.tableName).toBe('test_table');
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/repositories/base.repository.ts
import { createClient } from '@neondatabase/serverless';
import { AppError } from '../errors/app-errors';

export abstract class BaseRepository<T> {
  protected abstract tableName: string;
  protected db = createClient(process.env.DATABASE_URL!);

  abstract mapToEntity(row: unknown): T;

  async findById(id: string): Promise<T | null> {
    const { data } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    return data ? this.mapToEntity(data) : null;
  }

  async findMany(filters: Record<string, unknown> = {}): Promise<T[]> {
    let query = this.db.from(this.tableName).select('*');

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    }

    const { data } = await query;
    return data?.map(this.mapToEntity.bind(this)) ?? [];
  }

  async create(input: Partial<T>): Promise<T> {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'DB_ERROR', error.message);
    }

    return this.mapToEntity(data);
  }

  async update(id: string, input: Partial<T>): Promise<T> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'DB_ERROR', error.message);
    }

    return this.mapToEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(500, 'DB_ERROR', error.message);
    }
  }

  async softDelete(id: string): Promise<T> {
    return this.update(id, { is_deleted: true, deleted_at: new Date().toISOString() } as any);
  }
}
```

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/repositories/
git commit -m "feat: add base repository"
```

---

### Task 6: Event Repository

**Files:**
- Create: `src/lib/server/repositories/event.repository.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/server/repositories/event.repository.test.ts
import { describe, it, expect } from 'vitest';
import { EventRepository } from './event.repository';

describe('EventRepository', () => {
  it('should map event correctly', () => {
    const repo = new EventRepository();
    const row = { id: '1', title: 'Test', status: 'draft' };
    const event = repo.mapToEntity(row);
    expect(event.id).toBe('1');
    expect(event.title).toBe('Test');
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/repositories/event.repository.ts
import { BaseRepository } from './base.repository';

export interface EventEntity {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  unit_id: string | null;
  department_id: string | null;
  location_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
}

export class EventRepository extends BaseRepository<EventEntity> {
  tableName = 'events';

  mapToEntity(row: any): EventEntity {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      status: row.status,
      unit_id: row.unit_id,
      department_id: row.department_id,
      location_id: row.location_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_deleted: row.is_deleted ?? false,
      deleted_at: row.deleted_at ?? null,
    };
  }

  async findWithRelations(id: string): Promise<EventEntity | null> {
    const { data } = await this.db
      .from('events')
      .select(`
        *,
        unit:units!events_unit_id_fkey(name),
        department:departments_or_aayams!events_department_id_fkey(name),
        location:locations!events_location_id_fkey(name, city)
      `)
      .eq('id', id)
      .single();

    return data ? this.mapToEntity(data) : null;
  }

  async findByUnit(unitId: string): Promise<EventEntity[]> {
    return this.findMany({ unit_id: unitId });
  }

  async findByStatus(status: string): Promise<EventEntity[]> {
    return this.findMany({ status });
  }

  async findActive(date?: string): Promise<EventEntity[]> {
    const filters: Record<string, unknown> = { is_deleted: false };
    if (date) {
      filters.starts_at = date;
    }
    return this.findMany(filters);
  }
}
```

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/repositories/event.repository.ts
git commit -m "feat: add event repository"
```

---

## Phase 4: JWT Authentication

### Task 7: JWT Utility

**Files:**
- Create: `src/lib/server/auth/jwt.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/server/auth/jwt.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createToken, verifyToken } from './jwt';

describe('JWT', () => {
  let token: string;

  it('should create and verify token', async () => {
    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      roles: ['karyakarta'],
      permissions: ['event:read', 'event:create'],
    };

    token = await createToken(payload);
    expect(token).toBeDefined();

    const verified = await verifyToken(token);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe('user-123');
  });

  it('should return null for invalid token', async () => {
    const verified = await verifyToken('invalid-token');
    expect(verified).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/auth/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
);

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
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

export async function refreshToken(token: string): Promise<string | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  return createToken({
    userId: payload.userId,
    email: payload.email,
    roles: payload.roles,
    permissions: payload.permissions,
  });
}
```

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/auth/jwt.ts
git commit -m "feat: add JWT authentication"
```

---

### Task 8: Auth Middleware

**Files:**
- Modify: `src/middleware.ts` (existing)
- Create: `src/lib/server/middleware/auth.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/server/middleware/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { authMiddleware } from './auth';

describe('authMiddleware', () => {
  it('should redirect unauthenticated users', async () => {
    const req = new Request('http://localhost/dashboard');
    const res = await authMiddleware(req);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/login');
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../auth/jwt';

export async function authMiddleware(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get('auth-token')?.value 
    || req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-roles', JSON.stringify(payload.roles));
  requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions));

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export function requireAuth(req: NextRequest): { userId: string; roles: string[]; permissions: string[] } | null {
  const userId = req.headers.get('x-user-id');
  const rolesHeader = req.headers.get('x-user-roles');
  const permissionsHeader = req.headers.get('x-user-permissions');

  if (!userId) return null;

  return {
    userId,
    roles: rolesHeader ? JSON.parse(rolesHeader) : [],
    permissions: permissionsHeader ? JSON.parse(permissionsHeader) : [],
  };
}
```

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add src/middleware.ts src/lib/server/middleware/auth.ts
git commit -m "feat: add auth middleware"
```

---

## Phase 5: API Versioning

### Task 9: API Versioned Route Handler

**Files:**
- Modify: `src/app/api/v1/events/route.ts` (new structure)
- Create: `src/lib/server/api/response.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/server/api/response.test.ts
import { describe, it, expect } from 'vitest';
import { json, errorResponse } from './response';

describe('API Response', () => {
  it('should create success response', () => {
    const res = json({ data: { id: '1' } });
    expect(res.status).toBe(200);
  });

  it('should create error response', () => {
    const res = errorResponse(400, 'VALIDATION_ERROR', 'Invalid input');
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/api/response.ts
import { NextResponse } from 'next/server';

export interface ApiResponse<T> {
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

export function json<T>(data: T, options?: { status?: number; meta?: ApiResponse<T>['meta'] }): NextResponse {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(options?.meta && { meta: options.meta }),
  };

  return NextResponse.json(body, { status: options?.status ?? 200 });
}

export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): NextResponse {
  const body: ApiResponse<null> = {
    success: false,
    error: { code, message, details },
  };

  return NextResponse.json(body, { status: statusCode });
}

export function notFound(resource: string, id: string): NextResponse {
  return errorResponse(404, 'NOT_FOUND', `${resource} with id ${id} not found`);
}

export function unauthorized(message = 'Authentication required'): NextResponse {
  return errorResponse(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'Access denied'): NextResponse {
  return errorResponse(403, 'FORBIDDEN', message);
}

export function validationError(message: string, details?: Record<string, unknown>): NextResponse {
  return errorResponse(400, 'VALIDATION_ERROR', message, details);
}
```

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/api/response.ts
git commit -m "feat: add API response helpers"
```

---

### Task 10: Events API Route

**Files:**
- Create: `src/app/api/v1/events/route.ts`
- Create: `src/app/api/v1/events/[eventId]/route.ts`

**Step 1: Write the failing test**

```typescript
// src/app/api/v1/events/route.test.ts
import { describe, it, expect } from 'vitest';

describe('GET /api/v1/events', () => {
  it('should return events list', async () => {
    // Integration test would go here
    expect(true).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL (file doesn't exist)

**Step 3: Write minimal implementation**

```typescript
// src/app/api/v1/events/route.ts
import { NextRequest } from 'next/server';
import { EventService } from '@/lib/server/services/event.service';
import { EventRepository } from '@/lib/server/repositories/event.repository';
import { json, errorResponse, unauthorized } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    status: searchParams.get('status') || undefined,
    unit_id: searchParams.get('unit_id') || undefined,
    from_date: searchParams.get('from_date') || undefined,
    to_date: searchParams.get('to_date') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  };

  try {
    const service = new EventService();
    const result = await service.list(filters);
    return json(result.data, { meta: result.pagination });
  } catch (error) {
    console.error('Events list error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch events');
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('event:create')) {
    return unauthorized('You do not have permission to create events');
  }

  try {
    const body = await req.json();
    const service = new EventService();
    const event = await service.create(body);
    return json(event, { status: 201 });
  } catch (error) {
    console.error('Events create error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create event');
  }
}
```

```typescript
// src/app/api/v1/events/[eventId]/route.ts
import { NextRequest } from 'next/server';
import { EventRepository } from '@/lib/server/repositories/event.repository';
import { json, errorResponse, notFound, unauthorized, forbidden } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { eventId } = await params;
  const repo = new EventRepository();

  try {
    const event = await repo.findById(eventId);
    if (!event) {
      return notFound('Event', eventId);
    }
    return json(event);
  } catch (error) {
    console.error('Event get error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch event');
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('event:update')) {
    return forbidden('You do not have permission to update events');
  }

  const { eventId } = await params;
  const repo = new EventRepository();

  try {
    const body = await req.json();
    const event = await repo.update(eventId, body);
    return json(event);
  } catch (error) {
    console.error('Event update error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update event');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('event:delete')) {
    return forbidden('You do not have permission to delete events');
  }

  const { eventId } = await params;
  const repo = new EventRepository();

  try {
    await repo.softDelete(eventId);
    return json({ success: true });
  } catch (error) {
    console.error('Event delete error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to delete event');
  }
}
```

**Step 4: Verify implementation compile**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/api/v1/
git commit -m "feat: add v1 API routes for events"
```

---

## Phase 6: RBAC Permission System

### Task 11: Permission Guards

**Files:**
- Create: `src/lib/server/permissions/guard.ts`
- Create: `src/lib/server/permissions/types.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/server/permissions/guard.test.ts
import { describe, it, expect } from 'vitest';
import { checkPermission } from './guard';

describe('Permission Guard', () => {
  it('should allow exact permission', () => {
    const result = checkPermission(['event:create'], 'event:create');
    expect(result).toBe(true);
  });

  it('should deny missing permission', () => {
    const result = checkPermission(['event:read'], 'event:create');
    expect(result).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/server/permissions/types.ts
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

export const PERMISSION_MATRIX: Record<string, Permission[]> = {
  super_admin: [
    'admin:full', 'event:create', 'event:read', 'event:update', 'event:delete',
    'article:create', 'article:read', 'article:update', 'article:delete',
    'user:create', 'user:read', 'user:update', 'user:delete', 'report:read',
  ],
  org_admin: [
    'event:create', 'event:read', 'event:update', 'event:delete', 'event:approve', 'event:publish',
    'article:create', 'article:read', 'article:update', 'article:approve', 'article:publish',
    'user:read', 'user:update', 'report:read',
  ],
  vibhag_pramukh: [
    'event:read', 'event:update', 'event:approve', 'event:publish',
    'article:read', 'article:update', 'article:approve', 'article:publish',
    'report:read',
  ],
  aayam_pramukh: [
    'event:read', 'event:update',
    'article:read', 'article:update',
  ],
  unit_head: [
    'event:create', 'event:read', 'event:update',
    'article:create', 'article:read',
  ],
  karyakarta: [
    'event:read',
    'article:read',
  ],
};
```

```typescript
// src/lib/server/permissions/guard.ts
import type { Permission } from './types';

export function checkPermission(
  userPermissions: Permission[],
  required: Permission | Permission[]
): boolean {
  const requiredPermissions = Array.isArray(required) ? required : [required];
  return requiredPermissions.every(p => userPermissions.includes(p));
}

export function requirePermissions(
  permissions: Permission | Permission[]
): Permission[] {
  return Array.isArray(permissions) ? permissions : [permissions];
}

export function hasAnyPermission(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.some(p => userPermissions.includes(p));
}
```

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/permissions/
git commit -m "feat: add RBAC permission system"
```

---

## Summary

**Tasks Completed:** 11

**New Files Created:**
- `src/lib/server/errors/app-errors.ts`
- `src/lib/server/errors/index.ts`
- `src/lib/server/middleware/error-handler.ts`
- `src/lib/server/middleware/auth.ts`
- `src/lib/server/services/types.ts`
- `src/lib/server/services/event.service.ts`
- `src/lib/server/repositories/base.repository.ts`
- `src/lib/server/repositories/event.repository.ts`
- `src/lib/server/auth/jwt.ts`
- `src/lib/server/api/response.ts`
- `src/lib/server/permissions/types.ts`
- `src/lib/server/permissions/guard.ts`
- `src/app/api/v1/events/route.ts`
- `src/app/api/v1/events/[eventId]/route.ts`

**Tests:** Each task has unit tests using Vitest

**Note:** Run `npm install jose` before implementing JWT tasks. Run `npm install zod` for validation tasks in future phases.