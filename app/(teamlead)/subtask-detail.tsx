import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CommentSection from '@/components/CommentSection';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { getGroupSubtasks, getSubtasksByTask, updateSubtaskStatus } from '@/src/axios/api';

const STATUSES = ['Chưa bắt đầu', 'Đang chạy', 'Chờ xác nhận hoàn thành', 'Hoàn thành'];

const nextStatus = (status: string) => {
    const index = STATUSES.indexOf(status);
    if (index === -1) return STATUSES[0];
    return STATUSES[(index + 1) % STATUSES.length];
};

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

interface SubtaskDetail {
    id: number;
    tenSubtask: string;
    mota?: string;
    trangThai: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    nguoiThucHien?: { hoten: string };
    task?: { tentask: string };
    isPendingAssignment?: boolean;
    pendingAssigneeName?: string;
}

export default function TeamLeadSubtaskDetailScreen() {
    const params = useLocalSearchParams<{ id?: string; taskId?: string; taskName?: string; subtaskName?: string }>();
    const router = useRouter();
    const idParam = params.id as string | string[] | undefined;
    const rawSubtaskId = Array.isArray(idParam) ? idParam[0] : idParam;
    const parsedSubtaskId = rawSubtaskId ? Number(rawSubtaskId) : NaN;
    const subtaskId = Number.isFinite(parsedSubtaskId) ? parsedSubtaskId : NaN;
    const taskIdParam = params.taskId as string | string[] | undefined;
    const rawTaskId = Array.isArray(taskIdParam) ? taskIdParam[0] : taskIdParam;
    const parsedTaskId = rawTaskId ? Number(rawTaskId) : NaN;
    const taskId = Number.isFinite(parsedTaskId) ? parsedTaskId : undefined;
    const parentTaskNameFromParams = (() => {
        const value = Array.isArray(params.taskName) ? params.taskName[0] : params.taskName;
        return value || undefined;
    })();

    const subtaskNameFromParams = (() => {
        const value = Array.isArray(params.subtaskName) ? params.subtaskName[0] : params.subtaskName;
        return value || undefined;
    })();

    const [subtask, setSubtask] = useState<SubtaskDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);

    const loadSubtask = async () => {
        if (!subtaskId || Number.isNaN(subtaskId)) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            let list: any[] = [];
            if (taskId) {
                const response = await getSubtasksByTask(taskId);
                list = response?.subtasks || response?.data?.subtasks || response || [];
            } else {
                const response = await getGroupSubtasks();
                list = response?.subtasks || response?.data?.subtasks || response || [];
            }
            const normalizedList = Array.isArray(list) ? list : [];
            const found = normalizedList.find((item: any) => Number(item.id) === subtaskId);
            if (found) {
                const pendingAssignment = Array.isArray(found.assignments) && found.assignments.length > 0
                    ? found.assignments[0]
                    : null;
                setSubtask({
                    id: found.id,
                    tenSubtask: found.tenSubtask || found.ten,
                    mota: found.mota,
                    trangThai: found.trangThai,
                    ngayBatDau: found.ngayBatDau,
                    ngayKetThuc: found.ngayKetThuc,
                    nguoiThucHien: found.nguoiThucHien || found.assignee,
                    task: found.task?.tentask
                        ? { tentask: found.task.tentask }
                        : parentTaskNameFromParams
                            ? { tentask: parentTaskNameFromParams }
                            : undefined,
                    isPendingAssignment: Boolean(pendingAssignment),
                    pendingAssigneeName: pendingAssignment?.assignee?.hoten
                });
            } else {
                setSubtask(null);
            }
        } catch (error) {
            console.error('Load subtask detail error:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (!Number.isNaN(subtaskId)) {
                loadSubtask();
            }
        }, [subtaskId, taskId])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSubtask();
        setRefreshing(false);
    };

    const handleNextStatus = async () => {
        if (!subtask) return;
        const updated = nextStatus(subtask.trangThai);
        setUpdating(true);
        try {
            await updateSubtaskStatus(subtask.id, updated);
            setSubtask({ ...subtask, trangThai: updated });
            Alert.alert('Thành công', 'Đã cập nhật trạng thái công việc con');
        } catch (error: any) {
            console.error('Update subtask status error:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật trạng thái');
        } finally {
            setUpdating(false);
        }
    };

    const handleEditSubtask = () => {
        if (!subtask || Number.isNaN(subtaskId)) {
            Alert.alert('Lỗi', 'Thiếu thông tin công việc con');
            return;
        }
        const paramsToSend: Record<string, string> = {
            mode: 'edit',
            subtaskId: String(subtask.id),
            taskName: subtask.task?.tentask || parentTaskNameFromParams || '',
            subtaskName: subtask.tenSubtask || subtaskNameFromParams || ''
        };
        if (typeof taskId === 'number' && Number.isFinite(taskId)) {
            paramsToSend.taskId = String(taskId);
        }
        router.push({
            pathname: '/(teamlead)/subtask-form',
            params: paramsToSend
        });
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.helper}>Đang tải chi tiết...</Text>
            </SafeAreaView>
        );
    }

    if (!subtask) {
        return (
            <SafeAreaView style={styles.center}>
                <Ionicons name="alert-circle" size={48} color="#c4b5fd" />
                <Text style={styles.helper}>Không tìm thấy công việc con</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>{subtask.tenSubtask || subtaskNameFromParams || 'Công việc con'}</Text>
                    <TouchableOpacity
                        style={[styles.statusBadge, { backgroundColor: `${statusColor(subtask.trangThai)}1A` }]}
                        onPress={handleNextStatus}
                        disabled={updating}
                    >
                        <Text style={[styles.statusText, { color: statusColor(subtask.trangThai) }]}>
                            {updating ? 'Đang lưu...' : subtask.trangThai}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editButton} onPress={handleEditSubtask}>
                        <Ionicons name="create-outline" size={18} color="#7c3aed" />
                        <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
                    </TouchableOpacity>
                    {subtask.mota && <Text style={styles.description}>{subtask.mota}</Text>}
                    {subtask.task?.tentask && (
                        <View style={styles.infoRow}>
                            <Ionicons name="reader" size={18} color="#7c3aed" />
                            <Text style={styles.infoText}>{subtask.task.tentask}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={18} color="#7c3aed" />
                        <Text style={styles.infoText}>{formatDate(subtask.ngayBatDau)} - {formatDate(subtask.ngayKetThuc)}</Text>
                    </View>
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="person"
                                size={18}
                                color={subtask.isPendingAssignment ? '#f59e0b' : '#7c3aed'}
                            />
                            <Text
                                style={[
                                    styles.infoText,
                                    subtask.isPendingAssignment && styles.pendingAssigneeText
                                ]}
                            >
                                {subtask.isPendingAssignment
                                    ? 'Đang chờ xác nhận'
                                    : (subtask.nguoiThucHien?.hoten || 'Chưa gán')}
                            </Text>
                        </View>
                </View>
                <Text style={styles.helper}>Chạm vào trạng thái để chuyển sang bước kế tiếp</Text>
                {/* Comments */}
                <CommentSection subtaskId={subtaskId} onCommentAdded={loadSubtask} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    scroll: {
        flex: 1
    },
    content: {
        padding: 16
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe',
        padding: 18
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        marginBottom: 12
    },
    editButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#d6bcfa',
        marginBottom: 16,
        backgroundColor: '#f8f5ff'
    },
    editButtonText: {
        color: '#7c3aed',
        fontWeight: '600'
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600'
    },
    description: {
        color: '#4b5563',
        marginBottom: 12,
        lineHeight: 20
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10
    },
    infoText: {
        color: '#4b5563'
    },
    pendingAssigneeText: {
        color: '#d97706',
        fontWeight: '600'
    },
    helper: {
        marginTop: 12,
        color: '#6b7280'
    },
    center: {
        flex: 1,
        backgroundColor: '#f5f5ff',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
