import { getMySubtasks, updateMemberSubtaskStatus } from '@/src/axios/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PageHeader } from '../../../components/ui/PageHeader';
import { modalStyles, styles } from './styles';

interface Task {
    id: number;
    tentask: string;
    mota?: string;
    trangThai: string;
    mucDoUuTien: string;
    ngayKetThuc: string;
    nguoiDuocGiao?: {
        id: number;
        hoten: string;
    };
}

interface KanbanColumn {
    status: string;
    title: string;
    tasks: Task[];
    color: string;
}

export default function KanbanBoard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [columns, setColumns] = useState<KanbanColumn[]>([
        { status: 'Chưa bắt đầu', title: 'Chưa bắt đầu', tasks: [], color: '#6b7280' },
        { status: 'Đang chạy', title: 'Đang làm', tasks: [], color: '#f59e0b' },
        { status: 'Chờ xác nhận hoàn thành', title: 'Chờ xác nhận', tasks: [], color: '#3b82f6' },
        { status: 'Hoàn thành', title: 'Hoàn thành', tasks: [], color: '#10b981' },
    ]);
    // Move task modal state
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [taskToMove, setTaskToMove] = useState<Task | null>(null);
    const [currentColumnStatus, setCurrentColumnStatus] = useState<string>('');

    useEffect(() => {
        loadKanbanData();
    }, []);

    const loadKanbanData = async () => {
        try {
            setLoading(true);
            const subtasksData = await getMySubtasks();

            // Handle response structure - could be array or wrapped in object
            let subtasksArray: any[] = [];
            if (Array.isArray(subtasksData)) {
                subtasksArray = subtasksData;
            } else if (subtasksData.subtasks && Array.isArray(subtasksData.subtasks)) {
                subtasksArray = subtasksData.subtasks;
            } else if (subtasksData.data && Array.isArray(subtasksData.data)) {
                subtasksArray = subtasksData.data;
            }

            // Convert subtasks to task format for kanban display
            const tasksArray = subtasksArray.map(subtask => ({
                id: subtask.id,
                tentask: subtask.tenSubtask,
                mota: subtask.tentask ? `Task: ${subtask.tentask}` : '',
                trangThai: subtask.trangThai,
                mucDoUuTien: 'medium',
                ngayKetThuc: subtask.ngayKetThuc || new Date().toISOString(),
                nguoiDuocGiao: {
                    id: 1,
                    hoten: 'Tôi'
                },
                // Keep original subtask data for API calls
                originalSubtask: {
                    ...subtask,
                    task: {
                        id: subtask.taskId,
                        tentask: subtask.tentask,
                        duan: {
                            id: subtask.duanId,
                            tenduan: subtask.tenduan
                        }
                    }
                }
            }));

            // Organize tasks by status (be defensive if a status key is missing)
            const newColumns = columns.map(col => ({
                ...col,
                tasks: tasksArray.filter(task => task.trangThai === col.status)
            }));

            setColumns(newColumns);
        } catch (error) {
            console.error('Error loading kanban data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu Kanban');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadKanbanData();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const renderTaskCard = (task: Task, drag?: () => void, isActive?: boolean, columnStatus?: string) => (
        <ScaleDecorator>
            <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, isActive && styles.taskCardDragging]}
                onPress={() => {
                    // Show status change options
                    const otherStatuses = columns.map(c => c.status).filter(s => s !== task.trangThai);
                    Alert.alert('Chuyển trạng thái', 'Chọn trạng thái mới', [
                        ...otherStatuses.map(s => ({ text: s, onPress: () => handleChangeTaskStatus(task.id, s) })),
                        { text: 'Huỷ', style: 'cancel' }
                    ]);
                }}
                onLongPress={() => {
                    setTaskToMove(task);
                    setCurrentColumnStatus(columnStatus || task.trangThai);
                    setShowMoveModal(true);
                }}
                delayLongPress={300}
            >
                <View style={styles.taskHeader}>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.mucDoUuTien) }]} />
                    <Text style={styles.taskTitle} numberOfLines={2}>{task.tentask}</Text>
                    <TouchableOpacity style={styles.taskActionBtn} onPress={() => {
                        // show status change options
                        const otherStatuses = columns.map(c => c.status).filter(s => s !== task.trangThai);
                        Alert.alert('Chuyển trạng thái', 'Chọn trạng thái mới', [
                            ...otherStatuses.map(s => ({ text: s, onPress: () => handleChangeTaskStatus(task.id, s) })),
                            { text: 'Huỷ', style: 'cancel' }
                        ]);
                    }}>
                        <Text style={styles.taskActionText}>⋯</Text>
                    </TouchableOpacity>
                </View>

                {task.mota && (
                    <Text style={styles.taskDesc} numberOfLines={2}>{task.mota}</Text>
                )}

                {task.nguoiDuocGiao && (
                    <View style={styles.assigneeContainer}>
                        <View style={styles.assigneeAvatar}>
                            <Text style={styles.assigneeInitial}>
                                {task.nguoiDuocGiao.hoten.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.assigneeName} numberOfLines={1}>
                            {task.nguoiDuocGiao.hoten}
                        </Text>
                    </View>
                )}

                <Text style={styles.dueDate}>
                    📅 {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}
                </Text>
            </TouchableOpacity>
        </ScaleDecorator>
    );

    const handleChangeTaskStatus = async (taskId: number, status: string) => {
        try {
            setLoading(true);

            // Find the task to get original subtask data
            const task = columns.flatMap(col => col.tasks).find(t => t.id === taskId);
            const originalSubtask = (task as any)?.originalSubtask;

            if (!originalSubtask || !originalSubtask.task) {
                Alert.alert('Lỗi', 'Không thể tìm thấy thông tin subtask');
                return;
            }

            // Convert "Hoàn thành" to "Chờ xác nhận hoàn thành" if needed (approval workflow)
            const actualStatus = status === 'Hoàn thành' ? 'Chờ xác nhận hoàn thành' : status;

            await updateMemberSubtaskStatus(originalSubtask.task.id, taskId, actualStatus);

            // Show appropriate message
            if (actualStatus === 'Chờ xác nhận hoàn thành' && status === 'Hoàn thành') {
                Alert.alert('Thành công', 'Đã gửi yêu cầu xác nhận hoàn thành. Chờ quản lý phê duyệt.');
            } else {
                Alert.alert('Thành công', 'Cập nhật trạng thái thành công');
            }

            await loadKanbanData();
        } catch (err: any) {
            console.error('Error updating task status', err);
            Alert.alert('Lỗi', err.response?.data?.message || 'Không thể cập nhật trạng thái');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (data: Task[], columnStatus: string) => {
        // Update local state first
        const newColumns = columns.map(col =>
            col.status === columnStatus ? { ...col, tasks: data } : col
        );
        setColumns(newColumns);
    };

    const handleTaskMove = async (task: Task, fromStatus: string, toStatus: string) => {
        if (fromStatus === toStatus) {
            setShowMoveModal(false);
            return;
        }

        try {
            setShowMoveModal(false);
            setLoading(true);

            // Optimistic update
            const newColumns = columns.map(col => {
                if (col.status === fromStatus) {
                    return { ...col, tasks: col.tasks.filter(t => t.id !== task.id) };
                }
                if (col.status === toStatus) {
                    return { ...col, tasks: [...col.tasks, { ...task, trangThai: toStatus }] };
                }
                return col;
            });
            setColumns(newColumns);

            // Update on server
            await handleChangeTaskStatus(task.id, toStatus);
            Alert.alert('Thành công', `Đã chuyển công việc sang "${toStatus}"`);
        } catch (err) {
            console.error('Error moving task:', err);
            Alert.alert('Lỗi', 'Không thể chuyển công việc');
            // Revert on error
            loadKanbanData();
        } finally {
            setLoading(false);
            setTaskToMove(null);
            setCurrentColumnStatus('');
        }
    };

    const renderColumn = (column: KanbanColumn) => (
        <View key={column.status} style={styles.column}>
            <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
                <Text style={styles.columnTitle}>{column.title}</Text>
                <View style={styles.columnCount}>
                    <Text style={styles.columnCountText}>{column.tasks.length}</Text>
                </View>
            </View>

            <View style={styles.columnContent}>
                {column.tasks.length > 0 ? (
                    <DraggableFlatList
                        data={column.tasks}
                        onDragEnd={({ data }) => handleDragEnd(data, column.status)}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item, drag, isActive }: RenderItemParams<Task>) =>
                            renderTaskCard(item, drag, isActive, column.status)
                        }
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyColumn}>
                        <Text style={styles.emptyColumnText}>Không có công việc</Text>
                    </View>
                )}
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Kanban Board" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <PageHeader title="Kanban - Subtasks của tôi" />

                {/* Kanban Board */}
                <View style={{ flex: 1 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.boardContainer}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        scrollEnabled={true}
                        bounces={true}
                        alwaysBounceHorizontal={true}
                    >
                        {columns.map(column => renderColumn(column))}
                    </ScrollView>
                </View>

                {/* Move Task Modal */}
                <Modal visible={showMoveModal} transparent animationType="fade">
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContent}>
                            <Text style={modalStyles.modalTitle}>Chuyển công việc</Text>

                            {taskToMove && (
                                <View style={styles.taskPreview}>
                                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(taskToMove.mucDoUuTien) }]} />
                                    <Text style={styles.taskPreviewTitle}>{taskToMove.tentask}</Text>
                                </View>
                            )}

                            <Text style={modalStyles.modalSubtitle}>Chọn trạng thái mới:</Text>

                            {columns.filter(col => col.status !== currentColumnStatus).map(column => (
                                <TouchableOpacity
                                    key={column.status}
                                    style={[modalStyles.statusOption, { borderLeftColor: column.color }]}
                                    onPress={() => taskToMove && handleTaskMove(taskToMove, currentColumnStatus, column.status)}
                                >
                                    <Text style={modalStyles.statusText}>{column.title}</Text>
                                    <Text style={modalStyles.statusCount}>({column.tasks.length})</Text>
                                </TouchableOpacity>
                            ))}

                            <View style={modalStyles.modalActions}>
                                <TouchableOpacity
                                    style={modalStyles.cancelButton}
                                    onPress={() => setShowMoveModal(false)}
                                >
                                    <Text style={modalStyles.cancelButtonText}>Huỷ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

