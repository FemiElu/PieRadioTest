"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@packages/types";
import { Button } from "@/components/ui/button";
import { Check, X, Play, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ArtistUpload = Database["public"]["Tables"]["artist_uploads"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null
};

export default function ModerationPage() {
  const [uploads, setUploads] = useState<ArtistUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchPendingUploads = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("artist_uploads")
        .select(`
          *,
          profiles (*)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setUploads(data as any);
      }
      setLoading(false);
    };

    fetchPendingUploads();
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [supabase, audio]);

  const handlePlay = (url: string, id: string) => {
    if (currentPlaying === id) {
      audio?.pause();
      setCurrentPlaying(null);
      return;
    }

    if (audio) {
      audio.pause();
    }

    // If url is a path, get public url if possible, or signed. 
    // Assuming 'music' bucket is private, we probably need createSignedUrl
    // But for now let's try direct path if logic was set to Public for admins? 
    // Wait, music bucket is private. 
    // We need to generate a signed URL on the fly or the list should include it.

    // Quick fix: generate signed url
    const playAudio = async () => {
      const { data } = await supabase.storage.from('music').createSignedUrl(url, 3600);
      if (data?.signedUrl) {
        const newAudio = new Audio(data.signedUrl);
        newAudio.play();
        newAudio.onended = () => setCurrentPlaying(null);
        setAudio(newAudio);
        setCurrentPlaying(id);
      }
    };
    playAudio();
  };

  const handleAction = async (id: string, action: "approved" | "declined") => {
    const { error } = await supabase
      .from("artist_uploads")
      .update({ status: action })
      .eq("id", id);

    if (!error) {
      // Remove from list
      setUploads(prev => prev.filter(u => u.id !== id));
    }
  };

  if (loading) return <div>Loading queue...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black font-display tracking-tight text-[#141827]">Moderation Queue</h1>

      {uploads.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-zinc-100 rounded-2xl bg-white/50">
          <p className="text-zinc-500 font-medium">No pending submissions.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {uploads.map((upload) => (
            <div key={upload.id} className="bg-white border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handlePlay(upload.audio_url, upload.id)}
                  className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:scale-105"
                >
                  {currentPlaying === upload.id ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
                <div>
                  <h3 className="font-bold text-[#141827] text-lg">{upload.title}</h3>
                  <p className="text-zinc-500 font-medium text-sm">
                    by <span className="text-[#141827]">{upload.profiles?.full_name || "Unknown Artist"}</span> • {upload.genre}
                  </p>
                  <p className="text-zinc-400 text-xs mt-1 font-bold uppercase tracking-wider">
                    Submitted {upload.created_at && formatDistanceToNow(new Date(upload.created_at))} ago
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-bold"
                  onClick={() => handleAction(upload.id, "declined")}
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20"
                  onClick={() => handleAction(upload.id, "approved")}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
