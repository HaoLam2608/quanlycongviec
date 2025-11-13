import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTaskById } from '@/src/axios/api';
import { PageHeader } from '../../components/ui/PageHeader';

interface Task {
    id: number;
    tentask: string;
    mota: string;
    trangThai: string;
    mucDoUuTien: string;
    ngayBatDau: string;
    ngayKetThuc: string;
    ngayHoanThanh?: string;
    tienDo: number;
    ghiChu?: string;
    duan?: {
        id: number;
        tenduan: string;
    };
    nguoiDuocGiao?: {
        id: number;
        hoten: string;
        manv: string;
    };
    nguoiGiao?: {
        id: number;
        hoten: string;
        manv: string;
    };
    subtasks?: any[];
}

export default function TaskDetail() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const taskId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [task, setTask] = useState<Task | null>(null);

    useEffect(() => {
        if (taskId) {
            loadTaskData();
        }
    }, [taskId]);

    const loadTaskData = async () => {
        try {
            setLoading(true);
            const taskData = await getTaskById(taskId);
            setTask(taskData);
        } catch (error) {
            console.error('Error loading task:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin công việc');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTaskData();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Chưa bắt đầu': return '#6b7280';
            case 'Đang chạy': return '#f59e0b';
            case 'Chờ xác nhận hoàn thành': return '#3b82f6';
            case 'Hoàn thành': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'high': return 'Cao';
            case 'medium': return 'Trung bình';
            case 'low': return 'Thấp';
            default: return priority;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết công việc" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!task) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết công việc" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>❌</Text>
                    <Text style={styles.errorText}>Không tìm thấy công việc</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Chi tiết công việc" />
            
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.taskTitle}>{task.tentask}</Text>
                    <View style={styles.badges}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.trangThai) }]}>
                            <Text style={styles.badgeText}>{task.trangThai}</Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.mucDoUuTien) }]}>
                            <Text style={styles.badgeText}>{getPriorityText(task.mucDoUuTien)}</Text>
                        </View>
                    </View>
                </View>

                {/* Project */}
                {task.duan && (
                    <TouchableOpacity
                        style={styles.projectLink}
                        onPress={() => router.push(`/(manager)/project-detail?id=${task.duan?.id}`)}
                    >
                        <Text style={styles.projectLinkText}>📁 {task.duan.tenduan}</Text>
                        <Text style={styles.projectLinkArrow}>›</Text>
                    </TouchableOpacity>
                )}

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Mô tả</Text>
                    <Text style={styles.description}>{task.mota || 'Không có mô tả'}</Text>
                </View>

                {/* People */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Người liên quan</Text>
                    
                    {task.nguoiGiao && (
                        <View style={styles.personCard}>
                            <View style={styles.personAvatar}>
                                <Text style={styles.personInitial}>
                                    {task.nguoiGiao.hoten.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.personInfo}>
                                <Text style={styles.personRole}>Người giao việc</Text>
                                <Text style={styles.personName}>{task.nguoiGiao.hoten}</Text>
                                <Text style={styles.personCode}>{task.nguoiGiao.manv}</Text>
                            </View>
                        </View>
                    )}

                    {task.nguoiDuocGiao && (
                        <View style={styles.personCard}>
                            <View style={[styles.personAvatar, { backgroundColor: '#10b981' }]}>
                                <Text style={styles.personInitial}>
                                    {task.nguoiDuocGiao.hoten.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.personInfo}>
                                <Text style={styles.personRole}>Người thực hiện</Text>
                                <Text style={styles.personName}>{task.nguoiDuocGiao.hoten}</Text>
                                <Text style={styles.personCode}>{task.nguoiDuocGiao.manv}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Thời gian</Text>
                    <View style={styles.timelineContainer}>
                        <View style={styles.timelineItem}>
                            <Text style={styles.timelineLabel}>Bắt đầu:</Text>
                            <Text style={styles.timelineValue}>
                                {task.ngayBatDau ? new Date(task.ngayBatDau).toLocaleDateString('vi-VN') : 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.timelineItem}>
                            <Text style={styles.timelineLabel}>Kết thúc:</Text>
                            <Text style={styles.timelineValue}>
                                {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                        {task.ngayHoanThanh && (
                            <View style={styles.timelineItem}>
                                <Text style={styles.timelineLabel}>Hoàn thành:</Text>
                                <Text style={[styles.timelineValue, { color: '#10b981' }]}>
                                    {new Date(task.ngayHoanThanh).toLocaleDateString('vi-VN')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Progress */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Tiến độ</Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${task.tienDo}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{task.tienDo}%</Text>
                    </View>
                </View>

                {/* Notes */}
                {task.ghiChu && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📌 Ghi chú</Text>
                        <View style={styles.noteCard}>
                            <Text style={styles.noteText}>{task.ghiChu}</Text>
                        </View>
                    </View>
                )}

                {/* Subtasks */}
                {task.subtasks && task.subtasks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📋 Công việc con ({task.subtasks.length})</Text>
                        {task.subtasks.map((subtask, index) => (
                            <View key={index} style={styles.subtaskCard}>
                                <Text style={styles.subtaskName}>{subtask.tenSubtask}</Text>
                                <Text style={styles.subtaskStatus}>{subtask.trangThai}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#6b7280',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 16,
    },
    taskTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
        lineHeight: 28,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    projectLink: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    projectLinkText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
    },
    projectLinkArrow: {
        fontSize: 20,
        color: '#3b82f6',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 22,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    personCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    personAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    personInitial: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    personInfo: {
        flex: 1,
    },
    personRole: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    personName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    personCode: {
        fontSize: 13,
        color: '#6b7280',
    },
    timelineContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12,
    },
    timelineItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timelineLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    timelineValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 24,
        backgroundColor: '#e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10b981',
        borderRadius: 12,
    },
    progressText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        minWidth: 50,
        textAlign: 'right',
    },
    noteCard: {
        backgroundColor: '#fef3c7',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    noteText: {
        fontSize: 14,
        color: '#92400e',
        lineHeight: 22,
    },
    subtaskCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    subtaskName: {
        flex: 1,
        fontSize: 14,
        color: '#1f2937',
        marginRight: 8,
    },
    subtaskStatus: {
        fontSize: 12,
        color: '#6b7280',
    },
});
