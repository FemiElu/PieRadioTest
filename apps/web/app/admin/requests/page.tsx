import { getAdminRequests } from '@/app/actions/music-requests';
import AdminRequestsDashboard from '@/components/admin/AdminRequestsDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Music Requests | Admin Dashboard',
    description: 'Manage listener music requests',
};

/**
 * Admin Music Requests Page
 * 
 * MVP: Single-station deployment
 * - All requests are shown (no station filtering)
 * - Admin-only access (enforced by server action + RLS)
 */
export default async function AdminRequestsPage() {
    const requests = await getAdminRequests();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Music Requests</h2>
                <p className="text-muted-foreground">
                    Approve or reject listener song requests. Approved requests are queued for the playlist.
                </p>
            </div>

            <AdminRequestsDashboard initialRequests={requests || []} />
        </div>
    );
}
