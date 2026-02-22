'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const waitlistSchema = z.object({
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email("Please enter a valid email address."),
});

export type WaitlistState = {
    success?: boolean;
    message?: string;
    errors?: {
        fullName?: string[];
        email?: string[];
    };
};

/**
 * Join Waitlist Server Action
 * 
 * 1. Validates input
 * 2. Inserts into Supabase
 * 3. (Optional) Pings Google Sheets Webhook
 */
export async function joinWaitlist(
    prevState: any,
    formData: FormData
): Promise<WaitlistState> {
    const fullName = formData.get('fullName')?.toString().trim();
    const email = formData.get('email')?.toString().trim();

    // 1. Validation
    const validatedFields = waitlistSchema.safeParse({ fullName, email });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Please fix the errors below.",
        };
    }

    const { fullName: validatedName, email: validatedEmail } = validatedFields.data;

    try {
        const supabase = await createClient();

        // 2. Insert into Supabase
        const { error: dbError } = await supabase
            .from('waitlist')
            .insert({
                full_name: validatedName,
                email: validatedEmail,
                source: 'partnership_page'
            });

        if (dbError) {
            console.error('[Waitlist] Database Error:', dbError);
            return { message: "Failed to record your entry. Please try again later." };
        }

        // 3. Optional: Sync to Google Sheets
        const googleSheetUrl = process.env.WAITLIST_GOOGLE_SHEET_URL;
        if (googleSheetUrl) {
            console.log('[Waitlist] Syncing to Google Sheets...');
            try {
                const syncResponse = await fetch(googleSheetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName: validatedName, email: validatedEmail }),
                    redirect: 'follow',
                });

                if (!syncResponse.ok) {
                    const errorText = await syncResponse.text();
                    console.error(`[Waitlist] Google Sheet Sync Failed (${syncResponse.status}):`, errorText);
                } else {
                    console.log('[Waitlist] Google Sheet Sync Successful');
                }
            } catch (err) {
                console.error('[Waitlist] Google Sheet Sync Network Error:', err);
            }
        }

        return { success: true, message: "Thank you for joining the waitlist!" };


    } catch (err) {
        console.error('[Waitlist] Unexpected Error:', err);
        return { message: "An unexpected error occurred." };
    }
}
