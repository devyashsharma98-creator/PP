import { z } from "zod";
import { projectStatusValues, taskStatusValues, taskPriorityValues } from "@/db/schema/enums";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required.").max(512).trim(),
  nameHi: z.string().max(512).optional(),
  description: z.string().max(10000).optional(),
  departmentId: z.string().uuid().optional(),
  deadline: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(projectStatusValues).optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(projectStatusValues).optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required.").max(512).trim(),
  titleHi: z.string().max(512).optional(),
  description: z.string().max(10000).optional(),
  assigneeUserId: z.string().uuid().optional(),
  priority: z.enum(taskPriorityValues).optional().default("medium"),
  dueDate: z.string().datetime().optional(),
  sortOrder: z.number().int().optional().default(0),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(taskStatusValues).optional(),
  completedAt: z.string().datetime().optional().nullable(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  assigneeUserId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
