/**
 * Zod validation schemas for News article mutations.
 * Used in API route handlers to validate request bodies.
 */

import { z } from 'zod';

const AudioMomentSchema = z.object({
    id: z.string().optional(),
    label: z.string().min(1).max(200),
    time_seconds: z.number().int().min(0),
});

const NewsTierEnum = z.enum([
    'breaking', 'trending', 'update', 'archive', 'audio', 'poll', 'sponsor',
]);

const NewsStatusEnum = z.enum(['draft', 'published', 'archived']);

/**
 * Schema for creating a new article.
 * All content fields required; engagement counters default on DB.
 */
export const CreateArticleSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(300),
    slug: z
        .string()
        .min(3)
        .max(200)
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    content: z.string().min(1, 'Content cannot be empty').max(50_000),
    summary: z.string().max(500).nullable().optional(),
    cover_image_url: z.string().url('Must be a valid URL').nullable().optional(),
    category: z.string().max(100).nullable().optional(),
    tier: NewsTierEnum.default('update'),
    status: NewsStatusEnum.default('draft'),
    is_breaking: z.boolean().default(false),
    audio_preview_url: z.string().url('Must be a valid URL').nullable().optional(),
    audio_moments: z.array(AudioMomentSchema).max(10).nullable().optional(),
    author_name: z.string().max(100).nullable().optional(),
});

/**
 * Schema for updating an existing article.
 * All fields are optional — only send what changed.
 */
export const UpdateArticleSchema = CreateArticleSchema.partial().extend({
    // Explicit status field always required when transitioning publish state
    // but otherwise optional since CreateArticleSchema.partial() makes it optional too.
    status: NewsStatusEnum.optional(),
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;
