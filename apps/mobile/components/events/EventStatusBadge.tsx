import { View, Text } from 'react-native';
import type { EventStatus } from '../../lib/events/types';
import { EVENT_STATUS_LABELS } from '../../lib/events/types';

interface EventStatusBadgeProps {
    status: EventStatus;
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
    const getStatusStyles = () => {
        switch (status) {
            case "upcoming": return "bg-emerald-500";
            case "past": return "bg-zinc-500";
            case "cancelled": return "bg-red-500";
            default: return "bg-[#334AFF]"; // Primary blue
        }
    };

    return (
        <View className={`px-2 py-0.5 rounded-md self-start ${getStatusStyles()}`}>
            <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                {EVENT_STATUS_LABELS[status] || status}
            </Text>
        </View>
    );
}
