import { z } from "zod";
import { volunteerActivityTypeValues } from "@/db/schema/enums";

export const updateVolunteerProfileSchema = z.object({
  skills: z.array(z.string()).optional(),
  availability: z.record(z.unknown()).optional(),
  joinedAt: z.string().datetime().optional().nullable(),
  serviceSpanMonths: z.number().int().positive().optional().nullable(),
  emergencyContact: z.string().max(64).optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type UpdateVolunteerProfileInput = z.infer<typeof updateVolunteerProfileSchema>;

export const createVolunteerActivitySchema = z.object({
  activityType: z.enum(volunteerActivityTypeValues).optional().default("other"),
  description: z.string().max(5000).optional(),
  hoursLogged: z.number().int().positive().optional(),
  date: z.string().datetime(),
  eventId: z.string().uuid().optional().nullable(),
});
export type CreateVolunteerActivityInput = z.infer<typeof createVolunteerActivitySchema>;

export const listVolunteersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  skill: z.string().trim().optional(),
});
export type ListVolunteersQuery = z.infer<typeof listVolunteersQuerySchema>;
