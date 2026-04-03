import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError } from './app-errors';

describe('AppError', () => {
  it('should create error with all properties', () => {
    const error = new AppError(400, 'VALIDATION_ERROR', 'Invalid input', { field: 'email' });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
    expect(error.name).toBe('AppError');
  });
});

describe('NotFoundError', () => {
  it('should create with resource and id', () => {
    const error = new NotFoundError('Event', '123');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('RESOURCE_NOT_FOUND');
    expect(error.message).toBe('Event with id 123 not found');
  });
});

describe('UnauthorizedError', () => {
  it('should create with default message', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Authentication required');
  });

  it('should create with custom message', () => {
    const error = new UnauthorizedError('Token expired');
    expect(error.message).toBe('Token expired');
  });
});

describe('ForbiddenError', () => {
  it('should create with default message', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toBe('Access denied');
  });
});

describe('ValidationError', () => {
  it('should create with message and details', () => {
    const error = new ValidationError('Invalid email', { field: 'email' });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid email');
    expect(error.details).toEqual({ field: 'email' });
  });
});

describe('ConflictError', () => {
  it('should create with message', () => {
    const error = new ConflictError('Resource already exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.message).toBe('Resource already exists');
  });
});