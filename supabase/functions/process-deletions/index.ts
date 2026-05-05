import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function processDeletions() {
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log('Starting account deletion sweep...');

    // 1. Fetch pending deletion requests
    const { data: requests, error: fetchError } = await supabase
        .from('deletion_requests')
        .select('*')
        .eq('status', 'pending');

    if (fetchError) throw fetchError;
    if (!requests || requests.length === 0) {
        console.log('No pending deletion requests found.');
        return { successful: 0, failed: 0, message: "No pending requests." };
    }

    const stats = { successful: 0, failed: 0 };

    // 2. Process each request sequentially
    for (const request of requests) {
        const uid = request.user_id;
        console.log(`Processing deletion for user ID: ${uid}`);

        try {
            // A: Cleanup Storage Buckets (Avatars & Track Uploads)
            const { data: uploads } = await supabase
                .from('artist_uploads')
                .select('audio_url, cover_art_url')
                .eq('artist_id', uid);

            if (uploads && uploads.length > 0) {
                const filesToRemove: string[] = [];
                uploads.forEach(u => {
                    if (u.audio_url) filesToRemove.push(u.audio_url);
                    if (u.cover_art_url) filesToRemove.push(u.cover_art_url);
                });

                if (filesToRemove.length > 0) {
                    await supabase.storage.from('track-submissions').remove(filesToRemove);
                }
            }

            // Remove avatar
            await supabase.storage.from('avatars').remove([`${uid}`, `${uid}/avatar.jpg`, `${uid}/avatar.png`]);

            // B: Fire the DB Cleanup RPC
            const { error: rpcError } = await supabase.rpc('admin_cascade_delete_user', {
                target_uid: uid
            });

            if (rpcError) throw new Error(`RPC Cleanup Failed: ${rpcError.message}`);

            // C: Delete from Supabase Auth
            const { error: authError } = await supabase.auth.admin.deleteUser(uid);
            
            if (authError && !authError.message.includes('User not found')) {
                throw new Error(`Auth Deletion Failed: ${authError.message}`);
            }

            // D: Mark request as Processed
            await supabase
                .from('deletion_requests')
                .update({
                    status: 'processed',
                    processed_at: new Date().toISOString()
                })
                .eq('id', request.id);

            console.log(`Successfully completed deletion for ${uid}`);
            stats.successful++;

        } catch (err) {
            console.error(`Failed deletion for user ${uid}: ${err.message}`);
            stats.failed++;

            await supabase
                .from('deletion_requests')
                .update({
                    status: 'failed',
                    error_message: err.message,
                    processed_at: new Date().toISOString()
                })
                .eq('id', request.id);
        }
    }

    return { message: "Deletion sweep complete.", stats };
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const result = await processDeletions();
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        console.error('Function error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

// Re-adding Cron with a check for Deno.cron existence
if (typeof (Deno as any).cron === 'function') {
    (Deno as any).cron('Automated Account Deletion Sweep', '0 2 * * *', async () => {
        console.log('Automated Cron triggered: Account Deletion Sweep.');
        await processDeletions();
    });
}
