'use client';

import { useActionState } from 'react';
import { submitRequest, SubmitRequestState } from '@/app/actions/music-requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRef, useEffect } from 'react';

// Initialize with valid empty state per type definition
const initialState: SubmitRequestState = {
    message: '',
    errors: {}
};

interface RequestFormProps {
    stationId: number;
    showId?: string | null;
}

export default function RequestForm({ stationId, showId }: RequestFormProps) {
    // Use useActionState hook (standard in Next.js 14/15)
    // Ensure we pass the initial state correctly
    const [state, formAction, isPending] = useActionState(submitRequest, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.message?.includes('successfully')) {
            formRef.current?.reset();
        }
    }, [state]);

    return (
        <div className="w-full max-w-md p-6 bg-card rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Request a Song</h3>

            <form ref={formRef} action={formAction} className="space-y-4">
                {/* Hidden Station ID & Show ID */}
                <input type="hidden" name="station_id" value={stationId} />
                {showId && <input type="hidden" name="show_id" value={showId} />}

                <div className="space-y-2">
                    <Label htmlFor="artist_name">Artist Name *</Label>
                    <Input
                        id="artist_name"
                        name="artist_name"
                        placeholder="e.g. Wizkid"
                        required
                        aria-describedby="artist-error"
                    />
                    {state.errors?.artist_name && (
                        <p id="artist-error" className="text-sm text-destructive font-medium">
                            {state.errors.artist_name.join(', ')}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="song_title">Song Title *</Label>
                    <Input
                        id="song_title"
                        name="song_title"
                        placeholder="e.g. Essence"
                        required
                        aria-describedby="song-error"
                    />
                    {state.errors?.song_title && (
                        <p id="song-error" className="text-sm text-destructive font-medium">
                            {state.errors.song_title.join(', ')}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="listener_note">Note (Optional)</Label>
                    <Textarea
                        id="listener_note"
                        name="listener_note"
                        placeholder="Shoutout to..."
                        className="resize-none"
                    />
                </div>

                {state.message && (
                    <div className={`p-3 rounded-md text-sm ${state.message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {state.message}
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? 'Sending...' : 'Send Request'}
                </Button>
            </form>
        </div>
    );
}
