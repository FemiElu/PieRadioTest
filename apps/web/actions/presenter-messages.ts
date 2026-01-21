'use server'

import { createClient } from "@/lib/supabase/server";

export type MessageKey = "id" | "presenter_id" | "sender_name" | "sender_email" | "message" | "is_read" | "created_at";

export interface PresenterMessage {
    id: string;
    presenter_id: string;
    sender_name: string;
    sender_email: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export async function getPresenterMessages(): Promise<{ success: boolean; data?: PresenterMessage[]; error?: string }> {
    try {
        const supabase = await createClient();

        // createClient handles the cookie auth automatically
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("presenter_messages")
            .select("*")
            .eq("presenter_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase fetch error:", error);
            return { success: false, error: "Failed to fetch messages" };
        }

        return { success: true, data: data as PresenterMessage[] };

    } catch (error) {
        console.error("Server action error:", error);
        return { success: false, error: "Unexpected error" };
    }
}

export async function markPresenterMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("presenter_messages")
            .update({ is_read: true })
            .eq("id", messageId);

        if (error) {
            console.error("Supabase update error:", error);
            return { success: false, error: "Failed to update message" };
        }

        return { success: true };

    } catch (error) {
        console.error("Server action error:", error);
        return { success: false, error: "Unexpected error" };
    }
}
