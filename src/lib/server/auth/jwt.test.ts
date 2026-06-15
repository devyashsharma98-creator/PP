import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { createToken, verifyToken, refreshToken } from './jwt';

describe('JWT', () => {
  const originalSecret = process.env.JWT_SECRET;
  const payload = {
    userId: 'user-123',
    email: 'test@example.com',
    roles: ['karyakarta'],
    permissions: ['event:read', 'event:create'],
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('should fail closed when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;

    await expect(createToken(payload)).rejects.toThrow(/JWT_SECRET/);
    await expect(verifyToken('invalid-token')).rejects.toThrow(/JWT_SECRET/);
  });

  it('should create and verify token', async () => {
    const token = await createToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const verified = await verifyToken(token);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe('user-123');
    expect(verified?.email).toBe('test@example.com');
    expect(verified?.roles).toEqual(['karyakarta']);
  });

  it('should return null for invalid token', async () => {
    const verified = await verifyToken('invalid-token');
    expect(verified).toBeNull();
  });

  it('should refresh token', async () => {
    const token = await createToken(payload);
    const refreshed = await refreshToken(token);
    expect(refreshed).toBeDefined();

    const verified = await verifyToken(refreshed!);
    expect(verified?.userId).toBe('user-123');
  });

  it('should return null for expired/invalid refresh', async () => {
    const refreshed = await refreshToken('invalid');
    expect(refreshed).toBeNull();
  });
});
