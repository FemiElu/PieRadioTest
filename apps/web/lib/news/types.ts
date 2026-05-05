/**
 * Frontend-facing NewsArticle type derived from the DB row.
 * This is the single source of truth for news data shapes.
 * Previously in lib/mock-news.ts — this replaces that interface.
 */

import type { AudioMomentJson } from '@packages/types';

export type NewsTier = 'breaking' | 'trending' | 'update' | 'archive' | 'audio' | 'poll' | 'sponsor';
export type NewsStatus = 'draft' | 'published' | 'archived';

// Re-export for convenience
export type { AudioMomentJson };

export interface NewsArticle {
    id: string;
    slug: string;
    title: string;
    content: string;
    summary: string | null;
    cover_image_url: string | null;
    author_id: string | null;
    author_name: string | null;
    tier: NewsTier;
    category: string | null;
    status: NewsStatus;
    is_breaking: boolean;
    audio_preview_url: string | null;
    audio_moments: AudioMomentJson[] | null;
    youtube_url: string | null;
    external_url: string | null;
    options?: string[];
    results?: number[];
    likes_count: number;
    comments_count: number;
    shares_count: number;
    published_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

/** Slim view used in news feed cards (avoids sending large `content` field) */
export type NewsArticleCard = Omit<NewsArticle, 'content'>;

/** Categories available site-wide */
export const NEWS_CATEGORIES = [
    'Afrobeats',
    'Hip-hop',
    'Gossip',
    'Shows',
    'Entertainment & Lifestyle',
    'Local',
    'Music',
    'Podcasts',
    'Archive',
    'Engagement',
] as const;

export type NewsCategory = typeof NEWS_CATEGORIES[number];

/** User-facing interest chips — matches consumer page UI */
export const INTEREST_CHIPS: string[] = [
    'For You',
    ...NEWS_CATEGORIES,
];
