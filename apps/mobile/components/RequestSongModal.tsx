import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { validateRequest } from '../lib/request-validation';

export function RequestSongModal() {
    const [modalVisible, setModalVisible] = useState(false);
    const [artist, setArtist] = useState('');
    const [song, setSong] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // 1. Validate
        const params = { artist: artist.trim(), song: song.trim(), stationId: 1 };
        const { isValid, errors } = validateRequest(params.artist, params.song, params.stationId);

        if (!isValid) {
            Alert.alert('Error', Object.values(errors).flat().join('\n'));
            return;
        }

        setLoading(true);

        try {
            // 2. Auth Check
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Login Required', 'You must be logged in to request songs.');
                setLoading(false);
                return;
            }

            // 3. Duplicate Check (2 Hours) - Direct DB
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
            const { data: duplicates } = await supabase
                .from('music_requests')
                .select('id')
                .eq('requested_by_user_id', user.id)
                .eq('station_id', 1)
                .ilike('artist_name', params.artist)
                .ilike('song_title', params.song)
                .gte('created_at', twoHoursAgo)
                .maybeSingle();

            if (duplicates) {
                Alert.alert('Duplicate', 'You requested this recently. Please wait a bit.');
                setLoading(false);
                return;
            }

            // 4. Insert
            const { error } = await supabase
                .from('music_requests')
                .insert({
                    requested_by_user_id: user.id,
                    user_id: user.id,
                    artist_name: params.artist,
                    song_title: params.song,
                    station_id: 1,
                    listener_note: note.trim() || null,
                    status: 'pending'
                });

            if (error) {
                if (error.message.includes('Profanity')) {
                    Alert.alert('Rejected', 'Request contains inappropriate language.');
                } else {
                    Alert.alert('Error', 'Failed to submit request.');
                }
            } else {
                Alert.alert('Success', 'Request submitted!');
                setArtist('');
                setSong('');
                setNote('');
                setModalVisible(false);
            }
        } catch (err) {
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-white/10 p-3 rounded-full active:bg-white/20"
            >
                <Ionicons name="musical-notes" size={24} color="white" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end"
                >
                    <View className="bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl h-[70%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Request a Song</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#a1a1aa" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text className="text-zinc-400 mb-2 font-medium">Artist Name *</Text>
                            <TextInput
                                value={artist}
                                onChangeText={setArtist}
                                placeholder="e.g. Wizkid"
                                placeholderTextColor="#52525b"
                                className="bg-zinc-800 text-white p-4 rounded-xl mb-4 text-base border border-zinc-700"
                            />

                            <Text className="text-zinc-400 mb-2 font-medium">Song Title *</Text>
                            <TextInput
                                value={song}
                                onChangeText={setSong}
                                placeholder="e.g. Essence"
                                placeholderTextColor="#52525b"
                                className="bg-zinc-800 text-white p-4 rounded-xl mb-4 text-base border border-zinc-700"
                            />

                            <Text className="text-zinc-400 mb-2 font-medium">Note (Optional)</Text>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="Shoutout to..."
                                placeholderTextColor="#52525b"
                                multiline
                                numberOfLines={3}
                                className="bg-zinc-800 text-white p-4 rounded-xl mb-6 text-base border border-zinc-700 h-24"
                                textAlignVertical="top"
                            />

                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={loading}
                                className={`p-4 rounded-xl items-center ${loading ? 'bg-indigo-900' : 'bg-indigo-600 active:bg-indigo-700'}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Send Request</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}
