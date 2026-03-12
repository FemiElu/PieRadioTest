'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BarChart3, Settings2, User, Heart, Activity, Music2, ExternalLink, UploadCloud } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from 'sonner';
import { updateProfile } from '@/app/actions/profile';
import { useAuth } from "@/context/auth-context";

export function ProfileTabs({
    profile,
    artistProfile,
    likedShows = [],
    likedPresenters = [],
    likedSongs = [],
    artistUploads = []
}: {
    profile: any;
    artistProfile: any;
    likedShows?: any[];
    likedPresenters?: any[];
    likedSongs?: any[];
    artistUploads?: any[];
}) {
    const isArtist = !!artistProfile;
    const hasFavorites = likedShows.length > 0 || likedPresenters.length > 0 || likedSongs.length > 0;

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const { refreshProfile } = useAuth();

    useEffect(() => {
        if (profile?.full_name) {
            setFullName(profile.full_name);
        }
    }, [profile?.full_name]);

    const handleUpdateProfile = async () => {
        setIsUpdating(true);
        try {
            const result = await updateProfile({ fullName });
            if (result.success) {
                await refreshProfile();
                toast.success('Profile updated successfully');
            } else {
                toast.error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Tabs defaultValue="activity" className="w-full">
            <TabsList className="flex w-full grid-cols-4 lg:w-[600px] bg-card border border-border/40 p-1">
                <TabsTrigger value="activity"><Activity className="w-4 h-4 mr-2 hidden sm:block" /> Activity</TabsTrigger>
                <TabsTrigger value="preferences"><Settings2 className="w-4 h-4 mr-2 hidden sm:block" /> Preferences</TabsTrigger>
                <TabsTrigger value="account"><User className="w-4 h-4 mr-2 hidden sm:block" /> Account</TabsTrigger>
                {isArtist ? (
                    <>
                        <TabsTrigger value="stats" className="text-primary font-bold"><BarChart3 className="w-4 h-4 mr-2 hidden sm:block" /> Stats</TabsTrigger>
                        <TabsTrigger value="uploads"><Music2 className="w-4 h-4 mr-2 hidden sm:block" /> Uploads</TabsTrigger>
                    </>
                ) : (
                    <TabsTrigger value="favorites" className="hidden sm:flex"><Heart className="w-4 h-4 mr-2" /> Favorites</TabsTrigger>
                )}
            </TabsList>

            <TabsContent value="activity" className="mt-6 space-y-6">
                <Card className="bg-card/50 backdrop-blur border-border/40">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your listening history and interactions on Pie Radio.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-center p-8 text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-background/50">
                            No recent activity found. Start listening to shows!
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur border-border/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500/20" />
                            Your Favorites
                        </CardTitle>
                        <CardDescription>Shows, presenters, and liked songs from the persistent player.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!hasFavorites ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/40 rounded-xl bg-background/50">
                                <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <h3 className="font-semibold text-lg">No favorites yet</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                                    Click the heart icon on any song, show, or presenter to add them to your favorites.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Liked Songs */}
                                {likedSongs.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Music2 className="w-4 h-4" /> Liked Songs
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {likedSongs.map((song) => (
                                                <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/40 group hover:border-primary/50 transition-colors">
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                                        {song.cover_url ? (
                                                            <Image src={song.cover_url} alt={song.song_title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                                                <Music2 className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate uppercase italic tracking-tight">{song.song_title}</p>
                                                        <p className="text-xs text-muted-foreground truncate uppercase">{song.artist_name || 'Pie Radio Live'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Liked Presenters */}
                                {likedPresenters.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <User className="w-4 h-4" /> Favorite Presenters
                                        </h4>
                                        <div className="flex flex-wrap gap-4">
                                            {likedPresenters.map((presenter) => (
                                                <Link
                                                    key={presenter.id}
                                                    href={`/presenters/${presenter.slug || presenter.username}`}
                                                    className="flex flex-col items-center gap-2 group"
                                                >
                                                    <Avatar className="w-16 h-16 border-2 border-transparent group-hover:border-primary transition-all">
                                                        <AvatarImage src={presenter.avatar_url || ''} />
                                                        <AvatarFallback>{(presenter.full_name || 'P').charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-bold text-center group-hover:text-primary transition-colors">
                                                        {presenter.full_name || presenter.username}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Liked Shows */}
                                {likedShows.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Liked Shows
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {likedShows.map((show) => (
                                                <div key={show.id} className="flex gap-4 p-4 rounded-2xl bg-background/40 border border-border/40 group hover:border-primary/50 transition-colors">
                                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                                                        {show.cover_image_url ? (
                                                            <Image src={show.cover_image_url} alt={show.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-muted" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col justify-center gap-1">
                                                        <h5 className="font-display font-black text-lg italic uppercase tracking-tight group-hover:text-primary transition-colors">
                                                            {show.title}
                                                        </h5>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {show.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="preferences" className="mt-6">
                <Card className="bg-card/50 backdrop-blur border-border/40">
                    <CardHeader>
                        <CardTitle>Listening Preferences</CardTitle>
                        <CardDescription>Customize how you experience Pie Radio.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Audio Quality */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold tracking-tight">Audio Quality</h3>
                            <RadioGroup defaultValue="high" className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="high" id="q-high" />
                                    <div className="flex-1">
                                        <Label htmlFor="q-high" className="font-medium flex items-center gap-2">
                                            High Quality <Badge variant="secondary" className="text-[10px] h-5">Recommended</Badge>
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">Best audio experience (320kbps). Uses more data.</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="auto" id="q-auto" />
                                    <div className="flex-1">
                                        <Label htmlFor="q-auto" className="font-medium">Automatic</Label>
                                        <p className="text-sm text-muted-foreground mt-1">Adjusts quality based on your network connection.</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="low" id="q-low" />
                                    <div className="flex-1">
                                        <Label htmlFor="q-low" className="font-medium">Data Saver</Label>
                                        <p className="text-sm text-muted-foreground mt-1">Lower quality (64kbps). Best for limited data plans.</p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="h-px bg-border/40 w-full" />

                        {/* Notifications */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold tracking-tight">Notifications</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Live Show Alerts</Label>
                                        <p className="text-sm text-muted-foreground">Receive push notifications when your favorite shows go live.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">News Updates</Label>
                                        <p className="text-sm text-muted-foreground">Get notified about breaking news and platform updates.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 py-4 mt-6 border-t border-border/40 flex justify-end">
                        <Button>Save Preferences</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="account" className="mt-6">
                <Card className="bg-card/50 backdrop-blur border-border/40">
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                        <CardDescription>Update your personal information and security settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" defaultValue={profile?.email || ''} readOnly className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Email addresses cannot be changed currently.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 py-4 mt-6 border-t border-border/40 flex justify-end">
                        <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                            {isUpdating ? 'Updating...' : 'Update Profile'}
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            {isArtist && (
                <TabsContent value="stats" className="mt-6">
                    <Card className="bg-card/50 backdrop-blur border-border/40">
                        <CardHeader>
                            <CardTitle className="text-primary flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2" />
                                Radio Analytics
                            </CardTitle>
                            <CardDescription>Track how often your music is played on Pie Radio.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center">
                                    <h4 className="text-sm text-muted-foreground font-medium mb-2 uppercase tracking-wider">Total Plays</h4>
                                    <p className="text-5xl font-display font-bold text-primary">0</p>
                                    <p className="text-xs text-muted-foreground mt-2">All time</p>
                                </div>
                                <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center">
                                    <h4 className="text-sm text-muted-foreground font-medium mb-2 uppercase tracking-wider">This Week</h4>
                                    <p className="text-5xl font-display font-bold text-foreground">0</p>
                                    <p className="text-xs text-muted-foreground mt-2">-0% from last week</p>
                                </div>
                                <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-1">
                                    <h4 className="text-sm text-muted-foreground font-medium mb-2 uppercase tracking-wider">Top Track</h4>
                                    {artistProfile.featured_track_url ? (
                                        <div className="mt-1 flex flex-col items-center">
                                            <Music2 className="w-8 h-8 text-muted-foreground/50 mb-2" />
                                            <span className="font-semibold text-sm">Featured Single</span>
                                        </div>
                                    ) : (
                                        <p className="text-xl font-bold text-muted-foreground">No Tracks Found</p>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 text-center border-2 border-dashed border-border/40 rounded-xl bg-background/50">
                                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4 mx-auto" />
                                <h3 className="font-semibold text-lg">Detailed analytics coming soon</h3>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
                                    We are currently building the infrastructure to track real-time radio plays for your tracks. Check back later!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            )}

            {isArtist && (
                <TabsContent value="uploads" className="mt-6">
                    <Card className="bg-card/50 backdrop-blur border-border/40">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle className="text-primary flex items-center">
                                    <Music2 className="w-5 h-5 mr-2" />
                                    Your Uploads
                                </CardTitle>
                                <CardDescription>Manage your track submissions to Pie Radio.</CardDescription>
                            </div>
                            <Button asChild>
                                <Link href="/profile/upload">
                                    <UploadCloud className="w-4 h-4 mr-2" />
                                    Submit Track
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {artistUploads.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/40 rounded-xl bg-background/50">
                                    <Music2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                    <h3 className="font-semibold text-lg">No submissions yet</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-4">
                                        Submit your best tracks for a chance to be featured on our shows.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {artistUploads.map((upload) => (
                                        <div key={upload.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/40 bg-background/50 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <Music2 className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-base truncate">{upload.title}</h4>
                                                    <p className="text-xs text-muted-foreground truncate">{upload.genre} • {new Date(upload.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <Badge
                                                    variant={upload.status === 'approved' ? 'default' : upload.status === 'rejected' ? 'destructive' : 'secondary'}
                                                    className="uppercase text-[10px] tracking-wider"
                                                >
                                                    {upload.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            )}

            <TabsContent value="favorites" className="mt-6">
                <Card className="bg-card/50 backdrop-blur border-border/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500/20" />
                            Your Favourites
                        </CardTitle>
                        <CardDescription>All the shows, presenters, and songs you&apos;ve saved.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!hasFavorites ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/40 rounded-xl bg-background/50">
                                <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <h3 className="font-semibold text-lg">No favourites yet</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                                    Click the heart icon on any song, show, or presenter to add them to your favourites.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Detailed Lists will be here - using the same structure as Activity for consistency */}
                                {likedSongs.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Music2 className="w-4 h-4" /> Liked Songs
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {likedSongs.map((song) => (
                                                <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/40 group hover:border-primary/50 transition-colors">
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                                        {song.cover_url ? (
                                                            <Image src={song.cover_url} alt={song.song_title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                                                <Music2 className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate uppercase italic tracking-tight">{song.song_title}</p>
                                                        <p className="text-xs text-muted-foreground truncate uppercase">{song.artist_name || 'Pie Radio Live'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {likedPresenters.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <User className="w-4 h-4" /> Favorite Presenters
                                        </h4>
                                        <div className="flex flex-wrap gap-4">
                                            {likedPresenters.map((presenter) => (
                                                <Link
                                                    key={presenter.id}
                                                    href={`/presenters/${presenter.slug || presenter.username}`}
                                                    className="flex flex-col items-center gap-2 group"
                                                >
                                                    <Avatar className="w-16 h-16 border-2 border-transparent group-hover:border-primary transition-all">
                                                        <AvatarImage src={presenter.avatar_url || ''} />
                                                        <AvatarFallback>{(presenter.full_name || 'P').charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-bold text-center group-hover:text-primary transition-colors">
                                                        {presenter.full_name || presenter.username}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {likedShows.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Liked Shows
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {likedShows.map((show) => (
                                                <div key={show.id} className="flex gap-4 p-4 rounded-2xl bg-background/40 border border-border/40 group hover:border-primary/50 transition-colors">
                                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                                                        {show.cover_image_url ? (
                                                            <Image src={show.cover_image_url} alt={show.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-muted" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col justify-center gap-1">
                                                        <h5 className="font-display font-black text-lg italic uppercase tracking-tight group-hover:text-primary transition-colors">
                                                            {show.title}
                                                        </h5>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {show.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
