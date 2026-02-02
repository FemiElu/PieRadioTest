import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EventStatus } from "@/lib/dummy-data/events";

interface EventStatusBadgeProps {
    status: EventStatus;
    className?: string;
}

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
    const getStatusStyles = (status: EventStatus) => {
        switch (status) {
            case "onsale":
                return "bg-green-500 hover:bg-green-600 text-white border-transparent";
            case "fewleft":
                return "bg-orange-500 hover:bg-orange-600 text-white border-transparent";
            case "presale":
                return "bg-blue-500 hover:bg-blue-600 text-white border-transparent";
            case "soldout":
                return "bg-gray-500 hover:bg-gray-600 text-white border-transparent";
            case "cancelled":
                return "bg-red-500 hover:bg-red-600 text-white border-transparent";
            default:
                return "bg-primary text-primary-foreground";
        }
    };

    const getStatusLabel = (status: EventStatus) => {
        switch (status) {
            case "onsale":
                return "On Sale";
            case "fewleft":
                return "Few Left";
            case "presale":
                return "Presale";
            case "soldout":
                return "Sold Out";
            case "cancelled":
                return "Cancelled";
            default:
                return status;
        }
    };

    return (
        <Badge className={cn(getStatusStyles(status), className)}>
            {getStatusLabel(status)}
        </Badge>
    );
}
