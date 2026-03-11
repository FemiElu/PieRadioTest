import { Metadata } from 'next';
import { OnboardingWizard } from '@/components/profile/onboarding-wizard';
import { requireServerAuth } from '@/lib/auth/server-auth';

export const metadata: Metadata = {
    title: 'Complete Your Profile - Pie Radio',
    description: 'Set up your Pie Radio listener or artist profile.',
};

export default async function OnboardingPage() {
    const { user, profile } = await requireServerAuth();

    return (
        <div className="container max-w-2xl py-12">
            <div className="mb-8 text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Welcome to Pie Radio</h1>
                <p className="text-muted-foreground text-lg">
                    Let&apos;s personalize your experience. Are you here to listen to great music, or are you an artist looking to be heard?
                </p>
            </div>

            <OnboardingWizard initialProfile={profile} />
        </div>
    );
}
