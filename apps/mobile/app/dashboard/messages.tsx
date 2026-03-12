import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

export default function PresenterMessagesScreen() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchMessages();
    }, [user]);

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('presenter_messages')
                .select('*')
                .eq('presenter_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string, currentStatus: boolean) => {
        if (currentStatus) return;

        try {
            await supabase
                .from('presenter_messages')
                .update({ is_read: true })
                .eq('id', id);

            setMessages(curr => curr.map(m =>
                m.id === id ? { ...m, is_read: true } : m
            ));
        } catch (error) {
            console.error(error);
        }
    };

    const toggleExpand = (id: string, isRead: boolean) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            if (!isRead) markAsRead(id, isRead);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isExpanded = expandedId === item.id;

        return (
            <TouchableOpacity
                onPress={() => toggleExpand(item.id, item.is_read)}
                activeOpacity={0.7}
                className={`mb-3 rounded-xl border ${!item.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card border-white/5'} overflow-hidden`}
            >
                <View className="p-4">
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                                <Text className={`text-base ${!item.is_read ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                                    {item.sender_name}
                                </Text>
                                {!item.is_read && (
                                    <View className="w-2 h-2 rounded-full bg-primary" />
                                )}
                            </View>
                            <Text className="text-sm text-zinc-500">{item.sender_email}</Text>
                        </View>
                        <Text className="text-xs text-zinc-600">
                            {format(new Date(item.created_at), 'MMM d')}
                        </Text>
                    </View>

                    <Text
                        className="text-zinc-300 leading-relaxed"
                        numberOfLines={isExpanded ? undefined : 2}
                    >
                        {item.message}
                    </Text>

                    {isExpanded && (
                        <View className="mt-4 pt-4 border-t border-white/5 flex-row justify-end gap-3">
                            <TouchableOpacity
                                onPress={() => Linking.openURL(`mailto:${item.sender_email}?subject=Re: Message from Pie Radio listener`)}
                                className="bg-white/5 px-4 py-2 rounded-lg flex-row items-center gap-2 border border-white/10"
                            >
                                <Ionicons name="arrow-undo" size={16} color="white" />
                                <Text className="text-white font-medium text-sm">Reply</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator color="#E11D48" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <Stack.Screen options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
                headerTitle: "My Messages",
                headerBackTitle: "Back",
            }} />

            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <View className="w-16 h-16 bg-zinc-900 rounded-full items-center justify-center mb-4">
                            <Ionicons name="mail-open" size={32} color="#52525b" />
                        </View>
                        <Text className="text-zinc-500 text-lg font-medium">No messages yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
