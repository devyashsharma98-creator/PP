import { z } from "zod";
import { ROLE_CODES } from "../permissions/types";

export const createUserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  displayName: z.string().min(1).max(256).trim().optional(),
  displayNameHi: z.string().max(256).trim().optional(),
  phone: z.string().max(24).optional(),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  roleCode: z.enum(ROLE_CODES).optional().default("karyakarta"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(256).trim().optional(),
  displayNameHi: z.string().max(256).trim().optional(),
  phone: z.string().max(24).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const assignRoleSchema = z.object({
  roleCode: z.enum(ROLE_CODES),
  scopeType: z.enum(["org", "unit", "department", "event", "article"]).default("org"),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  scopeEntityId: z.string().uuid().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  isPrimary: z.boolean().optional().default(false),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  roleCode: z.enum(ROLE_CODES).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
