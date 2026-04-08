import { z } from "zod";

// ── Event checklist shape ─────────────────────────────────────────────────────
export const checklistSchema = z.object({
  designing: z.boolean().optional().default(false),
  food: z.boolean().optional().default(false),
  seating: z.boolean().optional().default(false),
  transport: z.boolean().optional().default(false),
  accommodation: z.boolean().optional().default(false),
  soundMic: z.boolean().optional().default(false),
  camera: z.boolean().optional().default(false),
  screen: z.boolean().optional().default(false),
  lights: z.boolean().optional().default(false),
});
export type Checklist = z.infer<typeof checklistSchema>;

// ── Event CRUD ────────────────────────────────────────────────────────────────
export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required.").max(512).trim(),
  description: z.string().max(10000).optional(),
  startsAt: z.string().datetime({ message: "Invalid start date." }).optional(),
  endsAt: z.string().datetime({ message: "Invalid end date." }).optional(),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  checklist: checklistSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.string().optional(),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  search: z.string().trim().optional(),
});
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

// ── Workflow transition ───────────────────────────────────────────────────────
export const eventWorkflowSchema = z.object({
  toStatus: z.string().min(1, "Target status is required."),
  notes: z.string().max(2000).optional(),
});
export type EventWorkflowInput = z.infer<typeof eventWorkflowSchema>;

// ── Form config ───────────────────────────────────────────────────────────────
export const eventFormConfigSchema = z.object({
  isEnabled: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  collectPhone: z.boolean().optional(),
  collectCity: z.boolean().optional(),
  collectAttendingCount: z.boolean().optional(),
  collectSpecialNeeds: z.boolean().optional(),
  collectNotes: z.boolean().optional(),
  allowMultipleSubmissions: z.boolean().optional(),
  maxRegistrations: z.number().int().positive().optional().nullable(),
  opensAt: z.string().datetime().optional().nullable(),
  closesAt: z.string().datetime().optional().nullable(),
});
export type EventFormConfigInput = z.infer<typeof eventFormConfigSchema>;

// ── Custom question ───────────────────────────────────────────────────────────
export const eventQuestionSchema = z.object({
  questionKey: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, underscores."),
  label: z.string().min(1).max(512),
  labelHi: z.string().max(512).optional(),
  questionType: z.enum(["text", "yesno"]).default("text"),
  isRequired: z.boolean().optional().default(false),
  displayOrder: z.number().int().optional().default(0),
});
export type EventQuestionInput = z.infer<typeof eventQuestionSchema>;

// ── Poll ──────────────────────────────────────────────────────────────────────
export const createPollSchema = z.object({
  question: z.string().min(1).max(1024),
  questionHi: z.string().max(1024).optional(),
  pollType: z.enum(["date", "general"]).default("general"),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(512),
        labelHi: z.string().max(512).optional(),
        scheduledAt: z.string().datetime().optional(),
        displayOrder: z.number().int().optional().default(0),
      })
    )
    .min(2, "At least 2 options required.")
    .max(20),
});
export type CreatePollInput = z.infer<typeof createPollSchema>;

export const finalizePollSchema = z.object({
  winnerOptionId: z.string().uuid("Valid option ID required."),
});

export const castVoteSchema = z.object({
  optionId: z.string().uuid("Valid option ID required."),
});

// ── Public registration ───────────────────────────────────────────────────────
export const publicRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required.").max(256).trim(),
  phone: z.string().max(24).optional(),
  email: z.string().email().optional(),
  city: z.string().max(128).optional(),
  attendingCount: z.number().int().min(1).max(100).optional().default(1),
  hasSpecialNeeds: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional(),
  answers: z.record(z.string()).optional(),
});
export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;
