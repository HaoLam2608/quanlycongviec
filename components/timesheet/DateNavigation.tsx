import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../app/(tabs)/member-timesheet/index.styles';

interface DateNavigationProps {
    selectedDate: Date | null;
    onPrevDate: () => void;
    onNextDate: () => void;
    onOpenDatePicker: () => void;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
    selectedDate,
    onPrevDate,
    onNextDate,
    onOpenDatePicker,
}) => {
    if (!selectedDate) return null;

    return (
        <View style={styles.dateNav}>
            <TouchableOpacity style={styles.dateNavButton} onPress={onPrevDate}>
                <Ionicons name="chevron-back" size={24} color="#667eea" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateDisplay} onPress={onOpenDatePicker}>
                <Text style={styles.dateText}>{selectedDate.toLocaleDateString('vi-VN')}</Text>
                <View style={styles.todayButton}>
                    <Ionicons name="calendar-outline" size={14} color="#667eea" />
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateNavButton} onPress={onNextDate}>
                <Ionicons name="chevron-forward" size={24} color="#667eea" />
            </TouchableOpacity>
        </View>
    );
};
