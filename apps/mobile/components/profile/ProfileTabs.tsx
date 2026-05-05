import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface ProfileTabsProps {
    user: any;
    profile: any;
    artistProfile: any;
}

export function ProfileTabs({ user, profile, artistProfile }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<'favorites' | 'activity' | 'tools'>('favorites');
    const [isLoading, setIsLoading] = useState(true);

    const [likedShows, setLikedShows] = useState<any[]>([]);
    const [likedPresenters, setLikedPresenters] = useState<any[]>([]);
    const [likedSongs, setLikedSongs] = useState<any[]>([]);
    const [artistUploads, setArtistUploads] = useState<any[]>([]);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) return;
            setIsLoading(true);

            try {
                const [
                    { data: showsData },
                    { data: presentersData },
                    { data: songsData }
                ] = await Promise.all([
                    supabase.from('liked_shows').select('show_id, show_title, show_image_url, shows(*)').eq('user_id', user.id),
                    supabase.from('liked_presenters').select('presenter_id, profiles!liked_presenters_presenter_id_fkey(*)').eq('user_id', user.id),
                    supabase.from('liked_songs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
                ]);

                setLikedShows(showsData || []);
                setLikedPresenters(presentersData || []);
                setLikedSongs(songsData || []);

                if (artistProfile) {
                    const { data: uploadsData } = await supabase
                        .from('artist_uploads')
                        .select('*')
                        .eq('artist_id', user.id)
                        .order('created_at', { ascending: false });
                    setArtistUploads(uploadsData || []);
                }
            } catch (error) {
                console.error("Error fetching favorites", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, [user, artistProfile]);

    const hasFavorites = likedShows.length > 0 || likedPresenters.length > 0 || likedSongs.length > 0;

    return (
        <View className="flex-1 mt-4">
            {/* Tab Header */}
            <View className="mb-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row px-6">
                    <TouchableOpacity
                        onPress={() => setActiveTab('favorites')}
                        className={`mr-6 pb-2 border-b-2 ${activeTab === 'favorites' ? 'border-primary' : 'border-transparent'}`}
                    >
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="heart" size={16} color={activeTab === 'favorites' ? '#334aff' : '#71717a'} />
                            <Text className={`font-bold text-sm ${activeTab === 'favorites' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Favorites
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('activity')}
                        className={`mr-6 pb-2 border-b-2 ${activeTab === 'activity' ? 'border-primary' : 'border-transparent'}`}
                    >
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="pulse" size={16} color={activeTab === 'activity' ? '#334aff' : '#71717a'} />
                            <Text className={`font-bold text-sm ${activeTab === 'activity' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Activity
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('tools')}
                        className={`mr-6 pb-2 border-b-2 ${activeTab === 'tools' ? 'border-primary' : 'border-transparent'}`}
                    >
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="settings" size={16} color={activeTab === 'tools' ? '#334aff' : '#71717a'} />
                            <Text className={`font-bold text-sm ${activeTab === 'tools' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Tools
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Extra padding for proper scrolling bounds */}
                    <View className="w-8" />
                </ScrollView>
                <View className="h-[1px] bg-border -mt-[1px]" />
            </View>

            {/* Content Area */}
            <View className="px-6 pb-12">
                {isLoading ? (
                    <View className="py-12 items-center justify-center">
                        <ActivityIndicator color="#334aff" />
                    </View>
                ) : (
                    <>
                        {/* Favorites Tab */}
                        {activeTab === 'favorites' && (
                            <View>
                                {!hasFavorites ? (
                                    <View className="items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-card/50">
                                        <Ionicons name="heart-outline" size={48} color="#52525b" className="mb-4" />
                                        <Text className="font-bold text-foreground text-lg mb-1">No favorites yet</Text>
                                        <Text className="text-muted-foreground text-center text-sm">
                                            Tap the heart icon on any song, show, or presenter to add them to your favorites.
                                        </Text>
                                    </View>
                                ) : (
                                    <View className="space-y-8">
                                        {likedSongs.length > 0 && (
                                            <View>
                                                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
                                                    Liked Songs
                                                </Text>
                                                <View className="space-y-3">
                                                    {likedSongs.map((song) => (
                                                        <View key={song.id} className="flex-row items-center gap-3 p-3 rounded-xl bg-card border border-border">
                                                            <View className="w-12 h-12 rounded-lg bg-muted overflow-hidden items-center justify-center">
                                                                {song.cover_url ? (
                                                                    <Image source={{ uri: song.cover_url }} className="w-full h-full" />
                                                                ) : (
                                                                    <Ionicons name="musical-notes" size={20} color="#71717a" />
                                                                )}
                                                            </View>
                                                            <View className="flex-1">
                                                                <Text className="text-foreground font-bold text-sm truncate">{song.song_title}</Text>
                                                                <Text className="text-muted-foreground text-xs truncate uppercase">{song.artist_name || 'Pie Radio Live'}</Text>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {likedPresenters.length > 0 && (
                                            <View>
                                                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
                                                    Favorite Presenters
                                                </Text>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                                    {likedPresenters.map((item) => {
                                                        const p = item.profiles;
                                                        return (
                                                            <TouchableOpacity key={item.presenter_id} className="items-center mr-4 w-20">
                                                                <View className="w-16 h-16 rounded-full bg-muted border border-border overflow-hidden mb-2 items-center justify-center">
                                                                    {p?.avatar_url ? (
                                                                        <Image source={{ uri: p.avatar_url }} className="w-full h-full" />
                                                                    ) : (
                                                                        <Text className="text-foreground font-bold text-xl uppercase">
                                                                            {(p?.full_name?.[0] || 'P')}
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                                <Text className="text-foreground text-xs font-bold text-center" numberOfLines={1}>
                                                                    {p?.full_name || p?.username}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </ScrollView>
                                            </View>
                                        )}

                                        {likedShows.length > 0 && (
                                            <View>
                                                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
                                                    Liked Shows
                                                </Text>
                                                <View className="space-y-3">
                                                    {likedShows.map((item) => {
                                                        const show = item.shows || item;
                                                        return (
                                                            <TouchableOpacity key={item.show_id} className="flex-row p-3 rounded-xl bg-card border border-border items-center gap-4">
                                                                <View className="w-16 h-16 rounded-lg bg-muted border border-border overflow-hidden">
                                                                    {show.cover_image_url || item.show_image_url ? (
                                                                        <Image source={{ uri: (show.cover_image_url || item.show_image_url) }} className="w-full h-full" />
                                                                    ) : (
                                                                        <View className="w-full h-full bg-primary/20" />
                                                                    )}
                                                                </View>
                                                                <View className="flex-1 justify-center">
                                                                    <Text className="text-foreground font-bold text-base truncate mb-1">
                                                                        {show.title || item.show_title}
                                                                    </Text>
                                                                    {show.description && (
                                                                        <Text className="text-muted-foreground text-xs" numberOfLines={2}>
                                                                            {show.description}
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <View className="items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-card/50">
                                <Text className="text-muted-foreground text-center">
                                    No recent activity found. Start listening to shows!
                                </Text>
                            </View>
                        )}

                        {/* Tools Tab */}
                        {activeTab === 'tools' && (
                            <View className="space-y-6">
                                {artistProfile && (
                                    <View>
                                        <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
                                            Artist Services
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => router.push("/profile/upload")}
                                            className="bg-card border-2 border-primary/25 rounded-xl p-4 flex-row items-center justify-between shadow-sm"
                                        >
                                            <View className="flex-row items-center gap-3">
                                                <View className="w-10 h-10 bg-primary/15 rounded-full items-center justify-center">
                                                    <Ionicons name="cloud-upload" size={20} color="#334aff" />
                                                </View>
                                                <View>
                                                    <Text className="text-card-foreground font-bold text-lg">Upload Track</Text>
                                                    <Text className="text-muted-foreground text-xs">Submit music for airplay</Text>
                                                </View>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#5d6476" />
                                        </TouchableOpacity>

                                        {/* Artist Uploads History */}
                                        {artistUploads.length > 0 && (
                                            <View className="mt-4 space-y-2">
                                                <Text className="text-foreground font-bold text-sm mb-2">Previous Signatures</Text>
                                                {artistUploads.map(upload => (
                                                    <View key={upload.id} className="flex-row items-center justify-between bg-card p-3 rounded-lg border border-border">
                                                        <View className="flex-row items-center gap-3">
                                                            <Ionicons name="musical-notes" size={16} color="#71717a" />
                                                            <Text className="text-foreground font-medium text-sm w-40" numberOfLines={1}>{upload.title}</Text>
                                                        </View>
                                                        <View className={`px-2 py-1 rounded-full ${upload.status === 'approved' ? 'bg-green-500/20' : upload.status === 'rejected' ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
                                                            <Text className={`text-[10px] font-bold uppercase ${upload.status === 'approved' ? 'text-green-500' : upload.status === 'rejected' ? 'text-red-500' : 'text-orange-500'}`}>
                                                                {upload.status}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}

                                {(profile?.role === 'presenter' || profile?.role === 'admin') && (
                                    <View>
                                        <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
                                            Presenter Tools
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => router.push("/dashboard/messages")}
                                            className="bg-card border-2 border-border rounded-xl p-4 flex-row items-center justify-between"
                                        >
                                            <View className="flex-row items-center gap-3">
                                                <View className="w-10 h-10 bg-primary/15 rounded-full items-center justify-center">
                                                    <Ionicons name="mail" size={20} color="#334aff" />
                                                </View>
                                                <Text className="text-card-foreground font-bold text-lg">Messages</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#5d6476" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {activeTab === 'tools' && (
                                    <View>
                                        <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-6 mb-3">
                                            Account Settings
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => router.push("/profile/delete-account")}
                                            className="bg-card border-2 border-border rounded-xl p-4 flex-row items-center justify-between"
                                        >
                                            <View className="flex-row items-center gap-3">
                                                <View className="w-10 h-10 bg-red-500/10 rounded-full items-center justify-center">
                                                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                                                </View>
                                                <View>
                                                    <Text className="text-red-600 font-bold text-lg">Delete Account</Text>
                                                    <Text className="text-muted-foreground text-xs mr-10">Permanently remove your data</Text>
                                                </View>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#5d6476" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}
            </View>
        </View>
    );
}
