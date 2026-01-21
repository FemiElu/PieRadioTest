import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Filter } from "bad-words";
import { router } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { MobileHeader } from "../../components/mobile-header";

export default function InteractScreen() {
    const { user, profile, isAuthenticated, isLoading: authLoading } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    const filter = new Filter();

    useEffect(() => {
        // Fetch History
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('chat_messages')
                .select('*, profiles(username, full_name)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) {
                setMessages(data.reverse());
                setTimeout(() => flatListRef.current?.scrollToEnd(), 500);
            }
            setLoading(false);
        };

        fetchMessages();

        // Subscribe
        const channel = supabase
            .channel('mobile_chat')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                async (payload) => {
                    const newMsg = payload.new;
                    // Fetch profile
                    const { data: userData } = await supabase
                        .from('profiles')
                        .select('username, full_name')
                        .eq('id', newMsg.user_id)
                        .single();

                    const msgWithProfile = { ...newMsg, profiles: userData };
                    setMessages(prev => [...prev, msgWithProfile]);
                    setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSend = async () => {
        if (!newMessage.trim() || !user) return;

        if (filter.isProfane(newMessage)) {
            alert("Please keep the chat clean!");
            return;
        }

        const text = newMessage;
        setNewMessage("");

        const { error } = await supabase.from('chat_messages').insert({
            user_id: user.id,
            content: text
        } as any);

        if (error) {
            console.error(error);
            alert("Failed to send");
        }
    };

    const handleLoginPress = () => {
        router.push('/auth/login');
    };

    if (loading || authLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator color="#ef4444" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <MobileHeader title="Community Chat" />

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                renderItem={({ item }) => {
                    const isMe = user?.id === item.user_id;
                    return (
                        <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                            <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                                {!isMe && (
                                    <Text style={styles.messageUsername}>
                                        {item.profiles?.username || "Anon"}
                                    </Text>
                                )}
                                <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
                                    {item.content}
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <View style={styles.inputContainer}>
                    {isAuthenticated ? (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Type a message..."
                                placeholderTextColor="#71717a"
                                value={newMessage}
                                onChangeText={setNewMessage}
                            />
                            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                                <Ionicons name="send" size={20} color="white" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={styles.loginPrompt} onPress={handleLoginPress}>
                            <Ionicons name="log-in-outline" size={20} color="#dc2626" />
                            <Text style={styles.loginPromptText}>Sign in to join the chat</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '700',
    },
    userBadge: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    userBadgeText: {
        color: '#a1a1aa',
        fontSize: 12,
    },
    messageList: {
        padding: 16,
        paddingBottom: 100,
    },
    messageRow: {
        marginBottom: 12,
        flexDirection: 'row',
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        borderRadius: 12,
        padding: 12,
    },
    messageBubbleMe: {
        backgroundColor: '#dc2626',
    },
    messageBubbleOther: {
        backgroundColor: '#27272a',
    },
    messageUsername: {
        fontSize: 12,
        fontWeight: '600',
        color: '#a1a1aa',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 15,
    },
    messageTextMe: {
        color: '#ffffff',
    },
    messageTextOther: {
        color: '#e4e4e7',
    },
    inputContainer: {
        padding: 16,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: '#27272a',
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#27272a',
        color: '#ffffff',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
        fontSize: 15,
    },
    sendButton: {
        backgroundColor: '#dc2626',
        padding: 10,
        borderRadius: 20,
    },
    loginPrompt: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    loginPromptText: {
        color: '#dc2626',
        fontSize: 15,
        fontWeight: '500',
    },
});
