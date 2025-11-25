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
import { notificationUserAPI } from '../../src/axios/notificationAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../src/config/api';
import { approvalAPI } from '../../src/axios/approvalApi';

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
    const DEBUG_LAYOUT = true; // set false to hide debug borders/logs
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
    const [joinFilterType, setJoinFilterType] = useState<'all' | 'task' | 'subtask'>('all');
    // reuse `filter` state for completion type: 'all' | 'tasks' | 'subtasks'
    const [historyFilterStatus, setHistoryFilterStatus] = useState<'all' | 'approved' | 'request'>('all');
    const [processingRequest, setProcessingRequest] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [approvedHistory, setApprovedHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const loadApprovedHistory = async (limit: number = 100) => {
        setLoadingHistory(true);
        try {
            const res = await approvalAPI.getApprovedHistory(limit);
            const dataWrapper = (res?.data ?? res) ?? {};
            const tasks = Array.isArray(dataWrapper.tasks) ? dataWrapper.tasks : [];
            const subtasks = Array.isArray(dataWrapper.subtasks) ? dataWrapper.subtasks : [];
            const assignments = Array.isArray(dataWrapper.assignments) ? dataWrapper.assignments : [];

            const allItems = [
                ...tasks.map((t: any) => ({ ...t, type: 'task' })),
                ...subtasks.map((s: any) => ({ ...s, type: 'subtask' })),
                ...assignments.map((a: any) => ({ ...a, type: 'assignment' })),
            ];

            setApprovedHistory(allItems);
            const message = res?.message || null;
            if (message) setInfoMessage(message);
        } catch (error: any) {
            console.error('Load approved history error:', error);
            setApprovedHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadJoinRequests = async () => {
        try {
            const res = await notificationUserAPI.getMyNotifications({ limit: 200 });
            console.log('DEBUG ⚙️ notifications raw response:', res);

            const items = Array.isArray(res)
                ? res
                : Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res?.data?.data)
                        ? res.data.data
                        : res?.data || res || [];

            const requests = (items || []).filter((n: any) => {
                const meta = n.userMeta || n.meta || (n.userNotification && n.userNotification.meta);
                return meta && (meta.requestToJoin === true || meta.requestToJoin) && !meta.processed;
            }).map((n: any) => ({
                id: n.id,
                title: n.title,
                content: n.content,
                createdAt: n.createdAt,
                meta: n.userMeta || n.meta || (n.userNotification && n.userNotification.meta),
                isRead: n.isRead || (n.userNotification && n.userNotification.isRead) || false
            }));

            console.log('DEBUG ⚙️ collected join requests:', requests);
            setJoinRequests(requests);
        } catch (error: any) {
            console.error('Load join requests error:', error);
            try {
                const alt = await api.get('/notifications/user', { params: { limit: 200 } });
                console.log('DEBUG ⚙️ alt notifications raw response:', alt?.data ?? alt);
                const altItems = alt?.data?.data ?? alt?.data ?? [];
                const requests = (altItems || []).filter((n: any) => {
                    const meta = n.userMeta || n.meta || (n.userNotification && n.userNotification.meta);
                    return meta && (meta.requestToJoin === true || meta.requestToJoin) && !meta.processed;
                }).map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    content: n.content,
                    createdAt: n.createdAt,
                    meta: n.userMeta || n.meta || (n.userNotification && n.userNotification.meta),
                    isRead: n.isRead || (n.userNotification && n.userNotification.isRead) || false
                }));
                setJoinRequests(requests);
            } catch (altErr: any) {
                console.error('Alt notifications fetch failed:', altErr);
                setJoinRequests([]);
            }
        }
    };

    useEffect(() => {
        if (activeTab === 'completion') {
            loadPendingApprovals();
        } else if (activeTab === 'join') {
            loadJoinRequests();
        } else if (activeTab === 'history') {
            loadApprovedHistory();
        }
    }, [filter, activeTab]);

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
        if (activeTab === 'completion') await loadPendingApprovals();
        if (activeTab === 'join') await loadJoinRequests();
        if (activeTab === 'history') await loadApprovedHistory();
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

    const acceptJoinRequest = async (req: any) => {
        setProcessingRequest(req.id);
        try {
            await api.post('/assignments/request/accept', {
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
            await api.post('/assignments/request/decline', {
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

    const openApprovalModal = (item: any, type: 'task' | 'subtask') => {
        setSelectedItem({ ...item, type });
        setIsModalOpen(true);
        setRejectReason('');
    };

    // Lọc và tìm kiếm
    const filteredTasks = pendingTasks.filter(task => {
        const matchesSearch = task.tentask.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.nguoiDuocGiao.hoten.toLowerCase().includes(searchQuery.toLowerCase());

        // (no status filter for completion; only type + search)

        // type filter via `filter` state: 'all' | 'tasks' | 'subtasks'
        if (filter === 'tasks' || filter === 'all') {
            return matchesSearch;
        }
        return false;
    });

    const filteredSubtasks = pendingSubtasks.filter(subtask => {
        const matchesSearch = subtask.tenSubtask.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subtask.nguoiThucHien.hoten.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subtask.task.tentask.toLowerCase().includes(searchQuery.toLowerCase());

        // (no status filter for completion; only type + search)

        if (filter === 'subtasks' || filter === 'all') {
            return matchesSearch;
        }
        return false;
    });

    const filteredHistory = approvedHistory.filter((item: any) => {
        // no type filter for history — only status (Tất cả / Phê duyệt / Yêu cầu)
        const type = item.type || (item.meta?.requestToJoin ? 'assignment' : 'task');

        // status filter
        const statusRaw = (item.trangThai || item.status || '').toString().toLowerCase();
        if (historyFilterStatus === 'approved') {
            if (!(statusRaw.includes('accept') || statusRaw.includes('approved') || item.approvedAt)) return false;
        }
        if (historyFilterStatus === 'request') {
            const isRequest = !!(item.meta?.requestToJoin || item.type === 'assignment' || item.meta?.requestToJoin);
            if (!isRequest) return false;
        }

        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const title = (item.tentask || item.tenSubtask || item.title || item.name || '').toString().toLowerCase();
        const performer = (item.nguoiDuocGiao?.hoten || item.nguoiThucHien?.hoten || item.meta?.requesterName || item.user?.hoten || '').toString().toLowerCase();
        const status = statusRaw;
        return title.includes(q) || performer.includes(q) || status.includes(q);
    });

    const completionCount = filteredTasks.length + filteredSubtasks.length;
    const joinCount = joinRequests.length;
    const historyCount = approvedHistory.length;
    const totalCount = completionCount + joinCount;
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

    // Filtered join requests (by status, type, and search)
    const filteredJoinRequests = joinRequests.filter((req: any) => {
        // type filter
        const meta = req.meta || {};
        const isTask = !!(meta.taskId && !meta.subtaskId);
        const isSubtask = !!meta.subtaskId;
        if (joinFilterType === 'task' && !isTask) return false;
        if (joinFilterType === 'subtask' && !isSubtask) return false;

        // search filter
        if (!searchQuery) return true;
        const s = searchQuery.toLowerCase();
        return (
            (req.title || '').toString().toLowerCase().includes(s) ||
            (req.content || '').toString().toLowerCase().includes(s) ||
            (meta.requesterName || '').toString().toLowerCase().includes(s) ||
            (meta.requester?.hoten || '').toString().toLowerCase().includes(s)
        );
    });

    const translateStatus = (s?: string) => {
        if (!s) return '';
        const st = s.toString().toLowerCase();
        if (st === 'accepted' || st === 'approve' || st === 'approved' || st === 'đã phê duyệt') return 'Đã phê duyệt';
        if (st === 'rejected' || st === 'declined' || st === 'từ chối' || st === 'rejected') return 'Đã từ chối';
        if (st === 'pending' || st === 'pending_approval' || st === 'đang chờ') return 'Đang chờ';
        if (st === 'in_progress' || st === 'doing' || st === 'đang thực hiện') return 'Đang thực hiện';
        return s;
    };

    const logLayout = (name: string, e: any) => {
        if (!DEBUG_LAYOUT) return;
        try {
            const { width, height, x, y } = e.nativeEvent.layout;
            console.log(`LAYOUT ${name}: w=${width} h=${height} x=${x} y=${y}`);
        } catch (err) {
            console.log('layout log error', err);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View
                style={[styles.header, DEBUG_LAYOUT ? styles.debugHeaderBorder : null]}
                onLayout={(e) => logLayout('header', e)}
            >
                <Text style={styles.title}>Quản lý phê duyệt</Text>
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
            </View>

            {/* Search Bar (visible for all tabs) */}
            <View
                style={[styles.searchContainer, DEBUG_LAYOUT ? styles.debugSearchBorder : null]}
                onLayout={(e) => logLayout('searchContainer', e)}
            >
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

            {/* Filters for tabs: completion, join, history (shared design) */}

            {/* Completion Filters */}
            {activeTab === 'completion' && (
                <View style={styles.filterWrapper} onLayout={(e) => logLayout('completionFilters', e)}>
                    <View style={styles.filterRow}>
                        {/* Only type filters for completion (Tất cả / Công việc / Công việc nhỏ) */}

                        {/* type filters use `filter` state */}
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                            onPress={() => setFilter('all')}
                        >
                            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tất cả</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'tasks' && styles.filterTabActive]}
                            onPress={() => setFilter('tasks')}
                        >
                            <Text style={[styles.filterText, filter === 'tasks' && styles.filterTextActive]}>Công việc lớn</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'subtasks' && styles.filterTabActive]}
                            onPress={() => setFilter('subtasks')}
                        >
                            <Text style={[styles.filterText, filter === 'subtasks' && styles.filterTextActive]}>Công việc nhỏ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}


            {/* Join Requests Filters */}
            {activeTab === 'join' && (
                <View style={styles.filterWrapper} onLayout={(e) => logLayout('joinFilters', e)}>
                    <View style={styles.filterRow}>
                        {/* Only type filters for join requests (Tất cả loại / Công việc / Công việc nhỏ) */}

                        {/* type filters */}
                        <TouchableOpacity
                            style={[styles.filterTab, joinFilterType === 'all' && styles.filterTabActive]}
                            onPress={() => setJoinFilterType('all')}
                        >
                            <Text style={[styles.filterText, joinFilterType === 'all' && styles.filterTextActive]}>Tất cả</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, joinFilterType === 'task' && styles.filterTabActive]}
                            onPress={() => setJoinFilterType('task')}
                        >
                            <Text style={[styles.filterText, joinFilterType === 'task' && styles.filterTextActive]}>Công việc lớn</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, joinFilterType === 'subtask' && styles.filterTabActive]}
                            onPress={() => setJoinFilterType('subtask')}
                        >
                            <Text style={[styles.filterText, joinFilterType === 'subtask' && styles.filterTextActive]}>Công việc nhỏ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* History Filters */}
            {activeTab === 'history' && (
                <View style={styles.filterWrapper} onLayout={(e) => logLayout('historyFilters', e)}>
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.filterTab, historyFilterStatus === 'all' && styles.filterTabActive]}
                            onPress={() => setHistoryFilterStatus('all')}
                        >
                            <Text style={[styles.filterText, historyFilterStatus === 'all' && styles.filterTextActive]}>Tất cả</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, historyFilterStatus === 'approved' && styles.filterTabActive]}
                            onPress={() => setHistoryFilterStatus('approved')}
                        >
                            <Text style={[styles.filterText, historyFilterStatus === 'approved' && styles.filterTextActive]}>Phê duyệt</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, historyFilterStatus === 'request' && styles.filterTabActive]}
                            onPress={() => setHistoryFilterStatus('request')}
                        >
                            <Text style={[styles.filterText, historyFilterStatus === 'request' && styles.filterTextActive]}>Yêu cầu</Text>
                        </TouchableOpacity>

                        {/* history only needs status filters (Tất cả / Phê duyệt / Yêu cầu) */}
                    </View>
                </View>
            )}

            {/* Approvals List */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.listContent}
                onLayout={(e) => logLayout('listScroll', e)}
                // add debug border to visualize space
                contentInset={{ top: 0 }}
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

                        {/* Join Requests Tab */}
                        {activeTab === 'join' && (
                            <>
                                {joinRequests.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="checkmark-done-circle-outline" size={64} color="#d1d5db" />
                                        <Text style={styles.emptyTitle}>Không có yêu cầu nhận việc</Text>
                                        <Text style={styles.emptyText}>
                                            {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Không có yêu cầu nhận việc'}
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
                                        {filteredHistory.length === 0 ? (
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
                                            filteredHistory.map((item: any) => {
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
        backgroundColor: '#f6faf9',
    },
    header: {
        backgroundColor: '#14b8a6',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        shadowColor: '#0f766e',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.95)',
    },
    searchFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: -12,
        marginBottom: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e6f6f4',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 6,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#0f172a',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 2,
        paddingBottom: 2,
        backgroundColor: 'transparent',
        marginHorizontal: 16,
        marginTop: 0,
        zIndex: 20,
        elevation: 20,
    },
    filterTab: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eef2f1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    filterTabActive: {
        backgroundColor: '#0ea5e9',
        borderColor: '#0ea5e9',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
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
        paddingTop: 8,
        paddingBottom: 12,
    },

    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 4,
        paddingTop: 8,
        overflow: 'visible',
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
        fontWeight: '700',
        color: '#374151',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
        textAlign: 'center',
    },
    approvalCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#eef6f5',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 14,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#e0f2fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cardHeaderInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 6,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#e0f2fe',
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0369a1',
    },
    parentTask: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f6fbfb',
        borderRadius: 10,
    },
    parentTaskLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginRight: 8,
    },
    parentTaskName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    cardDescription: {
        fontSize: 14,
        color: '#475569',
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
        color: '#475569',
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e6eef0',
        backgroundColor: '#fff',
        gap: 8,
    },
    detailButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    approveButton: {
        backgroundColor: '#10b981',
    },
    rejectButton: {
        backgroundColor: '#ef4444',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '700',
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
        borderBottomColor: '#eef2f1',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
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
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    modalDescription: {
        fontSize: 14,
        color: '#475569',
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
        color: '#0f172a',
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
        fontWeight: '700',
        color: '#f97316',
    },
    rejectReasonInput: {
        borderWidth: 1,
        borderColor: '#e6eef0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#0f172a',
        minHeight: 80,
        textAlignVertical: 'top',
        backgroundColor: '#fbfefe',
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
        fontWeight: '700',
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
    filterWrapper: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 6,
        zIndex: 20,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    debugHeaderBorder: {
        borderWidth: 1,
        borderColor: 'rgba(255,0,0,0.6)'
    },
    debugSearchBorder: {
        borderWidth: 1,
        borderColor: 'rgba(0,128,255,0.6)'
    },
    debugFilterBorder: {
        borderWidth: 1,
        borderColor: 'rgba(0,200,0,0.6)'
    },
    debugListBorder: {
        borderWidth: 1,
        borderColor: 'rgba(255,165,0,0.6)'
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
