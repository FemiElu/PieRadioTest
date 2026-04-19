import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Event } from '../../../lib/events/types';
import { formatEventPrice, EVENT_CATEGORY_LABELS } from '../../../lib/events/types';
import { EventStatusBadge } from '../../../components/events/EventStatusBadge';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchEvent() {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                setEvent(data as Event);
            } catch (error) {
                console.error('[EventDetailScreen] fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchEvent();
    }, [id]);

    const handleGetTickets = () => {
        if (event?.ticket_url) {
            Linking.openURL(event.ticket_url).catch(err => console.error("Couldn't load page", err));
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#334AFF" />
            </SafeAreaView>
        );
    }

    if (!event) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
                <Ionicons name="alert-circle-outline" size={64} color="#e4e4e7" />
                <Text className="text-xl font-black font-display text-[#141827] mt-4">Event Not Found</Text>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="mt-6 bg-[#334AFF] px-8 py-3 rounded-2xl"
                >
                    <Text className="text-white font-black uppercase tracking-widest text-xs">Back to Events</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const formattedDate = format(new Date(event.start_time), "EEEE, MMMM do, yyyy");
    const formattedTime = format(new Date(event.start_time), "HH:mm");

    return (
        <View className="flex-1 bg-white relative">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                {/* Hero section */}
                <View className="relative w-full h-[55vh]">
                    {event.cover_image_url ? (
                        <Image
                            source={{ uri: event.cover_image_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full bg-zinc-100 items-center justify-center">
                            <Ionicons name="calendar-outline" size={64} color="#e4e4e7" />
                        </View>
                    )}
                    <LinearGradient
                        colors={['transparent', 'rgba(20,24,39,0.95)']}
                        className="absolute inset-0"
                    />

                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-5 w-10 h-10 bg-black/20 backdrop-blur-md rounded-2xl items-center justify-center border border-white/10"
                    >
                        <Ionicons name="arrow-back" size={20} color="white" />
                    </TouchableOpacity>

                    <View className="absolute bottom-8 left-5 right-5 space-y-4">
                        <View className="flex-row items-center space-x-3">
                            <EventStatusBadge status={event.status} />
                            <View className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                                <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                                    {EVENT_CATEGORY_LABELS[event.category]}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-4xl font-black text-white font-display leading-[0.95] tracking-tighter shadow-sm">
                            {event.title}
                        </Text>
                        {event.artist_name && (
                            <Text className="text-xl text-[#334AFF] font-black italic uppercase tracking-tight">
                                {event.artist_name}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Content info */}
                <View className="px-5 py-8 space-y-10">
                    <View className="flex-row space-x-4">
                        <View className="flex-1 bg-zinc-50 p-5 rounded-3xl border border-zinc-100">
                           <View className="w-8 h-8 rounded-xl bg-[#334AFF]/10 items-center justify-center mb-3">
                               <Ionicons name="calendar" size={16} color="#334AFF" />
                           </View>
                           <Text className="text-zinc-400 font-black uppercase tracking-widest text-[9px] mb-1">Date & Time</Text>
                           <Text className="font-black text-[#141827] text-sm leading-tight">{formattedDate}</Text>
                           <Text className="text-zinc-500 font-bold text-xs mt-1">Starts {formattedTime}</Text>
                        </View>

                        <View className="flex-1 bg-zinc-50 p-5 rounded-3xl border border-zinc-100">
                           <View className="w-8 h-8 rounded-xl bg-[#334AFF]/10 items-center justify-center mb-3">
                               <Ionicons name="location" size={16} color="#334AFF" />
                           </View>
                           <Text className="text-zinc-400 font-black uppercase tracking-widest text-[9px] mb-1">Venue</Text>
                           <Text className="font-black text-[#141827] text-sm leading-tight">{event.venue_name || event.location || "TBA"}</Text>
                           <Text className="text-zinc-500 font-bold text-xs mt-1">{event.venue_city}</Text>
                        </View>
                    </View>

                    {event.description && (
                         <View className="space-y-4">
                            <View className="flex-row items-center space-x-3">
                                <View className="h-[2px] w-6 bg-[#334AFF]" />
                                <Text className="text-lg font-black font-display text-[#141827] uppercase tracking-tighter">About Event</Text>
                            </View>
                            <Text className="text-zinc-500 font-bold leading-6 text-sm">{event.description}</Text>
                        </View>
                    )}

                    <View className="space-y-4">
                         <View className="flex-row items-center space-x-3">
                            <View className="h-[2px] w-6 bg-[#334AFF]" />
                            <Text className="text-lg font-black font-display text-[#141827] uppercase tracking-tighter">Venue Info</Text>
                        </View>
                        <View className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                             <Text className="font-black text-[#141827] uppercase tracking-tight mb-1">{event.venue_name || "TBA"}</Text>
                             <Text className="text-zinc-500 font-bold text-xs mb-4">{event.venue_address || "Address TBA"}</Text>
                             
                             <TouchableOpacity className="flex-row items-center space-x-2">
                                <Ionicons name="navigate-circle-outline" size={18} color="#334AFF" />
                                <Text className="text-[#334AFF] font-black uppercase tracking-widest text-[10px]">Get Directions</Text>
                             </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom cta bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 pt-5 pb-10 flex-row items-center justify-between shadow-2xl">
                <View className="flex-1">
                    <Text className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-1">Price Range</Text>
                    <Text className="text-2xl font-black text-[#141827] tracking-tighter">
                        {formatEventPrice(event)}
                    </Text>
                </View>
                
                {event.ticket_url ? (
                    <TouchableOpacity
                        onPress={handleGetTickets}
                        className="bg-[#334AFF] px-8 py-4 rounded-2xl flex-row items-center space-x-3 shadow-lg shadow-[#334AFF]/30 active:scale-95 transition-all"
                        disabled={event.status === 'cancelled' || event.status === 'past'}
                    >
                        <Text className="text-white font-black uppercase tracking-widest text-xs">
                            Get Tickets
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color="white" />
                    </TouchableOpacity>
                ) : (
                    <View className="bg-zinc-100 px-8 py-4 rounded-2xl items-center justify-center opacity-50">
                        <Text className="text-zinc-400 font-black uppercase tracking-widest text-xs">
                            {event.status === 'cancelled' ? 'Cancelled' : 'Unavailable'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
