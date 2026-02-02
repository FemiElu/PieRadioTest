import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { EventStatusBadge } from './EventStatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../../lib/dummy-events';

interface EventCardProps {
    event: Event;
    variant?: "compact" | "default";
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/events/${event.id}`);
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 mb-4"
            activeOpacity={0.8}
        >
            <View className="relative h-40 w-full">
                <Image
                    source={{ uri: event.image }}
                    className="w-full h-full object-cover"
                />
                <View className="absolute top-3 right-3">
                    <EventStatusBadge status={event.status} />
                </View>
            </View>

            <View className="p-4 space-y-2">
                <Text className="font-bold text-lg text-text leading-tight font-display" numberOfLines={1}>
                    {event.title}
                </Text>
                <Text className="text-sm text-gray-500 mb-1" numberOfLines={1}>{event.artist}</Text>

                <View className="flex-row items-center space-x-1">
                    <Ionicons name="calendar-outline" size={14} color="#334aff" />
                    <Text className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString()} • {event.time}
                    </Text>
                </View>

                <View className="flex-row items-center space-x-1">
                    <Ionicons name="location-outline" size={14} color="#334aff" />
                    <Text className="text-xs text-gray-500" numberOfLines={1}>{event.venue.name}</Text>
                </View>

                {variant === "default" && (
                    <View className="pt-3 mt-1 border-t border-border/20 flex-row justify-between items-center">
                        <Text className="font-bold text-primary">
                            {event.priceRange.currency}{event.priceRange.min} - {event.priceRange.currency}{event.priceRange.max}
                        </Text>
                        <View className="bg-primary/10 px-3 py-1.5 rounded-full">
                            <Text className="text-primary text-xs font-semibold">Details</Text>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}
