'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Music2 } from 'lucide-react';
import RequestForm from './RequestForm';
import { useCurrentShow } from '@/hooks/use-current-show';

export default function RequestSongModal() {
    const [open, setOpen] = useState(false);
    const { currentShow } = useCurrentShow();

    // If a show is live, use its ID. Otherwise null/undefined.
    const activeShowId = currentShow?.shows?.id;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-white/10 text-zinc-400 hover:text-white transition-colors rounded-xl h-10 w-10"
                    title="Request a Song"
                >
                    <Music2 className="h-5 w-5" />
                    <span className="sr-only">Request Song</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                    <DialogTitle>Request a Song</DialogTitle>
                </DialogHeader>
                <div className="mt-2 text-sm text-muted-foreground mb-4">
                    {currentShow ? (
                        <p>Requesting to: <span className="font-semibold text-foreground">{currentShow.shows?.title || 'Live Show'}</span></p>
                    ) : (
                        <p>Sending general request to the station.</p>
                    )}
                </div>
                <div className="mt-2">
                    <RequestForm stationId={1} showId={activeShowId} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
