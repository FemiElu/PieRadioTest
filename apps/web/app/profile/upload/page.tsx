import { Metadata } from 'next';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { createClient } from '@/lib/supabase/server';
import { TrackUploadClient } from './track-upload-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Upload Track - Pie Radio',
    description: 'Submit your music to be featured on Pie Radio.',
};

export default async function UploadPage() {
    const { user } = await requireServerAuth();
    const supabase = await createClient();

    const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    const isArtist = !!artistProfile;

    if (!isArtist) {
        return (
            <div className="container max-w-2xl mx-auto py-20 px-4">
                <Card className="bg-card/50 backdrop-blur border-primary/20 shadow-xl overflow-hidden relative">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <CardHeader className="text-center pt-10 pb-6 relative z-10">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                            <Music2 className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-black font-display uppercase italic tracking-tight">
                            Claim Your <span className="text-primary">Artist Profile</span>
                        </CardTitle>
                        <CardDescription className="text-base mt-3 max-w-md mx-auto">
                            To submit your tracks to Pie Radio, you need to set up an artist profile first. It only takes a minute!
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 text-center relative z-10 pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-left">
                                <h4 className="font-semibold text-sm mb-1">Get Discovered</h4>
                                <p className="text-xs text-muted-foreground">Submit directly to our A&R team and presenters.</p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-left">
                                <h4 className="font-semibold text-sm mb-1">Artist Dashboard</h4>
                                <p className="text-xs text-muted-foreground">Track your submissions and upcoming plays.</p>
                            </div>
                        </div>
                        
                        <Button asChild size="lg" className="font-bold uppercase tracking-wider w-full sm:w-auto">
                            <Link href="/profile/onboarding">
                                Set up Artist Profile <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <TrackUploadClient />;
}
