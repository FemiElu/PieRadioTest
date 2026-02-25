"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  Loader2,
  Calendar,
  Music,
  Radio,
  ChevronRight,
  Mic2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudio } from "@/context/audio-context";
import { useCurrentShow } from "@/hooks/use-current-show";
import { useSchedule } from "@/hooks/use-schedule";
import { format } from "date-fns";

export default function Home() {
  const { isPlaying, togglePlay, isLoading, currentTrack } = useAudio();
  const { currentShow } = useCurrentShow();
  // Memoize tomorrow's cleanup: use the start of the day as the schedule key
  const todayDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [new Date().toLocaleDateString()]); // Only changes when the date actual rolls over

  const { schedule: todaySchedule, loading: scheduleLoading } =
    useSchedule(todayDate);

  // State for recently played tracks
  type PlayedTrack = { title: string; artist: string; time: string };
  const [recentlyPlayed, setRecentlyPlayed] = React.useState<PlayedTrack[]>([]);
  const [recentLoading, setRecentLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchRecentTracks() {
      try {
        const res = await fetch(
          "https://streaming-api.aiir.com/mounts/metadata/history/dnjp99nozxavv?limit=4",
        );
        if (!res.ok) throw new Error("Failed to fetch recent tracks");
        const data = await res.json();

        // Ensure formatDistanceToNow is available
        const { formatDistanceToNow } = await import("date-fns");

        // Parse AIIR API format
        const parsed = data.map((item: any) => {
          // AIIR formats title as "Artist - Title" or "Artist -Title"
          const splitIndex = item.title.indexOf("-");
          let artist = "Unknown Artist";
          let songTitle = item.title;

          if (splitIndex !== -1) {
            artist = item.title.substring(0, splitIndex).trim();
            songTitle = item.title.substring(splitIndex + 1).trim();
          }

          // Calculate relative time
          const relativeTime = formatDistanceToNow(new Date(item.timestamp), {
            addSuffix: true,
          });

          return {
            title: songTitle,
            artist: artist,
            time: relativeTime,
          };
        });

        setRecentlyPlayed(parsed);
      } catch (error) {
        console.error("Error fetching recent tracks:", error);
      } finally {
        setRecentLoading(false);
      }
    }

    fetchRecentTracks();
    // Poll every 60 seconds to keep fresh
    const interval = setInterval(fetchRecentTracks, 60000);
    return () => clearInterval(interval);
  }, []);

  // Determine the display title and artist
  // We prioritize real-time metadata from the stream, but fallback to
  // the scheduled show if metadata is generic (e.g., "Pie Radio Live")
  const isGenericMetadata =
    !currentTrack ||
    currentTrack.title === "Pie Radio Live" ||
    currentTrack.title === "Live Stream";

  const title = !isGenericMetadata
    ? currentTrack.title
    : currentShow?.shows?.title || "Pie Radio Live";

  const artist = !isGenericMetadata
    ? currentTrack.artist
    : currentShow?.shows?.host_id || "The Number One Station";

  const artwork =
    !isGenericMetadata &&
    currentTrack.artwork &&
    currentTrack.artwork !== "/placeholder-cover.jpg"
      ? currentTrack.artwork
      : currentShow?.shows?.cover_image_url || "/placeholder-cover.jpg";

  // Helper to format text to Title Case (first letter capital, rest lowercase for each word)
  // Handles all-caps input from AIIR nicely.
  const formatTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formattedTitle = formatTitleCase(title);
  const formattedArtist = formatTitleCase(artist);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[500px] md:h-[650px] overflow-hidden bg-[#0a0a0b]">
        {/* Full Width Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/hero-main.jpg"
            alt="Pie Radio Hero"
            fill
            sizes="100vw"
            className="object-cover object-center scale-105"
            priority
          />
          {/* Darker Overlays for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="container relative h-full max-w-screen-2xl mx-auto px-4 md:px-8 flex items-center z-10">
          <div className="w-full max-w-2xl space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Live Now
                </div>
                <div className="h-px w-8 bg-white/20" />
                <span className="text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                  Now Playing
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-baseline md:gap-1.5">
                <h2 className="text-white text-xl md:text-2xl font-black font-display italic tracking-tight line-clamp-1 px-1">
                  {formattedTitle}
                </h2>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-zinc-500 md:text-zinc-400 text-xs md:text-lg font-bold italic">
                    by
                  </span>
                  <p className="text-zinc-400 text-sm md:text-lg font-bold tracking-tight">
                    {formattedArtist}
                  </p>
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-white leading-[1.1]">
              Real Music <span className="text-primary italic">Matters.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-300 leading-relaxed max-w-lg font-medium">
              Broadcasting the freshest hits and hottest talk 24/7. Join the
              number one station for the youth.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="h-14 px-8 rounded-full text-lg shadow-2xl shadow-primary/40 gap-3 group bg-primary hover:bg-primary/90 min-w-[200px]"
                onClick={togglePlay}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : isPlaying ? (
                  <>
                    <Pause className="fill-current group-hover:scale-110 transition-transform" />
                    Pause Live
                  </>
                ) : (
                  <>
                    <Play className="fill-current group-hover:scale-110 transition-transform" />
                    Listen Live
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-full text-lg border-2 gap-3 bg-white/5 backdrop-blur-sm text-white border-white/20 hover:bg-white/10 hover:border-white/40"
                asChild
              >
                <Link href="/schedule">
                  <Calendar className="w-5 h-5" />
                  View Schedule
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Content Grid Section */}
      <section className="container max-w-screen-2xl mx-auto py-16 px-4 md:px-8 space-y-16">
        {/* Latest News & Featured */}
        <div className="space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold font-display tracking-tight">
                Latest from Pie Radio
              </h2>
              <p className="text-muted-foreground">
                Stay updated with the freshest music and urban culture news.
              </p>
            </div>
            <Link
              href="/news"
              className="text-primary font-semibold flex items-center gap-1 hover:underline group"
            >
              See All{" "}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Featured Card - Partnership */}
            <div className="md:col-span-8 relative group cursor-pointer block mt-4 md:mt-0">
              {/* Glowing Ambient Background Core */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#F96D00] via-primary to-[#F96D00] rounded-[2rem] blur-xl opacity-80 animate-pulse" />

              {/* Infinite Radar Ping Ring Effect */}

              <Link
                href="/partnership"
                className="relative h-full w-full aspect-video md:aspect-auto md:h-[450px] overflow-hidden rounded-2xl border border-[#F96D00] bg-card transition-all duration-500 hover:-translate-y-2 block shadow-[0_0_50px_rgba(249,109,0,0.4)] hover:shadow-[0_0_80px_rgba(249,109,0,0.6)]"
              >
                <Image
                  src="/assets/popeye-3.jpeg"
                  alt="Pie Radio x Popeyes Partnership"
                  fill
                  sizes="(max-width: 768px) 100vw, 66vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 p-8 space-y-3 z-10">
                  <div className="px-3 py-1 hidden md:block bg-[#F96D00] text-white text-xs font-bold rounded-full w-fit uppercase tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(249,109,0,0.5)]">
                    Partnership
                  </div>
                  <h3 className="text-3xl font-bold text-white leading-tight max-w-xl transition-colors">
                    Pie Radio Collabs with Popeyes
                  </h3>
                  <p className="text-zinc-300 text-sm max-w-md line-clamp-2">
                    The ultimate combo: crispy chicken meets the freshest beats.
                    Check out what we&apos;re cooking up with Louisiana&apos;s
                    finest. 🍗🎶
                  </p>
                </div>
              </Link>
            </div>

            {/* Sidebar Cards */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="flex-1 group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-lg">
                <Image
                  src="/assets/abstract-avatar.png"
                  alt="Artist Spotlight Placeholder"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-80" />
                <div className="absolute bottom-0 p-6 space-y-2">
                  <div className="text-primary text-xs font-bold uppercase tracking-widest">
                    Spotlight
                  </div>
                  <h4 className="text-xl font-bold text-white font-display">
                    Artist of the Month
                  </h4>
                </div>
              </div>

              <div
                className="flex-1 bg-white p-6 rounded-2xl border border-border/50 shadow-sm hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg"
                onClick={togglePlay}
              >
                <div className="space-y-4">
                  <div className="text-primary text-xs font-bold uppercase tracking-widest">
                    On Air Now
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center text-primary relative overflow-hidden">
                      {artwork && artwork !== "/placeholder-cover.jpg" ? (
                        <Image
                          src={artwork}
                          alt={title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <Mic2 className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">
                        {formattedTitle}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formattedArtist}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-2 gap-2"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Radio className="w-4 h-4" />
                    )}
                    {isPlaying ? "Pause Stream" : "Listen Live"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Playlist Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
          {/* Today's Schedule */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-display flex items-center gap-3">
              <Calendar className="text-primary" /> Today&apos;s Schedule
            </h3>
            <div className="space-y-1">
              {scheduleLoading ? (
                <div className="p-8 text-center text-zinc-400 animate-pulse font-bold tracking-widest uppercase text-xs">
                  Loading Schedule...
                </div>
              ) : todaySchedule && todaySchedule.length > 0 ? (
                todaySchedule.slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-border/50 transition-all group cursor-pointer"
                  >
                    <div className="flex gap-6 items-center">
                      <span className="text-lg font-bold text-primary/40 font-mono group-hover:text-primary transition-colors">
                        {format(new Date(item.start_time), "HH:mm")}
                      </span>
                      <div>
                        <h4 className="font-bold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.presenter?.full_name || "Pie Radio Presenter"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="group-hover:text-primary"
                    >
                      <Play className="w-5 h-5" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-400 bg-zinc-50/50 rounded-2xl border-2 border-dashed border-zinc-100 font-bold tracking-widest uppercase text-[10px]">
                  No shows scheduled for today
                </div>
              )}
            </div>
            <Button
              variant="link"
              className="text-primary px-0 font-bold"
              asChild
            >
              <Link href="/schedule">View Full Schedule &rarr;</Link>
            </Button>
          </div>

          {/* Recently Played */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-display flex items-center gap-3">
              <Music className="text-primary" /> Recently Played
            </h3>
            <div className="space-y-1">
              {recentLoading ? (
                <div className="p-8 text-center text-zinc-400 animate-pulse font-bold tracking-widest uppercase text-xs">
                  Loading Playlist...
                </div>
              ) : recentlyPlayed.length > 0 ? (
                recentlyPlayed.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-border/50 hover:bg-white transition-all"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-none pt-1">
                          {formatTitleCase(item.title)}
                        </h4>
                        <p className="text-xs text-muted-foreground pt-1">
                          {formatTitleCase(item.artist)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {item.time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-400 bg-zinc-50/50 rounded-2xl border-2 border-dashed border-zinc-100 font-bold tracking-widest uppercase text-[10px]">
                  No recent tracks
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modern Waveform Decoration or CTA */}
      <section className="bg-primary py-20 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 50 Q 25 25 50 50 T 100 50 T 150 50 V 100 H 0 Z"
              fill="white"
            />
          </svg>
        </div>
        <div className="container relative max-w-screen-2xl mx-auto px-4 md:px-8 text-center text-white space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold font-display">
            Ready to hear the difference?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground opacity-90 max-w-2xl mx-auto leading-relaxed">
            Download our mobile app for the best streaming experience on the go.
            Available for iOS and Android.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="secondary"
              size="lg"
              className="h-14 px-8 rounded-full font-bold shadow-2xl"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 rounded-full font-bold border-2 bg-transparent text-white border-white hover:bg-white hover:text-primary transition-colors"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
