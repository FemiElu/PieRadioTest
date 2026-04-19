import { Image, Pressable, Text, View } from "react-native";
import type { NewsArticleCard } from "@/lib/news/types";

type NewsFeaturedCardProps = {
  article: NewsArticleCard;
  onPress: (slug: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: (slug: string) => void;
  onShare: (article: NewsArticleCard) => void;
};

function formatDate(date: string | null): string {
  if (!date) {
    return "Latest update";
  }

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function NewsFeaturedCard({
  article,
  onPress,
  isBookmarked,
  onToggleBookmark,
  onShare,
}: NewsFeaturedCardProps) {
  return (
    <Pressable
      className="mb-4 overflow-hidden rounded-2xl border border-border bg-card"
      onPress={() => onPress(article.slug)}
      accessibilityRole="button"
      accessibilityLabel={`Open featured article ${article.title}`}
    >
      {article.cover_image_url ? (
        <Image source={{ uri: article.cover_image_url }} className="h-48 w-full" resizeMode="cover" />
      ) : (
        <View className="h-48 w-full items-center justify-center bg-muted">
          <Text className="text-sm font-medium text-muted-foreground">No cover image</Text>
        </View>
      )}

      <View className="space-y-2 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-primary">Featured</Text>
        <Text className="text-xl font-bold text-card-foreground">{article.title}</Text>
        {article.summary ? (
          <Text className="text-sm leading-5 text-muted-foreground" numberOfLines={3}>
            {article.summary}
          </Text>
        ) : null}
        <Text className="text-xs text-muted-foreground">
          {article.author_name ?? "Pie Radio"} · {formatDate(article.published_at ?? article.created_at)}
        </Text>
        <View className="mt-2 flex-row gap-3">
          <Pressable onPress={() => onShare(article)} accessibilityRole="button">
            <Text className="text-sm font-semibold text-primary">Share</Text>
          </Pressable>
          <Pressable onPress={() => onToggleBookmark(article.slug)} accessibilityRole="button">
            <Text className="text-sm font-semibold text-primary">
              {isBookmarked ? "Saved" : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

