import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";

export default function ProfileScreen() {
    const { user, profile, signOut, isAuthenticated } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        // Maybe refresh profile here?
        setTimeout(() => setRefreshing(false), 1000);
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
                <View className="mb-8 items-center">
                    <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
                        <Ionicons name="person" size={40} color="#E11D48" />
                    </View>
                    <Text className="text-white text-2xl font-bold mb-2">My Profile</Text>
                    <Text className="text-zinc-400 text-center">
                        Sign in to manage your account and access exclusive features.
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => router.push("/auth/login")}
                    className="w-full bg-primary py-4 rounded-xl items-center mb-4"
                >
                    <Text className="text-white font-bold text-lg">Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push("/auth/signup")}
                    className="w-full border border-zinc-700 py-4 rounded-xl items-center"
                >
                    <Text className="text-white font-bold text-lg">Create Account</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            >
                <View className="p-6">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-8">
                        <Text className="text-white text-3xl font-bold font-display">Profile</Text>
                        <TouchableOpacity onPress={() => signOut()} className="bg-red-500/10 px-4 py-2 rounded-full">
                            <Text className="text-red-500 font-bold">Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Card */}
                    <View className="bg-card border border-white/5 rounded-2xl p-6 mb-6">
                        <View className="flex-row items-center gap-4 mb-4">
                            <View className="w-16 h-16 bg-primary rounded-full items-center justify-center">
                                <Text className="text-white text-2xl font-bold">
                                    {(profile?.full_name?.[0] || profile?.username?.[0] || user?.email?.[0] || "?").toUpperCase()}
                                </Text>
                            </View>
                            <View>
                                <Text className="text-white text-xl font-bold">{profile?.full_name || "User"}</Text>
                                <Text className="text-zinc-400">@{profile?.username}</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-2">
                            <View className="bg-zinc-800 px-3 py-1 rounded-full">
                                <Text className="text-zinc-400 text-xs uppercase">{profile?.role || "Member"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Presenter Features */}
                    {(profile?.role === 'presenter' || profile?.role === 'admin') && (
                        <View className="mb-6">
                            <Text className="text-zinc-400 text-sm font-bold uppercase mb-4 tracking-wider">Presenter Tools</Text>

                            <TouchableOpacity
                                onPress={() => router.push("/dashboard/messages")}
                                className="bg-card border border-white/5 rounded-xl p-4 flex-row items-center justify-between mb-3"
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center">
                                        <Ionicons name="mail" size={20} color="#3b82f6" />
                                    </View>
                                    <Text className="text-white font-bold text-lg">Messages</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#52525b" />
                            </TouchableOpacity>

                            {/* Add more tools here later */}
                        </View>
                    )}

                    {/* General Settings */}
                    {/* <View>
                         <Text className="text-zinc-400 text-sm font-bold uppercase mb-4 tracking-wider">Settings</Text>
                         // ...
                    </View> */}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
