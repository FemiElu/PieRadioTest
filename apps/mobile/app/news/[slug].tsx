import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { fetchPublishedArticleBySlug } from "@/lib/news/queries";
import {
  loadNewsPreferences,
  saveNewsPreferences,
  toggleBookmarkedSlug,
} from "@/lib/news/preferences";
import type { NewsArticleDetail } from "@/lib/news/types";

function formatDate(date: string | null): string {
  if (!date) {
    return "Recently";
  }
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NewsDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = useMemo(
    () => (Array.isArray(params.slug) ? params.slug[0] : params.slug) ?? "",
    [params.slug],
  );
  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadArticle() {
      if (!slug) {
        setError("Article not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const foundArticle = await fetchPublishedArticleBySlug(slug);
        if (!isMounted) return;

        if (!foundArticle) {
          setError("Article not found.");
          setArticle(null);
          return;
        }

        setArticle(foundArticle);
        const prefs = await loadNewsPreferences();
        setIsBookmarked(prefs.bookmarkedSlugs.includes(foundArticle.slug));
      } catch (err: unknown) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to load article.";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadArticle();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#334aff" />
        <Text className="mt-3 text-sm text-muted-foreground">Loading article...</Text>
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-lg font-semibold text-foreground">Unable to open article</Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground">{error ?? "Not found."}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen options={{ title: "News", headerShown: true }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="px-5 pt-4">
          <Text className="text-2xl font-bold leading-8 text-foreground">{article.title}</Text>
          <Text className="mt-2 text-xs text-muted-foreground">
            {article.author_name ?? "Pie Radio"} · {formatDate(article.published_at ?? article.created_at)}
          </Text>
          {article.summary ? (
            <Text className="mt-4 text-base leading-6 text-muted-foreground">{article.summary}</Text>
          ) : null}
          <View className="mt-4 flex-row gap-4">
            <Pressable
              onPress={async () => {
                await Share.share({ message: `${article.title}\n\nRead more on Pie Radio` });
              }}
            >
              <Text className="text-sm font-semibold text-primary">Share</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                const prefs = await loadNewsPreferences();
                const next = toggleBookmarkedSlug(prefs, article.slug);
                await saveNewsPreferences(next);
                setIsBookmarked(next.bookmarkedSlugs.includes(article.slug));
              }}
            >
              <Text className="text-sm font-semibold text-primary">
                {isBookmarked ? "Saved" : "Save"}
              </Text>
            </Pressable>
          </View>
          <Text className="mt-6 text-base leading-7 text-foreground">{article.content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

