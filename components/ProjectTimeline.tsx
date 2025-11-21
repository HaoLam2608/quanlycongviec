import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarTask } from './ProjectCalendar';

interface ProjectTimelineProps {
    tasks: CalendarTask[];
}

const getStatusColor = (status: string): string => {
    const s = status?.toLowerCase() || '';
    if (s.includes('hoàn thành') || s === 'completed') return '#10B981';
    if (s.includes('đang') || s === 'in_progress') return '#F59E0B';
    if (s.includes('chờ') || s === 'pending') return '#3B82F6';
    if (s.includes('quá hạn')) return '#EF4444';
    return '#9CA3AF';
};

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ tasks }) => {
    // State để theo dõi task nào đang được expand
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

    // Phân loại tasks thành parent tasks và group subtasks theo parent
    const parentTasks = tasks.filter(t => !t.type || t.type === 'task');

    const taskGroups = parentTasks.map(parentTask => {
        const subtasks = tasks.filter(t =>
            t.type === 'subtask' &&
            (t.taskId === parentTask.id || t.parentId === parentTask.id)
        );
        return { parentTask, subtasks };
    });

    const toggleExpand = (taskId: number) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };

    if (tasks.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="timer-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Chưa có công việc nào</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {taskGroups
                .sort((a, b) => {
                    const dateA = new Date(a.parentTask.ngayBatDau || a.parentTask.startDate || 0);
                    const dateB = new Date(b.parentTask.ngayBatDau || b.parentTask.startDate || 0);
                    return dateA.getTime() - dateB.getTime();
                })
                .map((group, index) => {
                    const { parentTask, subtasks } = group;
                    const isExpanded = expandedTasks.has(parentTask.id);
                    const hasSubtasks = subtasks.length > 0;
                    const status = parentTask.trangThai || parentTask.status || '';

                    return (
                        <View key={parentTask.id} style={styles.taskGroup}>
                            {/* Parent Task */}
                            <View style={styles.parentTaskContainer}>
                                <View style={styles.timelineDotContainer}>
                                    <View style={[
                                        styles.timelineDot,
                                        styles.bigDot,
                                        { backgroundColor: getStatusColor(status) }
                                    ]} />
                                    {index < taskGroups.length - 1 && (
                                        <View style={styles.timelineLine} />
                                    )}
                                </View>

                                <View style={styles.parentTaskContent}>
                                    <TouchableOpacity
                                        style={styles.parentTaskHeader}
                                        onPress={() => hasSubtasks && toggleExpand(parentTask.id)}
                                        disabled={!hasSubtasks}
                                    >
                                        <View style={styles.taskTitleRow}>
                                            {hasSubtasks && (
                                                <Ionicons
                                                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                                                    size={16}
                                                    color="#6B7280"
                                                    style={{ marginRight: 4 }}
                                                />
                                            )}
                                            <Text style={styles.parentTaskTitle}>
                                                {parentTask.tentask || parentTask.title || parentTask.name || 'Không tên'}
                                            </Text>
                                        </View>
                                        {hasSubtasks && (
                                            <View style={styles.subtaskCount}>
                                                <Text style={styles.subtaskCountText}>
                                                    {subtasks.length}
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <View style={styles.taskMeta}>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                                            <Text style={styles.metaText}>
                                                {parentTask.ngayBatDau || parentTask.startDate
                                                    ? new Date(parentTask.ngayBatDau || parentTask.startDate!).toLocaleDateString('vi-VN')
                                                    : 'N/A'}
                                            </Text>
                                        </View>
                                        {status && (
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: getStatusColor(status) }
                                                ]}
                                            >
                                                <Text style={styles.statusText}>{status}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Subtasks - Thụt vào với indentation */}
                            {hasSubtasks && isExpanded && (
                                <View style={styles.subtasksContainer}>
                                    {subtasks.map((subtask, subIndex) => {
                                        const subStatus = subtask.trangThai || subtask.status || '';
                                        return (
                                            <View key={subtask.id} style={styles.subtaskItem}>
                                                <View style={styles.subtaskDotContainer}>
                                                    <View style={[
                                                        styles.timelineDot,
                                                        styles.smallDot,
                                                        { backgroundColor: getStatusColor(subStatus) }
                                                    ]} />
                                                    {subIndex < subtasks.length - 1 && (
                                                        <View style={styles.subtaskLine} />
                                                    )}
                                                </View>

                                                <View style={styles.subtaskContent}>
                                                    <Text style={styles.subtaskTitle}>
                                                        {subtask.tentask || subtask.title || subtask.tenSubtask || subtask.name || 'Không tên'}
                                                    </Text>
                                                    <View style={styles.taskMeta}>
                                                        <View style={styles.metaItem}>
                                                            <Ionicons name="calendar-outline" size={10} color="#9CA3AF" />
                                                            <Text style={styles.subtaskMetaText}>
                                                                {subtask.ngayBatDau || subtask.startDate
                                                                    ? new Date(subtask.ngayBatDau || subtask.startDate!).toLocaleDateString('vi-VN')
                                                                    : 'N/A'}
                                                            </Text>
                                                        </View>
                                                        {subStatus && (
                                                            <View
                                                                style={[
                                                                    styles.subtaskStatusBadge,
                                                                    { backgroundColor: getStatusColor(subStatus) }
                                                                ]}
                                                            >
                                                                <Text style={styles.subtaskStatusText}>{subStatus}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    );
                })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    taskGroup: {
        marginBottom: 16,
    },
    parentTaskContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineDotContainer: {
        alignItems: 'center',
        width: 24,
        paddingTop: 4,
    },
    timelineDot: {
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    bigDot: {
        width: 12,
        height: 12,
    },
    smallDot: {
        width: 8,
        height: 8,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 4,
        minHeight: 20,
    },
    parentTaskContent: {
        flex: 1,
        marginLeft: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    parentTaskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    taskTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    parentTaskTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    subtaskCount: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 24,
        alignItems: 'center',
    },
    subtaskCountText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    // Subtask styles với indentation
    subtasksContainer: {
        marginLeft: 36, // Thụt vào để phân biệt
        marginTop: 8,
    },
    subtaskItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    subtaskDotContainer: {
        alignItems: 'center',
        width: 20,
        paddingTop: 4,
    },
    subtaskLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 4,
        minHeight: 16,
    },
    subtaskContent: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    subtaskTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    subtaskMetaText: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    subtaskStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    subtaskStatusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
    },
});
