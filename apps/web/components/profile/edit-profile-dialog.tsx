"use client";

import Image from "next/image";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/ui/file-uploader";
import { Switch } from "@/components/ui/switch";
import { updateFullProfile } from "@/app/actions/profile";
import { toast } from "sonner";
import { Loader2, Music2, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: any;
    artistProfile: any;
}

export function EditProfileDialog({ open, onOpenChange, profile, artistProfile }: EditProfileDialogProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    
    // General State
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    
    // Artist State
    const [wantsArtist, setWantsArtist] = useState(false);
    const [stageName, setStageName] = useState("");
    const [artistBio, setArtistBio] = useState("");
    const [spotifyId, setSpotifyId] = useState("");
    const [appleMusicId, setAppleMusicId] = useState("");
    const [featuredTrackUrl, setFeaturedTrackUrl] = useState("");

    // Initialize state when profile data is available
    useEffect(() => {
        if (open) {
            setFullName(profile?.full_name || "");
            setUsername(profile?.username || "");
            setBio(profile?.bio || "");
            setAvatarUrl(profile?.avatar_url || "");
            
            if (artistProfile) {
                setWantsArtist(true);
                setStageName(artistProfile.stage_name || "");
                setArtistBio(artistProfile.bio || "");
                setSpotifyId(artistProfile.spotify_id || "");
                setAppleMusicId(artistProfile.apple_music_id || "");
                setFeaturedTrackUrl(artistProfile.featured_track_url || "");
            } else {
                setWantsArtist(false);
                setStageName("");
                setArtistBio("");
                setSpotifyId("");
                setAppleMusicId("");
                setFeaturedTrackUrl("");
            }
        }
    }, [open, profile, artistProfile]);

    const handleAvatarUpload = (path: string) => {
        const { data } = supabase.storage.from('images').getPublicUrl(path);
        setAvatarUrl(data.publicUrl);
        toast.success("Avatar uploaded successfully");
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const result = await updateFullProfile({
                fullName,
                username,
                bio,
                avatarUrl,
                wantsArtistProfile: wantsArtist,
                stageName,
                artistBio,
                spotifyId,
                appleMusicId,
                featuredTrackUrl
            });

            if (result.success) {
                toast.success("Profile updated successfully");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Failed to update profile");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your personal details or manage your artist profile.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">
                            <User className="w-4 h-4 mr-2" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="artist">
                            <Music2 className="w-4 h-4 mr-2" />
                            Artist Profile
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <Label>Avatar</Label>
                            <div className="mb-2">
                                {avatarUrl && (
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 relative rounded-full overflow-hidden border border-border">
                                            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setAvatarUrl("")}>
                                            Remove
                                        </Button>
                                    </div>
                                )}
                                {!avatarUrl && (
                                    <FileUploader
                                        bucket="images"
                                        folderPath={`avatars/${profile?.id}`}
                                        acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                                        maxSizeMB={5}
                                        onUploadComplete={handleAvatarUpload}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                                    placeholder="johndoe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">About Me (Listener Bio)</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="resize-none"
                                placeholder="I love listening to Afrobeats and Drill..."
                                rows={4}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="artist" className="space-y-6 mt-6">
                        {!artistProfile && (
                            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5 mb-6">
                                <div>
                                    <h4 className="font-medium text-foreground">Enable Artist Profile</h4>
                                    <p className="text-sm text-muted-foreground">Turn on to feature your music and stage name on your profile.</p>
                                </div>
                                <Switch
                                    checked={wantsArtist}
                                    onCheckedChange={setWantsArtist}
                                />
                            </div>
                        )}

                        {wantsArtist && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                <div className="space-y-2">
                                    <Label htmlFor="stageName">Stage Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="stageName"
                                        value={stageName}
                                        onChange={(e) => setStageName(e.target.value)}
                                        placeholder="DJ Awesome"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="artistBio">Artist Bio</Label>
                                    <Textarea
                                        id="artistBio"
                                        value={artistBio}
                                        onChange={(e) => setArtistBio(e.target.value)}
                                        className="resize-none"
                                        placeholder="Tell fans about your musical journey..."
                                        rows={4}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="spotifyId">Spotify Artist ID</Label>
                                        <Input
                                            id="spotifyId"
                                            value={spotifyId}
                                            onChange={(e) => setSpotifyId(e.target.value)}
                                            placeholder="e.g. 0Tk0BcbJ1k..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="appleMusicId">Apple Music ID</Label>
                                        <Input
                                            id="appleMusicId"
                                            value={appleMusicId}
                                            onChange={(e) => setAppleMusicId(e.target.value)}
                                            placeholder="e.g. 153098..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="featuredTrackUrl">Featured Track URL</Label>
                                    <Input
                                        id="featuredTrackUrl"
                                        value={featuredTrackUrl}
                                        onChange={(e) => setFeaturedTrackUrl(e.target.value)}
                                        placeholder="Link to your best track..."
                                    />
                                </div>
                            </div>
                        )}
                        {!wantsArtist && !artistProfile && (
                            <div className="text-center py-12 text-muted-foreground">
                                Toggle the switch above to claim your artist profile.
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || (wantsArtist && !stageName.trim())}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
