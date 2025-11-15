import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: any; // React component for icon
    iconColor: string;
    iconBgColor: string;
    textColor?: string;
    progress?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
    textColor,
    progress,
}) => {
    const getIconBgStyle = (bgColor: string) => {
        const colorMap: { [key: string]: string } = {
            'bg-blue-100': '#DBEAFE',
            'bg-green-100': '#D1FAE5',
            'bg-red-100': '#FEE2E2',
            'bg-orange-100': '#FFEDD5',
            'bg-purple-100': '#F3E8FF',
        };
        return { backgroundColor: colorMap[bgColor] || '#E5E7EB' };
    };

    const getIconColorStyle = (color: string) => {
        const colorMap: { [key: string]: string } = {
            'text-blue-600': '#2563EB',
            'text-green-600': '#16A34A',
            'text-red-600': '#DC2626',
            'text-orange-600': '#EA580C',
            'text-purple-600': '#9333EA',
        };
        return colorMap[color] || '#374151';
    };

    const getTextColorStyle = (color?: string) => {
        if (!color) return '#111827';
        const colorMap: { [key: string]: string } = {
            'text-blue-600': '#2563EB',
            'text-green-600': '#16A34A',
            'text-red-600': '#DC2626',
        };
        return colorMap[color] || '#111827';
    };

    return (
        <View style={styles.card}>
            <View style={styles.content}>
                <View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={[styles.value, { color: getTextColorStyle(textColor) }]}>
                        {value}
                    </Text>
                </View>
                <View style={[styles.iconContainer, getIconBgStyle(iconBgColor)]}>
                    <Icon size={24} color={getIconColorStyle(iconColor)} />
                </View>
            </View>
            {progress !== undefined && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: 8,
    },
    value: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        marginTop: 12,
    },
    progressBg: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#16A34A',
        borderRadius: 2,
    },
});

export default StatsCard;
