import { View, Text, TouchableOpacity, ActivityIndicator, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAudio } from "../../context/mobile-audio-context";
import { Ionicons } from "@expo/vector-icons";
import { MobileHeader } from "../../components/mobile-header";
import { RequestSongModal } from "../../components/RequestSongModal";

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width * 0.7;

export default function HomeScreen() {
    const { isPlaying, isLoading, togglePlay, currentTrack } = useMobileAudio();

    return (
        <SafeAreaView className="flex-1 bg-background">
            <MobileHeader />

            <View className="flex-1 items-center justify-center p-6">
                {/* Artwork Section */}
                <View
                    className="bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/5"
                    style={{
                        width: ARTWORK_SIZE,
                        height: ARTWORK_SIZE,
                        elevation: 10,
                    }}
                >
                    {currentTrack?.artwork ? (
                        <Image
                            source={{ uri: currentTrack.artwork }}
                            className="w-full h-full"
                            style={{ resizeMode: 'cover' }}
                        />
                    ) : (
                        <View className="w-full h-full items-center justify-center">
                            <Ionicons name="musical-notes" size={64} color="#333" />
                        </View>
                    )}
                </View>

                {/* Info Section */}
                <View className="items-center mt-10 w-full px-4">
                    <Text
                        numberOfLines={1}
                        className="text-white text-2xl font-bold text-center uppercase tracking-tight"
                    >
                        {currentTrack?.title || "Pie Radio Live"}
                    </Text>
                    <Text
                        numberOfLines={1}
                        className="text-primary text-base font-semibold text-center mt-2 uppercase tracking-widest"
                    >
                        {currentTrack?.artist || "The Number One Station"}
                    </Text>
                </View>

                {/* Playback Controls */}
                <View className="mt-12 items-center">
                    <TouchableOpacity
                        onPress={togglePlay}
                        disabled={isLoading}
                        className="w-24 h-24 rounded-full bg-primary items-center justify-center shadow-lg active:opacity-80 border-4 border-white/10"
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

                    <Text className="mt-6 text-gray-500 text-xs font-medium uppercase tracking-[0.2em]">
                        {isPlaying ? "Live Broadcast" : "Tap to Join"}
                    </Text>
                </View>

                <View className="mt-12 w-full max-w-[200px]">
                    <RequestSongModal />
                </View>
            </View>
        </SafeAreaView>
    );
}
