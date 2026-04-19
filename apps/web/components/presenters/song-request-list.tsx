"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Music,
    Play,
    CheckCircle,
    Clock,
    User,
    Loader2,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { updateRequestStatus } from "@/app/actions/music-requests";
import { toast } from "sonner";

interface SongRequest {
    id: string;
    artist_name: string;
    song_title: string;
    listener_note: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'played';
    created_at: string;
    profiles?: {
        full_name: string | null;
        username: string | null;
    };
}

interface SongRequestListProps {
    showId: string;
}

export function SongRequestList({ showId }: SongRequestListProps) {
    const [requests, setRequests] = useState<SongRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const supabase = createClient();

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('music_requests')
            .select(`
                *,
                profiles!music_requests_requested_by_user_id_fkey(full_name, username)
            `)
            .eq('show_id', showId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching requests:", error);
            toast.error("Failed to load song requests");
        } else {
            setRequests(data as SongRequest[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!showId) return;

        fetchRequests();

        // Realtime subscription
        const channel = supabase
            .channel(`show-requests-${showId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'music_requests',
                    filter: `show_id=eq.${showId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // For inserts, we need to fetch the profile info too
                        // A quick re-fetch is easiest for real-time with joins
                        fetchRequests();
                    } else if (payload.eventType === 'UPDATE') {
                        setRequests(prev => prev.map(req => 
                            req.id === payload.new.id ? { ...req, ...payload.new } : req
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        setRequests(prev => prev.filter(req => req.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [showId, fetchRequests, supabase]);

    const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'played') => {
        setUpdatingId(requestId);
        try {
            await updateRequestStatus(requestId, newStatus);
            toast.success(`Request marked as ${newStatus}`);
            // Local update (optimistic-ish)
            setRequests(prev => prev.map(req => 
                req.id === requestId ? { ...req, status: newStatus } : req
            ));
        } catch (error: any) {
            toast.error(error.message || "Failed to update request");
        } finally {
            setUpdatingId(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const playingOrApproved = requests.filter(r => r.status === 'approved' || r.status === 'played');

    return (
        <Card id="song-requests-section" className="w-full border-border/50 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Music className="w-5 h-5 text-primary" />
                            Song Requests
                            {pendingRequests.length > 0 && (
                                <Badge variant="destructive" className="ml-2 rounded-full px-2 animate-pulse">
                                    {pendingRequests.length} new
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Real-time song requests from your listeners.
                        </CardDescription>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={fetchRequests} 
                        disabled={loading}
                        className="rounded-xl"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading && requests.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Music className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-lg mb-1">No requests yet</h3>
                        <p className="text-muted-foreground">
                            When listeners request songs for this show, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {requests.map((req) => (
                            <div
                                key={req.id}
                                className={`p-4 transition-colors hover:bg-muted/30 ${req.status === 'pending' ? 'bg-primary/5' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-foreground">
                                                {req.song_title}
                                            </span>
                                            <span className="text-muted-foreground px-1">—</span>
                                            <span className="font-medium text-foreground/80">
                                                {req.artist_name}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {req.profiles?.full_name || req.profiles?.username || 'Guest'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(req.created_at), "h:mm a")}
                                            </span>
                                            <Badge 
                                                variant={
                                                    req.status === 'pending' ? 'outline' : 
                                                    req.status === 'approved' ? 'default' : 
                                                    req.status === 'played' ? 'secondary' : 'destructive'
                                                }
                                                className="text-[10px] uppercase font-bold py-0"
                                            >
                                                {req.status}
                                            </Badge>
                                        </div>

                                        {req.listener_note && (
                                            <div className="text-sm bg-muted/50 p-2 rounded-lg border border-border/50 italic text-muted-foreground">
                                                &quot;{req.listener_note}&quot;
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {req.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="rounded-xl gap-1"
                                                onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                disabled={updatingId === req.id}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Approve</span>
                                            </Button>
                                        )}
                                        {(req.status === 'pending' || req.status === 'approved') && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="rounded-xl gap-1"
                                                onClick={() => handleUpdateStatus(req.id, 'played')}
                                                disabled={updatingId === req.id}
                                            >
                                                <Play className="w-4 h-4" />
                                                <span>Play</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
