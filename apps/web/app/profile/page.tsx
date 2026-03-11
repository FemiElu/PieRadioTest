import { Metadata } from 'next';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { createClient } from '@/lib/supabase/server';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Profile & Settings - Pie Radio',
    description: 'Manage your Pie Radio profile and settings.',
};

export default async function ProfilePage() {
    const { user, profile } = await requireServerAuth();
    const supabase = await createClient();

    // Check if user has an artist profile
    const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // Fetch user's favourites
    const [
        { data: likedShowEntries },
        { data: likedPresenterEntries },
        { data: likedSongs }
    ] = await Promise.all([
        supabase.from('liked_shows').select('show_id, show_title, show_image_url, shows(*)').eq('user_id', user.id),
        supabase.from('liked_presenters').select('presenter_id, profiles!liked_presenters_presenter_id_fkey(*)').eq('user_id', user.id),
        supabase.from('liked_songs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    let artistUploads: any[] = [];
    if (artistProfile) {
        const { data } = await supabase
            .from('artist_uploads')
            .select('*')
            .eq('artist_id', user.id)
            .order('created_at', { ascending: false });
        if (data) artistUploads = data;
    }

    // For this example, let's say "onboarding" is incomplete if they haven't explicitly set a type.
    // However, we don't have a rigid flag yet. We'll show the banner for everyone who isn't an artist
    // to prompt them to choose, or if they haven't set any interests.
    // For now, let's just show it if `artistProfile` is null.
    // In reality, we might want a 'has_completed_onboarding' flag in profiles.

    const isArtist = !!artistProfile;
    const showOnboardingPrompt = !isArtist; // For demo, assuming anyone without an artist profile might want to complete it. 

    return (
        <div className="container max-w-5xl py-8">
            {showOnboardingPrompt && (
                <Alert className="mb-8 border-primary/50 bg-primary/5">
                    <InfoIcon className="h-5 w-5 text-primary" />
                    <AlertTitle>Complete your profile</AlertTitle>
                    <AlertDescription className="flex items-center justify-between mt-2">
                        <span>Are you an artist looking to be featured? Or want to customize your listening experience?</span>
                        <Link href="/profile/onboarding" className="flex items-center text-primary font-medium hover:underline">
                            Complete Now <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            <ProfileHeader profile={profile} artistProfile={artistProfile} />
            <div className="mt-8">
                <ProfileTabs
                    profile={profile}
                    artistProfile={artistProfile}
                    likedShows={likedShowEntries?.map((e: any) => e.shows || {
                        id: e.show_id,
                        title: e.show_title || 'Unknown Show',
                        artwork_url: e.show_image_url
                    }) || []}
                    likedPresenters={likedPresenterEntries?.map((e: any) => e.profiles) || []}
                    likedSongs={likedSongs || []}
                    artistUploads={artistUploads}
                />
            </div>
        </div>
    );
}
