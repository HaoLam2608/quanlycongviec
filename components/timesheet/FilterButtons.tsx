import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../app/(tabs)/member-timesheet/index.styles';

interface FilterButtonsProps {
    selectedDate: Date | null;
    onShowAll: () => void;
    onShowByDate: () => void;
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({
    selectedDate,
    onShowAll,
    onShowByDate,
}) => {
    return (
        <View style={styles.filterButtons}>
            <TouchableOpacity
                style={[
                    styles.filterButton,
                    selectedDate === null && styles.filterButtonActive,
                ]}
                onPress={onShowAll}
            >
                <Ionicons
                    name="list"
                    size={16}
                    color={selectedDate === null ? '#fff' : '#667eea'}
                />
                <Text
                    style={[
                        styles.filterButtonText,
                        selectedDate === null && styles.filterButtonTextActive,
                    ]}
                >
                    Tất cả
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.filterButton,
                    selectedDate !== null && styles.filterButtonActive,
                ]}
                onPress={onShowByDate}
            >
                <Ionicons
                    name="calendar"
                    size={16}
                    color={selectedDate !== null ? '#fff' : '#667eea'}
                />
                <Text
                    style={[
                        styles.filterButtonText,
                        selectedDate !== null && styles.filterButtonTextActive,
                    ]}
                >
                    Theo ngày
                </Text>
            </TouchableOpacity>
        </View>
    );
};
