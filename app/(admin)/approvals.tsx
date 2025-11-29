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
import { approvalAPI } from '../../src/axios/approvalApi';
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
    const [activeTab, setActiveTab] = useState<'completion' | 'join' | 'history'>('completion');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [processingApproval, setProcessingApproval] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [joinRequests, setJoinRequests] = useState<any[]>([]);
    const [processingRequest, setProcessingRequest] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [approvedHistory, setApprovedHistory] = useState<any[]>([]);
    const [joinFilter, setJoinFilter] = useState<'all' | 'tasks' | 'subtasks'>('all');
    const [historyFilter, setHistoryFilter] = useState<'all' | 'approved' | 'requested'>('all');
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);

    const loadApprovedHistory = async (limit: number = 100) => {
        setLoadingHistory(true);
        try {
            const res = await approvalAPI.getApprovedHistory(limit);
            console.log('DEBUG approvals.getApprovedHistory raw response:', res);

            // Tìm data ở nhiều cấp: res.data.data, res.data, hoặc res
            let dataWrapper = res?.data?.data || res?.data || res || {};
            console.log('DEBUG approvals.history dataWrapper:', dataWrapper);

            const tasks = Array.isArray(dataWrapper.tasks) ? dataWrapper.tasks : [];
            const subtasks = Array.isArray(dataWrapper.subtasks) ? dataWrapper.subtasks : [];
            const assignments = Array.isArray(dataWrapper.assignments) ? dataWrapper.assignments : [];

            const allItems = [
                ...tasks.map((t: any) => ({ ...t, type: 'task' })),
                ...subtasks.map((s: any) => ({ ...s, type: 'subtask' })),
                ...assignments.map((a: any) => ({ ...a, type: 'assignment' })),
            ];

            console.log('DEBUG approvals.history allItems count:', allItems.length);
            setApprovedHistory(allItems);
            const message = res?.message || res?.data?.message || null;
            if (message) setInfoMessage(message);
        } catch (error: any) {
            console.error('Load approved history error:', error);
            setApprovedHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Load tất cả data ngay khi component mount
    useEffect(() => {
        loadPendingApprovals();
        loadJoinRequests();
        loadApprovedHistory();
    }, []);

    // Chỉ reload data của tab đang active khi filter thay đổi
    useEffect(() => {
        if (activeTab === 'completion') {
            loadPendingApprovals();
        }
    }, [filter]);

    const filteredJoinRequests = joinRequests.filter(req => {
        // type filter
        if (joinFilter === 'tasks' && !req.meta?.taskId) return false;
        if (joinFilter === 'subtasks' && !req.meta?.subtaskId) return false;

        // search filter
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (req.title || '').toString().toLowerCase().includes(q) ||
            (req.content || '').toString().toLowerCase().includes(q) ||
            (req.meta?.requesterName || req.meta?.requester?.hoten || '').toString().toLowerCase().includes(q)
        );
    });

    const loadPendingApprovals = async () => {
        setLoading(true);
        setInfoMessage(null);
        try {
            const resp = await approvalAPI.getPendingApprovals({ type: filter as any });
            console.log('DEBUG approvals.getPendingApprovals raw response:', resp);

            // Tìm data ở nhiều cấp: resp.data.data, resp.data, hoặc resp
            let data = resp?.data?.data || resp?.data || resp || {};
            console.log('DEBUG approvals.pending parsed data:', data);

            const tasks = Array.isArray(data.tasks) ? data.tasks : [];
            const subtasks = Array.isArray(data.subtasks) ? data.subtasks : [];

            console.log('DEBUG approvals.pending tasks count:', tasks.length, 'subtasks count:', subtasks.length);
            setPendingTasks(tasks);
            setPendingSubtasks(subtasks);

            const message = resp?.message || resp?.data?.message || data?.message || null;
            if (message) setInfoMessage(message);
        } catch (error: any) {
            console.error('Error loading approvals:', error);
            Alert.alert('Lỗi', error?.message || error?.response?.data?.message || 'Không thể tải danh sách phê duyệt');
            setPendingTasks([]);
            setPendingSubtasks([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (activeTab === 'completion') await loadPendingApprovals();
        if (activeTab === 'join') await loadJoinRequests();
        if (activeTab === 'history') await loadApprovedHistory();
        setRefreshing(false);
    };

    const loadJoinRequests = async () => {
        try {
            // Use new API that filters server-side by role (admin/manager/teamlead)
            const res = await approvalAPI.getMyJoinRequests();
            console.log('DEBUG ⚙️ getMyJoinRequests raw response:', res);

            // Normalize response shape
            const raw = Array.isArray(res.data) ? res.data : (res.data?.data || res.data || []);

            const requests = (raw || []).map((n: any) => ({
                id: String(n.id),
                title: n.title,
                content: n.content,
                createdAt: n.createdAt,
                isRead: n.isRead || (n.userNotification && n.userNotification.isRead) || false,
                meta: n.userMeta || n.meta || (n.userNotification && n.userNotification.meta)
            }));

            console.log('DEBUG ⚙️ collected join requests:', requests.length);
            setJoinRequests(requests);
        } catch (error: any) {
            console.error('Load join requests error:', error);
            setJoinRequests([]);
        }
    };

    // Single canonical set of handlers / derived data (deduplicated)
    const acceptJoinRequest = async (req: any) => {
        setProcessingRequest(req.id);
        try {
            await approvalAPI.acceptRequestToJoin({
                taskId: req.meta.taskId || null,
                subtaskId: req.meta.subtaskId || null,
                requesterId: req.meta.requesterId
            });
            Alert.alert('Thành công', 'Đã chấp nhận yêu cầu nhận việc');
            await loadJoinRequests();
            await loadPendingApprovals();
        } catch (error: any) {
            console.error('Accept join request error:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || error?.message || 'Không thể chấp nhận yêu cầu');
        } finally {
            setProcessingRequest(null);
        }
    };

    const declineJoinRequest = async (req: any) => {
        setProcessingRequest(req.id);
        try {
            await approvalAPI.declineRequestToJoin({
                taskId: req.meta.taskId || null,
                subtaskId: req.meta.subtaskId || null,
                requesterId: req.meta.requesterId,
                reason: 'Từ chối'
            });
            Alert.alert('Thành công', 'Đã từ chối yêu cầu nhận việc');
            await loadJoinRequests();
        } catch (error: any) {
            console.error('Decline join request error:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || error?.message || 'Không thể từ chối yêu cầu');
        } finally {
            setProcessingRequest(null);
        }
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
            await loadPendingApprovals();
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

    const filteredTasks = pendingTasks.filter(task =>
        task.tentask.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.nguoiDuocGiao.hoten.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSubtasks = pendingSubtasks.filter(subtask =>
        subtask.tenSubtask.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subtask.nguoiThucHien.hoten.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subtask.task.tentask.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredHistory = approvedHistory.filter((item: any) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const title = (item.tentask || item.tenSubtask || item.title || item.name || '').toString().toLowerCase();
        const performer = (item.nguoiDuocGiao?.hoten || item.nguoiThucHien?.hoten || item.meta?.requesterName || item.user?.hoten || '').toString().toLowerCase();
        const status = (item.trangThai || item.status || '').toString().toLowerCase();
        return title.includes(q) || performer.includes(q) || status.includes(q);
    });

    // apply history filter (all / approved / requested)
    const filteredHistoryWithStatus = filteredHistory.filter((item: any) => {
        if (historyFilter === 'all') return true;
        const s = (item.trangThai || item.status || '').toString().toLowerCase();
        const isApproved = /accepted|approve|approved|đã phê duyệt/.test(s);
        if (historyFilter === 'approved') return isApproved;
        // 'requested' -> not approved (requests / pending)
        return !isApproved;
    });

    const completionCount = filteredTasks.length + filteredSubtasks.length;
    const joinCount = joinRequests.length;
    const historyCount = approvedHistory.length;
    const totalCount = completionCount + joinCount; // legacy total used elsewhere
    const headerCount = activeTab === 'completion' ? completionCount : activeTab === 'join' ? joinCount : historyCount;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const translateStatus = (s?: string) => {
        if (!s) return '';
        const st = s.toString().toLowerCase();
        if (st === 'accepted' || st === 'approve' || st === 'approved' || st === 'đã phê duyệt') return 'Đã phê duyệt';
        if (st === 'rejected' || st === 'declined' || st === 'từ chối' || st === 'rejected') return 'Đã từ chối';
        if (st === 'pending' || st === 'pending_approval' || st === 'đang chờ') return 'Đang chờ';
        if (st === 'in_progress' || st === 'doing' || st === 'đang thực hiện') return 'Đang thực hiện';
        return s;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Phê duyệt công việc</Text>
                <Text style={styles.subtitle}>
                    {headerCount} yêu cầu {activeTab === 'completion' ? 'chờ phê duyệt' : activeTab === 'join' ? 'nhận việc' : 'lịch sử'}
                </Text>
                {infoMessage ? (
                    <View style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.12)', padding: 8, borderRadius: 8 }}>
                        <Text style={{ color: '#fff', fontSize: 13 }}>{infoMessage}</Text>
                    </View>
                ) : null}
                {/* Top tabs: completion / join / history */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity onPress={() => setActiveTab('completion')} style={[styles.tabBtn, activeTab === 'completion' && styles.tabBtnActive]}>
                        <Text style={[styles.tabText, activeTab === 'completion' && styles.tabTextActive]}>Phê duyệt hoàn thành</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('join')} style={[styles.tabBtn, activeTab === 'join' && styles.tabBtnActive]}>
                        <Text style={[styles.tabText, activeTab === 'join' && styles.tabTextActive]}>Yêu cầu nhận việc</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('history')} style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}>
                        <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Lịch sử</Text>
                    </TouchableOpacity>
                </View>
                {/* debug button removed for production UX */}
            </View>

            {/* Search Bar (visible for all tabs, including History) */}
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

            {/* Filter Panel (completion / join / history) */}
            {(activeTab === 'completion' || activeTab === 'join' || activeTab === 'history') && (
                <View style={styles.filterWrapper}>
                    {activeTab === 'completion' && (
                        <View style={styles.filterRow}>
                            <TouchableOpacity
                                style={[styles.filterChip, filter === 'all' && styles.filterTabActive]}
                                onPress={() => setFilter('all')}
                            >
                                <Ionicons name="list" size={16} color={filter === 'all' ? '#fff' : '#6b7280'} />
                                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                                    Tất cả ({pendingTasks.length + pendingSubtasks.length})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, filter === 'tasks' && styles.filterTabActive]}
                                onPress={() => setFilter('tasks')}
                            >
                                <Ionicons name="briefcase" size={16} color={filter === 'tasks' ? '#fff' : '#6b7280'} />
                                <Text style={[styles.filterText, filter === 'tasks' && styles.filterTextActive]}>
                                    CV chính ({pendingTasks.length})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, filter === 'subtasks' && styles.filterTabActive]}
                                onPress={() => setFilter('subtasks')}
                            >
                                <Ionicons name="document-text" size={16} color={filter === 'subtasks' ? '#fff' : '#6b7280'} />
                                <Text style={[styles.filterText, filter === 'subtasks' && styles.filterTextActive]}>
                                    CV nhỏ ({pendingSubtasks.length})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTab === 'join' && (
                        <View style={styles.filterRow}>
                            <TouchableOpacity
                                style={[styles.filterChip, joinFilter === 'all' && styles.filterTabActive]}
                                onPress={() => setJoinFilter('all')}
                            >
                                <Ionicons name="list" size={16} color={joinFilter === 'all' ? '#fff' : '#6b7280'} />
                                <Text style={[styles.filterText, joinFilter === 'all' && styles.filterTextActive]}>
                                    Tất cả ({joinRequests.length})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, joinFilter === 'tasks' && styles.filterTabActive]}
                                onPress={() => setJoinFilter('tasks')}
                            >
                                <Ionicons name="briefcase" size={16} color={joinFilter === 'tasks' ? '#fff' : '#6b7280'} />
                                <Text style={[styles.filterText, joinFilter === 'tasks' && styles.filterTextActive]}>CV chính</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, joinFilter === 'subtasks' && styles.filterTabActive]}
                                onPress={() => setJoinFilter('subtasks')}
                            >
                                <Ionicons name="document-text" size={16} color={joinFilter === 'subtasks' ? '#fff' : '#6b7280'} />
                                <Text style={[styles.filterText, joinFilter === 'subtasks' && styles.filterTextActive]}>CV nhỏ</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTab === 'history' && (
                        <View style={styles.filterRow}>
                            <TouchableOpacity
                                style={[styles.filterChip, historyFilter === 'all' && styles.filterTabActive]}
                                onPress={() => setHistoryFilter('all')}
                            >
                                <Ionicons name="list" size={16} color={historyFilter === 'all' ? '#fff' : '#6b7280'} />
                                <Text style={[styles.filterText, historyFilter === 'all' && styles.filterTextActive]}>
                                    Tất cả ({approvedHistory.length})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, historyFilter === 'approved' && styles.filterTabActive]}
                                onPress={() => setHistoryFilter('approved')}
                            >
                                <Ionicons name="checkmark-done" size={16} color={historyFilter === 'approved' ? '#fff' : '#6b7280'} />
                                <Text style={[styles.filterText, historyFilter === 'approved' && styles.filterTextActive]}>Phê duyệt</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, historyFilter === 'requested' && styles.filterTabActive]}
                                onPress={() => setHistoryFilter('requested')}
                            >
                                <Ionicons name="chatbox-ellipses" size={16} color={historyFilter === 'requested' ? '#fff' : '#6b7280'} />
                                <Text style={[styles.filterText, historyFilter === 'requested' && styles.filterTextActive]}>Yêu cầu</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Approvals List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#f59e0b']}
                        tintColor="#f59e0b"
                    />
                }
            >
                {loading || loadingHistory ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#f59e0b" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </View>
                ) : (
                    <>
                        {/* Completion Tab - Tasks and Subtasks */}
                        {activeTab === 'completion' && (
                            <>
                                {totalCount === 0 ? (
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
                                                            <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />
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
                                                        <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                                                            <Ionicons name="list" size={24} color="#f59e0b" />
                                                        </View>
                                                        <View style={styles.cardHeaderInfo}>
                                                            <Text style={styles.cardTitle} numberOfLines={1}>
                                                                {subtask.tenSubtask}
                                                            </Text>
                                                            <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                                                                <Text style={[styles.badgeText, { color: '#f59e0b' }]}>
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
                            </>
                        )}

                        {/* Join Requests Tab */}
                        {activeTab === 'join' && (
                            <>
                                {joinRequests.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="checkmark-done-circle-outline" size={64} color="#d1d5db" />
                                        <Text style={styles.emptyTitle}>Không có yêu cầu nhận việc</Text>
                                        <Text style={styles.emptyText}>
                                            {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Không có yêu cầu nhận việc trong dự án bạn quản lý'}
                                        </Text>
                                    </View>
                                ) : (
                                    filteredJoinRequests.map(req => (
                                        <View key={`req-${req.id}`} style={styles.approvalCard}>
                                            <View style={styles.cardHeader}>
                                                <View style={styles.cardHeaderLeft}>
                                                    <View style={[styles.iconContainer, { backgroundColor: '#eef2ff' }]}>
                                                        <Ionicons name="people" size={24} color="#6366f1" />
                                                    </View>
                                                    <View style={styles.cardHeaderInfo}>
                                                        <Text style={styles.cardTitle} numberOfLines={1}>
                                                            {req.title || 'Yêu cầu nhận việc'}
                                                        </Text>
                                                        <View style={styles.badge}>
                                                            <Text style={styles.badgeText}>Chấp nhận nhận việc</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>

                                            {req.content && (
                                                <Text style={styles.cardDescription} numberOfLines={2}>
                                                    {req.content}
                                                </Text>
                                            )}

                                            <View style={styles.cardInfo}>
                                                <View style={styles.infoRow}>
                                                    <Ionicons name="person" size={16} color="#6b7280" />
                                                    <Text style={styles.infoText}>
                                                        Người yêu cầu: {req.meta?.requesterName || req.meta?.requester?.hoten || 'Không rõ'}
                                                    </Text>
                                                </View>
                                                <View style={styles.infoRow}>
                                                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                                    <Text style={styles.infoText}>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.cardActions}>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.approveButton]}
                                                    onPress={() => acceptJoinRequest(req)}
                                                    disabled={!!processingRequest}
                                                >
                                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                                    <Text style={styles.actionButtonText}>Chấp nhận</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.rejectButton]}
                                                    onPress={() => declineJoinRequest(req)}
                                                    disabled={!!processingRequest}
                                                >
                                                    <Ionicons name="close" size={18} color="#fff" />
                                                    <Text style={styles.actionButtonText}>Từ chối</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <>
                                {filteredHistoryWithStatus.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="checkmark-done-circle-outline" size={64} color="#d1d5db" />
                                        <Text style={styles.emptyTitle}>
                                            {approvedHistory.length === 0 && !searchQuery ? 'Chưa có lịch sử phê duyệt' : 'Không có kết quả'}
                                        </Text>
                                        <Text style={styles.emptyText}>
                                            {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Các công việc đã phê duyệt sẽ hiển thị ở đây'}
                                        </Text>
                                    </View>
                                ) : (
                                    filteredHistoryWithStatus.map((item: any) => {
                                        // Derive a sensible title from multiple potential fields
                                        const title = (
                                            item.tentask ||
                                            item.tenSubtask ||
                                            item.title ||
                                            item.name ||
                                            item.assignmentTitle ||
                                            item.assignment?.title ||
                                            item.task?.tentask ||
                                            item.subtask?.tenSubtask ||
                                            item.notification?.title ||
                                            item.userNotification?.title ||
                                            item.payload?.title ||
                                            item.payload?.data?.title ||
                                            item.meta?.taskTitle ||
                                            item.meta?.subtaskTitle ||
                                            (item.meta?.requestToJoin ? `Yêu cầu nhận việc - ${item.meta?.requesterName || ''}` : '') ||
                                            item.meta?.requesterName ||
                                            item.content ||
                                            item.message ||
                                            ''
                                        ).toString().trim() || 'N/A';

                                        const performer = (
                                            item.nguoiDuocGiao?.hoten ||
                                            item.nguoiThucHien?.hoten ||
                                            item.assignee?.hoten ||
                                            item.assignedTo?.hoten ||
                                            item.meta?.requesterName ||
                                            item.user?.hoten ||
                                            ''
                                        );

                                        const approver = (
                                            item.nguoiDuyet?.hoten ||
                                            item.approvedByName ||
                                            item.meta?.approvedByName ||
                                            ''
                                        );

                                        const status = item.trangThai || item.status || (item.approvedAt ? 'Đã phê duyệt' : '');
                                        const approvedDate = item.approvedAt || item.updatedAt || item.createdAt || null;
                                        return (
                                            <View key={`history-${item.type}-${item.id}`} style={styles.approvalCard}>
                                                <View style={styles.cardHeader}>
                                                    <View style={styles.cardHeaderLeft}>
                                                        <View style={[styles.iconContainer, { backgroundColor: item.type === 'task' ? '#fef3c7' : '#e0e7ff' }]}>
                                                            <Ionicons
                                                                name={item.type === 'task' ? 'briefcase' : item.type === 'subtask' ? 'list' : 'people'}
                                                                size={24}
                                                                color={item.type === 'task' ? '#f59e0b' : '#6366f1'}
                                                            />
                                                        </View>
                                                        <View style={styles.cardHeaderInfo}>
                                                            <Text style={styles.cardTitle} numberOfLines={1}>
                                                                {title}
                                                            </Text>
                                                            <View style={styles.badge}>
                                                                <Text style={styles.badgeText}>
                                                                    {item.type === 'task' ? 'Công việc chính' : item.type === 'subtask' ? 'Công việc nhỏ' : 'Yêu cầu'}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>

                                                {item.mota && (
                                                    <Text style={styles.cardDescription} numberOfLines={2}>
                                                        {item.mota}
                                                    </Text>
                                                )}

                                                <View style={styles.cardInfo}>
                                                    {performer ? (
                                                        <View style={styles.infoRow}>
                                                            <Ionicons name="person" size={16} color="#6b7280" />
                                                            <Text style={styles.infoText}>Người thực hiện: {performer}</Text>
                                                        </View>
                                                    ) : null}

                                                    {approver ? (
                                                        <View style={styles.infoRow}>
                                                            <Ionicons name="person-circle" size={16} color="#6b7280" />
                                                            <Text style={styles.infoText}>Người duyệt: {approver}</Text>
                                                        </View>
                                                    ) : null}

                                                    <View style={styles.infoRow}>
                                                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                                        <Text style={[styles.infoText, { color: '#10b981', fontWeight: '600' }]}>
                                                            {translateStatus(status) || 'Đã phê duyệt'}
                                                        </Text>
                                                    </View>

                                                    {approvedDate && (
                                                        <View style={styles.infoRow}>
                                                            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                                            <Text style={styles.infoText}>{formatDate(approvedDate)}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })
                                )}
                            </>
                        )}
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
                                                    {translateStatus(selectedItem.trangThai) || selectedItem.trangThai || ''}
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

            {/* Debug modal removed */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 22,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.95)',
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
        gap: 8,
    },
    filterWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        marginHorizontal: 0,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eef2f6',
        marginRight: 8,
        marginBottom: 8,
        gap: 6,
    },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eef2f6',
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: '#fff',
        borderColor: 'rgba(0,0,0,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    filterTextActive: {
        color: '#111827',
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
        backgroundColor: '#fef3c7',
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
        backgroundColor: '#fef3c7',
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#f59e0b',
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
        backgroundColor: '#fef3c7',
        borderRadius: 8,
    },
    modalStatusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f59e0b',
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
    tabBtn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.08)'
    },
    tabBtnActive: {
        backgroundColor: '#fff'
    },
    tabText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '600'
    },
    tabTextActive: {
        color: '#111827'
    }
});
