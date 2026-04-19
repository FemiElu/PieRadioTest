import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchPublishedNewsCardsPage } from "@/lib/news/queries";
import {
  loadNewsPreferences,
  saveNewsPreferences,
  toggleBookmarkedSlug,
  type NewsPreferences,
} from "@/lib/news/preferences";
import type { NewsArticleCard } from "@/lib/news/types";

type UseNewsState = {
  featured: NewsArticleCard | null;
  articles: NewsArticleCard[];
};

const NEWS_CACHE_KEY = "news-mvp";
const newsCache = new Map<string, UseNewsState>();
const PAGE_SIZE = 12;

export function __resetNewsCacheForTests() {
  newsCache.clear();
}

function pickFeatured(articles: NewsArticleCard[]): NewsArticleCard | null {
  return (
    articles.find((article) => article.tier === "breaking" || article.tier === "trending") ??
    articles[0] ??
    null
  );
}

export function useNews() {
  const [state, setState] = useState<UseNewsState>({ featured: null, articles: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [prefsReady, setPrefsReady] = useState(false);
  const [preferences, setPreferences] = useState<NewsPreferences>({
    selectedCategory: "all",
    bookmarkedSlugs: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const stateRef = useRef<UseNewsState>({ featured: null, articles: [] });
  const pageRef = useRef(1);

  const fetchPage = useCallback(
    async (targetPage: number, isManualRefresh: boolean) => {
      const canUseCache =
        targetPage === 1 && preferences.selectedCategory === "all" && searchTerm.trim() === "";
      if (canUseCache && newsCache.has(NEWS_CACHE_KEY) && !isManualRefresh) {
        setState(newsCache.get(NEWS_CACHE_KEY)!);
        setLoading(false);
      } else if (targetPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      if (isManualRefresh) {
        setRefreshing(true);
      }

      try {
        setError(null);
        const result = await fetchPublishedNewsCardsPage({
          page: targetPage,
          limit: PAGE_SIZE,
          category: preferences.selectedCategory,
          search: searchTerm.trim(),
        });

        const raw = result.articles;
        const featured = targetPage === 1 ? pickFeatured(raw) : stateRef.current.featured;
        const pageItems =
          targetPage === 1 && featured ? raw.filter((article) => article.id !== featured.id) : raw;
        const merged =
          targetPage === 1 ? pageItems : [...stateRef.current.articles, ...pageItems];
        const next = { featured, articles: merged };

        if (canUseCache && targetPage === 1) {
          newsCache.set(NEWS_CACHE_KEY, next);
        }

        stateRef.current = next;
        setState(next);
        setTotal(result.total);
        pageRef.current = targetPage;
      } catch (err: unknown) {
        if (newsCache.has(NEWS_CACHE_KEY) && targetPage === 1) {
          const cached = newsCache.get(NEWS_CACHE_KEY)!;
          stateRef.current = cached;
          setState(cached);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load news.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [preferences.selectedCategory, searchTerm],
  );

  useEffect(() => {
    loadNewsPreferences()
      .then((saved) => setPreferences(saved))
      .finally(() => setPrefsReady(true));
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    fetchPage(1, false);
  }, [prefsReady, preferences.selectedCategory, searchTerm, fetchPage]);

  useEffect(() => {
    if (!prefsReady) return;

    const channel = supabase
      .channel("mobile_news_feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "news_articles" }, () => {
        fetchPage(1, false);
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchPage(1, false);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      if (typeof supabase.removeChannel === "function") {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchPage, prefsReady]);

  const refresh = useCallback(async () => {
    await fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || stateRef.current.articles.length >= total) return;
    await fetchPage(pageRef.current + 1, false);
  }, [fetchPage, loading, loadingMore, total]);

  const setCategory = useCallback((category: string) => {
    setPreferences((current) => {
      const next = { ...current, selectedCategory: category };
      saveNewsPreferences(next).catch(() => undefined);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((slug: string) => {
    setPreferences((current) => {
      const next = toggleBookmarkedSlug(current, slug);
      saveNewsPreferences(next).catch(() => undefined);
      return next;
    });
  }, []);

  return useMemo(
    () => ({
      featured: state.featured,
      articles: state.articles,
      loading,
      loadingMore,
      error,
      refreshing,
      hasMore: state.articles.length < total,
      selectedCategory: preferences.selectedCategory,
      bookmarkedSlugs: preferences.bookmarkedSlugs,
      searchTerm,
      setSearchTerm,
      setCategory,
      toggleBookmark,
      refresh,
      loadMore,
    }),
    [
      state.featured,
      state.articles,
      loading,
      loadingMore,
      error,
      refreshing,
      total,
      preferences.selectedCategory,
      preferences.bookmarkedSlugs,
      searchTerm,
      setCategory,
      toggleBookmark,
      refresh,
      loadMore,
    ],
  );
}

