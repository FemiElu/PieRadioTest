export const dynamic = "force-dynamic";

import { getRequests } from '@/app/actions/music-requests';
import RequestsDashboard from '@/components/admin/RequestsDashboard';
import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Music Requests | Presenter Dashboard',
};

export default async function RequestsPage() {
    const supabase = await createClient();

    // Fetch Station ID logic
    // TODO: Replace with actual Presenter->Station assignment logic when available.
    // For now, defaulting to the first station in metadata.
    const { data: station } = await supabase
        .from('station_metadata')
        .select('id')
        .limit(1)
        .single();

    const stationId = Number(station?.id || 1);

    const requests = await getRequests(stationId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Music Requests</h2>
                    <p className="text-muted-foreground">Approve or reject listener requests for Station #{stationId}</p>
                </div>
            </div>

            <RequestsDashboard initialRequests={requests || []} />
        </div>
    );
}
