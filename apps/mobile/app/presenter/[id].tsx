import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";

export default function PresenterDetailScreen() {
    const { id } = useLocalSearchParams(); // This can be slug or UUID
    const router = useRouter();
    const [presenter, setPresenter] = useState<any>(null);
    const [shows, setShows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    useEffect(() => {
        if (id) fetchPresenter();
    }, [id]);

    const fetchPresenter = async () => {
        try {
            // Try fetching by slug first
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('slug', id)
                .single();

            if (error || !data) {
                // Determine if ID is UUID
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
                if (isUuid) {
                    const { data: byId, error: byIdError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (!byIdError) data = byId;
                }
            }

            if (data) {
                setPresenter(data);
                fetchShows(data.id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchShows = async (presenterId: string) => {
        try {
            const { data, error } = await (supabase.from('presenter_shows' as any) as any)
                .select('id, title, description, cover_image_url, schedule, display_order')
                .eq('presenter_id', presenterId)
                .order('display_order', { ascending: true });

            if (error) throw error;
            setShows(data || []);
        } catch (error) {
            console.error("Error fetching presenter shows:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!name || !email || !message) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setSending(true);
        try {
            const { error } = await supabase
                .from('presenter_messages')
                .insert({
                    presenter_id: presenter.id,
                    sender_name: name,
                    sender_email: email,
                    message: message
                });

            if (error) throw error;

            setSentSuccess(true);
            setName("");
            setEmail("");
            setMessage("");

            // Optional: Revert success state after a few seconds
            // setTimeout(() => setSentSuccess(false), 3000);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator color="#E11D48" size="large" />
            </SafeAreaView>
        );
    }

    if (!presenter) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
                <Text className="text-foreground text-lg">Presenter not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 p-2">
                    <Text className="text-primary font-bold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View className="flex-1 relative">
                {/* Custom Header Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-4 left-4 z-50 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-lg"
                >
                    <Ionicons name="arrow-back" size={24} color="#141827" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                    {/* Header Image */}
                    <View className="h-96 relative">
                        {presenter.avatar_url ? (
                            <Image
                                source={{ uri: presenter.avatar_url }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full justify-center items-center bg-muted">
                                <Ionicons name="person" size={80} color="#5d6476" />
                            </View>
                        )}
                        <LinearGradient
                            colors={['transparent', '#f4f5f8']}
                            className="absolute bottom-0 left-0 right-0 h-40"
                        />
                        <View className="absolute bottom-6 left-6 right-6">
                            <Text className="text-foreground text-4xl font-bold font-display">
                                {presenter.full_name}
                            </Text>
                            <Text className="text-primary text-lg font-bold mt-1 uppercase tracking-wider">
                                {presenter.username ? `@${presenter.username}` : "Presenter"}
                            </Text>
                        </View>
                    </View>

                    {/* Bio Section */}
                    {presenter.bio && (
                        <View className="px-6 mb-8">
                            <View className="bg-card border border-border p-6 rounded-3xl">
                                <Text className="text-foreground font-bold text-xl font-display mb-3">About</Text>
                                <Text className="text-muted-foreground leading-relaxed text-base">
                                    {presenter.bio}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Shows Section */}
                    {shows.length > 0 && (
                        <View className="px-6 mb-12">
                            <View className="bg-card border border-border p-6 rounded-3xl">
                                <View className="flex-row items-center gap-3 mb-6">
                                    <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                                        <Ionicons name="radio" size={20} color="#334aff" />
                                    </View>
                                    <Text className="text-foreground text-xl font-bold font-display">
                                        Shows
                                    </Text>
                                </View>

                                <View className="space-y-4">
                                    {shows.map((show) => (
                                        <View
                                            key={show.id}
                                            className="bg-muted/30 border border-border rounded-2xl p-4 flex-row items-start gap-4"
                                        >
                                            {/* Show Image */}
                                            <View className="w-20 h-20 rounded-xl overflow-hidden bg-muted">
                                                {show.cover_image_url ? (
                                                    <Image
                                                        source={{ uri: show.cover_image_url }}
                                                        className="w-full h-full"
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <View className="w-full h-full items-center justify-center">
                                                        <Ionicons name="musical-notes" size={32} color="#5d6476" />
                                                    </View>
                                                )}
                                            </View>

                                            {/* Show Info */}
                                            <View className="flex-1">
                                                <Text className="text-foreground font-bold text-lg mb-1" numberOfLines={1}>
                                                    {show.title}
                                                </Text>
                                                {show.schedule && (
                                                    <View className="flex-row items-center gap-1.5 mb-2">
                                                        <Ionicons name="time-outline" size={14} color="#334aff" />
                                                        <Text className="text-primary text-sm font-bold">
                                                            {show.schedule}
                                                        </Text>
                                                    </View>
                                                )}
                                                {show.description && (
                                                    <Text className="text-muted-foreground text-xs leading-relaxed" numberOfLines={2}>
                                                        {show.description}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Contact Form Section */}
                    <View className="px-6 pb-12">
                        <View className="bg-card border border-white/5 rounded-3xl p-6">
                            <View className="flex-row items-center gap-3 mb-6">
                                <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                                    <Ionicons name="mail" size={20} color="#334aff" />
                                </View>
                                <Text className="text-foreground text-xl font-bold font-display">
                                    Send a Message
                                </Text>
                            </View>

                            {sentSuccess ? (
                                <View className="items-center justify-center py-8">
                                    <View className="w-16 h-16 bg-green-500/10 rounded-full items-center justify-center mb-4">
                                        <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
                                    </View>
                                    <Text className="text-foreground text-xl font-bold mb-2">Message Sent!</Text>
                                    <Text className="text-muted-foreground text-center mb-6">
                                        Thanks for reaching out to {presenter.full_name}.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setSentSuccess(false)}
                                        className="bg-card border border-border py-3 px-6 rounded-xl"
                                    >
                                        <Text className="text-foreground font-medium">Send Another</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                                    <View className="space-y-4">
                                        <View>
                                            <Text className="text-muted-foreground mb-2 ml-1 text-sm font-bold">Your Name</Text>
                                            <TextInput
                                                className="bg-muted/30 border border-border rounded-xl p-4 text-foreground"
                                                placeholder="Enter your name"
                                                placeholderTextColor="#5d6476"
                                                value={name}
                                                onChangeText={setName}
                                            />
                                        </View>

                                        <View>
                                            <Text className="text-muted-foreground mb-2 ml-1 text-sm font-bold">Email Address</Text>
                                            <TextInput
                                                className="bg-muted/30 border border-border rounded-xl p-4 text-foreground"
                                                placeholder="you@email.com"
                                                placeholderTextColor="#5d6476"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                value={email}
                                                onChangeText={setEmail}
                                            />
                                        </View>

                                        <View>
                                            <Text className="text-muted-foreground mb-2 ml-1 text-sm font-bold">Message</Text>
                                            <TextInput
                                                className="bg-muted/30 border border-border rounded-xl p-4 text-foreground h-32"
                                                placeholder={`Hi ${presenter.full_name}...`}
                                                placeholderTextColor="#5d6476"
                                                multiline
                                                textAlignVertical="top"
                                                value={message}
                                                onChangeText={setMessage}
                                            />
                                        </View>

                                        <TouchableOpacity
                                            onPress={handleSendMessage}
                                            disabled={sending}
                                            className="bg-primary rounded-xl py-4 items-center mt-2 flex-row justify-center gap-2 shadow-lg"
                                        >
                                            {sending ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <View className="flex-row items-center gap-2">
                                                    <Ionicons name="send" size={18} color="white" />
                                                    <Text className="text-white font-bold text-lg">Send Message</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </KeyboardAvoidingView>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
