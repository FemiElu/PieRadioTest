import { View, Text, Image, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Category filter options
const CATEGORIES = [
    { id: "all", label: "Main Station" },
    { id: "80s", label: "80s Hits" },
    { id: "afrobeats", label: "Afrobeats" },
];

// Dummy presenter data
const DUMMY_PRESENTERS = [
    {
        id: "1",
        full_name: "Alex Thompson",
        slug: "alex-thompson",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        show: "Morning Rise",
        schedule: "Weekdays 6-10am",
        is_live: false,
        category: "all",
    },
    {
        id: "2",
        full_name: "Sarah Wilson",
        slug: "sarah-wilson",
        avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        show: "Midday Mix",
        schedule: "Weekdays 10am-2pm",
        is_live: true,
        category: "all",
    },
    {
        id: "3",
        full_name: "Jamie Lee",
        slug: "jamie-lee",
        avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
        show: "Drive Time",
        schedule: "Weekdays 4-7pm",
        is_live: false,
        category: "all",
    },
    {
        id: "4",
        full_name: "Rachel Martinez",
        slug: "rachel-martinez",
        avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
        show: "Evening Vibes",
        schedule: "Weekdays 7-10pm",
        is_live: false,
        category: "all",
    },
];

export default function PresentersScreen() {
    const [selectedCategory, setSelectedCategory] = useState("all");

    const filteredPresenters = selectedCategory === "all"
        ? DUMMY_PRESENTERS
        : DUMMY_PRESENTERS.filter(p => p.category === selectedCategory);

    const handlePresenterPress = (slug: string) => {
        // Navigate to presenter detail - can be implemented later
        console.log("Navigate to presenter:", slug);
    };

    const renderPresenterCard = ({ item }: { item: typeof DUMMY_PRESENTERS[0] }) => (
        <TouchableOpacity
            onPress={() => handlePresenterPress(item.slug)}
            activeOpacity={0.8}
            className="flex-1 m-2 rounded-2xl overflow-hidden bg-card border border-white/5"
        >
            {/* Image with Gradient */}
            <View className="aspect-[4/5] relative">
                <Image
                    source={{ uri: item.avatar_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
                {/* Gradient Overlay */}
                <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Live Badge */}
                {item.is_live && (
                    <View className="absolute top-2 right-2 flex-row items-center gap-1 bg-red-600 px-2 py-1 rounded-full">
                        <View className="w-1.5 h-1.5 bg-white rounded-full" />
                        <Text className="text-white text-[10px] font-bold uppercase">Live</Text>
                    </View>
                )}
            </View>

            {/* Info */}
            <View className="p-3">
                <Text className="text-white font-bold text-base" numberOfLines={1}>
                    {item.full_name}
                </Text>
                <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                    {item.show} • {item.schedule}
                </Text>
                <View className="flex-row items-center mt-2">
                    <Text className="text-primary text-xs font-bold">More</Text>
                    <Ionicons name="arrow-forward" size={12} color="#334aff" style={{ marginLeft: 4 }} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View className="px-5 pt-4 pb-2">
                    <Text className="text-white font-bold text-2xl font-display text-center mb-1">
                        Meet the Pie Radio Team
                    </Text>
                    <Text className="text-zinc-400 text-sm text-center mb-4">
                        Your favorite voices, bringing you the best in music and entertainment
                    </Text>

                    {/* Category Pills */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 4 }}
                        className="mb-4"
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-full mr-2 border ${selectedCategory === cat.id
                                        ? "bg-primary border-primary"
                                        : "bg-card border-white/10"
                                    }`}
                            >
                                <Text
                                    className={`font-bold text-sm ${selectedCategory === cat.id ? "text-white" : "text-zinc-300"
                                        }`}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Presenter Grid */}
                <View className="px-3">
                    <FlatList
                        data={filteredPresenters}
                        renderItem={renderPresenterCard}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        scrollEnabled={false}
                        contentContainerStyle={{ paddingBottom: 16 }}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
