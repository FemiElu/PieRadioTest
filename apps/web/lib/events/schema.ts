/**
 * Events — Zod Validation Schemas
 *
 * Used by both the admin form (client) and the API routes (server)
 * to validate event data before persistence.
 */

import { z } from 'zod';
import { EVENT_CATEGORIES, EVENT_STATUSES } from './types';

/** Base fields shared by create and update */
const EventBaseObject = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be under 200 characters'),

  description: z.string().max(5000).nullable().optional(),

  artist_name: z
    .string()
    .max(200)
    .nullable()
    .optional(),

  category: z.enum(EVENT_CATEGORIES, {
    message: 'Please select a valid category',
  }),

  status: z.enum(EVENT_STATUSES).default('upcoming'),

  // Date & time — ISO 8601 strings
  start_time: z
    .string()
    .min(1, 'Start date and time is required')
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date format'),

  end_time: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Invalid end date format',
    ),

  // Venue
  venue_name: z.string().max(200).nullable().optional(),
  venue_address: z.string().max(500).nullable().optional(),
  venue_city: z.string().max(100).nullable().optional(),

  // Pricing
  price_min: z
    .number({ coerce: true })
    .int()
    .min(0, 'Price cannot be negative')
    .default(0),

  price_max: z
    .number({ coerce: true })
    .int()
    .min(0)
    .nullable()
    .optional(),

  // External ticket link
  ticket_url: z
    .string()
    .url('Must be a valid URL')
    .nullable()
    .optional()
    .or(z.literal('')),

  // Media
  cover_image_url: z.string().url().nullable().optional().or(z.literal('')),

  // Flags
  is_featured: z.boolean().default(false),
});

/** Shared refinements for price and dates */
const applyEventRefinements = <T extends z.ZodType<any, any, any>>(schema: T) => {
  return schema
    .refine(
      (data: any) => {
        if (data.price_max != null && data.price_min != null && data.price_max < data.price_min) {
          return false;
        }
        return true;
      },
      {
        message: 'Maximum price must be greater than or equal to minimum price',
        path: ['price_max'],
      }
    )
    .refine(
      (data: any) => {
        if (data.end_time && data.start_time) {
          return new Date(data.end_time) > new Date(data.start_time);
        }
        return true;
      },
      {
        message: 'End time must be after start time',
        path: ['end_time'],
      }
    );
};

export const CreateEventSchema = applyEventRefinements(EventBaseObject);

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

/**
 * Update schema — all fields optional.
 * We call .partial() on the base object BEFORE applying refinements.
 */
export const UpdateEventSchema = applyEventRefinements(EventBaseObject.partial());

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
