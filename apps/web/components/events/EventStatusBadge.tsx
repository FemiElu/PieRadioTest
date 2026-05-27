import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EventStatus } from "@/lib/events/types";
import { EVENT_STATUS_LABELS, getDerivedEventStatus } from "@/lib/events/types";

interface EventStatusBadgeProps {
    status: EventStatus;
    startTime?: string;
    endTime?: string | null;
    className?: string;
}

export function EventStatusBadge({ status, startTime, endTime, className }: EventStatusBadgeProps) {
    const getStatusStyles = (status: EventStatus) => {
        switch (status) {
            case "upcoming":
                return "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent";
            case "past":
                return "bg-zinc-500 hover:bg-zinc-600 text-white border-transparent";
            case "cancelled":
                return "bg-red-500 hover:bg-red-600 text-white border-transparent";
            default:
                return "bg-primary text-primary-foreground";
        }
    };

    const currentStatus = startTime ? getDerivedEventStatus(status, startTime, endTime || null) : status;

    return (
        <Badge className={cn("uppercase tracking-widest text-[10px] py-0.5 px-2 font-black", getStatusStyles(currentStatus), className)}>
            {EVENT_STATUS_LABELS[currentStatus] || currentStatus}
        </Badge>
    );
}
