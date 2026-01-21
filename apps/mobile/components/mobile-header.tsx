import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

interface MobileHeaderProps {
    title?: string;
}

export function MobileHeader({ title = "PIE RADIO" }: MobileHeaderProps) {
    const { user, profile, isAuthenticated, signOut } = useAuth();
    const router = useRouter();

    const handleUserPress = () => {
        if (isAuthenticated) {
            Alert.alert(
                profile?.full_name || "User",
                profile?.email || user?.email || "",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Log Out",
                        style: "destructive",
                        onPress: async () => {
                            await signOut();
                        }
                    }
                ]
            );
        } else {
            router.push("/auth/login");
        }
    };

    return (
        <View className="flex-row items-center justify-between px-4 py-3 bg-background border-b border-zinc-900">
            <View className="flex-row items-center gap-2">
                {/* Logo or Title */}
                {/* If needed we can add a small logo here */}
                <Text className="text-white font-black text-xl italic tracking-tighter">{title}</Text>
            </View>

            <TouchableOpacity
                onPress={handleUserPress}
                className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
            >
                {isAuthenticated ? (
                    <View className="items-center justify-center">
                        {/* Use profile initial or icon */}
                        <Text className="text-primary font-bold text-lg">
                            {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                        </Text>
                    </View>
                ) : (
                    <Ionicons name="person-outline" size={20} color="#a1a1aa" />
                )}
            </TouchableOpacity>
        </View>
    );
}
