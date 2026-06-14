/**
 * Home — Server Component (ISR)
 *
 * WHY this is a Server Component:
 *   The previous "use client" version prevented Vercel from caching the rendered
 *   HTML at the CDN, so every visitor triggered a fresh serverless invocation.
 *   As a Server Component with ISR, Vercel caches the fully-rendered HTML for
 *   `revalidate` seconds and serves it from the CDN edge.
 *
 * WHY we use the plain supabase-js client here (not the SSR/cookie-aware one):
 *   The SSR client calls `cookies()` from 'next/headers' to manage user sessions.
 *   Calling `cookies()` makes Next.js treat the entire route as dynamic, which
 *   defeats ISR entirely (the page showed as "ƒ Dynamic" with no Revalidate column).
 *   The spotlight query is fully public (no auth required), so a plain anon-key
 *   client is correct and avoids opting the route into dynamic rendering.
 *
 * What lives here vs HomeClient:
 *   - HERE:       Spotlight fetch (server-side, ISR-cached, no cookies)
 *   - HomeClient: All interactive hooks (audio, schedule, recently-played poll)
 */

import { createClient } from "@supabase/supabase-js";
import HomeClient, { type SpotlightData } from "./home-client";
import { getFeaturedArticle, getPublishedArticles } from "@/lib/news/queries";
import type { NewsArticleCard } from "@/lib/news/types";

// ISR: Vercel regenerates the cached page at most every 5 minutes.
// Spotlight data rarely changes, so 5 min is a safe, conservative window.
export const revalidate = 300;

async function getSpotlight(): Promise<SpotlightData | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!url || !key) {
      console.warn(
        "[Home] Supabase credentials missing — skipping spotlight fetch.",
      );
      return null;
    }

    // Plain supabase-js client: no cookies, no session, no dynamic opt-in.
    const supabase = createClient(url, key);

    const { data, error } = await supabase
      .from("spotlights")
      .select("title, artist_name, image_url, link_url")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[Home] Failed to fetch spotlight:", error.message);
      return null;
    }

    return data ?? null;
  } catch (err) {
    console.error("[Home] Unexpected error fetching spotlight:", err);
    return null;
  }
}

async function getFeaturedArticleData(): Promise<NewsArticleCard | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!url || !key) {
      console.warn(
        "[Home] Supabase credentials missing — skipping featured article fetch.",
      );
      return null;
    }

    const supabase = createClient(url, key);
    return await getFeaturedArticle(supabase);
  } catch (err) {
    console.error("[Home] Unexpected error fetching featured article:", err);
    return null;
  }
}

async function getRecentHomepageArticles(): Promise<NewsArticleCard[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!url || !key) {
      console.warn(
        "[Home] Supabase credentials missing — skipping recent article fetch.",
      );
      return [];
    }

    const supabase = createClient(url, key);
    const { articles } = await getPublishedArticles(supabase, { limit: 3 });
    return articles;
  } catch (err) {
    console.error(
      "[Home] Unexpected error fetching recent homepage articles:",
      err,
    );
    return [];
  }
}

export default async function Home() {
  const [spotlight, featuredArticle, recentArticles] = await Promise.all([
    getSpotlight(),
    getFeaturedArticleData(),
    getRecentHomepageArticles(),
  ]);

  const homepageRecentArticles = recentArticles
    .filter((article) => article.id !== featuredArticle?.id)
    .slice(0, 2);

  return (
    <HomeClient
      initialSpotlight={spotlight}
      initialFeaturedArticle={featuredArticle}
      initialRecentArticles={homepageRecentArticles}
    />
  );
}
