import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { EventStatusBadge } from './EventStatusBadge';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '../../lib/events/types';
import { formatEventPrice } from '../../lib/events/types';
import { format } from 'date-fns';

interface EventCardProps {
    event: Event;
    variant?: "compact" | "default";
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/events/${event.id}`);
    };

    const formattedDate = format(new Date(event.start_time), "EEE, MMM d");
    const formattedTime = format(new Date(event.start_time), "HH:mm");

    return (
        <TouchableOpacity
            onPress={handlePress}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 mb-6"
            activeOpacity={0.8}
        >
            <View className="relative h-48 w-full">
                {event.cover_image_url ? (
                    <Image
                        source={{ uri: event.cover_image_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-full h-full bg-zinc-100 items-center justify-center">
                        <Ionicons name="calendar-outline" size={48} color="#e4e4e7" />
                    </View>
                )}
                <View className="absolute top-3 right-3">
                    <EventStatusBadge status={event.status} />
                </View>
            </View>

            <View className="p-4 space-y-3">
                <View>
                    <Text className="font-black text-xl text-[#141827] leading-tight font-display" numberOfLines={1}>
                        {event.title}
                    </Text>
                    <Text className="text-sm font-bold text-zinc-400 mt-0.5 lowercase tracking-tight" numberOfLines={1}>
                        {event.artist_name || "Pie Radio Event"}
                    </Text>
                </View>

                <View className="space-y-1.5">
                    <View className="flex-row items-center space-x-2">
                        <Ionicons name="time-outline" size={14} color="#334aff" />
                        <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            {formattedDate} • {formattedTime}
                        </Text>
                    </View>

                    <View className="flex-row items-center space-x-2">
                        <Ionicons name="location-outline" size={14} color="#334aff" />
                        <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest" numberOfLines={1}>
                            {event.venue_name || event.venue_city || event.location || "TBA"}
                        </Text>
                    </View>
                </View>

                {variant === "default" && (
                    <View className="pt-4 mt-1 border-t border-zinc-50 flex-row justify-between items-center">
                        <Text className="font-black text-[#334aff] uppercase tracking-tighter text-lg">
                            {formatEventPrice(event)}
                        </Text>
                        <View className="bg-[#334aff]/5 px-4 py-2 rounded-xl">
                            <Text className="text-[#334aff] text-[10px] font-black uppercase tracking-widest">Details</Text>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}
