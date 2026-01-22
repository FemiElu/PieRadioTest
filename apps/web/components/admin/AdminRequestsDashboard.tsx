'use client';

import { useState } from 'react';
import { updateRequestStatus } from '@/app/actions/music-requests';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

/**
 * Music Request type for admin dashboard
 * MVP: Single-station, admin-only management
 */
interface MusicRequest {
    id: string;
    artist_name: string;
    song_title: string;
    listener_note: string | null;
    status: string | null;
    created_at: string | null;
    profiles: {
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
        email: string | null;
    } | null;
}

interface AdminRequestsDashboardProps {
    initialRequests: MusicRequest[];
}

/**
 * Admin Music Requests Dashboard
 * 
 * MVP: Admin-only management
 * - View all pending/processed requests (last 24h)
 * - Approve requests → triggers email notification + playlist queue
 * - Reject requests → requires reason
 */
export default function AdminRequestsDashboard({ initialRequests }: AdminRequestsDashboardProps) {
    const [requests, setRequests] = useState<MusicRequest[]>(initialRequests);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
        setIsProcessing(true);
        try {
            await updateRequestStatus(id, status, reason);

            // Optimistic update
            setRequests(current =>
                current.map(req =>
                    req.id === id
                        ? { ...req, status, rejection_reason: reason || null }
                        : req
                )
            );

            if (status === 'rejected') {
                setRejectingId(null);
                setRejectionReason('');
            }
        } catch (error) {
            console.error('Failed to update request:', error);
            alert('Failed to update request. It might be expired or already processed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const openRejectModal = (id: string) => {
        setRejectingId(id);
        setRejectionReason('');
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="space-y-6">
            {/* Pending Requests */}
            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Pending Requests ({pendingRequests.length})
                </h3>
                <div className="rounded-md border bg-card">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4">Song Details</th>
                                <th className="p-4">Requested By</th>
                                <th className="p-4">Time</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {pendingRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No pending requests.
                                    </td>
                                </tr>
                            ) : (
                                pendingRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-muted/30">
                                        <td className="p-4">
                                            <div className="font-medium text-foreground">{req.song_title}</div>
                                            <div className="text-muted-foreground">{req.artist_name}</div>
                                            {req.listener_note && (
                                                <div className="text-xs italic mt-1 text-muted-foreground">
                                                    &quot;{req.listener_note}&quot;
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {req.profiles?.avatar_url && (
                                                    <Image
                                                        src={req.profiles.avatar_url}
                                                        width={24}
                                                        height={24}
                                                        className="w-6 h-6 rounded-full"
                                                        alt={req.profiles.full_name || req.profiles.username || "User"}
                                                    />
                                                )}
                                                <div>
                                                    <span className="block">
                                                        {req.profiles?.full_name || req.profiles?.username || 'Unknown'}
                                                    </span>
                                                    {req.profiles?.email && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {req.profiles.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {req.created_at &&
                                                formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleStatusUpdate(req.id, 'approved')}
                                                disabled={isProcessing}
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => openRejectModal(req.id)}
                                                disabled={isProcessing}
                                            >
                                                <X className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Processed Requests */}
            {processedRequests.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
                        Recently Processed ({processedRequests.length})
                    </h3>
                    <div className="rounded-md border bg-card">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="p-4">Song</th>
                                    <th className="p-4">Requester</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {processedRequests.map((req) => (
                                    <tr key={req.id} className="opacity-60">
                                        <td className="p-4">
                                            {req.artist_name} - {req.song_title}
                                        </td>
                                        <td className="p-4">
                                            {req.profiles?.full_name || req.profiles?.username || 'Unknown'}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={req.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reject Dialog */}
            <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                            id="reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g. Recently played, explicit content..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => rejectingId && handleStatusUpdate(rejectingId, 'rejected', rejectionReason)}
                            disabled={!rejectionReason.trim() || isProcessing}
                        >
                            Reject Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatusBadge({ status }: { status: string | null }) {
    if (status === 'rejected') {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Rejected
            </span>
        );
    }
    if (status === 'approved') {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Approved
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            Pending
        </span>
    );
}
