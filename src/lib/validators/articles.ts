import { z } from "zod";

// ── Values checklist ──────────────────────────────────────────────────────────
// All four must be true before submission (Rashtra Pratham editorial standard)
export const valuesChecklistSchema = z.object({
  rashtraPratham: z.boolean(),
  culturallyGrounded: z.boolean(),
  balancedTone: z.boolean(),
  noDivisiveContent: z.boolean(),
});
export type ValuesChecklist = z.infer<typeof valuesChecklistSchema>;

// ── Article categories (aligns with Aayam workstreams) ────────────────────────
export const ARTICLE_CATEGORIES = [
  "vimarsh",   // Discourse
  "shodh",     // Research
  "prachar",   // Outreach
  "yuva",      // Youth
  "mahila",    // Women
  "other",
] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

// ── Article CRUD ──────────────────────────────────────────────────────────────
export const createArticleSchema = z.object({
  title: z.string().min(1, "Title is required.").max(1024).trim(),
  content: z.string().max(100000).optional(),
  summary: z.string().max(2000).optional(),
  category: z.enum(ARTICLE_CATEGORIES).default("other"),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  featuredImage: z.string().max(2048).optional().nullable(),
  documentUrl: z.string().url().max(2048).optional().nullable(),
  socialUrl: z.string().url().max(2048).optional().nullable(),
  valuesChecklist: valuesChecklistSchema.optional().default({
    rashtraPratham: false,
    culturallyGrounded: false,
    balancedTone: false,
    noDivisiveContent: false,
  }),
});
export type CreateArticleInput = z.infer<typeof createArticleSchema>;

export const updateArticleSchema = createArticleSchema.partial();
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.string().optional(),
  category: z.enum(ARTICLE_CATEGORIES).optional(),
  authorUserId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;

// ── Workflow transition ───────────────────────────────────────────────────────
export const articleWorkflowSchema = z.object({
  toStatus: z.string().min(1, "Target status is required."),
  notes: z.string().max(2000).optional(),
  valuesChecklist: valuesChecklistSchema.optional(),
});
export type ArticleWorkflowInput = z.infer<typeof articleWorkflowSchema>;

// ── Review submission ─────────────────────────────────────────────────────────
export const submitReviewSchema = z.object({
  decision: z.enum(["approved", "rejected", "returned_for_revision"]),
  reviewNotes: z.string().max(4000).optional(),
  edits: z.string().max(4000).optional(),
  valuesChecklistSnapshot: valuesChecklistSchema.optional(),
});
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

// ── Publication record ────────────────────────────────────────────────────────
export const createPublicationSchema = z.object({
  channel: z.string().min(1).max(64),
  publishedUrl: z.string().url().max(2048).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreatePublicationInput = z.infer<typeof createPublicationSchema>;
