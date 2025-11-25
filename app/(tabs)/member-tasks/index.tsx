import { Ionicons } from '@expo/vector-icons';
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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import TaskCard from '../../../components/member/TaskCard';
import {
    getMySubtasks,
    getWorklogs,
    updateMemberSubtaskStatus
} from '../../../src/axios/api';
import { MemberSubtask } from '../../../types/member';
import { styles } from './styles';

export default function MemberTasksScreen() {
    const router = useRouter();
    const [subtasks, setSubtasks] = useState<MemberSubtask[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [worklogs, setWorklogs] = useState<any[]>([]);
    const [isLoadingWorklogs, setIsLoadingWorklogs] = useState(false);
    const [showWorklogs, setShowWorklogs] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadTasks();
    }, []);

    // Allowed one-way transitions for members: Chưa bắt đầu -> Đang chạy -> Hoàn thành
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
        'Chưa bắt đầu': ['Chưa bắt đầu', 'Đang chạy'],
        'Đang chạy': ['Đang chạy', 'Hoàn thành'],
        'Chờ xác nhận hoàn thành': ['Chờ xác nhận hoàn thành'],
        'Hoàn thành': ['Hoàn thành']
    };

    // Convert decimal hours to hours:minutes:seconds format
    const formatHoursToHMS = (decimalHours: number): string => {
        const hours = Math.floor(decimalHours);
        const minutes = Math.floor((decimalHours - hours) * 60);
        const seconds = Math.round(((decimalHours - hours) * 60 - minutes) * 60);

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

        return parts.join(' ');
    };

    const loadTasks = async () => {
        try {
            if (!refreshing) setLoading(true);
            const data = await getMySubtasks();

            // Handle response structure - could be array or wrapped in object
            let subtasksArray: MemberSubtask[] = [];
            if (Array.isArray(data)) {
                subtasksArray = data;
            } else if (data.subtasks && Array.isArray(data.subtasks)) {
                subtasksArray = data.subtasks;
            } else if (data.data && Array.isArray(data.data)) {
                subtasksArray = data.data;
            }

            setSubtasks(subtasksArray);
        } catch (error: any) {
            console.error('Error loading subtasks:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách công việc con');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTasks();
    };

    const loadWorklogs = async (subtaskId: number) => {
        try {
            setIsLoadingWorklogs(true);
            const response = await getWorklogs({ subtaskId });
            const worklogsData = response.worklogs || response || [];
            setWorklogs(worklogsData);
            setShowWorklogs(true);
        } catch (error: any) {
            console.error('Error loading worklogs:', error);
            Alert.alert('Lỗi', 'Không thể tải worklog');
            setWorklogs([]);
        } finally {
            setIsLoadingWorklogs(false);
        }
    };

    const allItems = [
        ...subtasks.map((subtask: any) => {
            return {
                id: subtask.id,
                title: subtask.tenSubtask || 'Chưa có tên',
                description: '',
                status: subtask.trangThai || 'Chưa bắt đầu',
                priority: 'medium',
                deadline: subtask.ngayKetThuc,
                project: subtask.tenduan || 'Chưa có dự án',
                projectId: subtask.duanId,
                type: 'subtask' as const,
                parentTask: subtask.tentask || 'Chưa có công việc lớn',
                taskId: subtask.taskId,
                progress: 0,
            };
        }),
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

    const updateTaskStatus = async (subtaskId: number, newStatus: string, type: 'task' | 'subtask') => {
        try {
            const subtask = subtasks.find((st: any) => st.id === subtaskId);
            if (subtask?.taskId) {
                // If user selects "Hoàn thành", actually set to "Chờ xác nhận hoàn thành"
                let actualStatus = newStatus;
                let successMessage = 'Cập nhật trạng thái thành công';

                if (newStatus === 'Hoàn thành') {
                    actualStatus = 'Chờ xác nhận hoàn thành';
                    successMessage = 'Đã gửi yêu cầu hoàn thành, chờ quản lý xác nhận';
                }

                // Enforce one-way transitions for members: Chưa bắt đầu -> Đang chạy -> Hoàn thành
                const ALLOWED_TRANSITIONS: Record<string, string[]> = {
                    'Chưa bắt đầu': ['Chưa bắt đầu', 'Đang chạy'],
                    'Đang chạy': ['Đang chạy', 'Hoàn thành'],
                    'Chờ xác nhận hoàn thành': ['Chờ xác nhận hoàn thành'],
                    'Hoàn thành': ['Hoàn thành']
                };

                const current = subtask.trangThai || 'Chưa bắt đầu';
                // If attempted newStatus is not in allowed transitions from current, block it
                // Note: when mapping 'Hoàn thành' -> 'Chờ xác nhận hoàn thành' we check the target label the user tapped
                if (!ALLOWED_TRANSITIONS[current]?.includes(newStatus)) {
                    Alert.alert('Hạn chế', 'Không thể chuyển trạng thái ngược lại. Trạng thái chỉ đi theo hướng Chưa bắt đầu → Đang chạy → Hoàn thành.');
                    return;
                }

                await updateMemberSubtaskStatus(subtask.taskId, subtaskId, actualStatus);
                setSubtasks(
                    subtasks.map((st: any) =>
                        st.id === subtaskId ? { ...st, trangThai: actualStatus } : st
                    )
                );
                Alert.alert('Thành công', successMessage);
                setSelectedTask({ ...selectedTask, status: actualStatus });
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin công việc con');
            }
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
                <Text style={styles.headerTitle}>Công việc con được giao</Text>
                <View style={styles.headerStats}>
                    <Text style={styles.headerStatsText}>Tổng số</Text>
                    <Text style={styles.headerStatsNumber}>{allItems.length}</Text>
                </View>
            </View>
            {/* Subtitle under header for context */}
            <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
                <Text style={styles.headerSubtitle}>Các công việc con đang được giao cho bạn</Text>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, styles.searchBoxElevated]}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm công việc con..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: '#10b981' }]}
                        onPress={() => router.push('/(tabs)/member-available-subtasks')}
                    >
                        <Ionicons name="layers" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setIsFilterVisible(!isFilterVisible)}
                    >
                        <Ionicons name="filter" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter Panel */}
            {isFilterVisible && (
                <View style={styles.filterPanel}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Trạng thái:</Text>
                        <View style={styles.filterButtons}>
                            {['all', 'Chưa bắt đầu', 'Đang chạy', 'Chờ xác nhận hoàn thành', 'Hoàn thành'].map((status) => (
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
            <ScrollView
                style={styles.tasksList}
                contentContainerStyle={styles.tasksContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#667eea']}
                        tintColor="#667eea"
                    />
                }
            >
                {filteredTasks.length === 0 ? (
                    <View style={[styles.emptyContainer, { width: '100%' }]}> 
                        <Ionicons name="file-tray-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>Không có công việc con</Text>
                        <Text style={styles.emptyText}>
                            Không tìm thấy công việc con nào phù hợp với bộ lọc hiện tại.
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
                            <Text style={styles.modalTitle}>Chi tiết công việc con</Text>
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

                                {selectedTask.parentTask && (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionLabel}>Công việc lớn</Text>
                                        <Text style={styles.modalSectionValue}>{selectedTask.parentTask}</Text>
                                    </View>
                                )}

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionLabel}>Trạng thái</Text>

                                    {selectedTask.status === 'Chờ xác nhận hoàn thành' && (
                                        <View style={[styles.modalSection, { backgroundColor: '#FEF3C7', padding: 12, marginBottom: 12, borderRadius: 8 }]}>
                                            <Text style={[styles.modalSectionValue, { color: '#F59E0B', fontWeight: 'bold', textAlign: 'center' }]}>
                                                ⏳ Đang chờ quản lý xác nhận hoàn thành
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.statusButtons}>
                                        {['Chưa bắt đầu', 'Đang chạy', 'Hoàn thành'].map((status) => {
                                            // Show actual status in UI but handle "Hoàn thành" specially
                                            const isActive = selectedTask.status === status ||
                                                (status === 'Hoàn thành' && selectedTask.status === 'Chờ xác nhận hoàn thành');

                                            const current = selectedTask.status || 'Chưa bắt đầu';
                                            const isDisabled = !ALLOWED_TRANSITIONS[current]?.includes(status);

                                            return (
                                                <TouchableOpacity
                                                    key={status}
                                                    style={[
                                                        styles.statusButton,
                                                        isActive && styles.statusButtonActive,
                                                        isDisabled && { opacity: 0.5 }
                                                    ]}
                                                    onPress={() => updateTaskStatus(selectedTask.id, status, selectedTask.type)}
                                                    disabled={isDisabled}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.statusButtonText,
                                                            isActive && styles.statusButtonTextActive,
                                                        ]}
                                                    >
                                                        {status}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
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

                                {/* Worklog Section */}
                                <View style={styles.modalSection}>
                                    <View style={styles.worklogHeader}>
                                        <Text style={styles.modalSectionLabel}>Worklog</Text>
                                        <TouchableOpacity
                                            style={styles.worklogButton}
                                            onPress={() => {
                                                if (showWorklogs) {
                                                    setShowWorklogs(false);
                                                } else {
                                                    loadWorklogs(selectedTask.id);
                                                }
                                            }}
                                            disabled={isLoadingWorklogs}
                                        >
                                            {isLoadingWorklogs ? (
                                                <ActivityIndicator size="small" color="#667eea" />
                                            ) : (
                                                <>
                                                    <Ionicons
                                                        name={showWorklogs ? 'chevron-up' : 'chevron-down'}
                                                        size={20}
                                                        color="#667eea"
                                                    />
                                                    <Text style={styles.worklogButtonText}>
                                                        {showWorklogs ? 'Thu gọn' : 'Xem worklog'}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {showWorklogs && (
                                        <View style={styles.worklogList}>
                                            {worklogs.length === 0 ? (
                                                <View style={styles.worklogEmpty}>
                                                    <Ionicons name="time-outline" size={32} color="#9CA3AF" />
                                                    <Text style={styles.worklogEmptyText}>Chưa có worklog nào</Text>
                                                </View>
                                            ) : (
                                                worklogs.map((worklog: any) => (
                                                    <View key={worklog.id} style={styles.worklogItem}>
                                                        <View style={styles.worklogItemHeader}>
                                                            <View style={styles.worklogItemInfo}>
                                                                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                                                                <Text style={styles.worklogDate}>
                                                                    {new Date(worklog.date || worklog.createdAt).toLocaleString('vi-VN', {
                                                                        year: 'numeric',
                                                                        month: '2-digit',
                                                                        day: '2-digit',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        second: '2-digit',
                                                                        hour12: false
                                                                    })}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.worklogItemInfo}>
                                                                <Ionicons name="time-outline" size={16} color="#667eea" />
                                                                <Text style={styles.worklogHours}>
                                                                    {formatHoursToHMS(worklog.hours || worklog.hours_spent || 0)}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        {worklog.note && (
                                                            <Text style={styles.worklogNote}>{worklog.note}</Text>
                                                        )}
                                                        {worklog.User?.hoten && (
                                                            <Text style={styles.worklogUser}>
                                                                Ghi nhận bởi: {worklog.User.hoten}
                                                            </Text>
                                                        )}
                                                    </View>
                                                ))
                                            )}
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
