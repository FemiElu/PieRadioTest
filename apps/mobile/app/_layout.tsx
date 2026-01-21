import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MobileAudioProvider } from "../context/mobile-audio-context";
import { AuthProvider } from "../context/auth-context";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <MobileAudioProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
                    </Stack>
                    <StatusBar style="light" />
                </MobileAudioProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
