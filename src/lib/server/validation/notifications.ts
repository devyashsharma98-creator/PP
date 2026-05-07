import { z } from 'zod';

export const notificationKindSchema = z.enum([
  'event_status_change',
  'article_status_change',
  'review_assigned',
  'review_completed',
  'poll_finalized',
  'registration_received',
  'mention',
  'system',
]);

export const createNotificationSchema = z.object({
  recipient_user_id: z.string().uuid('Invalid user ID'),
  kind: notificationKindSchema,
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().optional(),
  link_path: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid('Invalid entity ID').optional(),
  payload: z.record(z.unknown()).optional(),
});

export const notificationFiltersSchema = z.object({
  is_read: z.boolean().optional(),
  kind: notificationKindSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const markReadSchema = z.object({
  notification_ids: z.array(z.string().uuid('Invalid notification ID')).min(1),
});

export const sendNotificationSchema = z.object({
  recipient_user_ids: z.array(z.string().uuid('Invalid user ID')).min(1),
  kind: notificationKindSchema,
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().optional(),
  link_path: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid('Invalid entity ID').optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;