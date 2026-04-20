import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { InterestChips } from "@/components/news/InterestChips";
import { NewsHero } from "@/components/news/NewsHero";
import { NewsListItem } from "@/components/news/NewsListItem";
import { useNews } from "@/hooks/useNews";
import type { NewsArticleCard } from "@/lib/news/types";

const CATEGORY_OPTIONS = ["all", "Afrobeats", "Hip-hop", "Gossip", "Shows", "Music", "Podcasts"];

export default function NewsScreen() {
  const {
    featured,
    articles,
    loading,
    loadingMore,
    error,
    refreshing,
    hasMore,
    selectedCategory,
    bookmarkedSlugs,
    searchTerm,
    setSearchTerm,
    setCategory,
    toggleBookmark,
    refresh,
    loadMore,
  } = useNews();

  const navigateToDetail = (slug: string) => {
    router.push(`/news/${slug}`);
  };

  const handleShare = async (article: NewsArticleCard) => {
    await Share.share({
      message: `${article.title}\n\nRead more on Pie Radio`,
    });
  };

  const renderHeader = () => (
    <View className="pb-3">
      <View className="px-5 pt-2">
        <Text className="text-center text-2xl font-bold text-foreground">News</Text>
        <Text className="mt-1 text-center text-sm text-muted-foreground">
          Catch up on the latest from Pie Radio.
        </Text>
        {/* We keep the search input but position it nicely */}
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search news..."
          placeholderTextColor="#71717a"
          className="mt-4 mb-4 rounded-xl border border-border bg-card px-3 py-2 text-card-foreground"
        />
      </View>

      <InterestChips
        chips={CATEGORY_OPTIONS}
        selectedCategory={selectedCategory}
        onSelect={setCategory}
      />

      <View className="mt-6">
        {featured ? (
          <NewsHero
            articles={[featured]} // Array of articles even if it's currently returning one
            onPress={navigateToDetail}
          />
        ) : null}
      </View>

      <View className="px-5 mt-2 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-foreground">Recent Stories</Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-muted-foreground">Sorted For You</Text>
        </View>
      </View>
    </View>
  );

  if (loading && !featured && articles.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#334aff" />
        <Text className="mt-3 text-sm text-muted-foreground">Loading news...</Text>
      </SafeAreaView>
    );
  }

  if (error && !featured && articles.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-lg font-semibold text-foreground">Unable to load news</Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <FlatList
        data={articles}
        keyExtractor={(item: NewsArticleCard) => item.id}
        renderItem={({ item }) => (
          <NewsListItem
            article={item}
            onPress={navigateToDetail}
            isBookmarked={bookmarkedSlugs.includes(item.slug)}
            onToggleBookmark={toggleBookmark}
            onShare={handleShare}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View className="px-6 py-16 items-center">
            <Text className="text-lg font-bold text-muted-foreground">No stories yet</Text>
            <Text className="text-center mt-1 text-sm text-muted-foreground">
              Check back soon — new content is on the way.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#334aff" />}
        onEndReachedThreshold={0.3}
        onEndReached={loadMore}
        ListFooterComponent={
          <View className="py-8 items-center">
            {loadingMore ? (
              <ActivityIndicator color="#334aff" />
            ) : hasMore ? (
              <Pressable
                className="items-center rounded-full border border-border px-8 py-3"
                onPress={loadMore}
              >
                <Text className="text-sm font-bold text-foreground">Load More Articles</Text>
              </Pressable>
            ) : articles.length > 0 ? (
              <View className="items-center gap-3">
                <View className="h-px w-12 bg-border" />
                <Text className="text-sm italic text-muted-foreground">
                  You're all caught up for now.
                </Text>
              </View>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

