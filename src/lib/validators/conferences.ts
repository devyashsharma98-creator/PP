import { z } from "zod";
import { conferenceStatusValues, sessionTypeValues, registrationCategoryValues } from "@/db/schema/enums";

export const createConferenceSchema = z.object({
  title: z.string().min(1, "Title is required.").max(512).trim(),
  titleHi: z.string().max(512).optional(),
  theme: z.string().max(5000).optional(),
  themeHi: z.string().max(5000).optional(),
  description: z.string().max(10000).optional(),
  descriptionHi: z.string().max(10000).optional(),
  venue: z.string().max(512).optional(),
  venueHi: z.string().max(512).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  registrationEnabled: z.boolean().optional().default(false),
  maxRegistrations: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateConferenceInput = z.infer<typeof createConferenceSchema>;

export const updateConferenceSchema = createConferenceSchema.partial().extend({
  status: z.enum(conferenceStatusValues).optional(),
});
export type UpdateConferenceInput = z.infer<typeof updateConferenceSchema>;

export const listConferencesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(conferenceStatusValues).optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});
export type ListConferencesQuery = z.infer<typeof listConferencesQuerySchema>;

export const createConferenceSessionSchema = z.object({
  title: z.string().min(1, "Title is required.").max(512).trim(),
  titleHi: z.string().max(512).optional(),
  description: z.string().max(5000).optional(),
  descriptionHi: z.string().max(5000).optional(),
  sessionType: z.enum(sessionTypeValues).optional().default("other"),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  venue: z.string().max(256).optional(),
  venueHi: z.string().max(256).optional(),
  chairpersonName: z.string().max(256).optional(),
  chairpersonNameHi: z.string().max(256).optional(),
  sortOrder: z.number().int().optional().default(0),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateConferenceSessionInput = z.infer<typeof createConferenceSessionSchema>;

export const updateConferenceSessionSchema = createConferenceSessionSchema.partial();
export type UpdateConferenceSessionInput = z.infer<typeof updateConferenceSessionSchema>;

export const createSessionSpeakerSchema = z.object({
  profileId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Name is required.").max(256).trim(),
  nameHi: z.string().max(256).optional(),
  bio: z.string().max(2000).optional(),
  bioHi: z.string().max(2000).optional(),
  photoUrl: z.string().max(1024).optional(),
  topic: z.string().max(512).optional(),
  topicHi: z.string().max(512).optional(),
  affiliation: z.string().max(256).optional(),
  affiliationHi: z.string().max(256).optional(),
  sortOrder: z.number().int().optional().default(0),
});
export type CreateSessionSpeakerInput = z.infer<typeof createSessionSpeakerSchema>;

export const updateSessionSpeakerSchema = createSessionSpeakerSchema.partial();
export type UpdateSessionSpeakerInput = z.infer<typeof updateSessionSpeakerSchema>;

export const createConferenceRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required.").max(256).trim(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(24).optional(),
  organization: z.string().max(256).optional(),
  category: z.enum(registrationCategoryValues).optional().default("delegate"),
  notes: z.string().max(2000).optional(),
});
export type CreateConferenceRegistrationInput = z.infer<typeof createConferenceRegistrationSchema>;
