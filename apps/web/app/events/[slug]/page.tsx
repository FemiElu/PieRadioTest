import { createClient } from "@/lib/supabase/server";
import { getEventBySlug, getEventById, getRelatedEvents } from "@/lib/events/queries";
import { formatEventPrice, EVENT_CATEGORY_LABELS } from "@/lib/events/types";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
    Calendar,
    MapPin,
    ArrowLeft,
    Share2,
    Ticket,
    ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { FeaturedCarousel } from "@/components/events/FeaturedCarousel";

interface EventDetailPageProps {
    params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

/**
 * Helper to detect if a string looks like a UUID.
 * Used to support legacy UUID-based URLs with a 301 redirect.
 */
function isUUID(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
    const supabase = await createClient();
    const { slug } = await params;
    
    // Try slug first, then UUID fallback for metadata
    let event = await getEventBySlug(supabase, slug);
    if (!event && isUUID(slug)) {
        event = await getEventById(supabase, slug);
    }
    
    if (!event) return { title: "Event Not Found | Pie Radio" };
    
    return {
        title: `${event.title} | Pie Radio Events`,
        description: event.description?.slice(0, 160) || `Catch ${event.artist_name} at ${event.venue_name} on Pie Radio.`,
        openGraph: {
            title: event.title,
            description: event.description?.slice(0, 160) || `Catch ${event.artist_name} at ${event.venue_name} on Pie Radio.`,
            images: event.cover_image_url
                ? [{ url: event.cover_image_url, width: 1200, height: 630 }]
                : [],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: event.title,
            description: event.description?.slice(0, 160) || `Catch ${event.artist_name} at ${event.venue_name} on Pie Radio.`,
            images: event.cover_image_url ? [event.cover_image_url] : [],
        },
    };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
    const supabase = await createClient();
    const { slug } = await params;
    
    // Primary lookup: by slug
    let event = await getEventBySlug(supabase, slug);
    
    // Fallback: if param looks like a UUID, look up by ID and redirect to slug URL
    if (!event && isUUID(slug)) {
        const eventById = await getEventById(supabase, slug);
        if (eventById) {
            redirect(`/events/${eventById.slug}`);
        }
    }

    if (!event) {
        notFound();
    }

    const relatedEvents = await getRelatedEvents(
        supabase, 
        event.id, 
        event.category, 
        event.venue_city
    );

    const formattedDate = format(new Date(event.start_time), "EEEE, MMMM do, yyyy");
    const formattedTime = format(new Date(event.start_time), "HH:mm");
    
    return (
        <div className="pb-20">
            {/* Nav Header */}
            <div className="container py-4 md:py-6">
                <Link href="/events">
                    <Button
                        variant="ghost"
                        className="gap-2 pl-0 hover:pl-2 transition-all font-bold text-xs uppercase tracking-widest text-zinc-500"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Events
                    </Button>
                </Link>
            </div>

            {/* Hero Section */}
            <div className="relative w-full h-[45vh] md:h-[60vh] bg-zinc-900 overflow-hidden">
                {event.cover_image_url ? (
                    <Image
                        src={event.cover_image_url}
                        alt={event.title}
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Calendar className="w-24 h-24 text-zinc-700" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141827] via-[#141827]/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 container pb-8 md:pb-16">
                    <div className="max-w-4xl space-y-6">
                        <div className="flex items-center gap-3">
                            <EventStatusBadge status={event.status} startTime={event.start_time} endTime={event.end_time} />
                            <Badge variant="outline" className="bg-white/10 backdrop-blur text-white border-white/20 uppercase tracking-widest text-[10px] font-black py-1">
                                {EVENT_CATEGORY_LABELS[event.category]}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-7xl font-black font-display text-white leading-[0.9] tracking-tighter">
                                {event.title}
                            </h1>
                            {event.artist_name && (
                                <p className="text-xl md:text-3xl text-primary font-black italic uppercase tracking-tight">
                                    {event.artist_name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 mt-12">
                {/* Main Content (Left Col) */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Key Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-3xl border border-border/50 bg-card/50 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-400 mb-1">Date & Time</h3>
                                <p className="font-bold text-[#141827]">{formattedDate}</p>
                                <p className="text-zinc-500 font-medium">Starts at {formattedTime}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-400 mb-1">Venue</h3>
                                <p className="font-bold text-[#141827]">{event.venue_name || event.location || "TBA"}</p>
                                <p className="text-zinc-500">{event.venue_address}</p>
                                <p className="text-zinc-500 font-medium">{event.venue_city}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    {event.description && (
                         <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px bg-primary w-8" />
                                <h2 className="text-2xl font-black font-display uppercase tracking-tight text-[#141827]">About Event</h2>
                            </div>
                            <div className="prose prose-zinc max-w-none prose-p:text-zinc-500 prose-p:leading-relaxed prose-p:font-medium">
                                <p className="whitespace-pre-wrap">{event.description}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar (Right Col) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="p-8 rounded-3xl border border-border/50 bg-white shadow-xl shadow-zinc-200/50 space-y-8">
                            <div className="space-y-2">
                                <h3 className="font-black font-display text-xs uppercase tracking-[0.2em] text-zinc-300">Tickets & Pricing</h3>
                                <div className="text-4xl font-black font-display text-[#141827]">
                                    {formatEventPrice(event)}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {event.ticket_url ? (
                                    <Link href={event.ticket_url} target="_blank" className="block">
                                        <Button
                                            size="lg"
                                            className="w-full h-14 text-base font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            disabled={event.status === 'cancelled' || event.status === 'past'}
                                        >
                                            <Ticket className="w-5 h-5" />
                                            Get Tickets
                                            <ExternalLink className="w-4 h-4 opacity-50" />
                                        </Button>
                                    </Link>
                                ) : event.status === 'upcoming' && (event.price_min === 0) ? (
                                    <div className="h-14 flex items-center justify-center bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-black uppercase tracking-widest text-sm">
                                        Free Entry
                                    </div>
                                ) : (
                                    <Button
                                        size="lg"
                                        disabled
                                        className="w-full h-14 text-base font-black uppercase tracking-widest gap-2"
                                    >
                                        Unavailable
                                    </Button>
                                )}

                                {event.external_url && (
                                    <Link href={event.external_url} target="_blank" className="block">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-2xl border-border/50 text-zinc-700 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-zinc-50 transition-all"
                                        >
                                            <ExternalLink className="w-3 h-3" /> More Details
                                        </Button>
                                    </Link>
                                )}

                                <Button variant="outline" className="w-full h-12 rounded-2xl border-border/50 text-zinc-500 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-zinc-50 transition-all">
                                    <Share2 className="w-3 h-3" /> Share Event
                                </Button>
                            </div>

                            <div className="pt-6 border-t border-dashed border-border/50 text-center">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    All sales handled via external partner
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="my-20 opacity-50" />

            {/* Related Events */}
            {relatedEvents.length > 0 && (
                <div className="container">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-black font-display uppercase tracking-tight text-[#141827]">You Might Also Like</h2>
                    </div>
                    <FeaturedCarousel events={relatedEvents} />
                </div>
            )}
        </div>
    );
}
