// @ts-ignore: Deno global is provided by the Supabase Edge runtime
declare const Deno: any;

// @ts-ignore: Deno URL imports are valid in the Supabase Edge runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno URL imports are valid in the Supabase Edge runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function processDeletions() {
    try {
        // Initialize Supabase admin client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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

        // 2. Process each request sequentially to avoid overwhelming rate limits
        for (const request of requests) {
            const uid = request.user_id;
            console.log(`Processing deletion for user ID: ${uid}`);

            try {
                // A: Cleanup Storage Buckets (Avatars & Track Uploads) before DB row deletes
                // Find artist uploads to get file paths
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

                    // Remove from track-submissions bucket
                    if (filesToRemove.length > 0) {
                        await supabase.storage.from('track-submissions').remove(filesToRemove);
                        console.log(`Removed ${filesToRemove.length} storage files for user ${uid}`);
                    }
                }

                // If user uploaded an avatar (check profiles bucket if existing)
                await supabase.storage.from('avatars').remove([`${uid}`, `${uid}/avatar.jpg`, `${uid}/avatar.png`]);

                // B: Fire the massive DB Cleanup RPC (Transactions safety)
                const { error: rpcError } = await supabase.rpc('admin_cascade_delete_user', {
                    target_uid: uid
                });

                if (rpcError) throw new Error(`RPC Cleanup Failed: ${rpcError.message}`);

                // C: Delete from Supabase Auth (This is permanent and revokes sessions immediately)
                const { error: authError } = await supabase.auth.admin.deleteUser(uid);
                
                // If the user was already deleted from Auth (e.g. manual delete), just log and continue
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

            } catch (err: any) {
                console.error(`Failed deletion for user ${uid}: ${err.message}`);
                stats.failed++;

                // Mark request as Failed to avoid infinite spinning
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
    } catch (error: any) {
        console.error("Critical Failure:", error.message);
        throw error;
    }
}

// Enable standard HTTP triggering for manual testing / admin dashboard triggers
serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const result = await processDeletions();
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

// Configure Cron Job for 2:00 AM every single day natively on Deno runtime
Deno.cron('Automated Account Deletion Sweep', '0 2 * * *', async () => {
    console.log('Automated Cron triggered: Account Deletion Sweep.');
    await processDeletions();
});
