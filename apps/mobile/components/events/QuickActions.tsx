import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
}

function QuickAction({ icon, label, onPress }: QuickActionProps) {
    return (
        <TouchableOpacity
            className="flex-1 items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Ionicons name={icon} size={24} color="#334aff" />
            <Text className="text-xs font-semibold mt-2 text-center text-gray-800">{label}</Text>
        </TouchableOpacity>
    );
}

export function QuickActions() {
    return (
        <View className="flex-row gap-3 mb-6">
            <QuickAction icon="ticket-outline" label="Buy Tickets" />
            <QuickAction icon="calendar-outline" label="Submit Event" />
            <QuickAction icon="people-outline" label="Host with Us" />
        </View>
    );
}
