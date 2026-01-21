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

  useEffect(() => {
    fetchPendingUploads();
    return () => {
        if (audio) {
            audio.pause();
        }
    }
  }, []);

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
      <h1 className="text-3xl font-bold text-white">Moderation Queue</h1>
      
      {uploads.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500">No pending submissions.</p>
          </div>
      ) : (
          <div className="grid gap-4">
              {uploads.map((upload) => (
                  <div key={upload.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                          <button 
                            onClick={() => handlePlay(upload.audio_url, upload.id)}
                            className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                          >
                              {currentPlaying === upload.id ? <Pause size={20} /> : <Play size={20} />}
                          </button>
                          <div>
                              <h3 className="font-bold text-white text-lg">{upload.title}</h3>
                              <p className="text-zinc-400 text-sm">
                                  by {upload.profiles?.full_name || "Unknown Artist"} • {upload.genre}
                              </p>
                              <p className="text-zinc-600 text-xs mt-1">
                                  Submitted {upload.created_at && formatDistanceToNow(new Date(upload.created_at))} ago
                              </p>
                          </div>
                      </div>
                      
                      <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleAction(upload.id, "declined")}
                          >
                              <X className="w-4 h-4 mr-2" />
                              Decline
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
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
