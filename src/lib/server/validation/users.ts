import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  display_name: z.string().min(1, 'Display name is required').max(100),
  phone: z.string().optional(),
  default_unit_id: z.string().uuid('Invalid unit ID').optional(),
  default_department_id: z.string().uuid('Invalid department ID').optional(),
  preferred_language: z.enum(['en', 'hi']).default('en'),
});

export const updateUserSchema = createUserSchema.partial();

export const roleAssignmentSchema = z.object({
  role_id: z.string().uuid('Invalid role ID'),
  scope_type: z.enum(['org', 'unit', 'department', 'event', 'article']),
  org_id: z.string().uuid('Invalid org ID').optional(),
  unit_id: z.string().uuid('Invalid unit ID').optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  is_primary: z.boolean().default(false),
  starts_at: z.string().datetime('Invalid date').optional(),
  ends_at: z.string().datetime('Invalid date').optional(),
});

export const userFiltersSchema = z.object({
  is_active: z.boolean().optional(),
  unit_id: z.string().uuid('Invalid unit ID').optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  role_code: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type RoleAssignmentInput = z.infer<typeof roleAssignmentSchema>;
export type UserFilters = z.infer<typeof userFiltersSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;