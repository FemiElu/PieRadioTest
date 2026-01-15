import { View, Text, Image, TouchableOpacity, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

// --- DUMMY DATA ---
const DAYS = [
    { name: "Mon", full: "Monday", date: "January 1", isCurrent: false },
    { name: "Tue", full: "Tuesday", date: "January 2", isCurrent: true }, // Current date
    { name: "Wed", full: "Wednesday", date: "January 3", isCurrent: false },
    { name: "Thu", full: "Thursday", date: "January 4", isCurrent: false },
    { name: "Fri", full: "Friday", date: "January 5", isCurrent: false },
    { name: "Sat", full: "Saturday", date: "January 6", isCurrent: false },
    { name: "Sun", full: "Sunday", date: "January 7", isCurrent: false },
];

const DUMMY_SCHEDULE = [
    {
        id: "1",
        startTime: "06:00",
        endTime: "10:00",
        title: "Morning Rise",
        host: "Alex Thompson",
        image: "https://images.unsplash.com/photo-1478737270239-2f52b27fa34e?w=800&q=80",
        description: "Start your day with the best mix of news, music, and entertainment. Wake up with energy and positivity.",
        isLive: false,
    },
    {
        id: "2",
        startTime: "10:00",
        endTime: "14:00",
        title: "Midday Mix",
        host: "Jamie Lee & Sarah Wilson",
        image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
        description: "The perfect soundtrack to your workday. Chart hits, classic throwbacks, and guest interviews with your favorite artists.",
        isLive: true, // Currently live
    },
    {
        id: "3",
        startTime: "14:00",
        endTime: "18:00",
        title: "Afternoon Sessions",
        host: "Marcus Chen",
        image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
        description: "Deep dives into History, exclusive sessions, and artist spotlights. Discover new music.",
        isLive: false,
    },
    {
        id: "4",
        startTime: "18:00",
        endTime: "20:00",
        title: "Drive Time",
        host: "Rachel Martinez",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
        description: "Your nonstop companion with the biggest hits, traffic updates, and conversations. Music without limits.",
        isLive: false,
    },
];

// Blinking Live Indicator Component
function BlinkingDot() {
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const blink = Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0.2,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        );
        blink.start();
        return () => blink.stop();
    }, [fadeAnim]);

    return (
        <Animated.View
            className="w-2 h-2 rounded-full bg-red-500"
            style={{ opacity: fadeAnim }}
        />
    );
}

export default function ScheduleScreen() {
    const currentDayIndex = DAYS.findIndex(d => d.isCurrent);
    const [activeDay, setActiveDay] = useState(currentDayIndex);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Compact Header */}
                <View className="px-5 pt-3 pb-4">
                    <Text className="text-white font-bold text-2xl font-display tracking-tight text-center mb-0.5">
                        Schedule
                    </Text>
                    <Text className="text-zinc-400 text-sm font-medium text-center">
                        Plan your listening. Never miss a show.
                    </Text>

                    {/* Date Dropdown Trigger */}
                    <TouchableOpacity
                        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex-row items-center justify-between bg-card border border-white/10 rounded-xl px-4 py-3 mt-4"
                    >
                        <Text className="text-white font-semibold text-base">
                            {DAYS[activeDay].full}, {DAYS[activeDay].date}
                        </Text>
                        <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="white" />
                    </TouchableOpacity>

                    {/* Dropdown Content */}
                    {isDropdownOpen && (
                        <View className="bg-card border border-white/10 rounded-xl mt-2 overflow-hidden">
                            {DAYS.map((day, index) => (
                                <TouchableOpacity
                                    key={day.name}
                                    onPress={() => {
                                        setActiveDay(index);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`px-4 py-3 ${day.isCurrent ? "bg-primary" : ""} ${index < DAYS.length - 1 ? "border-b border-white/5" : ""
                                        }`}
                                >
                                    <Text className={`font-semibold ${day.isCurrent ? "text-white" : "text-zinc-300"}`}>
                                        {day.full}, {day.date}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Schedule List - Horizontal Card Layout */}
                <View className="px-5 space-y-3">
                    {DUMMY_SCHEDULE.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.7}
                            className="flex-row items-center bg-card rounded-xl p-3 border border-white/5"
                        >
                            {/* Image / Play Button */}
                            <View className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                                <Image
                                    source={{ uri: item.image }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                                {/* Blinking Red Dot for Live */}
                                {item.isLive && (
                                    <View className="absolute top-1 left-1">
                                        <BlinkingDot />
                                    </View>
                                )}
                                {/* Centered Play Button */}
                                <View className="absolute inset-0 flex items-center justify-center">
                                    <View className={`w-7 h-7 rounded-full items-center justify-center ${item.isLive ? 'bg-primary' : 'bg-black/40'
                                        }`}>
                                        <Ionicons name="play" size={12} color="white" style={{ marginLeft: 2 }} />
                                    </View>
                                </View>
                            </View>

                            {/* Content */}
                            <View className="flex-1 ml-3">
                                {/* Time & Live Badge */}
                                <View className="flex-row items-center mb-1">
                                    <Text className="text-white font-semibold text-xs">
                                        {item.startTime} - {item.endTime}
                                    </Text>
                                    {item.isLive && (
                                        <View className="ml-2 bg-red-500 px-1.5 py-0.5 rounded">
                                            <Text className="text-white text-[9px] font-bold uppercase">LIVE</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Title */}
                                <Text className="text-white font-bold text-base leading-tight mb-0.5" numberOfLines={1}>
                                    {item.title}
                                </Text>

                                {/* Host */}
                                <Text className="text-zinc-500 font-medium text-xs mb-1" numberOfLines={1}>
                                    {item.host}
                                </Text>

                                {/* Description */}
                                <Text className="text-zinc-400 text-[11px] leading-snug" numberOfLines={2}>
                                    {item.description}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Bottom Spacer */}
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
