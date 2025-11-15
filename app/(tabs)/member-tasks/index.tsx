import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import TaskCard from '../../../components/member/TaskCard';
import {
    getMemberTasks,
    updateMemberSubtaskStatus,
    updateMemberTaskStatus,
} from '../../../src/axios/api';
import { MemberSubtask, MemberTask } from '../../../types/member';
import { styles } from './index.styles';

export default function MemberTasksScreen() {
    const [tasks, setTasks] = useState<MemberTask[]>([]);
    const [subtasks, setSubtasks] = useState<MemberSubtask[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await getMemberTasks({});
            setTasks(data.tasks || []);
            setSubtasks(data.subtasks || []);
        } catch (error: any) {
            console.error('Error loading tasks:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách công việc');
        } finally {
            setLoading(false);
        }
    };

    const allItems = [
        ...tasks.map((task) => ({
            id: task.id,
            title: task.tentask,
            description: task.mota,
            status: task.trangThai,
            priority: task.mucDoUuTien || 'medium',
            deadline: task.ngayKetThuc,
            startDate: task.ngayBatDau,
            project: task.duan?.tenduan || 'Chưa có dự án',
            projectId: task.duan?.id,
            type: 'task' as const,
            assignedBy: task.nguoiGiao?.hoten,
            progress: task.tienDo || 0,
        })),
        ...subtasks.map((subtask) => ({
            id: subtask.id,
            title: subtask.tenSubtask,
            description: '',
            status: subtask.trangThai,
            priority: 'medium',
            deadline: subtask.ngayKetThuc,
            project: subtask.task?.duan?.tenduan || 'Chưa có dự án',
            projectId: subtask.task?.duan?.id,
            type: 'subtask' as const,
            parentTask: subtask.task?.tentask,
            progress: 0,
        })),
    ];

    const filteredTasks = allItems.filter((task) => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.project.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const updateTaskStatus = async (taskId: number, newStatus: string, type: 'task' | 'subtask') => {
        try {
            if (type === 'task') {
                await updateMemberTaskStatus(taskId, newStatus);
                setTasks(
                    tasks.map((task) =>
                        task.id === taskId ? { ...task, trangThai: newStatus } : task
                    )
                );
            } else {
                const subtask = subtasks.find((st) => st.id === taskId);
                if (subtask?.task) {
                    await updateMemberSubtaskStatus(subtask.task.id, taskId, newStatus);
                    setSubtasks(
                        subtasks.map((st) =>
                            st.id === taskId ? { ...st, trangThai: newStatus } : st
                        )
                    );
                }
            }
            Alert.alert('Thành công', 'Cập nhật trạng thái thành công');
            setSelectedTask({ ...selectedTask, status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Công việc của tôi</Text>
                <View style={styles.headerStats}>
                    <Text style={styles.headerStatsText}>Tổng số</Text>
                    <Text style={styles.headerStatsNumber}>{allItems.length}</Text>
                </View>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm công việc..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setIsFilterVisible(!isFilterVisible)}
                >
                    <Ionicons name="filter" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Filter Panel */}
            {isFilterVisible && (
                <View style={styles.filterPanel}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Trạng thái:</Text>
                        <View style={styles.filterButtons}>
                            {['all', 'Chưa bắt đầu', 'Đang chạy', 'Hoàn thành'].map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.filterChip,
                                        statusFilter === status && styles.filterChipActive,
                                    ]}
                                    onPress={() => setStatusFilter(status)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            statusFilter === status && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {status === 'all' ? 'Tất cả' : status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Độ ưu tiên:</Text>
                        <View style={styles.filterButtons}>
                            {[
                                { value: 'all', label: 'Tất cả' },
                                { value: 'high', label: 'Cao' },
                                { value: 'medium', label: 'Trung bình' },
                                { value: 'low', label: 'Thấp' },
                            ].map((priority) => (
                                <TouchableOpacity
                                    key={priority.value}
                                    style={[
                                        styles.filterChip,
                                        priorityFilter === priority.value && styles.filterChipActive,
                                    ]}
                                    onPress={() => setPriorityFilter(priority.value)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            priorityFilter === priority.value && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {priority.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            {/* Tasks List */}
            <ScrollView style={styles.tasksList} contentContainerStyle={styles.tasksContent}>
                {filteredTasks.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="file-tray-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>Không có công việc</Text>
                        <Text style={styles.emptyText}>
                            Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.
                        </Text>
                    </View>
                ) : (
                    filteredTasks.map((task) => (
                        <TaskCard
                            key={`${task.type}-${task.id}`}
                            id={task.id}
                            title={task.title}
                            description={task.description}
                            status={task.status}
                            priority={task.priority}
                            deadline={task.deadline}
                            project={task.project}
                            isSubtask={task.type === 'subtask'}
                            parentTask={task.type === 'subtask' ? task.parentTask : undefined}
                            onPress={() => {
                                setSelectedTask(task);
                                setIsDetailModalOpen(true);
                            }}
                        />
                    ))
                )}
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={isDetailModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsDetailModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chi tiết công việc</Text>
                            <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedTask && (
                            <ScrollView style={styles.modalBody}>
                                <Text style={styles.modalTaskTitle}>
                                    {selectedTask.type === 'subtask' ? '• ' : ''}
                                    {selectedTask.title}
                                </Text>
                                {selectedTask.description && (
                                    <Text style={styles.modalDescription}>{selectedTask.description}</Text>
                                )}

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionLabel}>Trạng thái</Text>
                                    <View style={styles.statusButtons}>
                                        {['Chưa bắt đầu', 'Đang chạy', 'Hoàn thành'].map((status) => (
                                            <TouchableOpacity
                                                key={status}
                                                style={[
                                                    styles.statusButton,
                                                    selectedTask.status === status && styles.statusButtonActive,
                                                ]}
                                                onPress={() => updateTaskStatus(selectedTask.id, status, selectedTask.type)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statusButtonText,
                                                        selectedTask.status === status && styles.statusButtonTextActive,
                                                    ]}
                                                >
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionLabel}>Dự án</Text>
                                    <Text style={styles.modalSectionValue}>{selectedTask.project}</Text>
                                </View>

                                {selectedTask.deadline && (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionLabel}>Deadline</Text>
                                        <Text style={styles.modalSectionValue}>
                                            {new Date(selectedTask.deadline).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                )}

                                {selectedTask.assignedBy && (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionLabel}>Được giao bởi</Text>
                                        <Text style={styles.modalSectionValue}>{selectedTask.assignedBy}</Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
