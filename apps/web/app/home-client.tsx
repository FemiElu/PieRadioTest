"use client";

/**
 * HomeClient — interactive shell for the Pie Radio homepage.
 *
 * The server component (app/page.tsx) fetches spotlight data at build/ISR time
 * and passes it as `initialSpotlight`. The latest featured news article is
 * also passed in as `initialFeaturedArticle` so the home page card stays
 * driven by admin/news. All client-side interactivity (audio controls,
 * schedule hook, recently-played AIIR polling) lives here.
 *
 * WHY this split exists:
 *   The homepage was previously a pure "use client" component, which prevented
 *   Vercel from caching the rendered HTML at the CDN. Converting the shell to a
 *   Server Component with ISR (revalidate=300) allows one cached render to serve
 *   potentially thousands of visitors, dramatically reducing Edge Request count.
 */

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
import { useAudio } from "@/context/audio-context";
import { useCurrentShow } from "@/hooks/use-current-show";
import { useSchedule } from "@/hooks/use-schedule";
import { format } from "date-fns";
import type { NewsArticleCard } from "@/lib/news/types";

export type SpotlightData = {
  title: string | null;
  artist_name: string | null;
  image_url: string | null;
  link_url: string | null;
};

interface HomeClientProps {
  initialSpotlight: SpotlightData | null;
  initialFeaturedArticle: NewsArticleCard | null;
  initialRecentArticles: NewsArticleCard[];
}

