"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Music2, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useAudio } from "@/context/audio-context";

type PartnershipEpisode = {
    id: string;
    title: string;
    description: string | null;
    aired_at: string | null;
    file_key: string | null;
    cover_image_url: string | null;
    duration_seconds: number | null;
};

const MAX_AUDIO_BYTES = 150 * 1024 * 1024;

function looksLikeMp3(bytes: Uint8Array) {
    const hasId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    const hasFrameSync = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    return hasId3 || hasFrameSync;
}

export function PartnershipEpisodeManager({ pageId }: { pageId: string }) {
    const [episodes, setEpisodes] = useState<PartnershipEpisode[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [airedAt, setAiredAt] = useState(new Date().toISOString().slice(0, 10));
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState("");
    const { playClip } = useAudio();
    const supabase = createClient();

    const loadEpisodes = useCallback(async () => {
        try {
            const response = await fetch(`/api/admin/partnerships/${pageId}/episodes`, { cache: "no-store" });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to load audio");
            setEpisodes(result.episodes ?? []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load audio");
        } finally {
            setLoading(false);
        }
    }, [pageId]);

    useEffect(() => { void loadEpisodes(); }, [loadEpisodes]);

    const saveEpisode = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        if (!audioFile) {
            setError("Choose an MP3 to upload.");
            return;
        }
        if (audioFile.type !== "audio/mpeg" || !audioFile.name.toLowerCase().endsWith(".mp3")) {
            setError("Upload an MP3 audio file.");
            return;
        }
        if (audioFile.size > MAX_AUDIO_BYTES) {
            setError("Audio files must be 150 MB or smaller.");
            return;
        }
        if (!looksLikeMp3(new Uint8Array(await audioFile.slice(0, 4).arrayBuffer()))) {
            setError("This file does not appear to contain MP3 audio.");
            return;
        }

        setSaving(true);
        const fileKey = `partnerships/${pageId}/${crypto.randomUUID()}.mp3`;
        try {
            const { error: uploadError } = await supabase.storage.from("partnership-audio").upload(fileKey, audioFile, {
                cacheControl: "3600",
                contentType: "audio/mpeg",
                upsert: false,
            });
            if (uploadError) throw uploadError;

            const response = await fetch(`/api/admin/partnerships/${pageId}/episodes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description: description || null,
                    aired_at: airedAt,
                    file_key: fileKey,
                    cover_image_url: coverImage || null,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to save audio details");
            setEpisodes((current) => [result.episode, ...current].sort((a, b) => (b.aired_at ?? "").localeCompare(a.aired_at ?? "")));
            setTitle("");
            setDescription("");
            setAudioFile(null);
        } catch (saveError) {
            await supabase.storage.from("partnership-audio").remove([fileKey]);
            setError(saveError instanceof Error ? saveError.message : "Audio upload failed");
        } finally {
            setSaving(false);
        }
    };

    const removeEpisode = async (episode: PartnershipEpisode) => {
        if (!window.confirm(`Remove “${episode.title}” from this partnership page? This also deletes its audio file.`)) return;
        setError("");
        try {
            const response = await fetch(`/api/admin/partnerships/${pageId}/episodes`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ episodeId: episode.id }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to remove audio");
            setEpisodes((current) => current.filter((item) => item.id !== episode.id));
        } catch (removeError) {
            setError(removeError instanceof Error ? removeError.message : "Failed to remove audio");
        }
    };

    const playEpisode = (episode: PartnershipEpisode) => {
        if (!episode.file_key) return;
        if (!episode.file_key.startsWith(`partnerships/${pageId}/`)) {
            const { data } = supabase.storage.from("pie-episodes").getPublicUrl(episode.file_key);
            playClip(data.publicUrl, episode.title, "Partnership DJ Mix", episode.cover_image_url ?? undefined);
            return;
        }
        void supabase.storage.from("partnership-audio").createSignedUrl(episode.file_key, 3600).then(({ data, error }) => {
            if (error || !data?.signedUrl) { setError("Could not open this mix for playback."); return; }
            playClip(data.signedUrl, episode.title, "Partnership DJ Mix", episode.cover_image_url ?? undefined);
        });
    };

    return (
        <section className="space-y-6 rounded-3xl border border-border/50 bg-white p-6 sm:p-8" aria-labelledby="partnership-audio-title">
            <div>
                <h2 id="partnership-audio-title" className="text-xl font-bold text-[#141827]">DJ mixes & audio</h2>
                <p className="mt-1 text-sm text-zinc-500">MP3 files up to 150 MB appear in the page’s audio player.</p>
            </div>
            {episodes.length > 0 && (
                <ul className="divide-y divide-border/60 rounded-2xl border border-border/60">
                    {episodes.map((episode) => (
                        <li key={episode.id} className="flex items-center gap-3 p-4">
                            <Music2 className="h-5 w-5 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-[#141827]">{episode.title}</p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500"><CalendarDays className="h-3 w-3" />{episode.aired_at ?? "No date"}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" aria-label={`Play ${episode.title}`} onClick={() => playEpisode(episode)}><Play className="h-4 w-4" /></Button>
                            <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${episode.title}`} onClick={() => void removeEpisode(episode)}><Trash2 className="h-4 w-4" /></Button>
                        </li>
                    ))}
                </ul>
            )}
            {loading && <p className="text-sm text-zinc-500">Loading audio…</p>}
            {!loading && episodes.length === 0 && <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500">No mixes uploaded yet.</p>}
            <form aria-label="Upload partnership audio" onSubmit={(event) => void saveEpisode(event)} className="grid gap-4 rounded-2xl bg-zinc-50 p-4 sm:grid-cols-2">
                <Input aria-label="Audio title" placeholder="Mix or show title" value={title} onChange={(event) => setTitle(event.target.value)} required />
                <Input aria-label="Date aired" type="date" value={airedAt} onChange={(event) => setAiredAt(event.target.value)} required />
                <Textarea aria-label="Audio description" placeholder="Mix notes, tracklist or guests" value={description} onChange={(event) => setDescription(event.target.value)} className="sm:col-span-2" />
                <Input aria-label="Cover art URL" placeholder="Optional cover image URL" value={coverImage} onChange={(event) => setCoverImage(event.target.value)} />
                <Input aria-label="MP3 audio file" type="file" accept="audio/mpeg,.mp3" onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)} required />
                <div className="flex items-center justify-between gap-3 sm:col-span-2">
                    <p className="truncate text-xs text-zinc-500">{audioFile?.name ?? "Choose an MP3 file"}</p>
                    <Button type="submit" disabled={saving || !title.trim() || !audioFile}>{saving ? "Uploading…" : "Upload mix"}</Button>
                </div>
            </form>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </section>
    );
}
