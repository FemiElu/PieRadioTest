import { View, Text, FlatList, Dimensions } from 'react-native';
import type { Event } from '../../lib/events/types';
import { EventCard } from './EventCard';

interface FeaturedCarouselProps {
    events: Event[];
}

export function FeaturedCarousel({ events }: FeaturedCarouselProps) {
    const { width } = Dimensions.get('window');
    const ITEM_WIDTH = width * 0.85;

    return (
        <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4 px-1">
                <Text className="text-xl font-bold text-text font-display">Featured Events</Text>
            </View>

            <FlatList
                data={events}
                renderItem={({ item }) => (
                    <View style={{ width: ITEM_WIDTH }} className="mr-4">
                        <EventCard event={item} />
                    </View>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={ITEM_WIDTH + 16} // Width + margin
                contentContainerStyle={{ paddingHorizontal: 4 }}
            />
        </View>
    );
}
