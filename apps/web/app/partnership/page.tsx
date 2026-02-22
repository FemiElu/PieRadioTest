"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import {
    Play,
    Pause,
    Radio,
    Gift,
    Music,
    Zap,
    Volume2,
    VolumeX,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { joinWaitlist } from "../actions/waitlist";
import { useFormStatus } from "react-dom";

/* ================================================================
   Constants
   ================================================================ */

const CITIES = [
    "London",
    "Manchester",
    "Birmingham",
    "Leeds",
    "Liverpool",
    "Bristol",
    "Glasgow",
    "Edinburgh",
    "Other",
] as const;

const FEATURES = [
    {
        icon: Radio,
        title: "Branded on-air promotions",
        description:
            "Hear Popeyes specials across Pie Radio shows — from shout-outs to custom jingles.",
    },
    {
        icon: Music,
        title: "Curated playlists",
        description:
            "Louisiana-inspired playlists that pair perfectly with bold flavour and good vibes.",
    },
    {
        icon: Gift,
        title: "Exclusive giveaways",
        description:
            "Win meal vouchers, merch drops, and VIP experiences — just for tuning in.",
    },
    {
        icon: Zap,
        title: "Live activations",
        description:
            "Pop-up events, live broadcasts from Popeyes locations, and surprise appearances.",
    },
] as const;

const CAROUSEL_IMAGES = [
    { id: 1, src: "/assets/popeye-3.jpeg", alt: "Delicious food spread" },
    { id: 2, src: "/assets/piesinger-1.webp", alt: "Pizza close-up" },
    { id: 3, src: "/assets/popeye-2.webp", alt: "Live music concert" },
    { id: 4, src: "/assets/popeye-1.webp", alt: "Concert crowd" },
    { id: 5, src: "/assets/pieImg.webp", alt: "Grilled chicken" },
    { id: 6, src: "/assets/popeyes_heroImg.webp", alt: "Radio studio" },
] as const;

const CONFETTI_COLORS = [
    "#FF6A00",
    "#A31919",
    "#FFB347",
    "#FF6B6B",
    "#FFC300",
    "#334AFF",
];

const waitlistSchema = z.object({
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email("Please enter a valid email address."),
});

/* ================================================================
   Analytics Helpers
   ================================================================ */

function pushEvent(event: string, data?: Record<string, unknown>) {
    if (typeof window !== "undefined") {
        const win = window as unknown as { dataLayer?: Record<string, unknown>[] };
        if (!win.dataLayer) {
            win.dataLayer = [];
        }
        win.dataLayer.push({ event, ...data });
    }
}

/* ================================================================
   Component: Confetti
   ================================================================ */

