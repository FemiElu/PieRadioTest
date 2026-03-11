'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Link as LinkIcon, Music2, Edit3 } from 'lucide-react';

export function ProfileHeader({ profile, artistProfile }: { profile: any; artistProfile: any }) {
    const isArtist = !!artistProfile;

    // Fallback initials
    const initials = (profile?.full_name?.[0] || profile?.email?.[0] || '?').toUpperCase();

    return (
        <div className="relative rounded-2xl border border-border/40 bg-card overflow-hidden">
            {/* Cover / Background Pattern */}
            <div className="h-32 md:h-48 bg-gradient-to-r from-primary/80 to-purple-600/80 w-full relative">
                {isArtist && artistProfile?.featured_track_url && (
                    <div className="absolute top-4 right-4 max-w-sm hidden sm:block">
                        <div className="bg-background/90 backdrop-blur text-sm flex items-center gap-2 p-2 rounded-lg border border-white/10 shadow-lg">
                            <Music2 className="w-4 h-4 text-primary" />
                            <span className="font-semibold truncate max-w-[150px]">Featured Track</span>
                            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => window.open(artistProfile.featured_track_url, '_blank')}>
                                Listen <LinkIcon className="ml-1 w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-6 pb-6 relative flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-4 -mt-16 sm:-mt-12">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="text-4xl bg-muted text-muted-foreground font-bold">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left pt-2 sm:pt-0 pb-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                        <h2 className="text-3xl font-display font-bold">
                            {isArtist && artistProfile.stage_name ? artistProfile.stage_name : (profile?.full_name || 'Listener')}
                        </h2>
                        {isArtist && artistProfile?.is_verified && (
                            <CheckCircle2 className="w-6 h-6 text-blue-500" />
                        )}
                        {!isArtist && profile?.role !== 'listener' && (
                            <Badge variant="secondary" className="capitalize text-xs tracking-wide">
                                {profile?.role}
                            </Badge>
                        )}
                    </div>

                    <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1">
                        @{profile?.username || profile?.email?.split('@')[0]}
                        {isArtist && <span className="text-xs ml-2 text-primary tracking-wider">ARTIST</span>}
                    </p>
                </div>

                <div className="flex gap-2">
                    {isArtist && artistProfile?.spotify_id && (
                        <Button variant="outline" size="sm" onClick={() => window.open(`https://open.spotify.com/artist/${artistProfile.spotify_id}`)}>
                            Spotify
                        </Button>
                    )}
                    {isArtist && artistProfile?.apple_music_id && (
                        <Button variant="outline" size="sm" onClick={() => window.open(`https://music.apple.com/artist/${artistProfile.apple_music_id}`)}>
                            Apple Music
                        </Button>
                    )}
                    <Button variant="secondary" size="sm">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                </div>
            </div>

            {isArtist && artistProfile.bio && (
                <div className="px-6 pb-6">
                    <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                        {artistProfile.bio}
                    </p>
                </div>
            )}

            {/* If Listener and has bio, show that instead. Though we didn't add bio to listener in onboarding, it might exist in profiles table */}
            {!isArtist && profile?.bio && (
                <div className="px-6 pb-6">
                    <p className="text-sm text-foreground/80 max-w-3xl leading-relaxed">
                        {profile.bio}
                    </p>
                </div>
            )}
        </div>
    );
}
