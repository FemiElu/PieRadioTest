/**
 * Typed Supabase query helpers for news articles.
 *
 * - Consumer helpers: fetch only published articles.
 * - Admin helpers: fetch all statuses for the CMS.
 *
 * All helpers accept a server-side Supabase client to enable
 * proper SSR session handling.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@packages/types';
import type { NewsArticle, NewsArticleCard } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Card-level columns (excludes `content` to reduce payload on list views)
// ─────────────────────────────────────────────────────────────────────────────
const CARD_SELECT = `
  id, slug, title, summary, cover_image_url,
  author_id, author_name, tier, category, status, is_breaking, is_featured,
  audio_preview_url, audio_moments,
  youtube_url, external_url,
  likes_count, comments_count, shares_count,
  published_at, created_at, updated_at
`.trim();

const FULL_SELECT = `${CARD_SELECT}, content`;

// ─────────────────────────────────────────────────────────────────────────────
// Consumer queries (published articles only — enforced by RLS + explicit filter)
// ─────────────────────────────────────────────────────────────────────────────

export interface GetPublishedArticlesOptions {
    tier?: NewsArticle['tier'] | null;
    category?: string | null;
    limit?: number;
    page?: number;
}

/**
 * Paginated list of published articles, optionally filtered by tier/category.
 * Returns card-level data (no `content`).
 */
export async function getPublishedArticles(
    supabase: SupabaseClient<Database>,
    { tier, category, limit = 20, page = 1 }: GetPublishedArticlesOptions = {},
): Promise<{ articles: NewsArticleCard[]; total: number }> {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
        .from('news_articles')
        .select(CARD_SELECT, { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(start, end);

    if (tier) query = query.eq('tier', tier);
    if (category) query = query.eq('category', category);

    const { data, count, error } = await query;

    if (error) {
        console.error('[news/queries] getPublishedArticles error:', error.message);
        return { articles: [], total: 0 };
    }

    return { articles: (data as unknown as NewsArticleCard[]) ?? [], total: count ?? 0 };
}

/**
 * Returns published breaking news articles (for hero carousel).
 */
export async function getBreakingArticles(
    supabase: SupabaseClient<Database>,
    limit = 5,
): Promise<NewsArticleCard[]> {
    const { data, error } = await supabase
        .from('news_articles')
        .select(CARD_SELECT)
        .eq('status', 'published')
        .eq('tier', 'breaking')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[news/queries] getBreakingArticles error:', error.message);
        return [];
    }
    return (data as unknown as NewsArticleCard[]) ?? [];
}

/**
 * Returns published trending articles (for the sidebar trending list).
 */
export async function getTrendingArticles(
    supabase: SupabaseClient<Database>,
    limit = 3,
): Promise<NewsArticleCard[]> {
    const { data, error } = await supabase
        .from('news_articles')
        .select(CARD_SELECT)
        .eq('status', 'published')
        .eq('tier', 'trending')
        .order('likes_count', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[news/queries] getTrendingArticles error:', error.message);
        return [];
    }
    return (data as unknown as NewsArticleCard[]) ?? [];
}

/**
 * Returns recent update articles for the sidebar "Recent Updates" list.
 */
export async function getRecentUpdateArticles(
    supabase: SupabaseClient<Database>,
    limit = 5,
): Promise<NewsArticleCard[]> {
    const { data, error } = await supabase
        .from('news_articles')
        .select(CARD_SELECT)
        .eq('status', 'published')
        .eq('tier', 'update')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[news/queries] getRecentUpdateArticles error:', error.message);
        return [];
    }
    return (data as unknown as NewsArticleCard[]) ?? [];
}

/**
 * Fetches a single published article by slug (including full content).
 * Returns null if not found or not published.
 */
export async function getArticleBySlug(
    supabase: SupabaseClient<Database>,
    slug: string,
): Promise<NewsArticle | null> {
    const { data, error } = await supabase
        .from('news_articles')
        .select(FULL_SELECT)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (error) {
        if (error.code !== 'PGRST116') { // Not found is expected
            console.error('[news/queries] getArticleBySlug error:', error.message);
        }
        return null;
    }
    return data as unknown as NewsArticle;
}

/**
 * Fetch the most recent published article that is marked as featured,
 * falling back to the most recent published article overall if none is featured.
 */
export async function getFeaturedArticle(
    supabase: SupabaseClient<Database>,
): Promise<NewsArticleCard | null> {
    // 1. Try to get the latest published featured article
    const { data: featuredData, error: featuredError } = await supabase
        .from('news_articles')
        .select(CARD_SELECT)
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(1);

    if (!featuredError && featuredData && featuredData.length > 0) {
        return featuredData[0] as unknown as NewsArticleCard;
    }

    // 2. Fallback to the latest published article overall
    const { data: latestData, error: latestError } = await supabase
        .from('news_articles')
        .select(CARD_SELECT)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1);

    if (latestError) {
        console.error('[news/queries] getFeaturedArticle error:', latestError.message);
        return null;
    }

    return (latestData?.[0] as unknown as NewsArticleCard) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin queries (all statuses — relies on admin RLS policy)
// ─────────────────────────────────────────────────────────────────────────────

export interface GetAllArticlesAdminOptions {
    status?: NewsArticle['status'] | 'all';
    tier?: NewsArticle['tier'] | null;
    search?: string | null;
    limit?: number;
    page?: number;
}

/**
 * Admin: paginated list of all articles (any status).
 */
export async function getAllArticlesAdmin(
    supabase: SupabaseClient<Database>,
    { status = 'all', tier, search, limit = 20, page = 1 }: GetAllArticlesAdminOptions = {},
): Promise<{ articles: NewsArticleCard[]; total: number }> {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
        .from('news_articles')
        .select(CARD_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

    if (status && status !== 'all') query = query.eq('status', status);
    if (tier) query = query.eq('tier', tier);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, count, error } = await query;

    if (error) {
        console.error('[news/queries] getAllArticlesAdmin error:', error.message);
        return { articles: [], total: 0 };
    }

    return { articles: (data as unknown as NewsArticleCard[]) ?? [], total: count ?? 0 };
}

/**
 * Admin: fetch a single article by id for the edit form (includes content).
 */
export async function getArticleByIdAdmin(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<NewsArticle | null> {
    const { data, error } = await supabase
        .from('news_articles')
        .select(FULL_SELECT)
        .eq('id', id)
        .single();

    if (error) {
        console.error('[news/queries] getArticleByIdAdmin error:', error.message);
        return null;
    }
    return data as unknown as NewsArticle;
}
