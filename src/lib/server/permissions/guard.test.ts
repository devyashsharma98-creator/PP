import { describe, it, expect } from 'vitest';
import { checkPermission, requirePermissions, hasAnyPermission } from './guard';
import type { Permission } from './types';

describe('Permission Guard', () => {
  const userPermissions: Permission[] = ['event:create', 'event:read', 'article:read'];

  it('should allow exact permission', () => {
    expect(checkPermission(userPermissions, 'event:create')).toBe(true);
  });

  it('should deny missing permission', () => {
    expect(checkPermission(userPermissions, 'event:delete')).toBe(false);
  });

  it('should allow multiple permissions when all present', () => {
    expect(checkPermission(userPermissions, ['event:create', 'event:read'])).toBe(true);
  });

  it('should deny when any permission missing in list', () => {
    expect(checkPermission(userPermissions, ['event:create', 'event:delete'])).toBe(false);
  });

  it('should require permissions as array', () => {
    const result = requirePermissions('event:create');
    expect(result).toEqual(['event:create']);
  });

  it('should check if user has any of required permissions', () => {
    expect(hasAnyPermission(userPermissions, ['event:delete', 'event:read'])).toBe(true);
    expect(hasAnyPermission(userPermissions, ['event:delete', 'event:publish'])).toBe(false);
  });
});