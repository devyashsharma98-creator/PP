import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  summary: z.string().optional(),
  category: z.enum(['shodh', 'vimarsh', 'prabandh', 'aalekhan', 'any']),
  unit_id: z.string().uuid('Invalid unit ID').optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export const articleStatusSchema = z.enum([
  'draft',
  'pending_unit_head_review',
  'pending_aayam_review',
  'pending_vibhag_review',
  'pending_prant_authorization',
  'authorized_public',
  'published',
  'archived',
  'rejected',
]);

export const articleReviewSchema = z.object({
  decision: z.enum(['approved', 'forwarded', 'changes_requested', 'rejected']),
  review_notes: z.string().optional(),
  edits: z.record(z.unknown()).optional(),
});

export const articleFiltersSchema = z.object({
  status: articleStatusSchema.optional(),
  category: z.string().optional(),
  author_user_id: z.string().uuid('Invalid user ID').optional(),
  unit_id: z.string().uuid('Invalid unit ID').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const valuesChecklistSchema = z.object({
  rashtra_pratham: z.boolean(),
  culturally_grounded: z.boolean(),
  balanced_tone: z.boolean(),
  no_divisive_content: z.boolean(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleFilters = z.infer<typeof articleFiltersSchema>;
export type ArticleReviewInput = z.infer<typeof articleReviewSchema>;
export type ValuesChecklist = z.infer<typeof valuesChecklistSchema>;