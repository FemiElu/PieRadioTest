import { View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Event, EventCategory } from '../../lib/events/types';
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from '../../lib/events/types';
import { FeaturedCarousel } from '../../components/events/FeaturedCarousel';
import { EventCard } from '../../components/events/EventCard';

const CATEGORIES = [
    { id: "all", label: "All" },
    ...EVENT_CATEGORIES.map(cat => ({ id: cat, label: EVENT_CATEGORY_LABELS[cat] }))
];

export default function EventsScreen() {
    const [events, setEvents] = useState<Event[]>([]);
    const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = useCallback(async (refresh = false) => {
        if (!refresh) setIsLoading(true);
        else setIsRefreshing(true);
        
        try {
            // Fetch all upcoming events
            let query = supabase
                .from('events')
                .select('*')
                .eq('status', 'upcoming')
                .order('start_time', { ascending: true });

            if (activeCategory !== 'all') {
                query = query.eq('category', activeCategory);
            }

            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,artist_name.ilike.%${searchQuery}%,venue_name.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            
            setEvents(data || []);
            setFeaturedEvents((data || []).filter(e => e.is_featured));
        } catch (error) {
            console.error('[EventsScreen] fetch error:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [activeCategory, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, searchQuery ? 500 : 0);
        return () => clearTimeout(timer);
    }, [fetchData, activeCategory, searchQuery]);

    const onRefresh = () => fetchData(true);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#334AFF" />
                }
            >
                {/* Header */}
                <View className="mt-4 mb-8">
                    <Text className="text-4xl font-black font-display text-[#141827] uppercase tracking-tighter">
                        LIVE <Text className="text-[#334AFF] italic">EVENTS</Text>
                    </Text>
                    <Text className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-1">Discover shows and station events</Text>
                </View>

                {isLoading && !isRefreshing ? (
                    <View className="py-20 items-center justify-center">
                        <ActivityIndicator size="large" color="#334AFF" />
                        <Text className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-4">Syncing live shows...</Text>
                    </View>
                ) : (
                    <>
                        {/* Featured Carousel */}
                        {featuredEvents.length > 0 && <FeaturedCarousel events={featuredEvents} />}

                        {/* Search & Filter */}
                        <View className="mb-8">
                            <View className="flex-row items-center bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3.5 mb-5">
                                <Ionicons name="search" size={18} color="#a1a1aa" />
                                <TextInput
                                    placeholder="Search events, artists..."
                                    className="flex-1 ml-3 text-[#141827] font-bold text-sm"
                                    placeholderTextColor="#a1a1aa"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setActiveCategory(cat.id)}
                                        className={`px-5 py-2.5 rounded-xl mr-2.5 border ${activeCategory === cat.id ? 'bg-[#334AFF] border-[#334AFF]' : 'bg-white border-zinc-100'}`}
                                    >
                                        <Text className={`font-black uppercase tracking-widest text-[10px] ${activeCategory === cat.id ? 'text-white' : 'text-zinc-400'}`}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Events List */}
                        <View>
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-lg font-black font-display text-[#141827] uppercase tracking-tight">UPCOMING EVENTS</Text>
                                <Text className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{events.length} found</Text>
                            </View>

                            {events.map(event => (
                                <EventCard key={event.id} event={event} variant="default" />
                            ))}

                            {events.length === 0 && (
                                <View className="py-20 items-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                                    <Ionicons name="calendar-outline" size={48} color="#e4e4e7" />
                                    <Text className="text-zinc-400 font-bold mt-4">No events found matching your criteria.</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
