import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    GestureResponderEvent,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { getTaskById, getSubtasksByTask, updateTaskStatus, updateSubtaskStatus } from '@/src/axios/api';

const TASK_STATUSES = ['Chưa bắt đầu', 'Đang chạy', 'Chờ xác nhận hoàn thành', 'Hoàn thành'];

interface TaskDetailState {
    id: number;
    tentask: string;
    moTa?: string;
    trangThai: string;
    mucDoUuTien?: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    nguoiDuocGiao?: { hoten: string; manv?: string };
    duan?: { id: number; tenduan?: string };
}

interface SubtaskItem {
    id: number;
    tenSubtask: string;
    mota?: string;
    trangThai: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    nguoiThucHien?: { hoten: string };
    parentTaskId?: number;
    parentTaskName?: string;
    isPendingAssignment?: boolean;
    pendingAssigneeName?: string;
}

const formatDate = (value?: string) => {
    if (!value) return 'Chưa rõ';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'Chưa rõ';
    return dt.toLocaleDateString('vi-VN');
};

const statusColor = (status: string) => {
    switch (status) {
        case 'Hoàn thành':
            return '#22c55e';
        case 'Đang chạy':
            return '#f97316';
        case 'Chờ xác nhận hoàn thành':
            return '#2563eb';
        default:
            return '#6b7280';
    }
};

