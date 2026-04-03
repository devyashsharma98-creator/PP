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