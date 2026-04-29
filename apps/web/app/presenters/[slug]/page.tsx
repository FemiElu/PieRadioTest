export const revalidate = 3600;

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Play, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PresenterContactForm } from "@/components/presenters/presenter-contact-form";
import { PresenterShowDescription } from "@/components/presenters/presenter-show-description";

interface PresenterPageProps {
  params: Promise<{ slug: string }>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PresenterShow {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  schedule: string | null;
  display_order: number;
}

// ---------------------------------------------------------------------------
// Data fetching helpers
// ---------------------------------------------------------------------------

/** Fetch a presenter profile from the database. Returns null if not found. */
async function fetchPresenter(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      `
            id,
            full_name,
            username,
            slug,
            avatar_url,
            bio,
            is_live,
            presenter_meta (
                category,
                instagram_handle,
                twitter_handle
            )
        `,
    )
    .or(`slug.eq.${slug},username.eq.${slug}`)
    .eq("role", "presenter")
    .single();
  return data;
}

/** Fetch shows linked to a presenter from the presenter_shows table. */
async function fetchPresenterShows(
  presenterId: string,
): Promise<PresenterShow[]> {
  const supabase = await createClient();
  // Use `as any` because presenter_shows is a newly created table and the
  // auto-generated Supabase types may not yet include it.
  const { data } = await (supabase.from("presenter_shows" as any) as any)
    .select("id, title, description, cover_image_url, schedule, display_order")
    .eq("presenter_id", presenterId)
    .order("display_order", { ascending: true });
  return (data ?? []) as PresenterShow[];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PresenterPageProps) {
  const { slug } = await params;
  const presenter = await fetchPresenter(slug);
  return {
    title: presenter
      ? `${presenter.full_name} | Pie Radio`
      : "Presenter | Pie Radio",
    description:
      presenter?.bio?.slice(0, 160) ||
      "Meet our talented presenter at Pie Radio.",
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PresenterPage({ params }: PresenterPageProps) {
  const { slug } = await params;

  const presenter = await fetchPresenter(slug);
  if (!presenter) notFound();

  const shows = await fetchPresenterShows(presenter.id);

  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      {/* ── Back Navigation ── */}
      <div className="container px-4 md:px-8 max-w-screen-2xl mx-auto pt-6">
        <Link
          href="/presenters"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Presenters
        </Link>
      </div>

      {/* ── Hero ── */}
      <section className="container px-4 md:px-8 max-w-screen-2xl mx-auto pt-8 pb-12">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-violet-600 to-purple-700 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Text */}
            <div className="flex-1 text-center md:text-left text-white space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
                {presenter.full_name}
              </h1>

              {/* Show the primary (first) show title if available */}
              {shows[0] && (
                <p className="text-lg text-white/80 font-medium">
                  {shows[0].title}
                </p>
              )}

              {/* Show the primary schedule if available */}
              {shows[0]?.schedule && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-white/70">
                  <Clock className="w-4 h-4 shrink-0" />
                  {shows[0].schedule}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <Button
                  size="lg"
                  className="rounded-full bg-white text-primary hover:bg-white/90 font-bold px-8"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Listen Live
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/30 text-white bg-white/10 hover:bg-white/20 font-bold px-8"
                >
                  <Link href="/schedule">View Schedule</Link>
                </Button>
              </div>
            </div>

            {/* Presenter Image */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 shrink-0">
              {presenter.avatar_url ? (
                <Image
                  src={presenter.avatar_url}
                  alt={presenter.full_name || "Presenter"}
                  fill
                  sizes="(max-width: 768px) 192px, 256px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 text-6xl font-bold">
                  {(presenter.full_name || "P").charAt(0)}
                </div>
              )}
              {presenter.is_live && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  Live
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Grid ── */}
      <section className="container px-4 md:px-8 max-w-screen-2xl mx-auto pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — About + Shows */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-3xl border border-border p-6 md:p-8">
              <h2 className="text-2xl font-bold font-display mb-6">About</h2>
              {presenter.bio ? (
                <div className="space-y-4">
                  {presenter.bio
                    .split("\n\n")
                    .map((paragraph: string, i: number) => (
                      <p
                        key={i}
                        className="text-muted-foreground leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No bio available yet.
                </p>
              )}
            </div>

            {/* Shows */}
            <div className="bg-white rounded-3xl border border-border p-6 md:p-8">
              <h2 className="text-2xl font-bold font-display mb-6">Shows</h2>

              {shows.length === 0 ? (
                /* Empty state — only shown when no shows have been added by admin */
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Radio className="w-7 h-7 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">No shows yet</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Shows for this presenter will appear here once they&apos;re
                    added.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shows.map((show) => (
                    <div
                      key={show.id}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors"
                    >
                      {/* Cover image */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-primary/10">
                        {show.cover_image_url ? (
                          <Image
                            src={show.cover_image_url}
                            alt={show.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-primary" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground leading-snug">
                          {show.title}
                        </h3>
                        {show.schedule && (
                          <p className="text-sm font-medium text-primary mt-0.5">
                            {show.schedule}
                          </p>
                        )}
                        {show.description && (
                          <PresenterShowDescription
                            description={show.description}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — Contact Form */}
          <div className="space-y-8">
            <PresenterContactForm
              presenterId={presenter.id}
              presenterName={presenter.full_name}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
