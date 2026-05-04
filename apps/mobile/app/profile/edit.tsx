import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export default function EditProfileScreen() {
    const { user, profile, refreshProfile } = useAuth();
    
    const [isLoading, setIsLoading] = useState(false);
    
    // General
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    
    // Artist
    const [artistProfile, setArtistProfile] = useState<any>(null);
    const [wantsArtist, setWantsArtist] = useState(false);
    const [stageName, setStageName] = useState("");
    const [artistBio, setArtistBio] = useState("");
    const [spotifyId, setSpotifyId] = useState("");
    const [appleMusicId, setAppleMusicId] = useState("");
    const [featuredTrackUrl, setFeaturedTrackUrl] = useState("");

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "");
            setUsername(profile.username || "");
            setBio(profile.bio || "");
            setAvatarUrl(profile.avatar_url || "");
        }
        
        const fetchArtist = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('artist_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (data) {
                setArtistProfile(data);
                setWantsArtist(true);
                setStageName(data.stage_name || "");
                setArtistBio(data.bio || "");
                setSpotifyId(data.spotify_id || "");
                setAppleMusicId(data.apple_music_id || "");
                setFeaturedTrackUrl(data.featured_track_url || "");
            }
        };
        fetchArtist();
    }, [profile, user]);

    const handlePickAvatar = async () => {
         try {
             const result = await DocumentPicker.getDocumentAsync({
                 type: 'image/*',
                 copyToCacheDirectory: true,
             });

             if (result.canceled || !result.assets[0]) return;
             
             setIsLoading(true);
             const asset = result.assets[0];
             const fileUri = asset.uri;
             
             const base64 = await FileSystem.readAsStringAsync(fileUri, {
                 encoding: FileSystem.EncodingType.Base64,
             });
             
             const ext = asset.name.split('.').pop()?.toLowerCase() || 'jpg';
             const path = `avatars/${user?.id}/${Date.now()}.${ext}`;
             
             const { data, error } = await supabase.storage
                 .from('images')
                 .upload(path, decode(base64), {
                     contentType: `image/${ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg'}`,
                     upsert: true
                 });

             if (error) {
                 throw error;
             }
             
             const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(data.path);
             setAvatarUrl(publicUrlData.publicUrl);
             Alert.alert("Success", "Avatar uploaded successfully!");
             
         } catch (error: any) {
             console.error("Upload error", error);
             Alert.alert("Upload Failed", error.message || "Failed to upload avatar");
         } finally {
             setIsLoading(false);
         }
    };

    const handleSave = async () => {
        if (!fullName.trim() || !username.trim()) {
            Alert.alert("Error", "Full name and username are required.");
            return;
        }

        if (wantsArtist && !stageName.trim()) {
            Alert.alert("Error", "Stage name is required for artist profiles.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Check Username Uniqueness
            if (username !== profile?.username) {
                const { data: existingUser } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('username', username)
                    .single();

                if (existingUser) {
                    Alert.alert("Error", "Username is already taken.");
                    return;
                }
            }

            // 2. Update General Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    username: username,
                    bio: bio,
                    avatar_url: avatarUrl || null
                })
                .eq('id', user?.id!);

            if (profileError) throw profileError;

            // 3. Update Auth Metadata
            await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            // 4. Update Artist Profile
            if (wantsArtist) {
                const { error: artistError } = await supabase
                    .from('artist_profiles')
                    .upsert({
                        user_id: user?.id!,
                        stage_name: stageName,
                        bio: artistBio,
                        spotify_id: spotifyId,
                        apple_music_id: appleMusicId,
                        featured_track_url: featuredTrackUrl
                    }, { onConflict: 'user_id' });

                if (artistError) throw artistError;
            }

            Alert.alert("Success", "Profile updated successfully!");
            await refreshProfile(); // refresh context
            router.back();
            
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
            <Stack.Screen options={{ 
                title: "Edit Profile",
                headerStyle: { backgroundColor: '#09090b' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { fontWeight: 'bold' }
            }} />
            
            <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
                {/* General Section */}
                <Text className="text-foreground text-xl font-bold mt-6 mb-4">General Info</Text>
                
                <View className="items-center mb-6">
                    <TouchableOpacity onPress={handlePickAvatar} disabled={isLoading}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} className="w-24 h-24 rounded-full border-2 border-border" />
                        ) : (
                            <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center border border-border border-dashed">
                                <Ionicons name="camera" size={32} color="#334aff" />
                            </View>
                        )}
                        <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-background">
                            <Ionicons name="pencil" size={12} color="#ffffff" />
                        </View>
                    </TouchableOpacity>
                    <Text className="text-muted-foreground text-xs mt-2">Tap to change avatar</Text>
                </View>

                <View className="space-y-4 mb-8">
                    <View>
                        <Text className="text-muted-foreground text-sm font-semibold mb-1 ml-1">Full Name</Text>
                        <TextInput
                            value={fullName}
                            onChangeText={setFullName}
                            className="bg-card text-foreground border border-border rounded-xl px-4 py-3"
                            placeholder="John Doe"
                            placeholderTextColor="#52525b"
                        />
                    </View>
                    
                    <View>
                        <Text className="text-muted-foreground text-sm font-semibold mb-1 ml-1">Username</Text>
                        <TextInput
                            value={username}
                            onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                            className="bg-card text-foreground border border-border rounded-xl px-4 py-3"
                            placeholder="johndoe"
                            placeholderTextColor="#52525b"
                            autoCapitalize="none"
                        />
                    </View>

                    <View>
                        <Text className="text-muted-foreground text-sm font-semibold mb-1 ml-1">Bio (Listener)</Text>
                        <TextInput
                            value={bio}
                            onChangeText={setBio}
                            className="bg-card text-foreground border border-border rounded-xl px-4 py-3"
                            placeholder="I love listening to Afrobeats..."
                            placeholderTextColor="#52525b"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <View className="h-[1px] bg-border mb-6" />

                {/* Artist Section */}
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-foreground text-xl font-bold">Artist Profile</Text>
                    <TouchableOpacity 
                        onPress={() => setWantsArtist(!wantsArtist)}
                        className={`w-12 h-6 rounded-full justify-center px-1 ${wantsArtist ? 'bg-primary' : 'bg-muted'}`}
                    >
                        <View className={`w-4 h-4 rounded-full bg-white transition-transform ${wantsArtist ? 'ml-6' : ''}`} />
                    </TouchableOpacity>
                </View>

                {wantsArtist && (
                    <View className="space-y-4 mb-8 bg-card border border-primary/20 p-4 rounded-xl">
                        <View>
                            <Text className="text-muted-foreground text-sm font-semibold mb-1 ml-1">Stage Name *</Text>
                            <TextInput
                                value={stageName}
                                onChangeText={setStageName}
                                className="bg-background text-foreground border border-border rounded-xl px-4 py-3"
                                placeholder="DJ Awesome"
                                placeholderTextColor="#52525b"
                            />
                        </View>

                        <View>
                            <Text className="text-muted-foreground text-sm font-semibold mb-1 ml-1">Artist Bio</Text>
                            <TextInput
                                value={artistBio}
                                onChangeText={setArtistBio}
                                className="bg-background text-foreground border border-border rounded-xl px-4 py-3"
                                placeholder="My musical journey started when..."
                                placeholderTextColor="#52525b"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View>
                            <Text className="text-muted-foreground text-sm font-semibold mb-1 ml-1">Spotify Artist ID</Text>
                            <TextInput
                                value={spotifyId}
                                onChangeText={setSpotifyId}
                                className="bg-background text-foreground border border-border rounded-xl px-4 py-3"
                                placeholder="e.g. 0Tk0BcbJ1k..."
                                placeholderTextColor="#52525b"
                            />
                        </View>

                        <View>
                            <Text className="text-muted-foreground text-sm font-semibold mb-1 ml-1">Apple Music ID</Text>
                            <TextInput
                                value={appleMusicId}
                                onChangeText={setAppleMusicId}
                                className="bg-background text-foreground border border-border rounded-xl px-4 py-3"
                                placeholder="e.g. 153098..."
                                placeholderTextColor="#52525b"
                            />
                        </View>

                        <View>
                            <Text className="text-muted-foreground text-sm font-semibold mb-1 ml-1">Featured Track URL</Text>
                            <TextInput
                                value={featuredTrackUrl}
                                onChangeText={setFeaturedTrackUrl}
                                className="bg-background text-foreground border border-border rounded-xl px-4 py-3"
                                placeholder="Link to your best track..."
                                placeholderTextColor="#52525b"
                            />
                        </View>
                    </View>
                )}

                <TouchableOpacity 
                    onPress={handleSave} 
                    disabled={isLoading}
                    className={`bg-primary w-full py-4 rounded-xl items-center mb-12 ${isLoading ? 'opacity-70' : ''}`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text className="text-primary-foreground font-bold text-lg">Save Changes</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}
