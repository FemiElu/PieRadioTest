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
  { id: "alternative", label: "Alternative" },
  { id: "dancehall", label: "Dancehall" }
];

// Executive Leadership Team Data
const EXECUTIVES_DATA = [
  {
    id: "e1",
    full_name: "Miz",
    username: "miz",
    slug: "miz",
    avatar_url: null,
    bio: "Executive Director at Pie Radio.",
    is_live: false,
    presenter_meta: {
      category: "Executive Leadership",
      instagram_handle: "miz",
      twitter_handle: null,
    },
    shows: [],
  },
  {
    id: "e2",
    full_name: "Solomon",
    username: "solomon",
    slug: "solomon",
    avatar_url: null,
    bio: "Director of Operations.",
    is_live: false,
    presenter_meta: {
      category: "Executive Leadership",
      instagram_handle: null,
      twitter_handle: null,
    },
    shows: [],
  },
];

// Senior Leadership Team Data
const SENIOR_LEADERSHIP_DATA = [
  {
    id: "s1",
    full_name: "Jason The Costa",
    username: "jason-da-costa",
    slug: "jason-da-costa",
    avatar_url: null,
    bio: "Head of Content.",
    is_live: false,
    presenter_meta: {
      category: "Senior Leadership",
      instagram_handle: "jason-da-costa",
      twitter_handle: "jason-da-costa",
    },
    shows: [],
  },
  {
    id: "s2",
    full_name: "Adiva Destiny",
    username: "adiva-destiny",
    slug: "adiva-destiny",
    avatar_url: null,
    bio: "Head of Music.",
    is_live: false,
    presenter_meta: {
      category: "Senior Leadership",
      instagram_handle: "adiva-destiny",
      twitter_handle: "adiva-destiny",
    },
    shows: [],
  },
  {
    id: "s3",
    full_name: "Joel (TechOnit)",
    username: "joel-techonit",
    slug: "joel-techonit",
    avatar_url: "/assets/Boss_upload.webp",
    role: "Head Of Tech-Support",
    bio: "Head Of Tech-Support Presenter of the BigBass Show Pie Radios Flagship House Show.",
    is_live: false,
    presenter_meta: {
      category: "Senior Leadership",
      instagram_handle: null,
      twitter_handle: null,
    },
    shows: [],
  },
];

const PresenterCard = ({
  item,
  onPress,
  clickable = true,
}: {
  item: any;
  onPress?: () => void;
  clickable?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={clickable ? 0.8 : 1}
    disabled={!clickable}
    className="flex-1 m-2 rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-sm"
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
          <Ionicons name="person" size={40} color="#cbd5e1" />
        </View>
      )}
      {/* Gradient Overlay */}
      <View
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          backgroundColor: "transparent",
          // Note: Real linear gradient would need expo-linear-gradient, using semi-transparent overlay as fallback if not installed
          // But for now, let's keep it simple or assume standard Tailwind-ish overlay if supported by the environment
        }}
      />

      {/* Live Badge */}
      {item.is_live && (
        <View className="absolute top-2 right-2 flex-row items-center gap-1 bg-red-600 px-2 py-1 rounded-full">
          <View className="w-1.5 h-1.5 bg-white rounded-full" />
          <Text className="text-white text-[10px] font-bold uppercase">
            Live
          </Text>
        </View>
      )}
    </View>

    {/* Info */}
    <View className="p-3">
      <Text
        className="text-zinc-900 font-bold text-base"
        numberOfLines={1}
      >
        {item.full_name || item.username}
      </Text>
      {/* Show role/bio */}
      <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
        {item.role ||
          (Array.isArray(item.presenter_meta)
            ? item.presenter_meta[0]?.category
            : item.presenter_meta?.category) ||
          "Presenter"}
      </Text>

      {clickable && (
        <View className="flex-row items-center mt-2">
          <Text className="text-primary text-xs font-bold">Profile</Text>
          <Ionicons
            name="arrow-forward"
            size={12}
            color="#334aff"
            style={{ marginLeft: 4 }}
          />
        </View>
      )}
    </View>
  </TouchableOpacity>
);

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

  const filteredPresenters =
    selectedCategory === "all"
      ? presenters
      : presenters.filter((p) => {
        const cat = Array.isArray(p.presenter_meta)
          ? p.presenter_meta[0]?.category
          : p.presenter_meta?.category;
        return cat?.toLowerCase() === selectedCategory;
      });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <FlatList
        data={filteredPresenters}
        renderItem={({ item }) => (
          <PresenterCard
            item={item}
            onPress={() => handlePresenterPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        ListHeaderComponent={
          <>
            <View className="px-3 pt-4 pb-2">
              <Text className="text-foreground font-bold text-3xl font-display text-center mb-1">
                Meet the Team
              </Text>
              <Text className="text-muted-foreground text-base text-center mb-6">
                Your favorite voices on Pie Radio
              </Text>

              {/* Category Filter Pills */}
              <View className="flex-row flex-wrap justify-center gap-2 mb-8">
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full border-2 ${selectedCategory === cat.id
                      ? "bg-primary border-primary"
                      : "bg-white border-zinc-200"
                      }`}
                  >
                    <Text
                      className={`text-sm font-bold ${selectedCategory === cat.id
                        ? "text-white"
                        : "text-zinc-600"
                        }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-foreground font-bold text-2xl font-display mb-4 px-2">
                Our Presenters
              </Text>
            </View>
          </>
        }
        ListFooterComponent={
          <>
            {filteredPresenters.length === 0 && (
              <Text className="text-muted-foreground text-center my-10 px-6">
                No presenters found in this category.
              </Text>
            )}

            {/* Senior Leadership Section */}
            <View className="mt-12 mb-8 px-1">
              <Text className="text-foreground font-bold text-2xl font-display mb-6 px-2">
                Senior Leadership Team
              </Text>
              <View className="flex-row flex-wrap">
                {SENIOR_LEADERSHIP_DATA.map((item) => (
                  <View key={item.id} style={{ width: "50%" }}>
                    <PresenterCard item={item} clickable={false} />
                  </View>
                ))}
              </View>
            </View>

            {/* Executive Leadership Section */}
            <View className="mt-8 mb-20 px-1">
              <Text className="text-foreground font-bold text-2xl font-display mb-6 px-2">
                Executive Leadership Team
              </Text>
              <View className="flex-row flex-wrap">
                {EXECUTIVES_DATA.map((item) => (
                  <View key={item.id} style={{ width: "50%" }}>
                    <PresenterCard item={item} clickable={false} />
                  </View>
                ))}
              </View>
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
}
