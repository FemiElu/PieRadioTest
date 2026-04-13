import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RNSafeAreaView);
import { useState, useEffect, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSchedule, type ScheduleItem } from "../../hooks/useSchedule";
import { useMobileAudio } from "../../context/mobile-audio-context";

const SCHEDULE_PLACEHOLDER_IMAGE = require("@/assets/pieRadioShowImg.webp");

function ScheduleShowThumbnail({ imageUrl }: { imageUrl: string | null }) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [imageUrl]);

  const trimmed = imageUrl?.trim() ?? "";
  const useLocal = loadFailed || !trimmed;

  return (
    <Image
      source={useLocal ? SCHEDULE_PLACEHOLDER_IMAGE : { uri: trimmed }}
      onError={() => setLoadFailed(true)}
      className="w-full h-full"
      resizeMode="cover"
    />
  );
}

// Helper to format date like "Monday"
const formatDayName = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "long" });
const formatDayShort = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });
const formatDatePart = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", day: "numeric" });

// Helper to format time "HH:mm" in London Time
const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
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
      ]),
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
  const { isPlaying, isLoading: isAudioLoading, togglePlay } = useMobileAudio();
  // Dynamic current time for live indicator
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Determine current date key (YYYY-MM-DD) to trigger re-calculation at midnight
  const dateKey = currentTime.toLocaleDateString("en-CA");

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
        isCurrent: i === 0,
      });
    }
    return result;
  }, [dateKey]);

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeDateObj = days[activeDayIndex].dateObj;
  const { schedule, loading: isLoading, error, refresh } = useSchedule(activeDateObj);

  // Merge consecutive shows with the same title, presenter, and image
  const mergedSchedule = useMemo(() => {
    if (!schedule.length) return [];

    const merged: Array<ScheduleItem & { originalIds: string[] }> = [];

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
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && schedule.length > 0}
            onRefresh={refresh}
            tintColor="#334aff"
          />
        }
      >
        {/* Compact Header */}
        <View className="px-5 pt-3 pb-4">
          <Text className="text-foreground font-bold text-2xl text-center mb-0.5">
            Schedule
          </Text>
          <Text className="text-muted-foreground text-sm font-medium text-center">
            Plan your listening. Never miss a show.
          </Text>

          {/* Date Dropdown Trigger */}
          <TouchableOpacity
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mt-4"
            disabled={isLoading && schedule.length === 0}
          >
            <Text className="text-card-foreground font-semibold text-base">
              {days[activeDayIndex].full}, {days[activeDayIndex].date}
            </Text>
            <Ionicons
              name={isDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#5d6476"
            />
          </TouchableOpacity>

          {/* Dropdown Content */}
          {isDropdownOpen && (
            <View className="bg-card border border-border rounded-xl mt-2 overflow-hidden">
              {days.map((day, index) => (
                <TouchableOpacity
                  key={day.name}
                  onPress={() => {
                    setActiveDayIndex(index);
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-3 ${index === activeDayIndex ? "bg-primary" : ""} ${
                    index < days.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <Text
                    className={`font-semibold ${index === activeDayIndex ? "text-primary-foreground" : "text-foreground"}`}
                  >
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
              <ActivityIndicator size="large" color="#334aff" />
              <Text className="text-muted-foreground mt-4 text-sm">
                Loading schedule...
              </Text>
            </View>
          ) : error ? (
            <View className="py-10 items-center justify-center rounded-2xl border-2 border-red-100 bg-red-50/80 p-6">
              <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
              <Text className="text-red-600 font-semibold mt-2 text-center">
                Failed to load schedule
              </Text>
              <Text className="text-red-400 text-xs text-center mt-1">
                {error}
              </Text>
            </View>
          ) : schedule.length === 0 ? (
            <View className="py-20 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50">
              <Ionicons name="calendar-outline" size={40} color="#5d6476" />
              <Text className="text-muted-foreground mt-4 font-medium text-center px-6">
                No shows scheduled for this day.
              </Text>
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
                  className={`flex-row items-center rounded-2xl p-4 border-2 overflow-hidden ${
                    isLive
                      ? "bg-red-50/90 border-red-400/60 shadow-md"
                      : "bg-card border-border"
                  }`}
                >
                  {/* Image / Play Icon */}
                  <View className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                    <ScheduleShowThumbnail imageUrl={item.image_url} />
                    {/* Blinking Red Dot for Live */}
                    {isLive && (
                      <View className="absolute top-1 left-1">
                        <BlinkingDot />
                      </View>
                    )}
                    {/* Centered Play Button */}
                    <View className="absolute inset-0 flex items-center justify-center">
                      <View
                        className={`w-7 h-7 rounded-full items-center justify-center ${
                          isLive ? "bg-primary" : "bg-black/40"
                        }`}
                      >
                        <Ionicons
                          name="play"
                          size={12}
                          color="white"
                          style={{ marginLeft: 2 }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Content */}
                  <View className="flex-1 ml-3">
                    {/* Time & Live Badge */}
                    <View className="flex-row items-start justify-between mb-1">
                      <View className="flex-row items-center flex-1 pr-2">
                        <Text className="text-foreground font-semibold text-xs">
                          {formatTime(item.start_time)} -{" "}
                          {formatTime(item.end_time)}
                        </Text>
                        {isLive && (
                          <View className="ml-2 bg-red-500 px-1.5 py-0.5 rounded">
                            <Text className="text-white text-[9px] font-bold uppercase">
                              LIVE
                            </Text>
                          </View>
                        )}
                      </View>

                      {isLive && (
                        <TouchableOpacity
                          onPress={togglePlay}
                          disabled={isAudioLoading}
                          accessibilityRole="button"
                          accessibilityLabel={isPlaying ? "Pause Stream" : "Listen Live"}
                          className="self-start"
                        >
                          <View className="flex-row items-center bg-primary px-2.5 py-1 rounded-full min-h-7">
                            {isAudioLoading ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                <Ionicons
                                  name={isPlaying ? "pause" : "play"}
                                  size={12}
                                  color="white"
                                  style={{ marginRight: 4 }}
                                />
                                <Text className="text-white text-[10px] font-bold">
                                  {isPlaying ? "Pause" : "Listen"}
                                </Text>
                              </>
                            )}
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Title */}
                    <Text
                      className="text-card-foreground font-bold text-base leading-tight mb-0.5"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>

                    {/* Host */}
                    <Text
                      className="text-muted-foreground font-semibold text-xs mb-1"
                      numberOfLines={1}
                    >
                      {item.presenter?.full_name || item.presenter?.username}
                    </Text>

                    {/* Description */}
                    <Text className="text-zinc-600 text-[11px] leading-snug" numberOfLines={2}>
                      {item.description || ""}
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