export default function TeamLeadTaskDetailScreen() {
    const params = useLocalSearchParams<{ id?: string }>();
    const taskParam = params.id as string | string[] | undefined;
    const rawTaskId = Array.isArray(taskParam) ? taskParam[0] : taskParam;
    const taskId = rawTaskId ? Number(rawTaskId) : NaN;
    const router = useRouter();

    const [task, setTask] = useState<TaskDetailState | null>(null);
    const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const loadData = async () => {
        if (!taskId || Number.isNaN(taskId)) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [taskResponse, subtasksResponse] = await Promise.all([
                getTaskById(taskId),
                getSubtasksByTask(taskId)
            ]);

            const detail = taskResponse?.task || taskResponse;
            if (detail) {
                setTask({
                    id: detail.id,
                    tentask: detail.tentask,
                    moTa: detail.moTa,
                    trangThai: detail.trangThai,
                    mucDoUuTien: detail.mucDoUuTien,
                    ngayBatDau: detail.ngayBatDau,
                    ngayKetThuc: detail.ngayKetThuc,
                    nguoiDuocGiao: detail.nguoiDuocGiao || detail.assignee,
                    duan: detail.duan || detail.project
                });
            }

            const list = subtasksResponse?.subtasks || subtasksResponse?.data?.subtasks || subtasksResponse || [];
            const safeTaskId = Number.isFinite(taskId) ? taskId : undefined;
            const normalized: SubtaskItem[] = list.map((item: any) => {
                const pendingAssignment = Array.isArray(item.assignments) && item.assignments.length > 0
                    ? item.assignments[0]
                    : null;

                return {
                    id: item.id,
                    tenSubtask: item.tenSubtask || item.ten,
                    mota: item.mota,
                    trangThai: item.trangThai,
                    ngayBatDau: item.ngayBatDau,
                    ngayKetThuc: item.ngayKetThuc,
                    nguoiThucHien: item.nguoiThucHien || item.assignee,
                    parentTaskId: detail?.id ?? safeTaskId,
                    parentTaskName: detail?.tentask || task?.tentask,
                    isPendingAssignment: Boolean(pendingAssignment),
                    pendingAssigneeName: pendingAssignment?.assignee?.hoten
                };
            });
            setSubtasks(normalized);
        } catch (error) {
            console.error('Load task detail error:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (!Number.isNaN(taskId)) {
                loadData();
            }
        }, [taskId])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleChangeTaskStatus = async () => {
        if (!task) return;
        const currentIndex = TASK_STATUSES.indexOf(task.trangThai);
        const nextStatus = TASK_STATUSES[(currentIndex + 1) % TASK_STATUSES.length];

        setUpdatingStatus(true);
        try {
            await updateTaskStatus(task.id, nextStatus);
            setTask({ ...task, trangThai: nextStatus });
            Alert.alert('Thành công', 'Đã cập nhật trạng thái công việc');
        } catch (error: any) {
            console.error('Update task status error:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật trạng thái');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleChangeSubtaskStatus = async (subtask: SubtaskItem) => {
        const currentIndex = TASK_STATUSES.indexOf(subtask.trangThai);
        const nextStatus = TASK_STATUSES[(currentIndex + 1) % TASK_STATUSES.length];

        try {
            await updateSubtaskStatus(subtask.id, nextStatus);
            setSubtasks(prev => prev.map(item => (item.id === subtask.id ? { ...item, trangThai: nextStatus } : item)));
        } catch (error: any) {
            console.error('Update subtask status error:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật trạng thái công việc nhỏ');
        }
    };

    const handleOpenSubtask = (subtask: SubtaskItem) => {
        const paramsToSend: Record<string, string> = {
            id: String(subtask.id)
        };
        if (typeof subtask.parentTaskId === 'number' && Number.isFinite(subtask.parentTaskId)) {
            paramsToSend.taskId = String(subtask.parentTaskId);
        }
        if (subtask.parentTaskName) {
            paramsToSend.taskName = subtask.parentTaskName;
        }
        if (subtask.tenSubtask) {
            paramsToSend.subtaskName = subtask.tenSubtask;
        }
        router.push({ pathname: '/(teamlead)/subtask-detail', params: paramsToSend });
    };

    const handleCreateSubtask = () => {
        if (Number.isNaN(taskId)) {
            Alert.alert('Lỗi', 'Thiếu thông tin công việc cha');
            return;
        }
        router.push({
            pathname: '/(teamlead)/subtask-form',
            params: {
                mode: 'create',
                taskId: String(taskId),
                taskName: task?.tentask || 'Công việc'
            }
        });
    };

    const completionRate = useMemo(() => {
        if (!subtasks.length) return 0;
        const done = subtasks.filter(item => item.trangThai === 'Hoàn thành').length;
        return Math.round((done / subtasks.length) * 100);
    }, [subtasks]);

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Đang tải chi tiết công việc...</Text>
            </SafeAreaView>
        );
    }

    if (!task) {
        return (
            <SafeAreaView style={styles.center}>
                <Ionicons name="alert-circle" size={48} color="#c4b5fd" />
                <Text style={styles.loadingText}>Không tìm thấy công việc</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{task.tentask}</Text>
                        <TouchableOpacity
                            style={[styles.statusBadge, { backgroundColor: `${statusColor(task.trangThai)}1A` }]}
                            onPress={handleChangeTaskStatus}
                            disabled={updatingStatus}
                        >
                            <Text style={[styles.statusText, { color: statusColor(task.trangThai) }]}>
                                {updatingStatus ? 'Đang lưu...' : task.trangThai}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {task.moTa && <Text style={styles.description}>{task.moTa}</Text>}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={18} color="#7c3aed" />
                        <Text style={styles.infoText}>
                            {formatDate(task.ngayBatDau)} - {formatDate(task.ngayKetThuc)}
                        </Text>
                    </View>
                    {task.nguoiDuocGiao && (
                        <View style={styles.infoRow}>
                            <Ionicons name="person" size={18} color="#7c3aed" />
                            <Text style={styles.infoText}>{task.nguoiDuocGiao.hoten}</Text>
                        </View>
                    )}
                    {task.duan?.tenduan && (
                        <View style={styles.infoRow}>
                            <Ionicons name="folder-open" size={18} color="#7c3aed" />
                            <Text style={styles.infoText}>{task.duan.tenduan}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tiến độ công việc con</Text>
                    <View style={styles.progressBox}>
                        <Text style={styles.progressValue}>{completionRate}%</Text>
                        <Text style={styles.progressLabel}>Hoàn thành</Text>
                        <Text style={styles.progressNote}>{subtasks.length} công việc con</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Danh sách công việc con</Text>
                        <TouchableOpacity style={styles.addButton} onPress={handleCreateSubtask}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.addButtonText}>Tạo</Text>
                        </TouchableOpacity>
                    </View>
                    {subtasks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="file-tray-outline" size={40} color="#c4b5fd" />
                            <Text style={styles.emptyText}>Chưa có công việc con</Text>
                        </View>
                    ) : (
                        subtasks.map(subtask => (
                            <TouchableOpacity
                                key={subtask.id}
                                style={styles.subtaskCard}
                                onPress={() => handleOpenSubtask(subtask)}
                            >
                                <View style={styles.subtaskHeader}>
                                    <View style={[styles.statusDot, { backgroundColor: statusColor(subtask.trangThai) }]} />
                                    <Text style={styles.subtaskTitle}>{subtask.tenSubtask}</Text>
                                    <TouchableOpacity
                                        style={[styles.statusBadge, { backgroundColor: '#f3e8ff' }]}
                                        onPress={(event: GestureResponderEvent) => {
                                            event.stopPropagation();
                                            handleChangeSubtaskStatus(subtask);
                                        }}
                                    >
                                        <Text style={[styles.statusText, { color: '#7c3aed' }]}>{subtask.trangThai}</Text>
                                    </TouchableOpacity>
                                </View>
                                {subtask.mota && <Text style={styles.subtaskDescription}>{subtask.mota}</Text>}
                                <View style={styles.metaRow}>
                                    <Ionicons name="calendar" size={16} color="#7c3aed" />
                                    <Text style={styles.metaText}>{formatDate(subtask.ngayBatDau)} - {formatDate(subtask.ngayKetThuc)}</Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons
                                        name="person"
                                        size={16}
                                        color={subtask.isPendingAssignment ? '#f59e0b' : '#7c3aed'}
                                    />
                                    <Text
                                        style={[
                                            styles.metaText,
                                            subtask.isPendingAssignment && styles.pendingAssigneeText
                                        ]}
                                    >
                                        {subtask.isPendingAssignment
                                            ? 'Đang chờ xác nhận'
                                            : (subtask.nguoiThucHien?.hoten || 'Chưa gán')}
                                    </Text>
                                </View>
                                <Text style={styles.helperText}>Chạm vào thẻ để xem chi tiết. Dùng nhãn trạng thái để chuyển bước.</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    center: {
        flex: 1,
        backgroundColor: '#f5f5ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280'
    },
    scroll: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 32
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe',
        padding: 18,
        marginBottom: 18
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        flex: 1,
        marginRight: 12
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600'
    },
    description: {
        marginTop: 12,
        color: '#4b5563',
        lineHeight: 20
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10
    },
    infoText: {
        color: '#4b5563',
        fontSize: 14
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#312e81',
        marginBottom: 0
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#7c3aed',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13
    },
    progressBox: {
        borderWidth: 1,
        borderColor: '#ede9fe',
        borderRadius: 16,
        paddingVertical: 24,
        alignItems: 'center'
    },
    progressValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#7c3aed'
    },
    progressLabel: {
        color: '#6b7280',
        marginTop: 4
    },
    progressNote: {
        marginTop: 8,
        color: '#9ca3af'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24
    },
    emptyText: {
        marginTop: 12,
        color: '#6b7280'
    },
    subtaskCard: {
        borderWidth: 1,
        borderColor: '#ede9fe',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12
    },
    subtaskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    subtaskTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1
    },
    subtaskDescription: {
        color: '#4b5563',
        marginBottom: 8
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4
    },
    metaText: {
        color: '#4b5563',
        fontSize: 13
    },
    pendingAssigneeText: {
        color: '#d97706',
        fontWeight: '600'
    },
    helperText: {
        marginTop: 10,
        fontSize: 12,
        color: '#9ca3af'
    }
});
