import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { validateRequest } from '../lib/request-validation';
import { useCurrentShow } from '../hooks/useCurrentShow';
import { Filter } from 'bad-words';

// Constants matching web app
const MAX_REQUESTS_PER_HOUR = 2;
const MAX_REQUESTS_PER_DAY = 5;
const DUPLICATE_WINDOW_HOURS = 2;

export function RequestSongModal() {
    const [modalVisible, setModalVisible] = useState(false);
    const [artist, setArtist] = useState('');
    const [song, setSong] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const { currentShow } = useCurrentShow();
    const filter = new Filter();

    const handleSubmit = async () => {
        // 1. Validate Basic Input
        const params = { artist: artist.trim(), song: song.trim(), stationId: 1 };
        const { isValid, errors } = validateRequest(params.artist, params.song, params.stationId);

        if (!isValid) {
            Alert.alert('Incomplete Form', Object.values(errors).flat().join('\n'));
            return;
        }

        // 2. Profanity Filter
        if (filter.isProfane(params.artist) || filter.isProfane(params.song) || (note && filter.isProfane(note))) {
            Alert.alert('Rejected', 'Request contains inappropriate language.');
            return;
        }

        setLoading(true);

        try {
            // 3. Auth Check
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Login Required', 'You must be logged in to request songs.');
                setLoading(false);
                return;
            }

            // 4. Rate Limit Check - Hourly
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const { count: hourlyCount } = await supabase
                .from('music_requests')
                .select('id', { count: 'exact', head: true })
                .eq('requested_by_user_id', user.id)
                .gte('created_at', oneHourAgo);

            if ((hourlyCount ?? 0) >= MAX_REQUESTS_PER_HOUR) {
                Alert.alert('Rate Limit Exceeded', `Maximum ${MAX_REQUESTS_PER_HOUR} requests per hour.`);
                setLoading(false);
                return;
            }

            // 5. Rate Limit Check - Daily
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count: dailyCount } = await supabase
                .from('music_requests')
                .select('id', { count: 'exact', head: true })
                .eq('requested_by_user_id', user.id)
                .gte('created_at', oneDayAgo);

            if ((dailyCount ?? 0) >= MAX_REQUESTS_PER_DAY) {
                Alert.alert('Rate Limit Exceeded', `Maximum ${MAX_REQUESTS_PER_DAY} requests per day.`);
                setLoading(false);
                return;
            }

            // 6. Duplicate Check (2 Hours)
            const duplicateWindowAgo = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
            const { data: duplicates } = await supabase
                .from('music_requests')
                .select('id')
                .eq('requested_by_user_id', user.id)
                .eq('station_id', 1)
                .ilike('artist_name', params.artist)
                .ilike('song_title', params.song)
                .gte('created_at', duplicateWindowAgo)
                .maybeSingle();

            if (duplicates) {
                Alert.alert('Already Requested', `You've already requested this song recently. Please wait ${DUPLICATE_WINDOW_HOURS} hours.`);
                setLoading(false);
                return;
            }

            // 7. Insert Request
            const { error } = await supabase
                .from('music_requests')
                .insert({
                    requested_by_user_id: user.id,
                    user_id: user.id, // Legacy compatibility
                    artist_name: params.artist,
                    song_title: params.song,
                    station_id: 1,
                    listener_note: note.trim() || null,
                    show_id: currentShow?.id || null,
                    status: 'pending'
                });

            if (error) {
                console.error('[RequestSongModal] Insert Error:', error);
                Alert.alert('Error', 'Failed to submit request. Please try again.');
            } else {
                Alert.alert('Success ✨', 'Your request has been sent to our presenters!');
                setArtist('');
                setSong('');
                setNote('');
                setModalVisible(false);
            }
        } catch (err) {
            console.error('[RequestSongModal] Unexpected error:', err);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-white/10 p-3 rounded-2xl active:bg-white/20 border border-white/10"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
            >
                <Ionicons name="musical-notes" size={24} color="white" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/40">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="w-full"
                    >
                        <View className="bg-white rounded-t-[40px] p-8 border-t border-zinc-100 shadow-2xl">
                            {/* Handle Bar */}
                            <View className="w-12 h-1.5 bg-zinc-200 rounded-full self-center mb-8" />

                            <View className="flex-row justify-between items-center mb-6">
                                <View>
                                    <Text className="text-foreground text-2xl font-black">Request a Song</Text>
                                    <View className="flex-row items-center mt-1">
                                        <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                                        <Text className="text-muted-foreground text-sm font-medium">
                                            {currentShow ? `To: ${currentShow.title}` : 'General Request'}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setModalVisible(false)}
                                    className="bg-zinc-100 p-2 rounded-full"
                                >
                                    <Ionicons name="close" size={24} color="#5d6476" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                                <View className="space-y-6">
                                    <View>
                                        <Text className="text-muted-foreground mb-2 ml-1 text-xs font-bold uppercase tracking-widest">Artist Name</Text>
                                        <TextInput
                                            value={artist}
                                            onChangeText={setArtist}
                                            placeholder="e.g. Wizkid"
                                            placeholderTextColor="#a1a1aa"
                                            className="bg-zinc-50 text-foreground p-5 rounded-2xl text-base border border-zinc-100 focus:border-primary"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-muted-foreground mb-2 ml-1 text-xs font-bold uppercase tracking-widest">Song Title</Text>
                                        <TextInput
                                            value={song}
                                            onChangeText={setSong}
                                            placeholder="e.g. Essence"
                                            placeholderTextColor="#a1a1aa"
                                            className="bg-zinc-50 text-foreground p-5 rounded-2xl text-base border border-zinc-100 focus:border-primary"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-muted-foreground mb-2 ml-1 text-xs font-bold uppercase tracking-widest">Optional Note</Text>
                                        <TextInput
                                            value={note}
                                            onChangeText={setNote}
                                            placeholder="Add a shoutout or message..."
                                            placeholderTextColor="#a1a1aa"
                                            multiline
                                            numberOfLines={3}
                                            className="bg-zinc-50 text-foreground p-5 rounded-2xl text-base border border-zinc-100 focus:border-primary h-28"
                                            textAlignVertical="top"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        disabled={loading}
                                        className="mt-4"
                                    >
                                        <LinearGradient
                                            colors={loading ? ['#d4d4d8', '#a1a1aa'] : ['#334aff', '#4f46e5']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            className="p-5 rounded-2xl items-center flex-row justify-center"
                                        >
                                            {loading ? (
                                                <ActivityIndicator color="white" size="small" />
                                            ) : (
                                                <>
                                                    <Text className="text-white font-black text-lg mr-2 uppercase tracking-tight">Send Request</Text>
                                                    <Ionicons name="paper-plane" size={18} color="white" />
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    
                                    <Text className="text-muted-foreground text-[10px] text-center mt-4 uppercase tracking-[2px] font-bold">
                                        Limit: 2 per hour • 5 per day
                                    </Text>
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}
