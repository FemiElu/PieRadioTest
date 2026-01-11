import { View, Text, FlatList, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@packages/types";
import { MobileHeader } from "../../components/mobile-header";

// Initialize Supabase Client (Mobile doesn't use SSR helpers usually, just direct client)
// We need the URL and Key. In Expo we use process.env.EXPO_PUBLIC_...
// Ensure .env is set up or hardcode for now (User Rule: NO SECRETS). 
// I will use placeholders and assume user will set EXPO_PUBLIC_SUPABASE_URL.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

type ScheduleSlot = Database["public"]["Tables"]["schedule_slots"]["Row"] & {
    shows: Database["public"]["Tables"]["shows"]["Row"] | null;
};

export default function ScheduleScreen() {
    const [slots, setSlots] = useState<ScheduleSlot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            // Fetch today's schedule
            const today = new Date().getDay();

            const { data, error } = await supabase
                .from("schedule_slots")
                .select(`
          *,
          shows (*)
        `)
                .eq("day_of_week", today)
                .order("start_time");

            if (error) {
                console.error(error);
            } else {
                setSlots(data || []);
            }
            setLoading(false);
        };

        fetchSchedule();
    }, []);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#E11D48" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <MobileHeader title="Schedule" />
            <FlatList
                data={slots}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListHeaderComponent={
                    <Text className="text-text font-bold text-2xl mb-6">Today's Schedule</Text>
                }
                renderItem={({ item }) => (
                    <View className="flex-row mb-6 bg-card rounded-xl overflow-hidden border border-zinc-800">
                        <View className="w-24 h-24 bg-zinc-800">
                            {item.shows?.cover_image_url && (
                                <Image
                                    source={{ uri: item.shows.cover_image_url }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            )}
                        </View>
                        <View className="flex-1 p-3 justify-center">
                            <Text className="text-primary font-bold text-xs mb-1">
                                {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                            </Text>
                            <Text className="text-white font-bold text-lg leading-tight mb-1">{item.shows?.title}</Text>
                            <Text className="text-zinc-500 text-xs">{item.shows?.genre}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Text className="text-zinc-500 text-center mt-10">No shows scheduled for today.</Text>
                }
            />
        </SafeAreaView>
    );
}
