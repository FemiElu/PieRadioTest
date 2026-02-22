export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Mail, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PresenterContactForm } from "@/components/presenters/presenter-contact-form";
import { RelatedPresenters } from "@/components/presenters/related-presenters";

interface PresenterPageProps {
    params: Promise<{ slug: string }>;
}

// Dummy presenter data for fallback
const DUMMY_PRESENTERS: Record<string, any> = {
    "sarah-wilson": {
        id: "2",
        full_name: "Sarah Wilson",
        username: "sarah-wilson",
        slug: "sarah-wilson",
        avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
        bio: "Sarah Wilson is one of Pie Radio's most beloved voices, bringing energy, passion, and incredible music knowledge to every show. With years of experience in broadcasting and a deep love for music, Sarah creates an unforgettable listening experience for our audience.\n\nKnown for engaging interviews with top artists, exclusive music premieres, and a genuine connection with listeners, this show has become a must-listen for music fans across the country.\n\nWhen not on air, Sarah is passionate about discovering new talent, attending live music events, and connecting with the community through various charity initiatives.",
        is_live: true,
        presenter_meta: {
            category: "amapiano",
            instagram_handle: "sarahwilson",
            twitter_handle: "sarahwilson"
        },
    },
    "alex-thompson": {
        id: "1",
        full_name: "Alex Thompson",
        username: "alex-thompson",
        slug: "alex-thompson",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
        bio: "Alex Thompson has been waking up the nation with his infectious energy for over a decade. His morning show is the perfect blend of great music, entertaining banter, and the latest news to start your day right.",
        is_live: false,
        presenter_meta: { category: "afrobeats", instagram_handle: "alexthompson", twitter_handle: "alexthompson" },
    },
    "jamie-lee": {
        id: "3",
        full_name: "Jamie Lee",
        username: "jamie-lee",
        slug: "jamie-lee",
        avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80",
        bio: "Jamie Lee is your afternoon companion, keeping you energized through the workday with the best music and entertaining stories.",
        is_live: false,
        presenter_meta: { category: "rap-hiphop", instagram_handle: "jamielee", twitter_handle: null },
    },
};

const DUMMY_SHOWS = [
    {
        id: "1",
        title: "The Early Bird ",
        description: "The perfect soundtrack to your day with chart hits, classic throwbacks, and exclusive artist interviews.",
        cover_image_url: "/assets/Jason2.webp",
        schedule: "Sundays • 8:00AM - 10:00AM",
    },
    {
        id: "2",
        title: "The Deep Vibe Show ",
        description: "welcome to deep vibe show with DJ Kane this is the show where we explore deep progressive and tech house music, tune in 3pm till 5pm every Monday for the best of the best of house music ",
        cover_image_url: "/assets/kane2.webp",
        schedule: "Mondays • 3:00PM - 5:00PM",
    },
];

const RELATED_PRESENTERS = [
    {
        id: "1",
        full_name: "Alex Thompson",
        slug: "alex-thompson",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    },
    {
        id: "3",
        full_name: "Jamie Lee",
        slug: "jamie-lee",
        avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    },
    {
        id: "4",
        full_name: "Rachel Martinez",
        slug: "rachel-martinez",
        avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
    },
];

export async function generateMetadata({ params }: PresenterPageProps) {
    const { slug } = await params;
    const presenter = DUMMY_PRESENTERS[slug];

    return {
        title: presenter ? `${presenter.full_name} | Pie Radio` : "Presenter | Pie Radio",
        description: presenter?.bio?.slice(0, 160) || "Meet our talented presenter at Pie Radio.",
    };
}

export default async function PresenterPage({ params }: PresenterPageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    // Try to fetch real presenter from database
    let presenter = null;
    const { data, error } = await supabase
        .from("profiles")
        .select(`
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
        `)
        .or(`slug.eq.${slug},username.eq.${slug}`)
        .eq("role", "presenter")
        .single();

    if (data) {
        presenter = data;
    } else {
        // Use dummy data fallback
        presenter = DUMMY_PRESENTERS[slug];
    }

    if (!presenter) {
        notFound();
    }

    const shows = DUMMY_SHOWS; // In production, fetch from database
    const relatedPresenters = RELATED_PRESENTERS.filter(p => p.slug !== slug);

    return (
        <div className="flex flex-col w-full min-h-screen bg-background">
            {/* Back Navigation */}
            <div className="container px-4 md:px-8 max-w-screen-2xl mx-auto pt-6">
                <Link
                    href="/presenters"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Presenters
                </Link>
            </div>

            {/* Hero Section */}
            <section className="container px-4 md:px-8 max-w-screen-2xl mx-auto pt-8 pb-12">
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-violet-600 to-purple-700 p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Text Content */}
                        <div className="flex-1 text-center md:text-left text-white space-y-4">
                            <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
                                {presenter.full_name}
                            </h1>
                            <p className="text-lg text-white/80">
                                {shows[0]?.title} • Weekdays 10am-2pm
                            </p>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-white/70">
                                <Clock className="w-4 h-4" />
                                {shows[0]?.schedule || "Monday - Friday • 10:00 - 14:00"}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
                                <Button
                                    size="lg"
                                    className="rounded-full bg-white text-primary hover:bg-white/90 font-bold px-8"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Listen to Show
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="rounded-full border-white/30 text-white bg-white/10 hover:bg-white/10 font-bold px-8"
                                >
                                    View Schedule
                                </Button>
                            </div>
                        </div>

                        {/* Presenter Image */}
                        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                            {presenter.avatar_url ? (
                                <Image
                                    src={presenter.avatar_url}
                                    alt={presenter.full_name || "Presenter"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30 text-6xl font-bold">
                                    {(presenter.full_name || "P").charAt(0)}
                                </div>
                            )}

                            {/* Live Indicator */}
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

            {/* Content Grid */}
            <section className="container px-4 md:px-8 max-w-screen-2xl mx-auto pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - About & Shows */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About Section */}
                        <div className="bg-white rounded-3xl border border-border p-8">
                            <h2 className="text-2xl font-bold font-display mb-6">About</h2>
                            <div className="prose prose-zinc max-w-none">
                                {presenter.bio?.split('\n\n').map((paragraph: string, i: number) => (
                                    <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Shows Section */}
                        <div className="bg-white rounded-3xl border border-border p-8">
                            <h2 className="text-2xl font-bold font-display mb-6">Shows</h2>
                            <div className="space-y-4">
                                {shows.map((show) => (
                                    <div
                                        key={show.id}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors"
                                    >
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-primary/10">
                                            {show.cover_image_url ? (
                                                <Image
                                                    src={show.cover_image_url}
                                                    alt={show.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Play className="w-6 h-6 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-foreground">{show.title} • {show.schedule}</h3>
                                            <p className="text-sm text-muted-foreground mt-0.5">{show.schedule}</p>
                                            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{show.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Contact Form */}
                    <div className="space-y-8">
                        <PresenterContactForm presenterId={presenter.id} presenterName={presenter.full_name} />
                    </div>
                </div>
            </section>

            {/* Related Presenters */}
            {/* <section className="container px-4 md:px-8 max-w-screen-2xl mx-auto pb-20">
                <h2 className="text-2xl font-bold font-display text-center mb-8">Related Presenters</h2>
                <RelatedPresenters presenters={relatedPresenters} />
            </section> */}
        </div>
    );
}
