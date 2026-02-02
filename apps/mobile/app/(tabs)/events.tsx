import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { EVENTS } from '../../lib/dummy-events';
import { FeaturedCarousel } from '../../components/events/FeaturedCarousel';
import { QuickActions } from '../../components/events/QuickActions';
import { EventCard } from '../../components/events/EventCard';

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "pop", label: "Pop" },
    { id: "jazz", label: "Jazz" },
    { id: "electronic", label: "Electronic" },
    { id: "rock", label: "Rock" },
    { id: "hiphop", label: "Hip Hop" },
];

export default function EventsScreen() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const featuredEvents = EVENTS.filter(e => e.isFeatured);

    const filteredEvents = EVENTS.filter(e => {
        const matchesCategory = activeCategory === 'all' || e.category === activeCategory;
        const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.artist.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView className="flex-1 px-4 pt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View className="mb-6">
                    <Text className="text-3xl font-bold font-display text-text">Live Events</Text>
                    <Text className="text-gray-500 mt-1">Discover shows and station events</Text>
                </View>

                {/* Featured Carousel */}
                <FeaturedCarousel events={featuredEvents} />

                {/* Quick Actions */}
                <QuickActions />

                {/* Search & Filter */}
                <View className="mb-6">
                    <View className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-2.5 mb-4">
                        <Ionicons name="search" size={20} color="#9ca3af" />
                        <TextInput
                            placeholder="Search events, artists..."
                            className="flex-1 ml-2 text-text font-medium"
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setActiveCategory(cat.id)}
                                className={`px-4 py-2 rounded-full mr-2 ${activeCategory === cat.id ? 'bg-primary' : 'bg-white border border-gray-200'}`}
                            >
                                <Text className={`font-medium ${activeCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Events List */}
                <View>
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-text">Upcoming Events</Text>
                        <Text className="text-xs text-gray-500">{filteredEvents.length} events found</Text>
                    </View>

                    {filteredEvents.map(event => (
                        <EventCard key={event.id} event={event} variant="default" />
                    ))}

                    {filteredEvents.length === 0 && (
                        <View className="py-10 items-center">
                            <Text className="text-gray-500">No events found matching your criteria.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
