import { z } from "zod";
import { ROLE_CODES } from "../permissions/types";

export const createUserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  displayName: z.string().min(1).max(256).trim().optional(),
  displayNameHi: z.string().max(256).trim().optional(),
  phone: z.string().max(24).optional(),
  responsibility: z.string().max(512).trim().optional(),
  responsibilityHi: z.string().max(512).trim().optional(),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  roleCode: z.enum(ROLE_CODES).optional().default("karyakarta"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(256).trim().optional(),
  displayNameHi: z.string().max(256).trim().optional(),
  phone: z.string().max(24).optional(),
  responsibility: z.string().max(512).trim().optional(),
  responsibilityHi: z.string().max(512).trim().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const assignRoleSchema = z
  .object({
    roleCode: z.enum(ROLE_CODES),
    scopeType: z.enum(["org", "unit", "department"]).default("org"),
    unitId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    isPrimary: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.scopeType === "unit" && !value.unitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unitId"],
        message: "unitId is required when scopeType is unit.",
      });
    }

    if (value.scopeType === "department" && !value.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departmentId"],
        message: "departmentId is required when scopeType is department.",
      });
    }
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
