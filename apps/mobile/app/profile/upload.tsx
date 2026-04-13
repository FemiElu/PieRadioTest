import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { decode } from 'base64-arraybuffer';

interface ScheduleShow {
    title: string;
    image_url: string | null;
    presenterName: string | null;
}

export default function TrackUploadScreen() {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [pitchNotes, setPitchNotes] = useState('');
    const [audioFile, setAudioFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [coverFile, setCoverFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [selectedShows, setSelectedShows] = useState<string[]>([]);
    const [shows, setShows] = useState<ScheduleShow[]>([]);
    const [showsLoading, setShowsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    React.useEffect(() => {
        const fetchShows = async () => {
            setShowsLoading(true);
            const { data, error } = await supabase
                .from('schedules')
                .select('title, image_url, presenter:presenter_id(full_name)')
                .order('title', { ascending: true });

            if (error) {
                console.error('Failed to fetch shows:', error);
            } else {
                const seen = new Set<string>();
                const uniqueShows: ScheduleShow[] = [];
                for (const entry of (data || [])) {
                    const showTitle = entry.title as string;
                    if (showTitle && !seen.has(showTitle)) {
                        seen.add(showTitle);
                        uniqueShows.push({
                            title: showTitle,
                            image_url: entry.image_url as string | null,
                            presenterName: entry.presenter?.full_name || null,
                        });
                    }
                }
                setShows(uniqueShows);
            }
            setShowsLoading(false);
        };

        fetchShows();
    }, []);

    const toggleShowSelection = (showTitle: string) => {
        setSelectedShows(prev => {
            if (prev.includes(showTitle)) {
                return prev.filter(t => t !== showTitle);
            }
            if (prev.length >= 2) {
                Alert.alert('Selection Limit', 'You can select up to 2 shows.');
                return prev;
            }
            return [...prev, showTitle];
        });
    };

    const pickAudio = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true
            });

            if (!result.canceled) {
                setAudioFile(result.assets[0]);
            }
        } catch (err) {
            console.error('Pick audio error:', err);
        }
    };

    const pickImage = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                copyToCacheDirectory: true
            });

            if (!result.canceled) {
                setCoverFile(result.assets[0]);
            }
        } catch (err) {
            console.error('Pick image error:', err);
        }
    };

    const uploadToSupabase = async (asset: DocumentPicker.DocumentPickerAsset, bucket: string, path: string) => {
        try {
            const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
            const arrayBuffer = decode(base64);

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, arrayBuffer, {
                    contentType: asset.mimeType ?? 'application/octet-stream',
                    upsert: true
                });

            if (error) throw error;
            return path;
        } catch (error) {
            console.error(`Upload error (${bucket}):`, error);
            throw error;
        }
    };

    const handleSubmit = async () => {
        if (!title || !genre || !audioFile || !user) {
            Alert.alert('Error', 'Please fill in required fields and select an audio file.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        try {
            // 1. Upload Audio
            const audioPath = `tracks/${user.id}/${Date.now()}-${audioFile.name}`;
            await uploadToSupabase(audioFile, 'track-submissions', audioPath);
            setUploadProgress(50);

            // 2. Upload Cover (Optional)
            let coverPath = null;
            if (coverFile) {
                coverPath = `covers/${user.id}/${Date.now()}-${coverFile.name}`;
                await uploadToSupabase(coverFile, 'track-submissions', coverPath);
            }
            setUploadProgress(80);

            // 3. Insert Metadata
            const { error: dbError } = await supabase
                .from('artist_uploads')
                .insert({
                    artist_id: user.id,
                    title,
                    genre,
                    pitch_notes: pitchNotes,
                    audio_url: audioPath,
                    cover_art_url: coverPath,
                    preferred_show_ids: selectedShows,
                    status: 'pending'
                });

            if (dbError) throw dbError;

            setUploadProgress(100);
            Alert.alert('Success', 'Track submitted successfully for review!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Final submission error:', error);
            Alert.alert('Upload Failed', error.message || 'An unexpected error occurred.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center p-6 border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Submit Track</Text>
            </View>

            <ScrollView className="flex-1 p-6">
                <View className="space-y-6 pb-12">
                    {/* Audio Picker */}
                    <View>
                        <Text className="text-zinc-400 text-sm font-bold uppercase mb-3">Audio Track *</Text>
                        <TouchableOpacity
                            onPress={pickAudio}
                            className={`h-32 border-2 border-dashed rounded-2xl items-center justify-center ${audioFile ? 'border-primary bg-primary/5' : 'border-zinc-800 bg-card'}`}
                        >
                            {audioFile ? (
                                <View className="items-center px-4">
                                    <Ionicons name="musical-notes" size={32} color="#E11D48" />
                                    <Text className="text-white font-medium mt-2 text-center" numberOfLines={1}>{audioFile.name}</Text>
                                    <Text className="text-zinc-500 text-xs mt-1">Change file</Text>
                                </View>
                            ) : (
                                <View className="items-center">
                                    <View className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center mb-2">
                                        <Ionicons name="add" size={24} color="#E11D48" />
                                    </View>
                                    <Text className="text-zinc-400 font-medium text-center">Tap to select audio file</Text>
                                    <Text className="text-zinc-600 text-xs mt-1">MP3, WAV, AAC (Max 50MB)</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Metadata Form */}
                    <View className="space-y-4">
                        <View>
                            <Text className="text-zinc-400 text-sm font-bold uppercase mb-2">Track Title *</Text>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter track title"
                                placeholderTextColor="#52525b"
                                className="bg-card border border-white/10 rounded-xl p-4 text-white text-lg font-bold"
                            />
                        </View>

                        <View>
                            <Text className="text-zinc-400 text-sm font-bold uppercase mb-2">Genre *</Text>
                            <TextInput
                                value={genre}
                                onChangeText={setGenre}
                                placeholder="e.g. Afrobeat, Hip Hop, Jazz"
                                placeholderTextColor="#52525b"
                                className="bg-card border border-white/10 rounded-xl p-4 text-white"
                            />
                        </View>

                        <View>
                            <Text className="text-zinc-400 text-sm font-bold uppercase mb-2">Pitch Notes</Text>
                            <TextInput
                                value={pitchNotes}
                                onChangeText={setPitchNotes}
                                placeholder="Tell our A&R team about this track..."
                                placeholderTextColor="#52525b"
                                multiline
                                numberOfLines={4}
                                className="bg-card border border-white/10 rounded-xl p-4 text-white min-h-[120px]"
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Artwork Picker */}
                    <View>
                        <Text className="text-zinc-400 text-sm font-bold uppercase mb-3">Cover Artwork (Optional)</Text>
                        <TouchableOpacity
                            onPress={pickImage}
                            className={`flex-row items-center p-4 border rounded-xl ${coverFile ? 'border-primary bg-primary/5' : 'border-zinc-800 bg-card'}`}
                        >
                            <View className="w-12 h-12 bg-zinc-800 rounded-lg items-center justify-center mr-4">
                                <Ionicons name={coverFile ? "image" : "add"} size={20} color={coverFile ? "#E11D48" : "#52525b"} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-medium" numberOfLines={1}>
                                    {coverFile ? coverFile.name : 'Choose an image'}
                                </Text>
                                <Text className="text-zinc-500 text-xs">JPG, PNG (Square preferred)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Show Preferences */}
                    <View>
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-zinc-400 text-sm font-bold uppercase">Preferred Shows</Text>
                            {selectedShows.length > 0 && (
                                <TouchableOpacity onPress={() => setSelectedShows([])}>
                                    <Text className="text-primary text-xs font-bold">CLEAR</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text className="text-zinc-500 text-xs mb-3">
                            Select up to 2 shows where you'd love your track to be played.
                        </Text>
                        
                        {showsLoading ? (
                            <ActivityIndicator color="#E11D48" className="my-4" />
                        ) : shows.length === 0 ? (
                            <View className="py-4 items-center bg-zinc-800/50 rounded-xl border border-dashed border-zinc-700">
                                <Text className="text-zinc-500 text-sm">No shows available.</Text>
                            </View>
                        ) : (
                            <View className="flex-row flex-wrap gap-2">
                                {shows.map((show) => {
                                    const isSelected = selectedShows.includes(show.title);
                                    return (
                                        <TouchableOpacity
                                            key={show.title}
                                            onPress={() => toggleShowSelection(show.title)}
                                            className={`flex-row items-center p-2 px-3 rounded-lg border-2 ${
                                                isSelected 
                                                    ? 'border-primary bg-primary/10' 
                                                    : 'border-zinc-800 bg-card'
                                            }`}
                                        >
                                            <Ionicons 
                                                name={isSelected ? "checkmark-circle" : "radio-button-off"} 
                                                size={16} 
                                                color={isSelected ? "#E11D48" : "#A1A1AA"} 
                                                className="mr-2"
                                            />
                                            <View>
                                                <Text className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-zinc-300'}`}>
                                                    {show.title}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isUploading}
                        className={`w-full py-5 rounded-2xl items-center flex-row justify-center ${isUploading ? 'bg-zinc-800' : 'bg-primary shadow-lg shadow-primary/20'}`}
                    >
                        {isUploading ? (
                            <>
                                <ActivityIndicator color="white" className="mr-3" />
                                <Text className="text-white font-bold text-lg">Uploading {uploadProgress}%</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="cloud-upload" size={24} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">Send Submission</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
