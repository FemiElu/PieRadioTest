'use server'

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
    presenterId: z.string().uuid(),
    senderName: z.string().min(1, "Name is required"),
    senderEmail: z.string().email("Invalid email address"),
    message: z.string().min(1, "Message is required"),
});

export type SendMessageState = {
    success: boolean;
    error?: string;
    message?: string;
}

export async function sendPresenterMessage(prevState: SendMessageState, formData: FormData): Promise<SendMessageState> {
    try {
        const rawData = {
            presenterId: formData.get("presenterId"),
            senderName: formData.get("senderName"),
            senderEmail: formData.get("senderEmail"),
            message: formData.get("message"),
        };

        const validatedData = schema.safeParse(rawData);

        if (!validatedData.success) {
            return {
                success: false,
                error: validatedData.error.flatten().fieldErrors.senderEmail?.[0] || "Invalid input data",
            };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from("presenter_messages")
            .insert({
                presenter_id: validatedData.data.presenterId,
                sender_name: validatedData.data.senderName,
                sender_email: validatedData.data.senderEmail,
                message: validatedData.data.message,
            });

        if (error) {
            console.error("Supabase insert error:", error);
            return {
                success: false,
                error: "Failed to send message. Please try again later.",
            };
        }

        return {
            success: true,
            message: "Message sent successfully!",
        };

    } catch (error) {
        console.error("Server action error:", error);
        return {
            success: false,
            error: "An unexpected error occurred.",
        };
    }
}
