"use client";

import { useState } from "react";
import { Mail, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

interface PresenterContactFormProps {
    presenterId: string;
    presenterName: string | null;
}

export function PresenterContactForm({ presenterId, presenterName }: PresenterContactFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const senderName = formData.get("name") as string;
        const senderEmail = formData.get("email") as string;
        const message = formData.get("message") as string;

        try {
            const supabase = createClient();

            const { error: insertError } = await supabase
                .from("presenter_messages")
                .insert({
                    presenter_id: presenterId,
                    sender_name: senderName,
                    sender_email: senderEmail,
                    message: message,
                });

            if (insertError) {
                throw insertError;
            }

            setIsSuccess(true);
            (e.target as HTMLFormElement).reset();
        } catch (err: any) {
            console.error("Error sending message:", err);
            setError(err.message || "Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-white rounded-3xl border border-border p-8">
                <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display">Message Sent!</h3>
                    <p className="text-muted-foreground">
                        Your message has been sent to {presenterName || "the presenter"}.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setIsSuccess(false)}
                        className="mt-4"
                    >
                        Send Another Message
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold font-display">Send a Message</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Your Name
                    </label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your name"
                        required
                        className="rounded-xl"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                    </label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@email.com"
                        required
                        className="rounded-xl"
                    />
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                        Message
                    </label>
                    <Textarea
                        id="message"
                        name="message"
                        placeholder="Write your message..."
                        required
                        rows={4}
                        className="rounded-xl resize-none"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                        {error}
                    </p>
                )}

                <Button
                    type="submit"
                    className="w-full rounded-xl font-bold"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
