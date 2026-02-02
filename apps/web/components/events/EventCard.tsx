import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@/lib/dummy-data/events";
import { EventStatusBadge } from "./EventStatusBadge";
import { format } from "date-fns";

interface EventCardProps {
    event: Event;
    variant?: "compact" | "default";
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
    const formattedDate = format(new Date(event.date), "EEE, MMM d");

    return (
        <Link href={`/events/${event.id}`} className="group block h-full">
            <Card className="h-full overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-colors duration-300">
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3">
                        <EventStatusBadge status={event.status} />
                    </div>
                </div>

                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                {event.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{event.artist}</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 py-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>
                            {formattedDate} • {event.time}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="truncate">{event.venue.name}</span>
                    </div>
                </CardContent>

                {variant === "default" && (
                    <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-border/50 bg-muted/20">
                        <div className="font-semibold text-primary">
                            {event.priceRange.currency}{event.priceRange.min} - {event.priceRange.currency}{event.priceRange.max}
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 gap-1 group-hover:translate-x-1 transition-transform">
                            Details <ArrowRight className="w-4 h-4" />
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
}
