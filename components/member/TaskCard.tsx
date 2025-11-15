import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TaskCardProps {
    id: number;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    deadline?: string;
    project?: string;
    isSubtask?: boolean;
    parentTask?: string;
    onPress?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
    title,
    description,
    status,
    priority = 'medium',
    deadline,
    project,
    isSubtask = false,
    parentTask,
    onPress,
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hoàn thành':
                return { bg: '#D1FAE5', text: '#16A34A' };
            case 'Đang chạy':
                return { bg: '#DBEAFE', text: '#2563EB' };
            case 'Chưa bắt đầu':
                return { bg: '#F3F4F6', text: '#6B7280' };
            default:
                return { bg: '#F3F4F6', text: '#6B7280' };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
            case 'cao':
                return { bg: '#FEE2E2', text: '#DC2626' };
            case 'medium':
            case 'trung_binh':
            case 'trung bình':
                return { bg: '#FEF3C7', text: '#D97706' };
            case 'low':
            case 'thap':
            case 'thấp':
                return { bg: '#D1FAE5', text: '#16A34A' };
            default:
                return { bg: '#F3F4F6', text: '#6B7280' };
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'high':
            case 'cao':
                return 'Cao';
            case 'medium':
            case 'trung_binh':
            case 'trung bình':
                return 'Trung bình';
            case 'low':
            case 'thap':
            case 'thấp':
                return 'Thấp';
            default:
                return 'Chưa xác định';
        }
    };

    const statusColors = getStatusColor(status);
    const priorityColors = getPriorityColor(priority);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={2}>
                        {isSubtask ? '• ' : ''}{title}
                    </Text>
                    {isSubtask && parentTask && (
                        <Text style={styles.parentTask} numberOfLines={1}>
                            Task: {parentTask}
                        </Text>
                    )}
                </View>
            </View>

            {description && (
                <Text style={styles.description} numberOfLines={2}>
                    {description}
                </Text>
            )}

            <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.badgeText, { color: statusColors.text }]}>
                        {status}
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: priorityColors.bg }]}>
                    <Text style={[styles.badgeText, { color: priorityColors.text }]}>
                        {getPriorityLabel(priority)}
                    </Text>
                </View>
                {project && (
                    <View style={styles.projectBadge}>
                        <Text style={styles.projectText} numberOfLines={1}>
                            {project}
                        </Text>
                    </View>
                )}
            </View>

            {deadline && (
                <View style={styles.footer}>
                    <Text style={styles.deadlineText}>
                        Deadline: {new Date(deadline).toLocaleDateString('vi-VN')}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
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
    header: {
        marginBottom: 8,
    },
    titleContainer: {
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    parentTask: {
        fontSize: 13,
        color: '#6B7280',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
        lineHeight: 20,
    },
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    projectBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    projectText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    footer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    deadlineText: {
        fontSize: 13,
        color: '#6B7280',
    },
});

export default TaskCard;
