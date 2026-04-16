import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  starts_at: z.string().datetime({ message: 'Invalid start date' }),
  ends_at: z.string().datetime({ message: 'Invalid end date' }).optional(),
  unit_id: z.string().uuid('Invalid unit ID').optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  location_id: z.string().uuid('Invalid location ID').optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventStatusSchema = z.enum([
  'draft',
  'submitted_by_unit',
  'pending_aayam_review',
  'pending_vibhag_review',
  'pending_prant_authorization',
  'pending_prant_dual_authorization',
  'authorized_public',
  'published',
  'escalated_kshetra',
  'returned_for_revision',
  'rejected',
  'cancelled',
]);

export const eventFiltersSchema = z.object({
  status: eventStatusSchema.optional(),
  unit_id: z.string().uuid('Invalid unit ID').optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  from_date: z.string().datetime('Invalid date').optional(),
  to_date: z.string().datetime('Invalid date').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().optional(),
  city: z.string().optional(),
  attending_count: z.coerce.number().int().positive().default(1),
  has_special_needs: z.boolean().default(false),
  notes: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventFilters = z.infer<typeof eventFiltersSchema>;
export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;