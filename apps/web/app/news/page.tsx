/**
 * News Page — Server Component
 *
 * Fetches real data from Supabase on the server side:
 * - Breaking articles (hero carousel)
 * - Trending articles (right rail)
 * - Recent updates (right rail)  
 * - Full article feed (main feed)
 *
 * Interactivity (chip filter, modals) is delegated to the NewsPageClient component.
 */

import { createClient } from "@/lib/supabase/server";
import {
  getBreakingArticles,
  getTrendingArticles,
  getRecentUpdateArticles,
  getPublishedArticles,
} from "@/lib/news/queries";
import { NewsPageClient } from "./news-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News | Pie Radio",
  description: "Breaking news, trending stories, and the latest from the Pie Radio team.",
};

// Revalidate every 60 seconds for near-real-time updates
export const revalidate = 60;

export default async function NewsPage() {
  const supabase = await createClient();

  // Fetch all data in parallel for performance
  const [breakingArticles, trendingArticles, recentArticles, { articles: feedArticles, total: totalFeedArticles }] =
    await Promise.all([
      getBreakingArticles(supabase, 5),
      getTrendingArticles(supabase, 3),
      getRecentUpdateArticles(supabase, 5),
      getPublishedArticles(supabase, { limit: 20, page: 1 }),
    ]);

  return (
    <NewsPageClient
      breakingArticles={breakingArticles}
      trendingArticles={trendingArticles}
      recentArticles={recentArticles}
      feedArticles={feedArticles}
      totalFeedArticles={totalFeedArticles}
    />
  );
}
