"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
    Calendar,
    MapPin,
    Clock,
    ArrowLeft,
    Share2,
    Heart,
    CalendarPlus,
    PlayCircle,
    PauseCircle,
    Navigation,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EVENTS } from "@/lib/dummy-data/events";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { PurchaseModal } from "@/components/events/PurchaseModal";
import { FeaturedCarousel } from "@/components/events/FeaturedCarousel";
import { useAudio } from "@/context/audio-context";
import { Howl } from "howler";

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isPlaying: isRadioPlaying, togglePlay: toggleRadio } = useAudio();

    const id = params.id as string;
    const event = EVENTS.find((e) => e.id === id);

    const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
    const [isPlayingPromo, setIsPlayingPromo] = useState(false);
    const [promoSound, setPromoSound] = useState<Howl | null>(null);

    // Initialize Audio Promo
    useEffect(() => {
        if (event?.audioPromoUrl) {
            const sound = new Howl({
                src: [event.audioPromoUrl],
                html5: true,
                onend: () => setIsPlayingPromo(false),
                onpause: () => setIsPlayingPromo(false),
                onplay: () => setIsPlayingPromo(true),
            });
            setPromoSound(sound);

            return () => {
                sound.unload();
            };
        }
    }, [event]);

    const togglePromo = () => {
        if (!promoSound) return;

        if (isPlayingPromo) {
            promoSound.pause();
        } else {
            // Pause radio if playing
            if (isRadioPlaying) {
                toggleRadio();
            }
            promoSound.play();
        }
    };

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h1 className="text-2xl font-bold">Event Not Found</h1>
                <Button variant="link" onClick={() => router.push("/events")}>
                    Back to Events
                </Button>
            </div>
        );
    }

    const formattedDate = format(new Date(event.date), "EEEE, MMMM do, yyyy");
    const relatedEvents = EVENTS.filter(
        (e) => e.id !== event.id && (e.category === event.category || e.venue.city === event.venue.city)
    ).slice(0, 5);

    return (
        <div className="pb-20">
            {/* Back Button (Mobile/Desktop) */}
            <div className="container py-4 md:py-6">
                <Button
                    variant="ghost"
                    className="gap-2 pl-0 hover:pl-2 transition-all"
                    onClick={() => router.push("/events")}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Events
                </Button>
            </div>

            {/* Hero Section */}
            <div className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh] bg-muted/20">
                <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 container pb-8 md:pb-12">
                    <div className="max-w-4xl space-y-4">
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EventStatusBadge status={event.status} />
                            <Badge variant="outline" className="bg-background/50 backdrop-blur text-foreground border-white/20">
                                {event.category.toUpperCase()}
                            </Badge>
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
                            {event.title}
                        </h1>

                        <p className="text-lg md:text-2xl text-white/90 font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            {event.artist}
                        </p>

                        {/* Audio Promo CTA */}
                        {event.audioPromoUrl && (
                            <Button
                                size="lg"
                                variant="outline"
                                className="mt-4 gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                                onClick={togglePromo}
                            >
                                {isPlayingPromo ? (
                                    <>
                                        <PauseCircle className="w-5 h-5" /> Pause Preview
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle className="w-5 h-5" /> Listen to Preview
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">
                {/* Main Content (Left Col) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border bg-card/50">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold">Date & Time</h3>
                                <p className="text-muted-foreground">{formattedDate}</p>
                                <p className="text-muted-foreground">{event.time}</p>
                                <Button variant="link" className="px-0 h-auto text-primary text-xs mt-1">
                                    <CalendarPlus className="w-3 h-3 mr-1" /> Add to Calendar
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold">Venue</h3>
                                <p className="font-medium">{event.venue.name}</p>
                                <p className="text-muted-foreground">{event.venue.address}</p>
                                <p className="text-muted-foreground">{event.venue.city}</p>
                                <Button variant="link" className="px-0 h-auto text-primary text-xs mt-1">
                                    <Navigation className="w-3 h-3 mr-1" /> Get Directions
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold font-display">About the Event</h2>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </p>
                    </div>

                    {/* Venue Info Extended */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold font-display">Venue Information</h2>
                        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                            {event.venue.transportTips && (
                                <div>
                                    <span className="font-semibold block text-sm mb-1">Getting There</span>
                                    <p className="text-sm text-muted-foreground">{event.venue.transportTips}</p>
                                </div>
                            )}
                            {event.venue.rules && (
                                <div>
                                    <span className="font-semibold block text-sm mb-1">Venue Rules</span>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                        {event.venue.rules.map((rule, idx) => (
                                            <li key={idx}>{rule}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right Col) - Sticky Ticket Box */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="p-6 rounded-xl border bg-card shadow-sm space-y-6">
                            <div className="price-tiers space-y-3">
                                <h3 className="font-semibold text-lg">Tickets</h3>
                                <div className="space-y-2">
                                    {event.ticketTiers.map(tier => (
                                        <div key={tier.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0 border-border/50">
                                            <div>
                                                <span className="font-medium">{tier.name}</span>
                                                {tier.available < 20 && tier.available > 0 && (
                                                    <span className="block text-xs text-orange-500">Only {tier.available} left!</span>
                                                )}
                                            </div>
                                            <span className="font-bold">{tier.currency}{tier.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full text-lg shadow-primary/20 shadow-lg"
                                onClick={() => setIsPurchaseOpen(true)}
                                disabled={event.status === 'soldout' || event.status === 'cancelled'}
                            >
                                {event.status === 'soldout' ? 'Sold Out' : 'Buy Tickets'}
                            </Button>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 gap-2">
                                    <Share2 className="w-4 h-4" /> Share
                                </Button>
                                <Button variant="outline" className="flex-1 gap-2">
                                    <Heart className="w-4 h-4" /> Save
                                </Button>
                            </div>

                            <div className="text-xs text-center text-muted-foreground">
                                Secure checkout powered by Pie Radio
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="my-12" />

            {/* Related Events */}
            <div className="container">
                <h2 className="text-2xl font-bold font-display mb-6">You Might Also Like</h2>
                <FeaturedCarousel events={relatedEvents} />
            </div>

            {/* Purchase Modal */}
            <PurchaseModal
                event={event}
                isOpen={isPurchaseOpen}
                onClose={() => setIsPurchaseOpen(false)}
            />
        </div>
    );
}
