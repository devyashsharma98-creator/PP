import { describe, it, expect } from 'vitest';
import { createToken, verifyToken, refreshToken } from './jwt';

describe('JWT', () => {
  const payload = {
    userId: 'user-123',
    email: 'test@example.com',
    roles: ['karyakarta'],
    permissions: ['event:read', 'event:create'],
  };

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