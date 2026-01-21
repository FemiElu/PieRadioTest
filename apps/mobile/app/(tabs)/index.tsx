import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAudio } from "../../context/mobile-audio-context";
import { Ionicons } from "@expo/vector-icons";
import { MobileHeader } from "../../components/mobile-header";

export default function HomeScreen() {
    const { isPlaying, isLoading, togglePlay } = useMobileAudio();

    return (
        <SafeAreaView className="flex-1 bg-background">
            <MobileHeader />

            <View className="flex-1 items-center justify-center p-4">
                <Text className="text-gray-400 mb-12 text-center text-lg">The Number One Station</Text>

                <TouchableOpacity
                    onPress={togglePlay}
                    disabled={isLoading}
                    className="w-24 h-24 rounded-full bg-primary items-center justify-center shadow-lg active:opacity-80"
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" size="large" />
                    ) : (
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={48}
                            color="white"
                            style={{ marginLeft: isPlaying ? 0 : 4 }}
                        />
                    )}
                </TouchableOpacity>

                <Text className="mt-8 text-gray-500 text-sm">
                    {isPlaying ? "Now Streaming..." : "Tap to Listen"}
                </Text>
            </View>
        </SafeAreaView>
    );
}
