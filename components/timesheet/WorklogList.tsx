import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../app/(tabs)/member-timesheet/index.styles';
import { Worklog } from '../../types/member';

interface WorklogListProps {
    groupedWorklogs: Record<string, Worklog[]>;
    isRefreshing: boolean;
    onRefresh: () => void;
    onEdit: (worklog: Worklog) => void;
    onDelete: (id: number) => void;
    hoursToHMS: (hours: number) => string;
}

export const WorklogList: React.FC<WorklogListProps> = ({
    groupedWorklogs,
    isRefreshing,
    onRefresh,
    onEdit,
    onDelete,
    hoursToHMS,
}) => {
    return (
        <ScrollView
            style={styles.worklogsList}
            contentContainerStyle={styles.worklogsContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            {Object.keys(groupedWorklogs).length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>Chưa có worklog</Text>
                    <Text style={styles.emptyText}>
                        Bắt đầu làm việc và ghi lại thời gian của bạn
                    </Text>
                </View>
            ) : (
                Object.entries(groupedWorklogs).map(([taskName, logs]) => {
                    const groupTotalSeconds = logs.reduce((sum, log) => sum + (log.hours * 3600), 0);
                    const groupTimeHMS = hoursToHMS(groupTotalSeconds / 3600);

                    return (
                        <View key={taskName} style={styles.taskGroup}>
                            <View style={styles.taskGroupHeader}>
                                <Text style={styles.taskGroupTitle}>{taskName}</Text>
                                <Text style={styles.taskGroupHours}>{groupTimeHMS}</Text>
                            </View>
                            {logs.map((log) => (
                                <View key={log.id} style={styles.worklogCard}>
                                    <View style={styles.worklogHeader}>
                                        <View style={styles.worklogInfo}>
                                            <Text style={styles.worklogProject}>{log.project}</Text>
                                            <Text style={styles.worklogHours}>{hoursToHMS(log.hours)}</Text>
                                        </View>
                                        <View style={styles.worklogActions}>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => onEdit(log)}
                                            >
                                                <Ionicons name="create-outline" size={20} color="#667eea" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => onDelete(log.id)}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    {log.description && (
                                        <Text style={styles.worklogDescription}>{log.description}</Text>
                                    )}
                                    <Text style={styles.worklogTime}>
                                        {new Date(log.createdAt || '').toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
};
