import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/events/types";
import { formatEventPrice } from "@/lib/events/types";
import { EventStatusBadge } from "./EventStatusBadge";
import { format } from "date-fns";

interface EventCardProps {
    event: Event;
    variant?: "compact" | "default";
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
    const formattedDate = format(new Date(event.start_time), "EEE, MMM d");

    return (
        <Link href={`/events/${event.slug}`} className="group block h-full">
            <Card className="h-full overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-colors duration-300 shadow-sm hover:shadow-md">
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                    {event.cover_image_url ? (
                        <Image
                            src={event.cover_image_url}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-zinc-200" />
                        </div>
                    )}
                    <div className="absolute top-3 right-3">
                        <EventStatusBadge status={event.status} startTime={event.start_time} endTime={event.end_time} />
                    </div>
                </div>

                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                {event.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                                {event.artist_name || "Pie Radio Event"}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 py-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>
                            {formattedDate} {event.start_time.includes('T') ? `• ${format(new Date(event.start_time), "HH:mm")}` : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="truncate">{event.venue_name || event.venue_city || event.location || "TBA"}</span>
                    </div>
                </CardContent>

                {variant === "default" && (
                    <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-border/50 bg-muted/20">
                        <div className="font-black text-primary text-sm tracking-tight uppercase">
                            {formatEventPrice(event)}
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 gap-1 group-hover:translate-x-1 transition-transform font-bold text-xs uppercase tracking-widest text-zinc-500">
                            Details <ArrowRight className="w-3 h-3" />
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
}
