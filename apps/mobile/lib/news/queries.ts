import { supabase } from "@/lib/supabase";
import {
  toNewsArticleCard,
  toNewsArticleDetail,
  type NewsArticleCard,
  type NewsArticleDetail,
} from "@/lib/news/types";

const LIST_COLUMNS =
  "id,slug,title,summary,cover_image_url,author_name,tier,category,published_at,created_at";
const DETAIL_COLUMNS =
  "id,slug,title,content,summary,cover_image_url,author_name,tier,category,published_at,created_at,audio_preview_url";

export async function fetchPublishedNewsCardsPage({
  page = 1,
  limit = 12,
  category = "all",
  search = "",
}: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}): Promise<{ articles: NewsArticleCard[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("news_articles")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (category !== "all") {
    query = query.eq("category", category);
  }

  if (search.trim()) {
    query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw error;
  }

  return {
    articles: (data ?? []).map((row) => toNewsArticleCard(row)),
    total: count ?? 0,
  };
}

export async function fetchPublishedArticleBySlug(
  slug: string,
): Promise<NewsArticleDetail | null> {
  const { data, error } = await supabase
    .from("news_articles")
    .select(DETAIL_COLUMNS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return toNewsArticleDetail(data);
}

