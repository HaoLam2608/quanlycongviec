import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../app/(tabs)/member-timesheet/index.styles';
import { TimerState } from '../../types/member';

interface TimerWidgetProps {
    timer: TimerState;
    formatTime: (seconds: number) => string;
    onSelectTask: () => void;
    onStopTimer: () => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({
    timer,
    formatTime,
    onSelectTask,
    onStopTimer,
}) => {
    return (
        <View style={styles.timerWidget}>
            {timer.isRunning ? (
                <View style={styles.timerActive}>
                    <View style={styles.timerInfo}>
                        <Text style={styles.timerTask}>{timer.currentTask}</Text>
                        <Text style={styles.timerProject}>{timer.currentProject}</Text>
                    </View>
                    <Text style={styles.timerDisplay}>{formatTime(timer.elapsedSeconds)}</Text>
                    <TouchableOpacity style={styles.stopButton} onPress={onStopTimer}>
                        <Ionicons name="square" size={20} color="#fff" />
                        <Text style={styles.stopButtonText}>Dừng</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.timerInactive}>
                    <Text style={styles.timerInactiveText}>Chọn công việc để bắt đầu</Text>
                    <TouchableOpacity style={styles.selectTaskButton} onPress={onSelectTask}>
                        <Text style={styles.selectTaskButtonText}>Chọn công việc</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};
