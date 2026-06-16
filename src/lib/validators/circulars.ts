import { z } from "zod";
import { circularPriorityValues, circularScopeValues } from "@/db/schema/enums";

export const createCircularSchema = z.object({
  title: z.string().min(1, "Title is required.").max(512).trim(),
  titleHi: z.string().max(512).optional(),
  body: z.string().min(1, "Body is required."),
  bodyHi: z.string().optional(),
  priority: z.enum(circularPriorityValues).optional().default("normal"),
  scope: z.enum(circularScopeValues).optional().default("org"),
  scopeEntityId: z.string().uuid().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});
export type CreateCircularInput = z.infer<typeof createCircularSchema>;

export const updateCircularSchema = createCircularSchema.partial();
export type UpdateCircularInput = z.infer<typeof updateCircularSchema>;

export const listCircularsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  priority: z.enum(circularPriorityValues).optional(),
  scope: z.enum(circularScopeValues).optional(),
  search: z.string().trim().optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
});
export type ListCircularsQuery = z.infer<typeof listCircularsQuerySchema>;
