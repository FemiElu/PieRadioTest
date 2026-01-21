/**
 * Email Notification Service
 * Uses Resend for sending transactional emails.
 * 
 * Environment: RESEND_API_KEY must be set.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender - update with your verified domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Pie Radio <no-reply@pieradio.co.uk>';

export interface ApprovalEmailData {
    toEmail: string;
    userName: string;
    artistName: string;
    songTitle: string;
}

/**
 * Send song request approval notification email.
 * Called AFTER the status update commits (async, non-blocking).
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: data.toEmail,
            subject: '🎵 Your Song Request Has Been Approved!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #8B5CF6;">Great News, ${data.userName}!</h1>
                    <p style="font-size: 16px; color: #333;">
                        Your request for <strong>"${data.songTitle}"</strong> by <strong>${data.artistName}</strong> 
                        has been approved by our team.
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Stay glued to Pie Radio – your song is in the queue! 🎧
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 14px; color: #666;">
                        Thank you for listening to Pie Radio.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('[Email] Failed to send approval email:', error);
            return { success: false, error: error.message };
        }

        console.log('[Email] Approval email sent to:', data.toEmail);
        return { success: true };
    } catch (err) {
        console.error('[Email] Unexpected error:', err);
        return { success: false, error: 'Unexpected error sending email' };
    }
}
