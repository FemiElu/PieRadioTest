import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export function MobileHeader() {
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
        <View className="flex-row items-center justify-between px-4 py-2 bg-white border-b border-zinc-100">
            <View className="flex-row items-center">
                <Image
                    source={require("../assets/logo.png")}
                    className="w-28 h-10"
                    resizeMode="contain"
                />
            </View>

            <TouchableOpacity
                onPress={handleUserPress}
                className="w-10 h-10 rounded-full bg-zinc-50 items-center justify-center border border-zinc-100"
            >
                {isAuthenticated ? (
                    <View className="items-center justify-center">
                        <Text className="text-primary font-bold text-lg">
                            {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                        </Text>
                    </View>
                ) : (
                    <Ionicons name="person-outline" size={20} color="#71717a" />
                )}
            </TouchableOpacity>
        </View>
    );
}
