import { describe, it, expect } from 'vitest';
import { json, errorResponse, notFound, unauthorized, forbidden, validationError } from './response';

describe('API Response Helpers', () => {
  it('should create success response with data', async () => {
    const res = json({ id: '1', name: 'Test' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: '1', name: 'Test' });
  });

  it('should create success response with custom status', async () => {
    const res = json({ id: '1' }, { status: 201 });
    expect(res.status).toBe(201);
  });

  it('should create success response with pagination meta', async () => {
    const res = json([{ id: '1' }], {
      meta: { page: 1, limit: 10, total: 50, hasMore: true },
    });
    const body = await res.json();
    expect(body.meta).toEqual({ page: 1, limit: 10, total: 50, hasMore: true });
  });

  it('should create error response', async () => {
    const res = errorResponse(400, 'VALIDATION_ERROR', 'Invalid input');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toEqual({ code: 'VALIDATION_ERROR', message: 'Invalid input' });
  });

  it('should create notFound response', async () => {
    const res = notFound('Event', '123');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Event with id 123 not found');
  });

  it('should create unauthorized response', async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should create forbidden response', async () => {
    const res = forbidden('No access');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toBe('No access');
  });

  it('should create validation error response', async () => {
    const res = validationError('Invalid email', { field: 'email' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual({ field: 'email' });
  });
});