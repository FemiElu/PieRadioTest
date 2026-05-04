import { View, Text, TouchableOpacity, ActivityIndicator, Image, Dimensions, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMobileAudio } from "../../context/mobile-audio-context";
import { useSchedule } from "../../hooks/useSchedule";
import { useCurrentShow } from "../../hooks/useCurrentShow";
import { useRecentlyPlayed } from "../../hooks/useRecentlyPlayed";
import { Ionicons } from "@expo/vector-icons";
import { MobileHeader } from "../../components/mobile-header";
import { HomeFeaturedCard } from "../../components/HomeFeaturedCard";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { RequestSongModal } from "../../components/RequestSongModal";

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const { isPlaying, isLoading: audioLoading, togglePlay, currentTrack, isLiveStream, switchToLive } = useMobileAudio();
    const { currentShow, loading: showLoading } = useCurrentShow();
    const { recentlyPlayed, loading: recentLoading } = useRecentlyPlayed();
    const router = useRouter();

    // Get today's schedule for "Coming Up Next"
    const today = useMemo(() => {
        const d = new Date();
        return d;
    }, []);
    const { schedule, loading: scheduleLoading } = useSchedule(today);

    const insets = useSafeAreaInsets();

    // Determine upcoming shows (next 3)
    const upcomingShows = useMemo(() => {
        const now = new Date();
        return schedule
            .filter(show => new Date(show.start_time) > now)
            .slice(0, 3);
    }, [schedule]);

    // Format Title Case helper (simplified)
    const toTitleCase = (str: string) => {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const displayTitle = currentTrack?.title && currentTrack.title !== "Pie Radio Live"
        ? toTitleCase(currentTrack.title)
        : currentShow?.title || "Pie Radio Live";

    const displayArtist = currentTrack?.artist && currentTrack.artist !== "The Number One Station"
        ? toTitleCase(currentTrack.artist)
        : currentShow?.presenter_name || "The Number One Station";

    const heroImage = currentTrack?.artwork || currentShow?.image_url || null;

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ paddingTop: insets.top, backgroundColor: '#fff' }}>
                <MobileHeader />
            </View>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Hero Section */}
                <View className="relative w-full h-[550px] bg-[#0a0a0b]">
                    <Image
                        source={require("../../assets/hero-main.jpg")}
                        className="absolute inset-0 w-full h-full"
                        style={{ resizeMode: 'cover' }}
                    />
                    {/* Gradient Overlays - Subtle to protect branding */}
                    <View className="absolute inset-0 bg-black/40" />
                    <View className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    {/* Hero Content */}
                    <View className="absolute bottom-10 left-6 right-6">
                        <View className="flex-row items-center mb-6">
                            <View className="flex-row items-center bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
                                <View className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                                <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Live Now</Text>
                            </View>
                            <View className="h-[1px] w-6 bg-white/20 mx-2" />
                            <Text className="text-primary text-[10px] font-black uppercase tracking-widest">Now Playing</Text>
                        </View>

                        {/* Mini Artwork & Track Info Card */}
                        <View className="flex-row items-center bg-white/10 border border-white/10 p-3 rounded-2xl mb-8 backdrop-blur-md">
                            <View className="relative">
                                <Image
                                    source={heroImage ? { uri: heroImage } : require("../../assets/hero-main.jpg")}
                                    className="w-14 h-14 rounded-xl"
                                />
                                {isPlaying && (
                                    <View className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 border-2 border-zinc-900">
                                        <Ionicons name="stats-chart" size={10} color="white" />
                                    </View>
                                )}
                            </View>
                            <View className="flex-1 ml-4 pr-2">
                                <Text className="text-white text-base font-bold italic" numberOfLines={1}>
                                    {displayTitle}
                                </Text>
                                <Text className="text-zinc-400 text-xs font-medium" numberOfLines={1}>
                                    {displayArtist}
                                </Text>
                            </View>
                            <RequestSongModal />
                        </View>

                        <Text className="text-white text-5xl font-bold mb-4 leading-tight">
                            Real Music{"\n"}
                            <Text className="text-primary italic">Matters.</Text>
                        </Text>

                        <Text className="text-zinc-300 text-base font-medium mb-8 leading-relaxed">
                            Broadcasting the freshest hits and hottest talk 24/7.
                        </Text>

                        <View className="flex-row space-x-3">
                            <TouchableOpacity
                                onPress={isLiveStream ? togglePlay : switchToLive}
                                disabled={audioLoading}
                                className="flex-1 flex-row items-center justify-center bg-primary py-4 rounded-full shadow-lg active:opacity-80"
                            >
                                {audioLoading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name={(isLiveStream && isPlaying) ? "pause" : "radio"}
                                            size={20}
                                            color="white"
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text className="text-white font-bold text-base">
                                            {isLiveStream 
                                                ? (isPlaying ? "Pause Live" : "Listen Live")
                                                : "Return to Live"}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 flex-row items-center justify-center bg-white/10 border border-white/20 py-4 rounded-full active:opacity-80"
                                onPress={() => router.push("/(tabs)/schedule")}
                            >
                                <Ionicons name="calendar-outline" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text className="text-white font-bold text-base">Schedule</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Content Sections */}
                <View className="bg-white px-6 py-12 space-y-12">

                    {/* Latest from Pie Radio */}
                    <View>
                        <View className="flex-row justify-between items-end mb-6">
                            <View>
                                <Text className="text-zinc-900 text-2xl font-bold">Latest from Pie</Text>
                                <Text className="text-zinc-500 text-sm mt-1">Freshest music and urban news</Text>
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                            <HomeFeaturedCard
                                title="Pie Radio x Popeyes"
                                subtitle="Partnership"
                                description="The ultimate combo: crispy chicken meets the freshest beats."
                                imageSource={require("../../assets/popeye-3.jpeg")}
                                onPress={() => router.push('/popeyesuk')}
                                badge="Featured"
                            />
                            {/* Artist Spotlight — interactive when content is ready */}
                            <HomeFeaturedCard
                                title="Artist Spotlight"
                                subtitle="Spotlight"
                                description="Discover this month's featured artist breaking through the scene."
                                imageSource={require("../../assets/abstract-avatar.png")}
                                onPress={undefined}
                            />
                        </ScrollView>
                    </View>

                    {/* Upcoming Shows */}
                    <View>
                        <Text className="text-zinc-900 text-2xl font-bold mb-6">Coming Up Next</Text>
                        {scheduleLoading ? (
                            <ActivityIndicator color="#334aff" className="my-4" />
                        ) : upcomingShows.length > 0 ? (
                            <View className="space-y-4">
                                {upcomingShows.map((item, idx) => (
                                    <View key={item.id} className="flex-row items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                        <View className="w-14 h-14 rounded-xl bg-zinc-200 items-center justify-center mr-4">
                                            {item.image_url ? (
                                                <Image source={{ uri: item.image_url }} className="w-full h-full rounded-xl" />
                                            ) : (
                                                <Ionicons name="mic" size={28} color="#a1a1aa" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-zinc-900 font-bold text-lg" numberOfLines={1}>{item.title}</Text>
                                            <Text className="text-zinc-500 text-sm">
                                                {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.presenter?.full_name || "Pie Radio"}
                                            </Text>
                                        </View>
                                        <Ionicons name="play-circle" size={32} color="#334aff" />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text className="text-zinc-400 text-sm italic">No more shows scheduled for today.</Text>
                        )}
                    </View>

                    {/* Recently Played */}
                    <View>
                        <Text className="text-zinc-900 text-2xl font-bold mb-6">Recently Played</Text>
                        {recentLoading ? (
                            <ActivityIndicator color="#334aff" className="my-4" />
                        ) : recentlyPlayed.length > 0 ? (
                            <View className="space-y-5">
                                {recentlyPlayed.slice(0, 5).map((item, idx) => (
                                    <View key={idx} className="flex-row items-center justify-between">
                                        <View className="flex-row items-center flex-1 mr-4">
                                            <View className="w-12 h-12 rounded-xl bg-zinc-50 items-center justify-center mr-3 border border-zinc-100">
                                                <Ionicons name="musical-note" size={20} color="#a1a1aa" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-zinc-900 font-bold text-base" numberOfLines={1}>{item.title}</Text>
                                                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider" numberOfLines={1}>{item.artist}</Text>
                                            </View>
                                        </View>
                                        <View className="bg-zinc-100 px-3 py-1.5 rounded-lg">
                                            <Text className="text-zinc-500 text-[10px] font-bold uppercase">{item.time}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text className="text-zinc-400 text-sm italic">Nothing played recently.</Text>
                        )}
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}
