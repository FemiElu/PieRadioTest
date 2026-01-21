import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#09090b", // Dark background
                    borderTopColor: "#27272a",
                },
                tabBarActiveTintColor: "#E11D48", // Primary Red
                tabBarInactiveTintColor: "#a1a1aa",
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Listen",
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="radio" color={color} />,
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: "Schedule",
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="calendar" color={color} />,
                }}
            />
            <Tabs.Screen
                name="interact"
                options={{
                    title: "Interact",
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="chatbubbles" color={color} />,
                }}
            />
        </Tabs>
    );
}
