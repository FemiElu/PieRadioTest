import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Image } from "react-native";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default function ProfileScreen() {
    const { user, profile, signOut, isAuthenticated } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [artistProfile, setArtistProfile] = useState<any>(null);

    const fetchArtistProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('artist_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
        setArtistProfile(data);
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchArtistProfile();
        }
    }, [isAuthenticated]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchArtistProfile();
        setTimeout(() => setRefreshing(false), 1000);
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
                <View className="mb-8 items-center">
                    <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
                        <Ionicons name="person" size={40} color="#334aff" />
                    </View>
                    <Text className="text-foreground text-2xl font-bold mb-2">My Profile</Text>
                    <Text className="text-muted-foreground text-center px-2">
                        Sign in to manage your account and access exclusive features.
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => router.push("/auth/login")}
                    className="w-full bg-primary py-4 rounded-xl items-center mb-4"
                >
                    <Text className="text-primary-foreground font-bold text-lg">Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push("/auth/signup")}
                    className="w-full border-2 border-border py-4 rounded-xl items-center"
                >
                    <Text className="text-foreground font-bold text-lg">Create Account</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#334aff" />
                }
            >
                <View className="p-6">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-8">
                        <Text className="text-foreground text-3xl font-bold">Profile</Text>
                        <View className="flex-row gap-2">
                            <TouchableOpacity onPress={() => router.push("/profile/edit")} className="bg-primary/10 px-4 py-2 rounded-full">
                                <Text className="text-primary font-bold">Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => signOut()} className="bg-red-500/10 px-4 py-2 rounded-full">
                                <Text className="text-red-600 font-bold">Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Profile Card */}
                    <View className="bg-card border border-border rounded-2xl p-6 mb-6">
                        <View className="flex-row items-center gap-4 mb-4">
                            <View className="w-16 h-16 bg-primary rounded-full items-center justify-center overflow-hidden border-2 border-border">
                                {profile?.avatar_url ? (
                                    <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
                                ) : (
                                    <Text className="text-primary-foreground text-2xl font-bold">
                                        {(profile?.full_name?.[0] || profile?.username?.[0] || user?.email?.[0] || "?").toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <View>
                                <Text className="text-card-foreground text-xl font-bold">{profile?.full_name || "User"}</Text>
                                <Text className="text-muted-foreground">@{profile?.username}</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-2">
                            <View className="bg-muted px-3 py-1 rounded-full">
                                <Text className="text-muted-foreground text-xs font-semibold uppercase">
                                    {profile?.role || "Member"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <ProfileTabs user={user} profile={profile} artistProfile={artistProfile} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
