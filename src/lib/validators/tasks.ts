import { z } from "zod";
import { projectStatusValues, taskStatusValues, taskPriorityValues } from "@/db/schema/enums";

/**
 * Deadlines and due dates are calendar days, not instants: a task is "due on
 * the 14th", never "due at 14:30 in some timezone". The UI's date input
 * therefore sends `YYYY-MM-DD`, and that is the canonical wire format.
 *
 * Full ISO datetimes are still accepted, because existing callers and seeded
 * data send them, but they are normalised down to the calendar day so that the
 * value stored does not depend on the sender's clock. The column stays
 * `timestamptz`; the day is anchored at midnight UTC.
 */
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A real day in the calendar, not merely a well-shaped string. Checking the
 * shape alone let `2026-02-31` through, which `new Date()` silently rolls
 * forward to 3 March, and `2026-13-01`, which becomes an Invalid Date.
 */
export function isRealCalendarDate(value: string): boolean {
  const match = CALENDAR_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1) return false;

  // Day 0 of the next month is the last day of this one, and handles leap years.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

export const calendarDate = z
  .string()
  .refine(
    (value) => CALENDAR_DATE.test(value) || !Number.isNaN(Date.parse(value)),
    "Expected a date as YYYY-MM-DD.",
  )
  .transform((value) => (CALENDAR_DATE.test(value) ? value : value.slice(0, 10)))
  .refine(isRealCalendarDate, "That is not a real calendar date.");

/** Parse a validated calendar date into the instant stored in the column. */
export function calendarDateToInstant(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required.").max(512).trim(),
  nameHi: z.string().max(512).optional(),
  description: z.string().max(10000).optional(),
  departmentId: z.string().uuid().optional(),
  deadline: calendarDate.optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(projectStatusValues).optional(),
  deadline: calendarDate.nullable().optional(),
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
  // Nullable: clearing an assignee is a real, distinct action from leaving the
  // field alone, and must survive JSON (which drops `undefined`).
  assigneeUserId: z.string().uuid().nullable().optional(),
  priority: z.enum(taskPriorityValues).optional().default("medium"),
  dueDate: calendarDate.nullable().optional(),
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
