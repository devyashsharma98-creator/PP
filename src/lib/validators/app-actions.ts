/**
 * Zod schemas for all AppActionRequest variants.
 *
 * Uses status constants from the centralized status-maps module to avoid
 * duplicating valid status lists. Reuses existing checklist/values schemas
 * where applicable.
 */
import { z } from "zod";
import { validUiEventStatuses, validUiArticleStatuses } from "@/lib/app/status-maps";

// ── Shared sub-schemas ────────────────────────────────────────────────────────

const pracharPlatforms = ["whatsapp", "facebook", "instagram", "telegram"] as const;

const checklistSchema = z
  .object({
    designing: z.boolean().optional(),
    food: z.boolean().optional(),
    seating: z.boolean().optional(),
    transport: z.boolean().optional(),
    accommodation: z.boolean().optional(),
    soundMic: z.boolean().optional(),
    camera: z.boolean().optional(),
    screen: z.boolean().optional(),
    lights: z.boolean().optional(),
  })
  .passthrough();

const valuesChecklistSchema = z.object({
  rashtraPratham: z.boolean(),
  culturallyGrounded: z.boolean(),
  balancedTone: z.boolean(),
  noDivisiveContent: z.boolean(),
});

// ── Action schemas ────────────────────────────────────────────────────────────

const createEventAction = z.object({
  action: z.literal("createEvent"),
  payload: z
    .object({
      title: z.string().min(1, "Title is required.").max(512).trim(),
      description: z.string().max(10000).optional().default(""),
      date: z.string().optional(),
      dateIso: z.string().optional(),
      unit: z.string().optional().default("Unit"),
      submittedBy: z.string().optional(),
      checklist: checklistSchema.optional(),
      report: z.string().optional(),
      photos: z.array(z.string()).optional(),
      poster: z.string().optional(),
      videoUrl: z.string().optional(),
      imageUrl: z.string().optional(),
    })
    .passthrough(),
});

const updateEventStatusAction = z.object({
  action: z.literal("updateEventStatus"),
  payload: z.object({
    id: z.string().uuid("Valid event ID required."),
    status: z.enum(validUiEventStatuses),
  }),
});

const updateFormConfigAction = z.object({
  action: z.literal("updateFormConfig"),
  payload: z.object({
    eventId: z.string().uuid(),
    config: z.object({
      fields: z.object({
        phone: z.boolean(),
        city: z.boolean(),
        attendingCount: z.boolean(),
        specialNeeds: z.boolean(),
      }),
      customQuestions: z
        .array(
          z.object({
            id: z.string(),
            question: z.string().max(512),
            questionHi: z.string().max(512),
            type: z.enum(["text", "yesno"]),
          }),
        )
        .max(20),
    }),
  }),
});

const addPollAction = z.object({
  action: z.literal("addPoll"),
  payload: z.object({
    eventId: z.string().uuid(),
    poll: z.object({
      question: z.string().min(1).max(1024),
      questionHi: z.string().max(1024),
      type: z.enum(["date", "general"]),
      options: z
        .array(
          z.object({
            label: z.string().min(1).max(512),
            votes: z.number().optional(),
            scheduledAtIso: z.string().nullable().optional(),
          }),
        )
        .min(2, "At least 2 options required.")
        .max(20),
    }),
  }),
});

const castVoteAction = z.object({
  action: z.literal("castVote"),
  payload: z.object({
    eventId: z.string().uuid(),
    pollId: z.string().uuid(),
    optionId: z.string().uuid(),
  }),
});

const finalizePollAction = z.object({
  action: z.literal("finalizePoll"),
  payload: z.object({
    eventId: z.string().uuid(),
    pollId: z.string().uuid(),
    winnerOptionId: z.string().uuid(),
  }),
});

const addArticleAction = z.object({
  action: z.literal("addArticle"),
  payload: z.object({
    title: z.string().min(1, "Title is required.").max(1024).trim(),
    content: z.string().max(100000),
    summary: z.string().max(2000),
    author: z.string().optional(),
    date: z.string().optional(),
    category: z.string().min(1),
    socialUrl: z.string().optional(),
    imageUrl: z.string().optional(),
    documentUrl: z.string().nullable().optional(),
    valuesChecklist: valuesChecklistSchema,
  }),
});

const updateArticleStatusAction = z.object({
  action: z.literal("updateArticleStatus"),
  payload: z.object({
    id: z.string().uuid("Valid article ID required."),
    status: z.enum(validUiArticleStatuses),
    edits: z
      .object({
        title: z.string().max(1024).optional(),
        content: z.string().max(100000).optional(),
        summary: z.string().max(2000).optional(),
      })
      .optional(),
    documentUrl: z.string().nullable().optional(),
    reviewNotes: z.string().max(2000).nullable().optional(),
  }),
});

const updatePracharPlatformAction = z.object({
  action: z.literal("updatePracharPlatform"),
  payload: z.object({
    eventId: z.string().uuid(),
    platform: z.enum(pracharPlatforms),
    done: z.boolean(),
    skipReason: z.string().max(500).nullable().optional(),
  }),
});

const updateVrittAction = z.object({
  action: z.literal("updateVritt"),
  payload: z.object({
    eventId: z.string().uuid(),
    vrittContent: z.string().max(50000).optional(),
    vrittAttendanceCount: z.number().int().min(0).optional(),
    vrittMediaUrls: z.array(z.string().max(2048)).max(20).optional(),
    vrittStatus: z.enum(["draft", "submitted", "reviewed"]).optional(),
  }),
});

const markAttendanceAction = z.object({
  action: z.literal("markAttendance"),
  payload: z.object({
    eventId: z.string().uuid(),
  }),
});

// ── Discriminated union ───────────────────────────────────────────────────────

export const appActionSchema = z.discriminatedUnion("action", [
  createEventAction,
  updateEventStatusAction,
  updateFormConfigAction,
  addPollAction,
  castVoteAction,
  finalizePollAction,
  addArticleAction,
  updateArticleStatusAction,
  updatePracharPlatformAction,
  updateVrittAction,
  markAttendanceAction,
]);

export type ValidatedAppAction = z.infer<typeof appActionSchema>;
