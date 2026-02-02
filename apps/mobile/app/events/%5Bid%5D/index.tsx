import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EVENTS } from '../../../lib/dummy-events';
import { EventStatusBadge } from '../../../components/events/EventStatusBadge';
import { LinearGradient } from 'expo-linear-gradient';

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const event = EVENTS.find(e => e.id === id);

    if (!event) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <Text>Event not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-background relative">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} stickyHeaderIndices={[0]}>

                {/* Back Button Overlay */}
                <View className="absolute top-0 left-0 right-0 z-10 px-4 pt-12 pb-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Hero Image */}
                <View className="relative w-full h-[45vh]">
                    <Image
                        source={{ uri: event.image }}
                        className="w-full h-full object-cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        className="absolute inset-0"
                    />

                    <View className="absolute bottom-8 left-4 right-4 space-y-2">
                        <View className="flex-row items-center space-x-2 mb-2">
                            <EventStatusBadge status={event.status} />
                            <View className="bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
                                <Text className="text-white text-xs font-bold uppercase">{event.category}</Text>
                            </View>
                        </View>

                        <Text className="text-3xl font-bold text-white font-display leading-tight shadow-md">
                            {event.title}
                        </Text>
                        <Text className="text-xl text-white/90 font-medium">
                            {event.artist}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View className="px-5 py-6 space-y-8 -mt-6 bg-background rounded-t-3xl min-h-screen">

                    {/* Quick Stats */}
                    <View className="flex-row bg-white p-4 rounded-xl shadow-sm border border-gray-100 justify-between">
                        <View className="flex-1 items-center border-r border-gray-100 pr-2">
                            <Ionicons name="calendar" size={20} color="#334aff" className="mb-1" />
                            <Text className="font-bold text-text text-center text-xs">
                                {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Text>
                            <Text className="text-gray-500 text-xs text-center">{event.time}</Text>
                        </View>
                        <View className="flex-1 items-center pl-2">
                            <Ionicons name="location" size={20} color="#334aff" className="mb-1" />
                            <Text className="font-bold text-text text-center text-xs" numberOfLines={1}>
                                {event.venue.name}
                            </Text>
                            <Text className="text-gray-500 text-xs text-center" numberOfLines={1}>{event.venue.city}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View>
                        <Text className="text-lg font-bold text-text mb-2 font-display">About</Text>
                        <Text className="text-gray-600 leading-6">{event.description}</Text>
                    </View>

                    {/* Venue Info */}
                    <View>
                        <Text className="text-lg font-bold text-text mb-2 font-display">Venue</Text>
                        <Text className="font-semibold text-text">{event.venue.name}</Text>
                        <Text className="text-gray-500 mb-2">{event.venue.address}</Text>
                        {event.venue.transportTips && (
                            <View className="flex-row items-start mt-2 bg-gray-50 p-3 rounded-lg">
                                <Ionicons name="bus" size={16} color="gray" style={{ marginTop: 2, marginRight: 6 }} />
                                <Text className="text-xs text-gray-500 flex-1">{event.venue.transportTips}</Text>
                            </View>
                        )}
                    </View>

                    {/* Ticket Tiers Preview */}
                    <View className="pb-8">
                        <Text className="text-lg font-bold text-text mb-2 font-display">Tickets</Text>
                        {event.ticketTiers.map(tier => (
                            <View key={tier.id} className="flex-row justify-between py-3 border-b border-gray-100">
                                <View>
                                    <Text className="font-medium text-text">{tier.name}</Text>
                                    {tier.available < 20 && tier.available > 0 && (
                                        <Text className="text-xs text-orange-500">Few left</Text>
                                    )}
                                </View>
                                <Text className="font-bold text-primary">{tier.currency}{tier.price}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Bottom Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 pb-8 flex-row items-center justify-between shadow-lg">
                <View>
                    <Text className="text-xs text-gray-500 uppercase font-bold">Price Range</Text>
                    <Text className="text-xl font-bold text-primary">
                        {event.priceRange.currency}{event.priceRange.min} - {event.priceRange.currency}{event.priceRange.max}
                    </Text>
                </View>
                <TouchableOpacity
                    className={`px-8 py-3 rounded-full ${event.status === 'soldout' ? 'bg-gray-400' : 'bg-primary'}`}
                    disabled={event.status === 'soldout'}
                >
                    <Text className="text-white font-bold font-display">
                        {event.status === 'soldout' ? 'Sold Out' : 'Buy Tickets'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
