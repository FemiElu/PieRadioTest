"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MetadataPage() {
    const [formData, setFormData] = useState({
        title: "",
        artist: "",
        cover_url: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/stations/metadata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to update");

            setMessage("Success! Metadata broadcasted.");
            // Optional: Clear form or keep it
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-white mb-6">Update &quot;Now Playing&quot;</h1>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Song Title</label>
                        <input
                            type="text"
                            required
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="e.g. Essence"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Artist</label>
                        <input
                            type="text"
                            required
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="e.g. WizKid ft. Tems"
                            value={formData.artist}
                            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Cover Image URL (Optional)</label>
                        <input
                            type="url"
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="https://..."
                            value={formData.cover_url}
                            onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                        />
                        <p className="text-xs text-zinc-600">If empty, default station logo will be used.</p>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-md text-sm ${message.startsWith("Error") ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                            {message}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Broadcast Update
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
