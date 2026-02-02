import { Ticket, CalendarPlus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionProps {
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
}

function QuickAction({ icon: Icon, label, onClick }: QuickActionProps) {
    return (
        <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 w-full gap-2 border-border/50 bg-card hover:border-primary/50 hover:bg-muted/50 transition-all"
            onClick={onClick}
        >
            <Icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{label}</span>
        </Button>
    );
}

export function QuickActions() {
    return (
        <div className="grid grid-cols-3 gap-3 px-4 md:px-0">
            <QuickAction icon={Ticket} label="Buy Tickets" />
            <QuickAction icon={CalendarPlus} label="Submit Event" />
            <QuickAction icon={UserPlus} label="Host with Us" />
        </div>
    );
}