function Confetti({ show }: { show: boolean }) {
    if (!show) return null;

    const pieces = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 40}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${Math.random() * 0.6}s`,
        rotation: `${Math.random() * 360}deg`,
        size: `${6 + Math.random() * 8}px`,
    }));

    return (
        <div className="confetti-container" aria-hidden="true">
            {pieces.map((p) => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: p.left,
                        top: p.top,
                        backgroundColor: p.color,
                        animationDelay: p.delay,
                        width: p.size,
                        height: p.size,
                        transform: `rotate(${p.rotation})`,
                    }}
                />
            ))}
        </div>
    );
}

/* ================================================================
   Component: Equalizer
   ================================================================ */

function Equalizer({ playing }: { playing: boolean }) {
    return (
        <div
            className={cn("equalizer", !playing && "equalizer-paused")}
            aria-hidden="true"
        >
            {[...Array(5)].map((_, i) => (
                <div key={i} className="equalizer-bar" />
            ))}
        </div>
    );
}

/* ================================================================
   Component: SubmitButton
   ================================================================ */

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            id="waitlist-submit"
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-xl text-base font-bold bg-popeyes-orange hover:bg-popeyes-orange/90 text-white shadow-lg shadow-popeyes-orange/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {pending ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Joining...
                </div>
            ) : (
                "Join the Waitlist"
            )}
        </Button>
    );
}

/* ================================================================
   Hook: useScrollReveal
   ================================================================ */

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed");
                    }
                });
            },
            { threshold: 0.12 }
        );

        const targets = el.querySelectorAll(".scroll-reveal");
        targets.forEach((t) => observer.observe(t));

        return () => observer.disconnect();
    }, []);

    return ref;
}

/* ================================================================
   Social Icons (inline SVGs for zero-dep footprint)
   ================================================================ */

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

/* ================================================================
   Main Page Component
   ================================================================ */

export default function PartnershipPage() {
    /* --- Audio state --- */
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioMuted, setAudioMuted] = useState(false);

    /* --- Form state --- */
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("")
    const [city, setCity] = useState("");
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    /* --- Carousel state --- */
    const carouselRef = useRef<HTMLDivElement>(null);

    /* --- Scroll reveal --- */
    const revealContainerRef = useScrollReveal();

    /* --- Waitlist form ref for scroll-into-view --- */
    const waitlistRef = useRef<HTMLElement>(null);

    /* --- Analytics: page view on mount --- */
    useEffect(() => {
        pushEvent("partnership_page_view");
    }, []);

    /* --- Audio handlers --- */
    const toggleAudio = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isAudioPlaying) {
            audio.pause();
            pushEvent("audio_teaser_pause");
        } else {
            audio.play();
            pushEvent("audio_teaser_play");
        }
        setIsAudioPlaying(!isAudioPlaying);
    }, [isAudioPlaying]);

    const handleTimeUpdate = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        setAudioProgress(audio.currentTime);
        setAudioDuration(audio.duration || 0);
    }, []);

    const handleSeek = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const audio = audioRef.current;
            if (!audio) return;
            const newTime = parseFloat(e.target.value);
            audio.currentTime = newTime;
            setAudioProgress(newTime);
        },
        []
    );

    const toggleMute = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.muted = !audio.muted;
        setAudioMuted(!audioMuted);
    }, [audioMuted]);

    /* --- Carousel scroll --- */
    const scrollCarousel = useCallback(
        (direction: "left" | "right") => {
            const el = carouselRef.current;
            if (!el) return;
            const scrollAmount = el.clientWidth * 0.7;
            el.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
            pushEvent("carousel_scroll", { direction });
        },
        []
    );

    /* --- Waitlist submit --- */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const nameVal = formData.get("fullName")?.toString() || "";
        const emailVal = formData.get("email")?.toString() || "";

        const result = waitlistSchema.safeParse({ fullName: nameVal, email: emailVal });
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            const firstError = Object.values(fieldErrors).flat()[0];
            setFormError(firstError || "Invalid input.");
            return;
        }

        try {
            const response = await joinWaitlist(null, formData);

            if (response.success) {
                setFormSuccess(true);
                setShowConfetti(true);
                pushEvent("waitlist_signup", { email: result.data.email });
                // Remove confetti after animation completes
                setTimeout(() => setShowConfetti(false), 2000);
            } else {
                setFormError(response.message || "Something went wrong. Please try again.");
            }
        } catch (err) {
            setFormError("An unexpected error occurred. Please try again.");
        }
    };

    /* --- Social click --- */
    const handleSocialClick = useCallback((platform: string) => {
        pushEvent("social_click", { platform });
    }, []);

    const scrollToWaitlist = useCallback(() => {
        waitlistRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    /* --- Format time --- */
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div ref={revealContainerRef} className="flex flex-col w-full">
            <Confetti show={showConfetti} />

            {/* ============================================================
          HERO SECTION
          ============================================================ */}
            <section className="relative w-full min-h-[360px] sm:min-h-[420px] lg:min-h-[540px] xl:min-h-[640px] overflow-hidden bg-deep-text">
                {/* Background image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/popeyes_heroImg.webp"
                        alt="Restaurant interior with warm lighting"
                        fill
                        className="object-cover object-center"
                        priority
                        sizes="100vw"
                    />
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                </div>

                <div className="container relative z-10 h-full max-w-screen-2xl mx-auto px-4 md:px-8 flex flex-col justify-center py-16 sm:py-20 lg:py-24">
                    {/* Brand lockup */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <Image
                            src="/assets/logo.png"
                            alt="Pie Radio logo"
                            width={140}
                            height={42}
                            className="h-8 sm:h-10 lg:h-12 w-auto"
                            priority
                        />
                        <span className="text-white/50 text-2xl sm:text-3xl font-thin">×</span>
                        <Image
                            src="/assets/popeyes-seeklogo.png"
                            alt="Popeyes Louisiana Kitchen logo"
                            width={50}
                            height={42}
                            className="h-8 sm:h-10 lg:h-12 w-auto"
                            priority
                        />
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-display tracking-tight text-white leading-[1.08] max-w-3xl mb-4 sm:mb-6">
                        Turning Up the Flavor.{" "}
                        <span className="gradient-text">Turning Up the Volume.</span>
                    </h1>

                    {/* Subcopy */}
                    <p className="text-sm sm:text-base lg:text-lg text-zinc-300 leading-relaxed max-w-xl mb-6 sm:mb-8">
                        Pie Radio is proud to partner with Popeyes Louisiana Kitchen — the global home of bold, Louisiana-inspired flavor. This exciting collaboration blends great food with great sound.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Button
                            id="hero-cta-waitlist"
                            size="lg"
                            className="h-12 sm:h-14 px-8 rounded-full text-base sm:text-lg shadow-2xl shadow-popeyes-orange/30 gap-3 group bg-popeyes-orange hover:bg-popeyes-orange/90 text-white font-bold"
                            onClick={scrollToWaitlist}
                        >
                            Join the Waitlist
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <div className="coming-soon-tooltip inline-flex">
                            <Button
                                id="hero-cta-preview"
                                variant="outline"
                                size="lg"
                                className="h-12 sm:h-14 px-8 rounded-full text-base sm:text-lg border-2 gap-3 bg-white/5 backdrop-blur-sm text-white border-white/20 cursor-not-allowed opacity-60"
                                disabled
                                aria-disabled="true"
                                title="Available on launch."
                            >
                                <Music className="w-5 h-5" />
                                Preview Heaters Show
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================
          AUDIO TEASER
          ============================================================ */}
            {/* <section className="bg-deep-text py-6 scroll-reveal" aria-label="Audio teaser preview">
                <div className="container max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
                        <button
                            id="audio-play-btn"
                            onClick={toggleAudio}
                            className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-popeyes-orange flex items-center justify-center text-white hover:bg-popeyes-orange/90 transition-colors focus:outline-none focus:ring-2 focus:ring-popeyes-orange focus:ring-offset-2 focus:ring-offset-deep-text"
                            aria-label={isAudioPlaying ? "Pause audio teaser" : "Play audio teaser"}
                        >
                            {isAudioPlaying ? (
                                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
                            )}
                        </button>

                        <div className="flex-1 w-full flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-white text-xs sm:text-sm font-semibold">
                                    Partnership Teaser
                                </span>
                                <span className="text-zinc-400 text-xs tabular-nums">
                                    {formatTime(audioProgress)} / {formatTime(audioDuration)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max={audioDuration || 0}
                                value={audioProgress}
                                onChange={handleSeek}
                                className="audio-range w-full"
                                aria-label="Audio progress"
                            />
                        </div>

                        <Equalizer playing={isAudioPlaying} />

                        <button
                            id="audio-mute-btn"
                            onClick={toggleMute}
                            className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-popeyes-orange rounded-md p-1"
                            aria-label={audioMuted ? "Unmute audio" : "Mute audio"}
                        >
                            {audioMuted ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                <audio
                    ref={audioRef}
                    src="/assets/partnership/dummy-audio.wav"
                    preload="metadata"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onEnded={() => setIsAudioPlaying(false)}
                />
            </section> */}

            {/* ============================================================
          FEATURES GRID
          ============================================================ */}
            {/* <section className="bg-warm-cream py-16 sm:py-20 lg:py-24">
                <div className="container max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-10 sm:mb-14 scroll-reveal">
                        <p className="text-popeyes-orange text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-3">
                            What&apos;s Cooking
                        </p>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-deep-text tracking-tight">
                            Bold Flavour Meets Bold Sound
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                        {FEATURES.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className={cn(
                                        "scroll-reveal group bg-white rounded-2xl border border-border/50 p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default",
                                        `scroll-reveal-delay-${idx + 1}`
                                    )}
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-popeyes-orange/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-popeyes-orange/20 transition-colors">
                                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-popeyes-orange" />
                                    </div>
                                    <h3 className="font-bold text-base sm:text-lg text-deep-text mb-2 font-display">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section> */}

            {/* ============================================================
          MEDIA CAROUSEL
          ============================================================ */}
            <section className="bg-deep-text py-16 sm:py-20 lg:py-24 overflow-hidden">
                <div className="container max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="flex items-end justify-between mb-8 sm:mb-10 scroll-reveal">
                        <div>
                            <p className="text-popeyes-orange text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-2">
                                Sneak Peek
                            </p>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
                                Behind the Scenes
                            </h2>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <button
                                onClick={() => scrollCarousel("left")}
                                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-popeyes-orange"
                                aria-label="Scroll carousel left"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => scrollCarousel("right")}
                                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-popeyes-orange"
                                aria-label="Scroll carousel right"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div
                        ref={carouselRef}
                        className="carousel-snap flex gap-4 sm:gap-6 overflow-x-auto pb-4"
                    >
                        {CAROUSEL_IMAGES.map((img) => (
                            <div
                                key={img.id}
                                className="group relative flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] aspect-[4/3] rounded-2xl overflow-hidden border border-white/10"
                            >
                                <Image
                                    src={img.src}
                                    alt={img.alt}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 360px"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-14 h-14 rounded-full bg-popeyes-orange/90 flex items-center justify-center text-white shadow-xl">
                                        <Play className="w-6 h-6 fill-current ml-0.5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================================
          WAITLIST FORM
          ============================================================ */}
            <section
                ref={waitlistRef}
                id="waitlist"
                className="bg-warm-cream py-16 sm:py-20 lg:py-24"
            >
                <div className="container max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="max-w-xl mx-auto text-center scroll-reveal">
                        <p className="text-popeyes-orange text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-3">
                            Be the First to Know
                        </p>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-deep-text tracking-tight mb-3">
                            Join the Waitlist
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
                            Sign up to get exclusive early access to the Popeyes Event coming soon!
                        </p>

                        {formSuccess ? (
                            <div className="bg-white rounded-2xl border border-popeyes-orange/30 p-8 sm:p-10 text-center animate-slide-in-up">
                                <div className="w-16 h-16 rounded-full bg-popeyes-orange/10 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl" role="img" aria-label="Party">🎉</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold font-display text-deep-text mb-2">
                                    You&apos;re in!
                                </h3>
                                <p className="text-sm sm:text-base text-muted-foreground">
                                    We&apos;ll send event updates to{" "}
                                    <span className="font-semibold text-deep-text">{email || fullName}</span>.
                                    <br />
                                    Stay hungry. Stay vibing.
                                </p>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit}
                                className="bg-white rounded-2xl border border-border/50 p-6 sm:p-8 shadow-lg scroll-reveal"
                                noValidate
                            >
                                <div className="space-y-4">
                                    <div className="text-left">
                                        <label
                                            htmlFor="full-name"
                                            className="text-sm font-medium text-deep-text mb-1.5 block"
                                        >
                                            Full name <span className="text-cajun-red">*</span>
                                        </label>
                                        <Input
                                            id="full-name"
                                            name="fullName"
                                            type="text"
                                            placeholder="Joe Doe"
                                            defaultValue={fullName}
                                            onChange={(e) => {
                                                setFullName(e.target.value);
                                                if (formError) setFormError("");
                                            }}
                                            className="h-12 rounded-xl text-base"
                                            required
                                            autoComplete="name"
                                        />
                                    </div>

                                    <div className="text-left">
                                        <label
                                            htmlFor="waitlist-email"
                                            className="text-sm font-medium text-deep-text mb-1.5 block"
                                        >
                                            Email address <span className="text-cajun-red">*</span>
                                        </label>
                                        <Input
                                            id="waitlist-email"
                                            name="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            defaultValue={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (formError) setFormError("");
                                            }}
                                            className="h-12 rounded-xl text-base"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>

                                    {formError && (
                                        <p
                                            className="text-sm text-cajun-red text-left"
                                            role="alert"
                                            aria-live="assertive"
                                        >
                                            {formError}
                                        </p>
                                    )}

                                    <SubmitButton />
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* ============================================================
          SOCIAL
          ============================================================ */}
            <section className="bg-white py-12 sm:py-16 border-t border-border/50">
                <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 text-center scroll-reveal">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
                        Follow the vibe
                    </p>
                    <h2 className="text-xl sm:text-2xl font-bold font-display text-deep-text mb-6">
                        Stay Connected
                    </h2>
                    <div className="flex items-center justify-center gap-4">
                        {[
                            { Icon: InstagramIcon, label: "Instagram", platform: "instagram" },
                            { Icon: XIcon, label: "X (Twitter)", platform: "twitter" },
                            { Icon: FacebookIcon, label: "Facebook", platform: "facebook" },
                        ].map(({ Icon, label, platform }) => (
                            <a
                                key={platform}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSocialClick(platform);
                                }}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-border/50 flex items-center justify-center text-deep-text hover:bg-popeyes-orange hover:border-popeyes-orange hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-popeyes-orange focus:ring-offset-2"
                                aria-label={`Follow us on ${label}`}
                            >
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================================
          COMING SOON FOOTER BANNER
          ============================================================ */}
            <section className="bg-gradient-to-r from-popeyes-orange via-cajun-red to-popeyes-orange py-10 sm:py-14 relative overflow-hidden">
                {/* Decorative waveform */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 60 Q 15 40 30 60 T 60 60 T 90 60 T 120 60 V 100 H 0 Z" fill="white" />
                    </svg>
                </div>

                <div className="container relative max-w-screen-2xl mx-auto px-4 md:px-8 text-center text-white">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 animate-float">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        Coming Soon
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display mb-3">
                        Something Delicious Is on the Way
                    </h2>
                    <p className="text-base sm:text-lg text-white/80 max-w-lg mx-auto leading-relaxed">
                        We&apos;re putting the finishing touches on an unforgettable collaboration. Stay tuned.
                    </p>
                </div>
            </section>
        </div>
    );
}
