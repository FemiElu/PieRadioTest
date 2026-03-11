'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitOnboarding } from '@/app/actions/profile';
import { Headphones, Mic2, Loader2, Music2, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ProfileType = 'listener' | 'artist' | null;

const GENRES = ['AfroBeats', 'R&B', 'Hip Hop', 'Amapiano', 'Dancehall', 'UK Drill', 'Grime', 'House'];

export function OnboardingWizard({ initialProfile }: { initialProfile: any }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [type, setType] = useState<ProfileType>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [interests, setInterests] = useState<string[]>([]);
    const [stageName, setStageName] = useState('');
    const [bio, setBio] = useState('');
    const [spotifyId, setSpotifyId] = useState('');
    const [appleMusicId, setAppleMusicId] = useState('');

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const toggleInterest = (genre: string) => {
        setInterests(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        );
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const result = await submitOnboarding({
                type: type!,
                interests: type === 'listener' ? interests : undefined,
                stageName: type === 'artist' ? stageName : undefined,
                bio: type === 'artist' ? bio : undefined,
                spotifyId: type === 'artist' ? spotifyId : undefined,
                appleMusicId: type === 'artist' ? appleMusicId : undefined,
            });

            if (result.success) {
                toast.success('Profile updated successfully!');
                router.push('/profile');
            } else {
                toast.error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-border/40 shadow-lg bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle>
                    {step === 1 && "Choose your path"}
                    {step === 2 && type === 'listener' && "What do you love to hear?"}
                    {step === 2 && type === 'artist' && "Claim Your Artist Profile"}
                </CardTitle>
                <CardDescription>
                    {step === 1 && "Select how you primarily plan to use Pie Radio."}
                    {step === 2 && type === 'listener' && "Select your favorite genres to personalize your experience."}
                    {step === 2 && type === 'artist' && "Tell us about yourself so we can feature you on the platform."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <button
                            onClick={() => setType('listener')}
                            className={cn(
                                "flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]",
                                type === 'listener'
                                    ? "border-primary bg-primary/10"
                                    : "border-border/40 bg-background/50 hover:border-primary/50 hover:bg-primary/5"
                            )}
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                                <Headphones className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Listener</h3>
                            <p className="text-sm text-center text-muted-foreground">
                                I&apos;m here to discover music, listen to shows, and interact with presenters.
                            </p>
                        </button>

                        <button
                            onClick={() => setType('artist')}
                            className={cn(
                                "flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]",
                                type === 'artist'
                                    ? "border-primary bg-primary/10"
                                    : "border-border/40 bg-background/50 hover:border-primary/50 hover:bg-primary/5"
                            )}
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                                <Mic2 className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Artist</h3>
                            <p className="text-sm text-center text-muted-foreground">
                                I make music and want to share it, be featured, and track my radio plays.
                            </p>
                        </button>
                    </div>
                )}

                {step === 2 && type === 'listener' && (
                    <div className="py-4">
                        <div className="flex flex-wrap gap-3">
                            {GENRES.map(genre => {
                                const isSelected = interests.includes(genre);
                                return (
                                    <button
                                        key={genre}
                                        onClick={() => toggleInterest(genre)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                                            isSelected
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border/40 hover:border-primary hover:text-primary"
                                        )}
                                    >
                                        <Radio className="w-4 h-4" />
                                        {genre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 2 && type === 'artist' && (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="stageName">Stage Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="stageName"
                                placeholder="Your artist or band name"
                                value={stageName}
                                onChange={(e) => setStageName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Short Bio</Label>
                            <Textarea
                                id="bio"
                                placeholder="Tell us a bit about your musical journey..."
                                className="resize-none"
                                rows={4}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="spotify">Spotify Artist ID (Optional)</Label>
                                <div className="relative">
                                    <Music2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="spotify"
                                        placeholder="e.g. 0Tk0BcbJ1k..."
                                        className="pl-9"
                                        value={spotifyId}
                                        onChange={(e) => setSpotifyId(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Found in your Spotify URL</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apple">Apple Music ID (Optional)</Label>
                                <div className="relative">
                                    <Music2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="apple"
                                        placeholder="e.g. 153098..."
                                        className="pl-9"
                                        value={appleMusicId}
                                        onChange={(e) => setAppleMusicId(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border/40 pt-6">
                {step > 1 ? (
                    <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                        Back
                    </Button>
                ) : (
                    <div></div> // Spacing
                )}

                {step < 2 ? (
                    <Button onClick={handleNext} disabled={!type}>
                        Continue
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || (type === 'artist' && !stageName.trim())}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complete Profile
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
