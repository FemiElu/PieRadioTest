import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

interface HomeFeaturedCardProps {
    title: string;
    subtitle: string;
    description: string;
    imageSource: any;
    /** When undefined the card is non-interactive (no press feedback). */
    onPress?: () => void;
    badge?: string;
    badgeColor?: string;
}

export function HomeFeaturedCard({
    title,
    subtitle,
    description,
    imageSource,
    onPress,
    badge,
    badgeColor = "#F96D00"
}: HomeFeaturedCardProps) {
    const cardStyle = [
        styles.card,
        styles.cardShadow,
    ];

    const inner = (
        <>
            <View className="h-40 relative">
                <Image
                    source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
                    className="w-full h-full"
                    resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/30" />

                {badge && (
                    <View
                        className="absolute top-3 left-3 px-2 py-1 rounded-full shadow-sm"
                        style={{ backgroundColor: badgeColor }}
                    >
                        <Text className="text-white text-[10px] font-bold uppercase">{badge}</Text>
                    </View>
                )}
            </View>

            <View className="p-4">
                <Text className="text-primary text-[10px] font-bold uppercase mb-1">{subtitle}</Text>
                <Text className="text-white text-lg font-bold mb-1" numberOfLines={1}>{title}</Text>
                <Text className="text-zinc-400 text-xs leading-snug" numberOfLines={2}>
                    {description}
                </Text>
            </View>
        </>
    );

    if (!onPress) {
        return <View style={cardStyle}>{inner}</View>;
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={cardStyle}
            accessibilityRole="button"
            accessibilityLabel={title}
        >
            {inner}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 280,
        marginRight: 16,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    }
});

