/**
 * Email Notification Service
 * Uses Resend for sending transactional emails.
 * 
 * Environment: RESEND_API_KEY must be set.
 */

import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend() {
    if (!resendInstance) {
        if (!process.env.RESEND_API_KEY) {
            console.warn('[Email] RESEND_API_KEY is missing. Email functionality will be disabled.');
            return null;
        }
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}

// Default sender - update with your verified domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Pie Radio <no-reply@pieradio.co.uk>';

export interface ApprovalEmailData {
    toEmail: string;
    userName: string;
    artistName: string;
    songTitle: string;
}

export interface TrackDecisionEmailData {
    toEmail: string;
    userName: string;
    trackTitle: string;
    action: 'approved' | 'rejected';
}

/**
 * Send song request approval notification email.
 * Called AFTER the status update commits (async, non-blocking).
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<{ success: boolean; error?: string }> {
    const resend = getResend();
    if (!resend) return { success: false, error: 'Email service not configured' };

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

/**
 * Send track upload decision notification email (Approved/Rejected).
 */
export async function sendTrackDecisionEmail(data: TrackDecisionEmailData): Promise<{ success: boolean; error?: string }> {
    const isApproved = data.action === 'approved';
    const subject = isApproved
        ? `🔥 Your track "${data.trackTitle}" has been APPROVED!`
        : `Update regarding your track submission: "${data.trackTitle}"`;

    const resend = getResend();
    if (!resend) return { success: false, error: 'Email service not configured' };

    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: data.toEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <h1 style="color: ${isApproved ? '#10B981' : '#EF4444'}; text-transform: uppercase;">
                        ${isApproved ? 'Congratulations!' : 'Submission Update'}
                    </h1>
                    <p style="font-size: 16px; color: #333;">
                        Hi ${data.userName},
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Our A&R team has reviewed your track submission: <strong>"${data.trackTitle}"</strong>.
                    </p>
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0; text-align: center;">
                        <h2 style="margin: 0; color: #111827;">Status: 
                            <span style="color: ${isApproved ? '#10B981' : '#EF4444'}; text-transform: uppercase;">
                                ${data.action}
                            </span>
                        </h2>
                    </div>
                    ${isApproved ? `
                        <p style="font-size: 16px; color: #333;">
                            Your track is now in our radio playlist queue and will be scheduled for airplay soon. 
                            Keep an eye on Pie Radio for your feature!
                        </p>
                    ` : `
                        <p style="font-size: 16px; color: #333;">
                            Thank you for sharing your music with us. While this specific track wasn't selected for airplay this time, 
                            we appreciate your talent and encourage you to keep creating and submitting new work in the future.
                        </p>
                    `}
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="font-size: 14px; color: #666;">
                        Stay tuned to Pie Radio – Real Music Matters.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('[Email] Failed to send track decision email:', error);
            return { success: false, error: error.message };
        }

        console.log(`[Email] Track decision (${data.action}) email sent to:`, data.toEmail);
        return { success: true };
    } catch (err) {
        console.error('[Email] Unexpected error:', err);
        return { success: false, error: 'Unexpected error sending email' };
    }
}
