import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

// Category filter options
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "afrobeats", label: "Afrobeats" },
  { id: "amapiano", label: "Amapiano" },
  { id: "rap-hiphop", label: "Rap & Hiphop" },
  { id: "rnb", label: "R&B" },
  { id: "house", label: "House" },
  { id: "sports", label: "Sports" },
];

export default function PresentersScreen() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [presenters, setPresenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresenters();
  }, []);

  const fetchPresenters = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "presenter")
        // .eq('is_visible', true) // assuming we might have this later
        .order("full_name");

      if (error) throw error;
      setPresenters(data || []);
    } catch (error) {
      console.error("Error fetching presenters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresenterPress = (presenter: any) => {
    // Navigate to presenter detail using slug or ID
    // If slug is missing, fall back to ID (though migration added slug)
    const identifier = presenter.slug || presenter.id;
    router.push(`/presenter/${identifier}`);
  };

  const renderPresenterCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handlePresenterPress(item)}
      activeOpacity={0.8}
      className="flex-1 m-2 rounded-2xl overflow-hidden bg-card border-2 border-border"
      style={{ maxWidth: "46%" }}
    >
      {/* Image with Gradient */}
      <View className="aspect-[4/5] relative bg-zinc-100">
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="person" size={40} color="#5d6476" />
          </View>
        )}
        {/* Gradient Overlay */}
        <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Live Badge (Mock for now, or fetch from real-time status) */}
        {/* {item.is_live && (
                    <View className="absolute top-2 right-2 flex-row items-center gap-1 bg-red-600 px-2 py-1 rounded-full">
                        <View className="w-1.5 h-1.5 bg-white rounded-full" />
                        <Text className="text-white text-[10px] font-bold uppercase">Live</Text>
                    </View>
                )} */}
      </View>

      {/* Info */}
      <View className="p-3">
        <Text className="text-card-foreground font-bold text-base" numberOfLines={1}>
          {item.full_name || item.username}
        </Text>
        {/* Show bio or generic text */}
        <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
          {item.bio || "Presenter"}
        </Text>

        <View className="flex-row items-center mt-2">
          <Text className="text-primary text-xs font-bold">Profile</Text>
          <Ionicons
            name="arrow-forward"
            size={12}
            color="#334aff"
            style={{ marginLeft: 4 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#334aff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-foreground font-bold text-2xl font-display text-center mb-1">
          Meet the Team
        </Text>
        <Text className="text-muted-foreground text-sm text-center mb-6">
          Your favorite voices on Pie Radio
        </Text>
      </View>

      <FlatList
        data={presenters}
        renderItem={renderPresenterCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        ListEmptyComponent={
          <Text className="text-muted-foreground text-center mt-10 px-6">
            No presenters found.
          </Text>
        }
      />
    </SafeAreaView>
  );
}
