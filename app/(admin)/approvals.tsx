import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
    View,
} from 'react-native';
import api from '../../src/axios/config';

interface PendingTask {
    id: number;
    tentask: string;
    mota?: string;
    trangThai: string;
    ngayKetThuc?: string;
    nguoiDuocGiao: {
        id: number;
        hoten: string;
        manv: string;
    };
    nguoiGiao: {
        id: number;
        hoten: string;
        manv: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface PendingSubtask {
    id: number;
    tenSubtask: string;
    mota?: string;
    trangThai: string;
    ngayKetThuc?: string;
    nguoiThucHien: {
        id: number;
        hoten: string;
        manv: string;
    };
    task: {
        id: number;
        tentask: string;
        nguoiGiao: {
            id: number;
            hoten: string;
            manv: string;
        };
    };
    createdAt: string;
    updatedAt: string;
}

export default function ApprovalsManagement() {
    const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
    const [pendingSubtasks, setPendingSubtasks] = useState<PendingSubtask[]>([]);
    const [filter, setFilter] = useState<'all' | 'tasks' | 'subtasks'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [processingApproval, setProcessingApproval] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadPendingApprovals();
    }, [filter]);

    const loadPendingApprovals = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/approvals/pending?type=${filter}`);
            const data = response.data.data || response.data;
            setPendingTasks(data.tasks || []);
            setPendingSubtasks(data.subtasks || []);
        } catch (error: any) {
            console.error('Error loading approvals:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tải danh sách phê duyệt');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPendingApprovals();
        setRefreshing(false);
    };

    const handleApprove = async (item: any, type: 'task' | 'subtask', approved: boolean) => {
        setProcessingApproval(true);
        try {
            if (type === 'task') {
                await api.post(`/approvals/tasks/${item.id}/approve`, {
                    approved,
                    reason: approved ? '' : rejectReason
                });
            } else {
                await api.post(`/approvals/subtasks/${item.id}/approve`, {
                    approved,
                    reason: approved ? '' : rejectReason
                });
            }
            
            Alert.alert('Thành công', approved ? 'Đã phê duyệt thành công' : 'Đã từ chối yêu cầu');
            setIsModalOpen(false);
            setSelectedItem(null);
            setRejectReason('');
            loadPendingApprovals();
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Lỗi khi xử lý phê duyệt');
        } finally {
            setProcessingApproval(false);
        }
    };

    const openApprovalModal = (item: any, type: 'task' | 'subtask') => {
        setSelectedItem({ ...item, type });
        setIsModalOpen(true);
        setRejectReason('');
    };

    // Lọc và tìm kiếm
    const filteredTasks = pendingTasks.filter(task => 
        task.tentask.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.nguoiDuocGiao.hoten.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSubtasks = pendingSubtasks.filter(subtask => 
        subtask.tenSubtask.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subtask.nguoiThucHien.hoten.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subtask.task.tentask.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCount = filteredTasks.length + filteredSubtasks.length;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý phê duyệt</Text>
                <Text style={styles.subtitle}>
                    {totalCount} yêu cầu chờ phê duyệt
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm công việc, nhân viên..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9ca3af"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={{ alignItems: 'center' }}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        Tất cả ({pendingTasks.length + pendingSubtasks.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'tasks' && styles.filterTabActive]}
                    onPress={() => setFilter('tasks')}
                >
                    <Text style={[styles.filterText, filter === 'tasks' && styles.filterTextActive]}>
                        Công việc chính ({pendingTasks.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'subtasks' && styles.filterTabActive]}
                    onPress={() => setFilter('subtasks')}
                >
                    <Text style={[styles.filterText, filter === 'subtasks' && styles.filterTextActive]}>
                        Công việc nhỏ ({pendingSubtasks.length})
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Approvals List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={['#14b8a6']}
                        tintColor="#14b8a6"
                    />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#14b8a6" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </View>
                ) : totalCount === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-done-circle-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>Không có yêu cầu phê duyệt</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Tất cả công việc đã được xử lý'}
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Tasks */}
                        {(filter === 'all' || filter === 'tasks') && filteredTasks.map(task => (
                            <View key={`task-${task.id}`} style={styles.approvalCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderLeft}>
                                        <View style={styles.iconContainer}>
                                            <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                                        </View>
                                        <View style={styles.cardHeaderInfo}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>
                                                {task.tentask}
                                            </Text>
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>Công việc chính</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {task.mota && (
                                    <Text style={styles.cardDescription} numberOfLines={2}>
                                        {task.mota}
                                    </Text>
                                )}

                                <View style={styles.cardInfo}>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="person" size={16} color="#6b7280" />
                                        <Text style={styles.infoText}>
                                            Người thực hiện: {task.nguoiDuocGiao.hoten}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="person-outline" size={16} color="#6b7280" />
                                        <Text style={styles.infoText}>
                                            Người giao: {task.nguoiGiao.hoten}
                                        </Text>
                                    </View>
                                    {task.ngayKetThuc && (
                                        <View style={styles.infoRow}>
                                            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                            <Text style={styles.infoText}>
                                                Deadline: {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.infoRow}>
                                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                                        <Text style={styles.infoText}>
                                            Yêu cầu: {formatDate(task.updatedAt)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cardActions}>
                                    <TouchableOpacity 
                                        style={styles.detailButton}
                                        onPress={() => openApprovalModal(task, 'task')}
                                    >
                                        <Ionicons name="eye-outline" size={18} color="#6b7280" />
                                        <Text style={styles.detailButtonText}>Chi tiết</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, styles.approveButton]}
                                        onPress={() => handleApprove(task, 'task', true)}
                                        disabled={processingApproval}
                                    >
                                        <Ionicons name="checkmark" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}>Phê duyệt</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, styles.rejectButton]}
                                        onPress={() => openApprovalModal(task, 'task')}
                                    >
                                        <Ionicons name="close" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}>Từ chối</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {/* Subtasks */}
                        {(filter === 'all' || filter === 'subtasks') && filteredSubtasks.map(subtask => (
                            <View key={`subtask-${subtask.id}`} style={styles.approvalCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#fff7ed' }]}>
                                            <Ionicons name="list" size={24} color="#f97316" />
                                        </View>
                                        <View style={styles.cardHeaderInfo}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>
                                                {subtask.tenSubtask}
                                            </Text>
                                            <View style={[styles.badge, { backgroundColor: '#fff7ed' }]}>
                                                <Text style={[styles.badgeText, { color: '#f97316' }]}>
                                                    Công việc nhỏ
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.parentTask}>
                                    <Text style={styles.parentTaskLabel}>Thuộc task:</Text>
                                    <Text style={styles.parentTaskName}>{subtask.task.tentask}</Text>
                                </View>

                                {subtask.mota && (
                                    <Text style={styles.cardDescription} numberOfLines={2}>
                                        {subtask.mota}
                                    </Text>
                                )}

                                <View style={styles.cardInfo}>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="person" size={16} color="#6b7280" />
                                        <Text style={styles.infoText}>
                                            Người thực hiện: {subtask.nguoiThucHien?.hoten || 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="person-outline" size={16} color="#6b7280" />
                                        <Text style={styles.infoText}>
                                            Người giao: {subtask.task?.nguoiGiao?.hoten || 'N/A'}
                                        </Text>
                                    </View>
                                    {subtask.ngayKetThuc && (
                                        <View style={styles.infoRow}>
                                            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                            <Text style={styles.infoText}>
                                                Deadline: {new Date(subtask.ngayKetThuc).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.infoRow}>
                                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                                        <Text style={styles.infoText}>
                                            Yêu cầu: {formatDate(subtask.updatedAt)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cardActions}>
                                    <TouchableOpacity 
                                        style={styles.detailButton}
                                        onPress={() => openApprovalModal(subtask, 'subtask')}
                                    >
                                        <Ionicons name="eye-outline" size={18} color="#6b7280" />
                                        <Text style={styles.detailButtonText}>Chi tiết</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, styles.approveButton]}
                                        onPress={() => handleApprove(subtask, 'subtask', true)}
                                        disabled={processingApproval}
                                    >
                                        <Ionicons name="checkmark" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}>Phê duyệt</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, styles.rejectButton]}
                                        onPress={() => openApprovalModal(subtask, 'subtask')}
                                    >
                                        <Ionicons name="close" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}>Từ chối</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Approval Detail Modal */}
            <Modal
                visible={isModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Chi tiết {selectedItem?.type === 'task' ? 'công việc' : 'công việc nhỏ'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {selectedItem && (
                                <>
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>
                                            {selectedItem.type === 'task' ? selectedItem.tentask : selectedItem.tenSubtask}
                                        </Text>
                                        {selectedItem.mota && (
                                            <Text style={styles.modalDescription}>{selectedItem.mota}</Text>
                                        )}
                                    </View>

                                    <View style={styles.modalInfoGrid}>
                                        <View style={styles.modalInfoItem}>
                                            <Text style={styles.modalLabel}>Người thực hiện</Text>
                                            <Text style={styles.modalValue}>
                                                {selectedItem.type === 'task' 
                                                    ? selectedItem.nguoiDuocGiao.hoten 
                                                    : selectedItem.nguoiThucHien.hoten
                                                }
                                            </Text>
                                        </View>
                                        <View style={styles.modalInfoItem}>
                                            <Text style={styles.modalLabel}>Người giao</Text>
                                            <Text style={styles.modalValue}>
                                                {selectedItem.type === 'task' 
                                                    ? selectedItem.nguoiGiao?.hoten || 'N/A'
                                                    : selectedItem.task?.nguoiGiao?.hoten || 'N/A'
                                                }
                                            </Text>
                                        </View>
                                        <View style={styles.modalInfoItem}>
                                            <Text style={styles.modalLabel}>Trạng thái</Text>
                                            <View style={styles.modalStatusBadge}>
                                                <Text style={styles.modalStatusText}>
                                                    {selectedItem.trangThai}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.modalInfoItem}>
                                            <Text style={styles.modalLabel}>Thời gian yêu cầu</Text>
                                            <Text style={styles.modalValue}>
                                                {formatDate(selectedItem.updatedAt)}
                                            </Text>
                                        </View>
                                    </View>

                                    {selectedItem.type === 'subtask' && (
                                        <View style={styles.modalSection}>
                                            <Text style={styles.modalLabel}>Thuộc task</Text>
                                            <Text style={styles.modalValue}>{selectedItem.task.tentask}</Text>
                                        </View>
                                    )}

                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalLabel}>Lý do từ chối (tùy chọn)</Text>
                                        <TextInput
                                            style={styles.rejectReasonInput}
                                            placeholder="Nhập lý do nếu muốn từ chối yêu cầu..."
                                            value={rejectReason}
                                            onChangeText={setRejectReason}
                                            multiline
                                            numberOfLines={3}
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity 
                                            style={[styles.modalActionButton, styles.modalApproveButton]}
                                            onPress={() => handleApprove(selectedItem, selectedItem.type, true)}
                                            disabled={processingApproval}
                                        >
                                            <Ionicons name="checkmark-done" size={20} color="#fff" />
                                            <Text style={styles.modalActionButtonText}>
                                                {processingApproval ? 'Đang xử lý...' : 'Phê duyệt hoàn thành'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.modalActionButton, styles.modalRejectButton]}
                                            onPress={() => handleApprove(selectedItem, selectedItem.type, false)}
                                            disabled={processingApproval}
                                        >
                                            <Ionicons name="close-circle" size={20} color="#fff" />
                                            <Text style={styles.modalActionButtonText}>
                                                {processingApproval ? 'Đang xử lý...' : 'Từ chối yêu cầu'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#14b8a6',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#14b8a6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#f9fafb',
    },
    filterTab: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterTabActive: {
        backgroundColor: '#14b8a6',
        borderColor: '#14b8a6',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    filterTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
    approvalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardHeaderInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#eff6ff',
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3b82f6',
    },
    parentTask: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
    },
    parentTaskLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginRight: 6,
    },
    parentTaskName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
    },
    cardDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    cardInfo: {
        gap: 8,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#6b7280',
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        gap: 6,
    },
    detailButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    approveButton: {
        backgroundColor: '#10b981',
    },
    rejectButton: {
        backgroundColor: '#ef4444',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    modalSection: {
        marginBottom: 20,
    },
    modalSectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    modalDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
    modalInfoGrid: {
        gap: 16,
        marginBottom: 20,
    },
    modalInfoItem: {
        gap: 6,
    },
    modalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    modalValue: {
        fontSize: 15,
        color: '#111827',
    },
    modalStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fff7ed',
        borderRadius: 8,
    },
    modalStatusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f97316',
    },
    rejectReasonInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        minHeight: 80,
        textAlignVertical: 'top',
        backgroundColor: '#f9fafb',
    },
    modalActions: {
        gap: 12,
        marginTop: 8,
        paddingBottom: 20,
    },
    modalActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    modalApproveButton: {
        backgroundColor: '#10b981',
    },
    modalRejectButton: {
        backgroundColor: '#ef4444',
    },
    modalActionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
