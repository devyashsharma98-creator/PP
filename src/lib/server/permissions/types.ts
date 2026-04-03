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