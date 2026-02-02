import { View, Text } from 'react-native';
import { styled } from 'nativewind';

interface EventStatusBadgeProps {
    status: "onsale" | "soldout" | "fewleft" | "presale" | "cancelled";
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
    const getStatusStyles = () => {
        switch (status) {
            case "onsale": return "bg-green-500";
            case "fewleft": return "bg-orange-500";
            case "presale": return "bg-blue-500";
            case "soldout": return "bg-gray-500";
            case "cancelled": return "bg-red-500";
            default: return "bg-primary";
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case "onsale": return "On Sale";
            case "fewleft": return "Few Left";
            case "presale": return "Presale";
            case "soldout": return "Sold Out";
            case "cancelled": return "Cancelled";
            default: return status;
        }
    };

    return (
        <View className={`px-2 py-1 rounded-full self-start ${getStatusStyles()}`}>
            <Text className="text-white text-xs font-bold uppercase">{getStatusLabel()}</Text>
        </View>
    );
}
