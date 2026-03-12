import { View, Text, Image, TouchableOpacity, ScrollView, Animated, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RNSafeAreaView);
import { useState, useEffect, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSchedule } from "../../hooks/useSchedule";

// Helper to format date like "Monday"
const formatDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long' });
const formatDayShort = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
const formatDatePart = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

// Helper to format time "HH:mm" in London Time
const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/London'
    });
};

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
    // Dynamic current time for live indicator
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);

    // Determine current date key (YYYY-MM-DD) to trigger re-calculation at midnight
    const dateKey = currentTime.toLocaleDateString('en-CA');

    // Generate next 7 days, refreshing if the date changes
    const days = useMemo(() => {
        const result = [];
        const baseDate = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + i);
            result.push({
                dateObj: d,
                name: formatDayShort(d),
                full: formatDayName(d),
                date: formatDatePart(d),
                isCurrent: i === 0
            });
        }
        return result;
    }, [dateKey]);

    const [activeDayIndex, setActiveDayIndex] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const activeDateObj = days[activeDayIndex].dateObj;
    const { schedule, loading: isLoading, error } = useSchedule(activeDateObj);

    // Merge consecutive shows with the same title, presenter, and image
    const mergedSchedule = useMemo(() => {
        if (!schedule.length) return [];

        const merged: (any)[] = [];

        schedule.forEach((show) => {
            const last = merged[merged.length - 1];

            // Check if this show is consecutive and identical to the last one
            const isConsecutive = last && last.end_time === show.start_time;
            const isIdentical =
                last &&
                last.title === show.title &&
                last.presenter_id === show.presenter_id &&
                last.image_url === show.image_url;

            if (isConsecutive && isIdentical) {
                // Extend the end time of the last merged show
                last.end_time = show.end_time;
                last.originalIds.push(show.id);
            } else {
                // Add as a new entry
                merged.push({
                    ...show,
                    originalIds: [show.id],
                });
            }
        });

        return merged;
    }, [schedule]);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 24 }}
            >
                {/* Compact Header */}
                <View className="px-5 pt-3 pb-4">
                    <Text className="text-white font-bold text-2xl   text-center mb-0.5">
                        Schedule
                    </Text>
                    <Text className="text-zinc-400 text-sm font-medium text-center">
                        Plan your listening. Never miss a show.
                    </Text>

                    {/* Date Dropdown Trigger */}
                    <TouchableOpacity
                        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex-row items-center justify-between bg-card border border-white/10 rounded-xl px-4 py-3 mt-4"
                        disabled={isLoading && schedule.length === 0}
                    >
                        <Text className="text-white font-semibold text-base">
                            {days[activeDayIndex].full}, {days[activeDayIndex].date}
                        </Text>
                        <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="white" />
                    </TouchableOpacity>

                    {/* Dropdown Content */}
                    {isDropdownOpen && (
                        <View className="bg-card border border-white/10 rounded-xl mt-2 overflow-hidden">
                            {days.map((day, index) => (
                                <TouchableOpacity
                                    key={day.name}
                                    onPress={() => {
                                        setActiveDayIndex(index);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`px-4 py-3 ${index === activeDayIndex ? "bg-primary" : ""} ${index < days.length - 1 ? "border-b border-white/5" : ""
                                        }`}
                                >
                                    <Text className={`font-semibold ${index === activeDayIndex ? "text-white" : "text-zinc-300"}`}>
                                        {day.full}, {day.date}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Content Area */}
                <View className="px-5 space-y-3">
                    {isLoading ? (
                        <View className="py-20 items-center justify-center">
                            <ActivityIndicator size="large" color="#E11D48" />
                            <Text className="text-zinc-500 mt-4 text-sm">Loading schedule...</Text>
                        </View>
                    ) : error ? (
                        <View className="py-10 items-center justify-center bg-card rounded-xl border border-white/5 p-6">
                            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
                            <Text className="text-white font-semibold mt-2 text-center">Failed to load schedule</Text>
                            <Text className="text-zinc-500 text-xs text-center mt-1">{error}</Text>
                        </View>
                    ) : schedule.length === 0 ? (
                        <View className="py-20 items-center justify-center bg-card rounded-xl border border-white/5">
                            <Ionicons name="calendar-outline" size={40} color="#3F3F46" />
                            <Text className="text-zinc-500 mt-4 font-medium">No shows scheduled for this day.</Text>
                        </View>
                    ) : (
                        mergedSchedule.map((item) => {
                            const showStart = new Date(item.start_time);
                            const showEnd = new Date(item.end_time);
                            const isLive = currentTime >= showStart && currentTime < showEnd;

                            return (
                                <TouchableOpacity
                                    key={item.originalIds.join("-")}
                                    activeOpacity={0.7}
                                    className={`flex-row items-center rounded-xl p-3 border overflow-hidden ${isLive ? 'bg-red-500/10 border-red-500/50 shadow-md' : 'bg-card border-white/5'
                                        }`}
                                >
                                    {/* Image / Play Button */}
                                    <View className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                                        <Image
                                            source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1478737270239-2f52b27fa34e?w=800&q=80' }} // Fallback image
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                        {/* Blinking Red Dot for Live */}
                                        {isLive && (
                                            <View className="absolute top-1 left-1">
                                                <BlinkingDot />
                                            </View>
                                        )}
                                        {/* Centered Play Button */}
                                        <View className="absolute inset-0 flex items-center justify-center">
                                            <View className={`w-7 h-7 rounded-full items-center justify-center ${isLive ? 'bg-primary' : 'bg-black/40'
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
                                                {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                            </Text>
                                            {isLive && (
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
                                            {item.presenter?.full_name || item.presenter?.username}
                                        </Text>

                                        {/* Description */}
                                        <Text className="text-zinc-400 text-[11px] leading-snug" numberOfLines={2}>
                                            {item.description || "Tune in for the best hits!"}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {/* Bottom Spacer */}
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
