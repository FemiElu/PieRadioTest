"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/ui/file-uploader";
import { useAuth } from "@/context/auth-context";
import { Database } from "@packages/types";
import { Music, Loader2 } from "lucide-react";


// Simple Input component since we might not have one yet
function SimpleInput({ label, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">{label}</label>
            <input
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                {...props}
            />
        </div>
    );
}

export default function ArtistUploadPage() {
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        title: "",
        genre: "",
        description: "",
    });

    const [audioPath, setAudioPath] = useState<string | null>(null);
    const [imagePath, setImagePath] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!audioPath) {
            setError("Please upload your audio track first.");
            return;
        }
        if (!formData.title) {
            setError("Please provide a title for your track.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const { error: dbError } = await supabase
                .from('artist_uploads')
                .insert({
                    artist_id: user?.id ?? null,
                    title: formData.title,
                    genre: formData.genre,
                    audio_url: audioPath,
                    status: 'pending' as Database["public"]["Enums"]["request_status"],
                    reviewed_by: null
                } as any);

            if (dbError) throw dbError;

            router.push('/dashboard/artist?success=true');

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to submit upload. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col w-full min-h-screen">
            {/* Page Header */}
            <section className="bg-zinc-950 text-white pt-24 pb-12">
                <div className="container px-4 md:px-8 max-w-screen-2xl mx-auto">
                    <div className="max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                            <Music className="w-3 h-3" />
                            Talent Showcase
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-tight">
                            Submit Your <span className="text-primary italic">Music</span>
                        </h1>
                        <p className="text-lg text-zinc-400 font-medium">
                            Join the Pie Radio rotation. Submit your freshest tracks for a chance to be featured on air.
                        </p>
                    </div>
                </div>
            </section>

            <section className="container max-w-screen-2xl mx-auto py-12 px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Form Side */}
                <div className="lg:col-span-7 space-y-10">
                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 font-bold text-sm">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <span className="text-lg">!</span>
                            </div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SimpleInput
                                label="Track Title"
                                placeholder="e.g. Midnight City"
                                value={formData.title}
                                onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <SimpleInput
                                label="Genre"
                                placeholder="e.g. Afrobeats / Rap"
                                value={formData.genre}
                                onChange={(e: any) => setFormData({ ...formData, genre: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Audio Track (MP3/WAV)</label>
                            <FileUploader
                                bucket="music"
                                acceptedFileTypes={['audio/mpeg', 'audio/wav', 'audio/x-m4a']}
                                maxSizeMB={200}
                                onUploadComplete={(path) => setAudioPath(path)}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Cover Art (Optional)</label>
                            <FileUploader
                                bucket="images"
                                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                                maxSizeMB={10}
                                onUploadComplete={(path) => setImagePath(path)}
                            />
                        </div>

                        <div className="pt-4 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                            <p className="text-xs text-muted-foreground max-w-xs font-medium">
                                By submitting, you agree to our terms of service and confirm you own the rights to this music.
                            </p>
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full md:w-auto h-14 px-12 rounded-full font-bold shadow-xl shadow-primary/20 gap-3"
                                disabled={submitting || !audioPath}
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                {submitting ? "Submitting..." : "Submit for Review"}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Info Side */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 space-y-6">
                        <h3 className="text-2xl font-bold font-display tracking-tight">How it works</h3>
                        <div className="space-y-6">
                            {[
                                { title: "Upload your track", desc: "Submit high-quality MP3 or WAV files up to 200MB." },
                                { title: "Voice review", desc: "Our presenters listen to every submission to find the best talent." },
                                { title: "Get Featured", desc: "If we love it, we'll put your track in the rotation." }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-primary border border-primary/20 shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold">{step.title}</h4>
                                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
