'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music2, Play, UploadCloud, Radio } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TrackVettingModal } from '@/components/admin/track-vetting-modal';
import { toast } from 'sonner';

// Removed ShowLookup interface as we store titles directly

export default function AdminArtistUploadsPage() {
    const supabase = createClient();
    const [uploads, setUploads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUpload, setSelectedUpload] = useState<any | null>(null);

    const fetchUploads = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('artist_uploads')
            .select('*, profiles!artist_id(full_name, email)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch pending uploads:', error);
            toast.error('Failed to fetch pending track submissions.');
        } else {
            setUploads(data || []);
        }
        setIsLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchUploads();
    }, [fetchUploads]);

    const handleStatusAction = async (id: string, action: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('artist_uploads')
            .update({ status: action })
            .eq('id', id);

        if (error) {
            console.error(`Error updating status to ${action}:`, error);
            throw new Error(`Failed to mark track as ${action}.`);
        }

        toast.success(`Track successfully ${action}!`);
        fetchUploads();

        // In a real production setup, we would trigger an email from the server logic here via a fetch call to an API Route or Server Action.
        // For example: await fetch('/api/admin/notify-artist', { method: 'POST', body: JSON.stringify({ id, action }) });
        await fetch('/api/admin/notify-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId: id, action })
        }).catch(err => console.error("Notification trigger failed:", err));
    };

    const getPreferredShowNames = (upload: any): string[] => {
        const ids = upload.preferred_show_ids as string[] | null;
        if (!ids || ids.length === 0) return [];
        return ids; // ids are now show titles
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-4xl font-black font-display tracking-tight text-[#141827] uppercase italic">
                    Artist <span className="text-primary">Uploads</span>
                </h1>
                <p className="text-zinc-500 mt-2 max-w-2xl">
                    Review and moderate music submitted directly by verified artists. Approved tracks will automatically enter the radio playlist queue.
                </p>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="bg-zinc-50/50 border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-primary" />
                        Pending Moderation Queue
                        <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary hover:bg-primary/20">{uploads.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                        Tracks waiting for A&R approval.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
                            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
                            <p className="text-sm font-medium">Loading submissions...</p>
                        </div>
                    ) : uploads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                                <Music2 className="w-8 h-8 text-zinc-300" />
                            </div>
                            <h3 className="font-bold text-lg text-[#141827]">Queue is empty</h3>
                            <p className="text-zinc-500 text-sm max-w-sm mt-1">
                                There are currently no pending track submissions from artists to review.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {uploads.map((upload) => {
                                const preferredShowNames = getPreferredShowNames(upload);
                                return (
                                    <div key={upload.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4 hover:bg-zinc-50/50 transition-colors group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                                <Music2 className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-[#141827] truncate">{upload.title}</h4>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{upload.genre}</Badge>
                                                    <span className="text-xs text-zinc-500 truncate">by {upload.profiles?.full_name || 'Unknown'}</span>
                                                </div>
                                                {preferredShowNames.length > 0 && (
                                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                        <Radio className="w-3 h-3 text-primary shrink-0" />
                                                        {preferredShowNames.map((name) => (
                                                            <Badge key={name} variant="secondary" className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20">
                                                                {name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 sm:w-auto w-full justify-between sm:justify-end">
                                            <div className="text-xs text-zinc-400 text-right hidden sm:block">
                                                {new Date(upload.created_at).toLocaleDateString()}<br />
                                                {new Date(upload.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <Button
                                                onClick={() => setSelectedUpload(upload)}
                                                className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Review
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <TrackVettingModal
                upload={selectedUpload}
                isOpen={!!selectedUpload}
                onClose={() => setSelectedUpload(null)}
                onAction={handleStatusAction}
            />
        </div>
    );
}