export default function HomeClient({
  initialSpotlight,
  initialFeaturedArticle,
  initialRecentArticles,
}: HomeClientProps) {
  const { isPlaying, togglePlay, isLoading, currentTrack } = useAudio();
  const { currentShow } = useCurrentShow();

  // Memoize once at mount — schedule only needs today's date boundary
  const todayDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { schedule: todaySchedule, loading: scheduleLoading } =
    useSchedule(todayDate);

  // Recently played tracks — polled from AIIR every 60s.
  // This fetch goes directly to AIIR (not through Vercel) so it does NOT
  // consume Edge Requests. Interval is kept at 60s for freshness.
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

        const { formatDistanceToNow } = await import("date-fns");

        const parsed = data.map((item: any) => {
          const splitIndex = item.title.indexOf("-");
          let artist = "Unknown Artist";
          let songTitle = item.title;

          if (splitIndex !== -1) {
            artist = item.title.substring(0, splitIndex).trim();
            songTitle = item.title.substring(splitIndex + 1).trim();
          }

          return {
            title: songTitle,
            artist: artist,
            time: formatDistanceToNow(new Date(item.timestamp), {
              addSuffix: true,
            }),
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
    const interval = setInterval(fetchRecentTracks, 60000);
    return () => clearInterval(interval);
  }, []);

  // Spotlight: use the server-pre-fetched value directly — no client fetch needed.
  const spotlight = initialSpotlight;

  // Determine display title/artist — prefer real-time ICY metadata over generic fallback
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

  const formatTitleCase = (str: string) =>
    str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

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
              <div className="flex items-center gap-3 mt-4 md:mt-0">
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
                id="hero-listen-live-btn"
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
            <div className="md:col-span-8 space-y-4">
              {/* Main Featured Card - Latest published featured article */}
              {initialFeaturedArticle ? (
                <div className="relative group cursor-default block mt-4 md:mt-0">
                  {/* Glowing Ambient Background Core */}
                  {/* <div className="absolute -inset-2 bg-gradient-to-r from-[#F96D00] via-primary to-[#F96D00] rounded-[2rem] blur-xl opacity-80 animate-pulse" /> */}

                  <Link
                    href={`/news/${initialFeaturedArticle.slug}?from=home`}
                    className="relative h-full w-full aspect-video md:aspect-auto md:h-[450px] overflow-hidden rounded-2xl border-primary  bg-card transition-all duration-500 hover:-translate-y-2 block shadow-[0_0_50px_rgba(249,109,0,0.4)] hover:shadow-[0_0_80px_rgba(249,109,0,0.6)] hover:rounded-[2rem]"
                  >
                    {initialFeaturedArticle.cover_image_url ? (
                      <Image
                        src={initialFeaturedArticle.cover_image_url}
                        alt={initialFeaturedArticle.title}
                        fill
                        quality={90}
                        sizes="(max-width: 768px) 100vw, 66vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                        <Mic2 className="w-16 h-16 text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 p-8 space-y-3 z-10 w-full">
                      <div className="px-3 py-1 hidden md:block bg-[#F96D00] text-white text-xs font-bold rounded-full w-fit uppercase tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(249,109,0,0.5)]">
                        {initialFeaturedArticle.category || "Featured"}
                      </div>
                      <h3 className="text-3xl font-bold text-white leading-tight max-w-xl transition-colors line-clamp-2">
                        {initialFeaturedArticle.title}
                      </h3>
                      {initialFeaturedArticle.summary && (
                        <p className="text-zinc-300 text-sm max-w-md line-clamp-2">
                          {initialFeaturedArticle.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="relative group cursor-default block mt-4 md:mt-0">
                  {/* Glowing Ambient Background Core */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#F96D00] via-primary to-[#F96D00] rounded-[2rem] blur-xl opacity-80 animate-pulse" />

                  <div className="relative h-full w-full aspect-video md:aspect-auto md:h-[450px] overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-950/95 transition-all duration-500 block shadow-[0_0_50px_rgba(249,109,0,0.12)]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="max-w-md px-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                          <Mic2 className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em]">
                            Latest from Pie Radio
                          </p>
                          <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                            No featured news yet
                          </h3>
                          <p className="text-zinc-400 text-sm md:text-base">
                            Publish an article in admin/news and mark it as
                            featured to populate this card.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="hidden lg:block">
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-200">
                  <span className="h-px flex-1 bg-zinc-200" />
                  <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 font-semibold">
                    More stories
                  </span>
                  <span className="h-px flex-1 bg-zinc-200" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {initialRecentArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}?from=home`}
                      className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        {article.cover_image_url ? (
                          <Image
                            src={article.cover_image_url}
                            alt={article.title}
                            fill
                            quality={90}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-500">
                            <Mic2 className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <div className="p-5 space-y-3">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                          {article.category || "News"}
                        </span>
                        <h3 className="text-lg font-bold text-zinc-900 line-clamp-2">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-sm text-zinc-500 line-clamp-2">
                            {article.summary}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Cards */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="flex-1 group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-lg">
                <Image
                  src={spotlight?.image_url || "/assets/abstract-avatar.png"}
                  alt={
                    spotlight?.artist_name
                      ? `Spotlight: ${spotlight.artist_name}`
                      : "Artist Spotlight Placeholder"
                  }
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-80" />
                <div className="absolute bottom-0 p-6 space-y-2">
                  <div className="text-primary text-xs font-bold uppercase tracking-widest">
                    {spotlight?.title || "Spotlight"}
                  </div>
                  <h4 className="text-xl font-bold text-white font-display">
                    {spotlight?.artist_name || "Artist of the Month"}
                  </h4>
                </div>
                {spotlight?.link_url && (
                  <Link
                    href={
                      spotlight.link_url.startsWith("http") ||
                      spotlight.link_url.startsWith("/")
                        ? spotlight.link_url
                        : `https://${spotlight.link_url}`
                    }
                    target={
                      spotlight.link_url.startsWith("/") ? "_self" : "_blank"
                    }
                    rel={
                      spotlight.link_url.startsWith("/")
                        ? undefined
                        : "noopener noreferrer"
                    }
                    className="absolute inset-0 z-20"
                  >
                    <span className="sr-only">View Spotlight</span>
                  </Link>
                )}
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

      {/* CTA Section */}
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
          {/* Download badges */}
          <div className="flex flex-col items-center gap-6 pt-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
              Download the app
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {/* App Store */}
              <a
                id="cta-app-store-btn"
                href="https://apps.apple.com/app/pie-radio-live/id6771355572"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download Pie Radio on the App Store"
                className="inline-flex items-center gap-3 h-14 px-6 rounded-2xl bg-white text-zinc-900 font-bold shadow-2xl hover:bg-zinc-100 active:scale-95 transition-all duration-200 group min-w-[180px]"
              >
                {/* Apple logo */}
                <svg
                  className="w-7 h-7 shrink-0 fill-current"
                  viewBox="0 0 814 1000"
                  aria-hidden="true"
                >
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-155.8-109.8c-48.3-68.5-89.2-172.5-89.2-271.4 0-149.5 97.7-228.6 194.5-228.6 64.2 0 117.4 42.1 157.6 42.1 38.4 0 98.4-44.8 170.3-44.8 27.5 0 108.2 2.6 164.4 96.1zm-234.5-168c31.3-37.9 53.5-90.8 53.5-143.7 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 85.3-55.1 139.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.1-70.9z" />
                </svg>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Download on the
                  </span>
                  <span className="text-lg font-extrabold tracking-tight">
                    App Store
                  </span>
                </div>
              </a>

              {/* Google Play */}
              <a
                id="cta-google-play-btn"
                href="https://play.google.com/store/apps/details?id=com.pieradio.mobile"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get Pie Radio on Google Play"
                className="inline-flex items-center gap-3 h-14 px-6 rounded-2xl bg-white text-zinc-900 font-bold shadow-2xl hover:bg-zinc-100 active:scale-95 transition-all duration-200 group min-w-[180px]"
              >
                {/* Play Store logo (coloured triangle) */}
                <svg
                  className="w-7 h-7 shrink-0"
                  viewBox="0 0 512 512"
                  aria-hidden="true"
                >
                  <linearGradient
                    id="pg1"
                    x1="91.1"
                    y1="-59"
                    x2="234.5"
                    y2="83.9"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#00a0ff" />
                    <stop offset="1" stopColor="#00beff" />
                  </linearGradient>
                  <path
                    fill="url(#pg1)"
                    d="M27 18.9C20.8 25.4 17 35.4 17 48.5v415c0 13.1 3.8 23.1 10 29.6L28 494l232.6-232.6v-5.5L27 18.9z"
                  />
                  <linearGradient
                    id="pg2"
                    x1="316"
                    y1="255.9"
                    x2="395.2"
                    y2="255.9"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#ffe000" />
                    <stop offset="1" stopColor="#ffbd00" />
                  </linearGradient>
                  <path
                    fill="url(#pg2)"
                    d="M337.9 334.8 260.6 257.5v-5.5l77.3-77.3 1.8 1L428 228.8c24 13.6 24 35.9 0 49.5l-88.3 55.6-1.8 1z"
                  />
                  <linearGradient
                    id="pg3"
                    x1="44.7"
                    y1="284.3"
                    x2="297.1"
                    y2="536.5"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#ff3a44" />
                    <stop offset="1" stopColor="#c31162" />
                  </linearGradient>
                  <path
                    fill="url(#pg3)"
                    d="M339.7 333.8 260.6 254.7 27 487.1c7.9 8.4 21 9.4 35.6 1.1l277.1-154.4"
                  />
                  <linearGradient
                    id="pg4"
                    x1="21"
                    y1="-11"
                    x2="168.4"
                    y2="136.1"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#32a071" />
                    <stop offset=".1" stopColor="#2da771" />
                    <stop offset=".5" stopColor="#15cf74" />
                    <stop offset=".8" stopColor="#06e775" />
                    <stop offset="1" stopColor="#00f076" />
                  </linearGradient>
                  <path
                    fill="url(#pg4)"
                    d="M339.7 175.9 62.6 21.6C48 13.3 34.9 14.2 27 22.6l233.6 233.1 79.1-79.8z"
                  />
                </svg>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Get it on
                  </span>
                  <span className="text-lg font-extrabold tracking-tight">
                    Google Play
                  </span>
                </div>
              </a>
            </div>

            <Link
              href="/contact"
              id="cta-contact-us-btn"
              className="text-white/70 text-sm font-semibold hover:text-white underline underline-offset-4 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
