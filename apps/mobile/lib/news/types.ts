import type { Database } from "@packages/types";

export type NewsTier =
  | "breaking"
  | "trending"
  | "update"
  | "archive"
  | "audio"
  | "poll"
  | "sponsor";
export type NewsStatus = "draft" | "published" | "archived";

export type NewsArticleRow = Database["public"]["Tables"]["news_articles"]["Row"];

export interface NewsArticleCard {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  tier: NewsTier;
  category: string | null;
  published_at: string | null;
  created_at: string | null;
}

export interface NewsArticleDetail extends NewsArticleCard {
  content: string;
  audio_preview_url: string | null;
}

export function toNewsArticleCard(row: NewsArticleRow): NewsArticleCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    cover_image_url: row.cover_image_url,
    author_name: row.author_name,
    tier: row.tier,
    category: row.category,
    published_at: row.published_at,
    created_at: row.created_at,
  };
}

export function toNewsArticleDetail(row: NewsArticleRow): NewsArticleDetail {
  return {
    ...toNewsArticleCard(row),
    content: row.content,
    audio_preview_url: row.audio_preview_url,
  };
}

