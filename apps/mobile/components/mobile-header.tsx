import React from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/auth-context";
import { useRouter } from "expo-router";
import { NotificationBell } from "./NotificationBell";

interface MobileHeaderProps {
    title?: string;
    rightElement?: React.ReactNode;
}

export function MobileHeader({ title, rightElement }: MobileHeaderProps) {
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
        <View className="flex-row items-center justify-between px-4 py-2 bg-white border-b border-zinc-100 min-h-[56px]">
            <View className="flex-row items-center flex-1">
                {title ? (
                    <Text className="text-zinc-900 text-xl font-black uppercase tracking-tight">{title}</Text>
                ) : (
                    <Image
                        source={require("../assets/logo.png")}
                        className="w-28 h-10"
                        resizeMode="contain"
                    />
                )}
            </View>

            <View className="flex-row items-center">
                {rightElement}
                <View className="flex-row items-center ml-2">
                    <NotificationBell />
                    <TouchableOpacity
                        onPress={handleUserPress}
                        className="w-10 h-10 rounded-full bg-zinc-50 items-center justify-center border border-zinc-100 ml-2"
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
            </View>
        </View>
    );
}

