import { Pressable, Text, View } from "react-native";
import type { NewsArticleCard } from "@/lib/news/types";

type NewsListItemProps = {
  article: NewsArticleCard;
  onPress: (slug: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: (slug: string) => void;
  onShare: (article: NewsArticleCard) => void;
};

function toRelativeDate(date: string | null): string {
  if (!date) {
    return "Recently";
  }

  const source = new Date(date).getTime();
  const diffMs = Date.now() - source;
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

export function NewsListItem({
  article,
  onPress,
  isBookmarked,
  onToggleBookmark,
  onShare,
}: NewsListItemProps) {
  return (
    <Pressable
      className="mb-3 rounded-xl border border-border bg-card p-4"
      onPress={() => onPress(article.slug)}
      accessibilityRole="button"
      accessibilityLabel={`Open article ${article.title}`}
    >
      <Text className="text-base font-semibold text-card-foreground">{article.title}</Text>
      {article.summary ? (
        <Text className="mt-1 text-sm text-muted-foreground" numberOfLines={2}>
          {article.summary}
        </Text>
      ) : null}
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-muted-foreground">{article.category ?? "News"}</Text>
        <Text className="text-xs text-muted-foreground">
          {toRelativeDate(article.published_at ?? article.created_at)}
        </Text>
      </View>
      <View className="mt-2 flex-row gap-3">
        <Pressable onPress={() => onShare(article)} accessibilityRole="button">
          <Text className="text-xs font-semibold text-primary">Share</Text>
        </Pressable>
        <Pressable onPress={() => onToggleBookmark(article.slug)} accessibilityRole="button">
          <Text className="text-xs font-semibold text-primary">{isBookmarked ? "Saved" : "Save"}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

