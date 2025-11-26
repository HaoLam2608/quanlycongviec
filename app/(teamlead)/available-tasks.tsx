import { acceptAssignment, declineAssignment, getPendingTaskAssignments, getUnassignedTasks, requestToClaimTask } from '@/src/axios/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Task {
    id: number;
    tentask: string;
    mota?: string;
    mucDoUuTien?: string;
    ngayKetThuc?: string;
    duan?: {
        id: number;
        tenduan: string;
    };
    nguoiGiao?: {
        id: number;
        hoten: string;
        manv: string;
    };
}

interface PendingAssignment {
    id: number;
    taskId: number;
    status: string;
    createdAt: string;
    task: Task;
    manager?: {
        id: number;
        hoten: string;
        manv: string;
    };
}

export default function AvailableTasksScreen() {
    const router = useRouter();
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [requestingTaskId, setRequestingTaskId] = useState<number | null>(null);
    const [processingAssignmentId, setProcessingAssignmentId] = useState<number | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [declineAssignmentId, setDeclineAssignmentId] = useState<number | null>(null);

    const loadAvailableTasks = async () => {
        try {
            const res = await getUnassignedTasks();
            const tasks = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setAvailableTasks(tasks);
            if (tasks.length === 0 && res.message) {
                setInfoMessage(res.message);
            }
        } catch (error: any) {
            console.error('Load available tasks error:', error);
            setAvailableTasks([]);
            setInfoMessage(error?.message || 'Không thể tải danh sách công việc');
        }
    };

    const loadPendingAssignments = async () => {
        try {
            const res = await getPendingTaskAssignments();
            const assignments = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setPendingAssignments(assignments);
        } catch (error: any) {
            console.error('Load pending assignments error:', error);
            setPendingAssignments([]);
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setInfoMessage(null);
        await Promise.all([loadAvailableTasks(), loadPendingAssignments()]);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleRequestTask = async (taskId: number) => {
        Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn yêu cầu nhận công việc này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Gửi yêu cầu',
                    onPress: async () => {
                        setRequestingTaskId(taskId);
                        try {
                            await requestToClaimTask({ taskId });
                            Alert.alert('Thành công', 'Đã gửi yêu cầu nhận công việc. Vui lòng đợi Manager/Admin duyệt.');
                            await loadData();
                        } catch (error: any) {
                            console.error('Request task error:', error);
                            Alert.alert('Lỗi', error?.message || 'Không thể gửi yêu cầu');
                        } finally {
                            setRequestingTaskId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleAcceptAssignment = async (assignmentId: number) => {
        setProcessingAssignmentId(assignmentId);
        try {
            await acceptAssignment(assignmentId.toString());
            Alert.alert('Thành công', 'Đã chấp nhận công việc!');
            await loadData();
        } catch (error: any) {
            console.error('Accept assignment error:', error);
            Alert.alert('Lỗi', error?.message || 'Không thể chấp nhận công việc');
        } finally {
            setProcessingAssignmentId(null);
        }
    };

    const handleDeclineAssignment = (assignmentId: number) => {
        setDeclineAssignmentId(assignmentId);
        setShowDeclineModal(true);
        setDeclineReason('');
    };

    const handleDeclineConfirm = async () => {
        if (!declineAssignmentId) return;

        if (!declineReason.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
            return;
        }

        setProcessingAssignmentId(declineAssignmentId);
        try {
            await declineAssignment(declineAssignmentId.toString(), { reason: declineReason });
            Alert.alert('Thành công', 'Đã từ chối công việc!');
            setShowDeclineModal(false);
            setDeclineReason('');
            setDeclineAssignmentId(null);
            await loadData();
        } catch (error: any) {
            console.error('Decline assignment error:', error);
            Alert.alert('Lỗi', error?.message || 'Không thể từ chối công việc');
        } finally {
            setProcessingAssignmentId(null);
        }
    };

    const filteredAvailableTasks = availableTasks.filter(task => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            task.tentask.toLowerCase().includes(q) ||
            task.mota?.toLowerCase().includes(q) ||
            task.duan?.tenduan?.toLowerCase().includes(q)
        );
    });

    const filteredPendingAssignments = pendingAssignments.filter(assignment => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            assignment.task?.tentask?.toLowerCase().includes(q) ||
            assignment.task?.mota?.toLowerCase().includes(q) ||
            assignment.task?.duan?.tenduan?.toLowerCase().includes(q)
        );
    });

    const getPriorityColor = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'cao':
            case 'high':
                return '#ef4444';
            case 'trung bình':
            case 'medium':
                return '#f59e0b';
            case 'thấp':
            case 'low':
                return '#10b981';
            default:
                return '#6b7280';
        }
    };

    const getPriorityLabel = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'cao':
            case 'high':
                return 'Cao';
            case 'trung bình':
            case 'medium':
                return 'Trung bình';
            case 'thấp':
            case 'low':
                return 'Thấp';
            default:
                return priority || 'Không xác định';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Không xác định';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        } catch {
            return dateString;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#312e81" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Yêu cầu nhận task</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={styles.subtitle}>
                    {filteredAvailableTasks.length} công việc khả dụng • {filteredPendingAssignments.length} chờ xác nhận
                </Text>
                {infoMessage && (
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={16} color="#b45309" />
                        <Text style={styles.infoMessage}>{infoMessage}</Text>
                    </View>
                )}
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm công việc..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                />
                {search ? (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2563eb']}
                        />
                    }
                >
                    {/* Unassigned Tasks Section */}
                    {filteredAvailableTasks.length > 0 ? (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="hand-right" size={24} color="#2563eb" />
                                <Text style={styles.sectionTitle}>
                                    Công việc chưa ai nhận ({filteredAvailableTasks.length})
                                </Text>
                            </View>
                            {filteredAvailableTasks.map((task) => {
                                const isRequesting = requestingTaskId === task.id;

                                return (
                                    <View key={task.id} style={[styles.card, styles.availableCard]}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.taskTitle} numberOfLines={2}>
                                                {task.tentask}
                                            </Text>
                                            {task.mucDoUuTien && (
                                                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.mucDoUuTien) }]}>
                                                    <Text style={styles.priorityText}>{getPriorityLabel(task.mucDoUuTien)}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {task.mota && (
                                            <Text style={styles.taskDescription} numberOfLines={2}>
                                                {task.mota}
                                            </Text>
                                        )}

                                        {task.duan && (
                                            <View style={styles.infoRow}>
                                                <Ionicons name="folder-open" size={16} color="#2563eb" />
                                                <Text style={styles.infoText}>{task.duan.tenduan}</Text>
                                            </View>
                                        )}

                                        {task.nguoiGiao && (
                                            <View style={styles.infoRow}>
                                                <Ionicons name="person" size={16} color="#6b7280" />
                                                <Text style={styles.infoText}>
                                                    Tạo bởi: {task.nguoiGiao.hoten}
                                                </Text>
                                            </View>
                                        )}

                                        {task.ngayKetThuc && (
                                            <View style={styles.infoRow}>
                                                <Ionicons name="calendar" size={16} color="#6b7280" />
                                                <Text style={styles.infoText}>Hạn: {formatDate(task.ngayKetThuc)}</Text>
                                            </View>
                                        )}

                                        <TouchableOpacity
                                            style={[styles.requestButton, isRequesting && styles.requestingButton]}
                                            onPress={() => handleRequestTask(task.id)}
                                            disabled={isRequesting}
                                        >
                                            {isRequesting ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Ionicons name="hand-right" size={20} color="#fff" />
                                                    <Text style={styles.requestButtonText}>Yêu cầu nhận việc</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}

                    {/* Pending Assignments Section - Tasks được manager gán */}
                    {filteredPendingAssignments.length > 0 && (
                        <View style={[styles.section, styles.pendingSection]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="mail" size={24} color="#f59e0b" />
                                <Text style={styles.sectionTitle}>
                                    Được giao bởi Manager ({filteredPendingAssignments.length})
                                </Text>
                            </View>
                            {filteredPendingAssignments.map((assignment) => {
                                const isProcessing = processingAssignmentId === assignment.id;

                                return (
                                    <View key={assignment.id} style={[styles.card, styles.pendingCard]}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.taskTitle} numberOfLines={2}>
                                                {assignment.task.tentask}
                                            </Text>
                                            {assignment.task.mucDoUuTien && (
                                                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(assignment.task.mucDoUuTien) }]}>
                                                    <Text style={styles.priorityText}>{getPriorityLabel(assignment.task.mucDoUuTien)}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {assignment.task.mota && (
                                            <Text style={styles.taskDescription} numberOfLines={2}>
                                                {assignment.task.mota}
                                            </Text>
                                        )}

                                        {assignment.task.duan && (
                                            <View style={styles.infoRow}>
                                                <Ionicons name="folder-open" size={16} color="#f59e0b" />
                                                <Text style={styles.infoText}>{assignment.task.duan.tenduan}</Text>
                                            </View>
                                        )}

                                        {assignment.manager && (
                                            <View style={styles.infoRow}>
                                                <Ionicons name="person-circle" size={16} color="#6b7280" />
                                                <Text style={styles.infoText}>
                                                    Giao bởi: {assignment.manager.hoten}
                                                </Text>
                                            </View>
                                        )}

                                        {assignment.task.ngayKetThuc && (
                                            <View style={styles.infoRow}>
                                                <Ionicons name="calendar" size={16} color="#6b7280" />
                                                <Text style={styles.infoText}>Hạn: {formatDate(assignment.task.ngayKetThuc)}</Text>
                                            </View>
                                        )}

                                        <View style={styles.actionRow}>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.acceptButton, isProcessing && styles.disabledButton]}
                                                onPress={() => handleAcceptAssignment(assignment.id)}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                                        <Text style={styles.actionButtonText}>Chấp nhận</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.declineButton, isProcessing && styles.disabledButton]}
                                                onPress={() => handleDeclineAssignment(assignment.id)}
                                                disabled={isProcessing}
                                            >
                                                <Ionicons name="close-circle" size={20} color="#fff" />
                                                <Text style={styles.actionButtonText}>Từ chối</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Empty State */}
                    {filteredAvailableTasks.length === 0 && filteredPendingAssignments.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="briefcase-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>
                                {search ? 'Không tìm thấy công việc phù hợp' : 'Không có công việc khả dụng'}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Decline Modal */}
            {showDeclineModal && (
                <Modal
                    visible={showDeclineModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowDeclineModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modal}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Lý do từ chối</Text>
                                <TouchableOpacity onPress={() => setShowDeclineModal(false)}>
                                    <Ionicons name="close" size={24} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalLabel}>Vui lòng nhập lý do từ chối công việc:</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Nhập lý do..."
                                placeholderTextColor="#9ca3af"
                                value={declineReason}
                                onChangeText={setDeclineReason}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalCancelButton]}
                                    onPress={() => setShowDeclineModal(false)}
                                >
                                    <Text style={styles.modalCancelText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalConfirmButton]}
                                    onPress={handleDeclineConfirm}
                                    disabled={processingAssignmentId !== null}
                                >
                                    {processingAssignmentId ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.modalConfirmText}>Xác nhận</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    header: {
        padding: 16,
        paddingTop: 18,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ede9fe'
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    backButton: {
        padding: 8
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#312e81',
        flex: 1,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center'
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        padding: 8,
        backgroundColor: '#fef3c7',
        borderRadius: 8
    },
    infoMessage: {
        flex: 1,
        fontSize: 13,
        color: '#b45309'
    },
    searchContainer: {
        marginHorizontal: 16,
        marginVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    searchInput: {
        flex: 1,
        height: 44,
        color: '#111827'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280'
    },
    scrollContent: {
        padding: 16,
        paddingTop: 0
    },
    section: {
        marginBottom: 24
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#dbeafe'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#312e81',
        flex: 1
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    availableCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 12
    },
    taskTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#312e81'
    },
    taskDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
        lineHeight: 20
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    },
    infoText: {
        fontSize: 14,
        color: '#6b7280',
        flex: 1
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff'
    },
    requestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#2563eb',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 12
    },
    requestingButton: {
        backgroundColor: '#9ca3af'
    },
    requestButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff'
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center'
    },
    pendingSection: {
        backgroundColor: '#fffbeb',
        borderColor: '#fef3c7'
    },
    pendingCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        backgroundColor: '#fffbeb'
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10
    },
    acceptButton: {
        backgroundColor: '#10b981'
    },
    declineButton: {
        backgroundColor: '#ef4444'
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
        opacity: 0.6
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#312e81'
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        minHeight: 100,
        marginBottom: 16
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center'
    },
    modalCancelButton: {
        backgroundColor: '#f3f4f6'
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280'
    },
    modalConfirmButton: {
        backgroundColor: '#ef4444'
    },
    modalConfirmText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff'
    }
});
