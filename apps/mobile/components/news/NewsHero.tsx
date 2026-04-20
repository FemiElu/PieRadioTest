import { useRef, useState, useCallback } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NewsArticleCard } from "@/lib/news/types";

interface NewsHeroProps {
  articles: NewsArticleCard[];
  onPress: (slug: string) => void;
}

const { width } = Dimensions.get("window");

export function NewsHero({ articles, onPress }: NewsHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  if (articles.length === 0) return null;

  return (
    <View className="mb-6">
      <FlatList
        ref={flatListRef}
        data={articles}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPress(item.slug)}
            className="w-full relative overflow-hidden bg-zinc-900"
            style={{ width, aspectRatio: 4 / 5 }}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Read article: ${item.title}`}
          >
            <Image
              source={
                item.cover_image_url && item.cover_image_url.startsWith("http")
                  ? { uri: item.cover_image_url }
                  : require("../../assets/popeyes_manchester_0001.jpg")
              }
              style={{ width: "100%", height: "100%", position: "absolute" }}
              resizeMode="cover"
            />
            {/* Gradient Overlay for Text Readability */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%" }}
            />

            <View className="absolute bottom-10 left-5 right-5 flex flex-col gap-3">
              <View className="flex-row items-center gap-2">
                <View className="rounded-full bg-red-600 px-3 py-1">
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-white">
                    ● BREAKING
                  </Text>
                </View>
                <View className="rounded-full bg-white/20 px-3 py-1">
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-white">
                    {item.category || "NEWS"}
                  </Text>
                </View>
              </View>

              <Text className="text-2xl font-bold text-white leading-tight" numberOfLines={3}>
                {item.title}
              </Text>

              <Text className="text-sm text-zinc-300" numberOfLines={2}>
                {item.summary}
              </Text>
            </View>
          </Pressable>
        )}
      />

      {/* Pagination Indicators */}
      {articles.length > 1 && (
        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center space-x-2">
          {articles.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${i === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/40"
                }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
