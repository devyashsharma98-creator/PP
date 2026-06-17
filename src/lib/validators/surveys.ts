import { z } from "zod";
import { surveyStatusValues } from "@/db/schema/enums";

export const surveyQuestionSchema = z.object({
  questionKey: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(512),
  labelHi: z.string().max(512).optional(),
  questionType: z.enum(["text", "yesno", "select", "multiselect", "textarea", "number", "email", "rating", "date", "checkbox_group", "radio_group"]).default("text"),
  isRequired: z.boolean().optional().default(false),
  displayOrder: z.number().int().optional().default(0),
  options: z.array(z.string().min(1).max(256)).optional(),
});
export type SurveyQuestionInput = z.infer<typeof surveyQuestionSchema>;

export const createSurveySchema = z.object({
  title: z.string().min(1, "Title is required.").max(512).trim(),
  titleHi: z.string().max(512).optional(),
  description: z.string().max(10000).optional(),
  descriptionHi: z.string().max(10000).optional(),
  scope: z.enum(["org", "unit", "department"]).optional().default("org"),
  scopeEntityId: z.string().uuid().optional().nullable(),
  allowMultipleSubmissions: z.boolean().optional().default(false),
  maxSubmissions: z.number().int().positive().optional().nullable(),
  opensAt: z.string().datetime().optional().nullable(),
  closesAt: z.string().datetime().optional().nullable(),
  isPublic: z.boolean().optional().default(false),
  questions: z.array(surveyQuestionSchema).optional().default([]),
});
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;

export const updateSurveySchema = createSurveySchema.partial().extend({
  status: z.enum(surveyStatusValues).optional(),
});
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;

export const listSurveysQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(surveyStatusValues).optional(),
  search: z.string().trim().optional(),
});
export type ListSurveysQuery = z.infer<typeof listSurveysQuerySchema>;

export const submitSurveySchema = z.object({
  respondentName: z.string().max(256).optional(),
  respondentEmail: z.string().email().optional().or(z.literal("")),
  respondentPhone: z.string().max(24).optional(),
  answers: z.array(z.object({
    questionKey: z.string().min(1),
    value: z.string().optional().nullable(),
  })),
});
export type SubmitSurveyInput = z.infer<typeof submitSurveySchema>;
