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
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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
                <Text className="text-white text-lg">Presenter not found</Text>
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
                    className="absolute top-4 left-4 z-50 w-10 h-10 bg-black/50 rounded-full items-center justify-center backdrop-blur-md"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
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
                            <LinearGradient
                                colors={['#18181b', '#000000']}
                                className="w-full h-full justify-center items-center"
                            >
                                <Ionicons name="person" size={80} color="#52525b" />
                            </LinearGradient>
                        )}
                        <LinearGradient
                            colors={['transparent', '#000000']}
                            className="absolute bottom-0 left-0 right-0 h-40"
                        />
                        <View className="absolute bottom-6 left-6 right-6">
                            <Text className="text-white text-4xl font-bold font-display shadow-sm">
                                {presenter.full_name}
                            </Text>
                            <Text className="text-primary text-lg font-medium mt-1">
                                {presenter.username ? `@${presenter.username}` : "Presenter"}
                            </Text>
                        </View>
                    </View>

                    {/* Bio Section */}
                    {presenter.bio && (
                        <View className="px-6 mb-8">
                            <Text className="text-zinc-400 leading-relaxed text-base">
                                {presenter.bio}
                            </Text>
                        </View>
                    )}

                    {/* Contact Form Section */}
                    <View className="px-6 pb-12">
                        <View className="bg-card border border-white/5 rounded-3xl p-6">
                            <View className="flex-row items-center gap-3 mb-6">
                                <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                                    <Ionicons name="mail" size={20} color="#E11D48" />
                                </View>
                                <Text className="text-white text-xl font-bold font-display">
                                    Send a Message
                                </Text>
                            </View>

                            {sentSuccess ? (
                                <View className="items-center justify-center py-8">
                                    <View className="w-16 h-16 bg-green-500/10 rounded-full items-center justify-center mb-4">
                                        <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
                                    </View>
                                    <Text className="text-white text-xl font-bold mb-2">Message Sent!</Text>
                                    <Text className="text-zinc-400 text-center mb-6">
                                        Thanks for reaching out to {presenter.full_name}.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setSentSuccess(false)}
                                        className="bg-card border border-white/10 py-3 px-6 rounded-xl"
                                    >
                                        <Text className="text-white font-medium">Send Another</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                                    <View className="space-y-4">
                                        <View>
                                            <Text className="text-zinc-400 mb-2 ml-1 text-sm font-medium">Your Name</Text>
                                            <TextInput
                                                className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-white"
                                                placeholder="Enter your name"
                                                placeholderTextColor="#52525b"
                                                value={name}
                                                onChangeText={setName}
                                            />
                                        </View>

                                        <View>
                                            <Text className="text-zinc-400 mb-2 ml-1 text-sm font-medium">Email Address</Text>
                                            <TextInput
                                                className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-white"
                                                placeholder="you@email.com"
                                                placeholderTextColor="#52525b"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                value={email}
                                                onChangeText={setEmail}
                                            />
                                        </View>

                                        <View>
                                            <Text className="text-zinc-400 mb-2 ml-1 text-sm font-medium">Message</Text>
                                            <TextInput
                                                className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-white h-32"
                                                placeholder={`Hi ${presenter.full_name}...`}
                                                placeholderTextColor="#52525b"
                                                multiline
                                                textAlignVertical="top"
                                                value={message}
                                                onChangeText={setMessage}
                                            />
                                        </View>

                                        <TouchableOpacity
                                            onPress={handleSendMessage}
                                            disabled={sending}
                                            className="bg-primary rounded-xl py-4 items-center mt-2 flex-row justify-center gap-2"
                                        >
                                            {sending ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <>
                                                    <Ionicons name="send" size={18} color="white" />
                                                    <Text className="text-white font-bold text-lg">Send Message</Text>
                                                </>
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
