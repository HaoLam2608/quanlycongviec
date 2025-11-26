import { approvalAPI } from '@/src/axios/approvalApi';
import api from '@/src/axios/config';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

type ApprovalKind = 'task' | 'subtask' | 'assignment';

interface ApprovalItem {
    key: string;
    kind: ApprovalKind;
    entityId: number;
    taskId: number;
    status: string;
    requestDate?: string;
    responseDate?: string;
    comments?: string;
    title: string;
    description?: string;
    projectName?: string;
    requester?: {
        id?: number;
        hoten?: string;
        manv?: string;
    };
    raw?: any;
}

const PENDING_STATUS_KEYWORDS = ['chờ', 'pending'];

const getStatusStyle = (status?: string) => {
    if (!status) {
        return { color: '#6b7280', label: 'Không rõ' };
    }

    const normalized = status.toLowerCase();
    if (normalized.includes('từ chối') || normalized.includes('reject')) {
        return { color: '#ef4444', label: status };
    }
    if (normalized.includes('hoàn thành') || normalized.includes('approved')) {
        return { color: '#10b981', label: status };
    }
    // Translate accepted/accept to Vietnamese for clarity in UI
    if (normalized.includes('accept') || normalized.includes('accepted')) {
        return { color: '#10b981', label: 'Đã chấp nhận' };
    }
    if (PENDING_STATUS_KEYWORDS.some(keyword => normalized.includes(keyword))) {
        return { color: '#f59e0b', label: status };
    }
    return { color: '#6366f1', label: status };
};

const isPendingStatus = (status?: string) => {
    if (!status) return false;
    const normalized = status.toLowerCase();
    return PENDING_STATUS_KEYWORDS.some(keyword => normalized.includes(keyword));
};

const formatDate = (value?: string) => {
    if (!value) return undefined;
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return undefined;
    return dt.toLocaleDateString('vi-VN');
};

const normalizeApprovalsResponse = (payload: any): ApprovalItem[] => {
    if (!payload) return [];

    const approvalsArray = Array.isArray(payload?.approvals) ? payload.approvals : undefined;
    if (approvalsArray) {
        const mapped = approvalsArray.map((item: any, index: number) => {
            const status = item?.status || item?.trangThai;
            return {
                key: `approval-${item?.id ?? index}`,
                kind: (item?.type === 'subtask' || item?.kind === 'subtask') ? 'subtask' : (item?.type === 'assignment' ? 'assignment' : 'task'),
                entityId: item?.id ?? index,
                taskId: item?.taskId ?? item?.task?.id ?? item?.id ?? index,
                status,
                requestDate: item?.requestDate || item?.createdAt,
                responseDate: item?.responseDate || item?.approvedAt || item?.rejectedAt,
                comments: item?.comments || item?.approvalNote,
                title: item?.task?.tieude || item?.task?.tenSubtask || item?.task?.tentask || item?.title || `Yêu cầu #${item?.id ?? index}`,
                description: item?.task?.mota || item?.description,
                projectName: item?.task?.project?.tenduan || item?.task?.duan?.tenduan,
                requester: item?.requester || item?.nguoiThucHien || item?.nguoiDuocGiao,
                raw: item
            } satisfies ApprovalItem;
        });
        // Return all mapped approvals for flexibility (tasks/subtasks/assignments)
        return mapped;
    }

    const container = payload?.data ?? payload;
    const items: ApprovalItem[] = [];

    // Tasks (approved history)
    const tasks = Array.isArray(container?.tasks) ? container.tasks : [];
    tasks.forEach((task: any) => {
        const status = task?.trangThai || task?.status;
        items.push({
            key: `task-${task?.id}`,
            kind: 'task',
            entityId: task?.id,
            taskId: task?.id,
            status,
            requestDate: task?.requestedCompletionAt || task?.updatedAt || task?.createdAt,
            responseDate: task?.approvedAt || task?.rejectedAt,
            comments: task?.approvalNote || task?.rejectionReason || task?.ghiChu,
            title: task?.tentask || task?.title || `Công việc #${task?.id}`,
            description: task?.mota,
            projectName: task?.duan?.tenduan || task?.project?.tenduan,
            requester: task?.nguoiDuocGiao ? { id: task.nguoiDuocGiao.id, hoten: task.nguoiDuocGiao.hoten, manv: task.nguoiDuocGiao.manv } : undefined,
            raw: task
        });
    });

    // Subtasks
    const subtasks = Array.isArray(container?.subtasks) ? container.subtasks : [];
    subtasks.forEach((subtask: any) => {
        const status = subtask?.trangThai;
        items.push({
            key: `subtask-${subtask?.id}`,
            kind: 'subtask',
            entityId: subtask?.id,
            taskId: subtask?.taskId ?? subtask?.task?.id,
            status,
            requestDate: subtask?.requestedCompletionAt || subtask?.updatedAt || subtask?.createdAt,
            responseDate: subtask?.approvedAt || subtask?.rejectedAt,
            comments: subtask?.approvalNote || subtask?.rejectionReason || subtask?.ghiChu,
            title: subtask?.tenSubtask || subtask?.title || `Công việc con #${subtask?.id}`,
            description: subtask?.mota,
            projectName: subtask?.task?.duan?.tenduan || subtask?.task?.tentask,
            requester: subtask?.nguoiThucHien ? { id: subtask.nguoiThucHien.id, hoten: subtask.nguoiThucHien.hoten, manv: subtask.nguoiThucHien.manv } : undefined,
            raw: subtask
        });
    });

    // Assignments (optional)
    const assignments = Array.isArray(container?.assignments) ? container.assignments : [];
    assignments.forEach((a: any) => {
        items.push({
            key: `assignment-${a?.id}`,
            kind: 'assignment',
            entityId: a?.id,
            taskId: a?.taskId ?? a?.subtaskId ?? a?.id,
            status: a?.status || a?.trangThai,
            requestDate: a?.createdAt,
            responseDate: a?.acceptedAt || a?.approvedAt,
            comments: a?.note || a?.reason || undefined,
            title: a?.title || (a.subtask ? a.subtask.tenSubtask : a.task?.tentask) || `Assignment #${a?.id}`,
            description: a?.content || undefined,
            projectName: a?.task?.duan?.tenduan || undefined,
            requester: a?.assignee || a?.requester || undefined,
            raw: a
        });
    });

    return items;
};

export default function TeamLeadApprovalsScreen() {
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState<'subtasks' | 'tasks' | 'history'>('subtasks');
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [joinRequests, setJoinRequests] = useState<any[]>([]);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

    const loadApprovals = useCallback(async () => {
        // Skip loading approvals if on "Chấp nhận nhận việc" tab
        if (filterMode === 'tasks') {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let payload: any = null;
            let serverMessage: string | null = null;

            if (filterMode === 'history') {
                // approvalAPI.getApprovedHistory returns history data
                const data = await approvalAPI.getApprovedHistory(100);
                payload = data?.data ?? data ?? {};
                serverMessage = data?.message || null;
            } else {
                // Call api directly so we can read res.data.message like web frontend
                const res = await api.get('/approvals/pending', {
                    params: { type: 'subtasks' }
                });
                // web returns { success: true, data: { subtasks: [...] }, message }
                payload = res.data?.data ?? res.data ?? {};
                serverMessage = res.data?.message || null;
            }

            setApprovals(normalizeApprovalsResponse(payload));
            setInfoMessage(serverMessage);
        } catch (error: any) {
            console.error('Load approvals error:', error);
            const errMsg = (error && (error.message || error?.response?.data?.message || JSON.stringify(error))) || 'Lỗi khi tải danh sách phê duyệt';
            try { Alert.alert('Lỗi tải phê duyệt', String(errMsg)); } catch (e) { console.warn('Unable to show alert for approval error', e); }
            setApprovals([]);
            setInfoMessage(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterMode]);

    useEffect(() => {
        console.log('🟡 TEAMLEAD useEffect triggered, filterMode:', filterMode);
        if (filterMode === 'tasks') {
            // Load join requests only for "Chấp nhận nhận việc" tab
            console.log('🟡 TEAMLEAD Loading join requests...');
            loadJoinRequests();
        } else {
            // Load approvals for other tabs
            console.log('🟡 TEAMLEAD Loading approvals...');
            loadApprovals();
        }
    }, [filterMode, loadApprovals]);

    const loadJoinRequests = async () => {
        try {
            console.log('🔵 TEAMLEAD loadJoinRequests called');
            const res = await approvalAPI.getMyJoinRequests();
            console.log('🔵 TEAMLEAD getMyJoinRequests response:', JSON.stringify(res, null, 2));
            const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            console.log('🔵 TEAMLEAD raw data:', raw);
            const requests = raw.map((n: any) => ({
                id: String(n.id),
                title: n.title,
                content: n.content,
                createdAt: n.createdAt,
                isRead: n.isRead || (n.userNotification && n.userNotification.isRead) || false,
                meta: n.userMeta || n.meta || (n.userNotification && n.userNotification.meta)
            }));
            console.log('🔵 TEAMLEAD mapped requests count:', requests.length);
            setJoinRequests(requests);
        } catch (error: any) {
            console.error('❌ TEAMLEAD Load join requests error:', error);
            console.error('❌ TEAMLEAD Error response:', error?.response?.data);
            setJoinRequests([]);
        }
    };

    const acceptJoinRequest = async (request: any) => {
        setProcessingRequestId(request.id);
        try {
            await approvalAPI.acceptRequestToJoin({
                taskId: request.meta.taskId || null,
                subtaskId: request.meta.subtaskId || null,
                requesterId: request.meta.requesterId
            });
            Alert.alert('Thành công', 'Đã chấp nhận yêu cầu nhận việc');
            loadJoinRequests();
            loadApprovals();
        } catch (error: any) {
            console.error('Accept request error:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || error?.message || 'Không thể chấp nhận yêu cầu');
        } finally {
            setProcessingRequestId(null);
        }
    };

    const declineJoinRequest = async (request: any) => {
        setProcessingRequestId(request.id);
        try {
            await approvalAPI.declineRequestToJoin({
                taskId: request.meta.taskId || null,
                subtaskId: request.meta.subtaskId || null,
                requesterId: request.meta.requesterId,
                reason: 'Từ chối'
            });
            Alert.alert('Thành công', 'Đã từ chối yêu cầu nhận việc');
            loadJoinRequests();
        } catch (error: any) {
            console.error('Decline request error:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || error?.message || 'Không thể từ chối yêu cầu');
        } finally {
            setProcessingRequestId(null);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        if (filterMode === 'tasks') {
            loadJoinRequests().then(() => setRefreshing(false));
        } else {
            loadApprovals();
        }
    }, [filterMode, loadApprovals]);

    const submitDecision = async (item: ApprovalItem, approved: boolean, reason?: string) => {
        try {
            if (item.kind === 'task') {
                await approvalAPI.approveTask(item.entityId, approved, reason);
            } else {
                await approvalAPI.approveSubtask(item.entityId, approved, reason);
            }
            const message = approved ? 'Đã phê duyệt yêu cầu' : 'Đã từ chối yêu cầu';
            Alert.alert('Thành công', message);
            loadApprovals();
        } catch (error: any) {
            Alert.alert('Lỗi', error?.message || error?.response?.data?.message || 'Thao tác không thành công');
        }
    };

    const handleApprove = (item: ApprovalItem) => {
        Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn phê duyệt yêu cầu này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Phê duyệt',
                    onPress: () => submitDecision(item, true)
                }
            ]
        );
    };

    const handleReject = (item: ApprovalItem) => {
        const confirmReject = (reason?: string) => {
            submitDecision(item, false, reason || 'Từ chối');
        };

        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Từ chối yêu cầu',
                'Vui lòng nhập lý do từ chối:',
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Từ chối',
                        onPress: confirmReject
                    }
                ],
                'plain-text'
            );
            return;
        }

        Alert.alert(
            'Từ chối yêu cầu',
            'Bạn có chắc chắn muốn từ chối yêu cầu này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Từ chối',
                    onPress: () => confirmReject('Từ chối')
                }
            ]
        );
    };

    const filteredApprovals = useMemo(() => {
        const searchLower = search.trim().toLowerCase();
        return approvals.filter(item => {
            // If not history view, show only pending statuses
            if (filterMode !== 'history' && !isPendingStatus(item.status)) return false;

            if (!searchLower) return true;

            const haystacks = [
                item.title?.toLowerCase() || '',
                item.description?.toLowerCase() || '',
                item.requester?.hoten?.toLowerCase() || '',
                item.requester?.manv?.toLowerCase() || '',
                item.projectName?.toLowerCase() || ''
            ];

            return haystacks.some(text => text.includes(searchLower));
        });
    }, [approvals, search, filterMode]);

    const renderApproval = ({ item }: { item: ApprovalItem }) => {
        const statusInfo = getStatusStyle(item.status);
        const pending = isPendingStatus(item.status);
        const requestDateLabel = formatDate(item.requestDate);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.taskTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                        <Text style={styles.statusText}>{statusInfo.label}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name={item.kind === 'task' ? 'briefcase' : 'git-branch'} size={16} color="#7c3aed" />
                    <Text style={styles.infoText}>
                        {item.kind === 'task' ? 'Công việc' : 'Công việc con'}
                    </Text>
                </View>

                {item.projectName && (
                    <View style={styles.infoRow}>
                        <Ionicons name="folder-open" size={16} color="#7c3aed" />
                        <Text style={styles.infoText}>{item.projectName}</Text>
                    </View>
                )}

                {item.description && (
                    <Text style={styles.taskDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}

                <View style={styles.infoRow}>
                    <Ionicons name="person" size={16} color="#6b7280" />
                    <Text style={styles.infoText}>
                        {item.requester?.hoten || 'Không rõ'} ({item.requester?.manv || 'N/A'})
                    </Text>
                </View>

                {requestDateLabel && (
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={16} color="#6b7280" />
                        <Text style={styles.infoText}>{requestDateLabel}</Text>
                    </View>
                )}

                {item.comments && (
                    <View style={styles.commentsBox}>
                        <Text style={styles.commentsLabel}>Ghi chú:</Text>
                        <Text style={styles.commentsText}>{item.comments}</Text>
                    </View>
                )}

                {pending && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleApprove(item)}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Phê duyệt</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleReject(item)}
                        >
                            <Ionicons name="close-circle" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Từ chối</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Phê duyệt công việc</Text>
                <Text style={styles.headerSubtitle}>Quản lý yêu cầu phê duyệt</Text>
                {infoMessage ? (
                    <Text style={styles.infoMessage} numberOfLines={2}>{infoMessage}</Text>
                ) : null}
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm công việc, người yêu cầu..."
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

            {/* Filter chips: Phê duyệt hoàn thành / Chấp nhận nhận việc / Lịch sử */}
            <View style={styles.filterWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity style={[styles.chip, filterMode === 'subtasks' && styles.chipActive]} onPress={() => setFilterMode('subtasks')}>
                        <Text style={[styles.chipText, filterMode === 'subtasks' && styles.chipTextActive]}>Phê duyệt hoàn thành</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.chip, filterMode === 'tasks' && styles.chipActive]} onPress={() => setFilterMode('tasks')}>
                        <Text style={[styles.chipText, filterMode === 'tasks' && styles.chipTextActive]}>Chấp nhận nhận việc</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.chip, filterMode === 'history' && styles.chipActive]} onPress={() => setFilterMode('history')}>
                        <Text style={[styles.chipText, filterMode === 'history' && styles.chipTextActive]}>Lịch sử</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : (
                filterMode === 'tasks' ? (
                    // Show join requests (yêu cầu nhận việc)
                    <FlatList
                        data={joinRequests}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => { setRefreshing(true); loadJoinRequests().then(() => setRefreshing(false)); }}
                                colors={['#7c3aed']}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-done-circle-outline" size={64} color="#c4b5fd" />
                                <Text style={styles.emptyText}>{joinRequests.length === 0 ? 'Không có yêu cầu nhận việc' : ''}</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.taskTitle}>{item.title}</Text>
                                </View>
                                <Text style={{ color: '#6b7280', marginBottom: 8 }}>{item.content}</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                    <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => acceptJoinRequest(item)} disabled={processingRequestId === item.id}>
                                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}>Chấp nhận</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => declineJoinRequest(item)} disabled={processingRequestId === item.id}>
                                        <Ionicons name="close-circle" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}>Từ chối</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                ) : (
                    <FlatList
                        data={filteredApprovals}
                        keyExtractor={item => item.key}
                        renderItem={renderApproval}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#7c3aed']}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-done-circle-outline" size={64} color="#c4b5fd" />
                                <Text style={styles.emptyText}>{infoMessage || 'Không có công việc cần phê duyệt'}</Text>
                            </View>
                        }
                    />
                )
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
        paddingTop: 18
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#312e81'
    },
    headerSubtitle: {
        marginTop: 4,
        fontSize: 14,
        color: '#6b7280'
    },
    infoMessage: {
        marginTop: 8,
        fontSize: 13,
        color: '#b45309'
    },
    searchContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
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
    filterWrap: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'transparent'
    },
    filterScroll: {
        paddingLeft: 4,
        paddingRight: 12,
        alignItems: 'center'
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: '#f3f4f6',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1
    },
    chipActive: {
        backgroundColor: '#7c3aed',
        borderColor: '#6d28d9'
    },
    chipText: {
        color: '#4b5563',
        fontWeight: '600'
    },
    chipTextActive: {
        color: '#fff'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280'
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 32
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe',
        padding: 18,
        marginBottom: 16
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 8
    },
    taskTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937'
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff'
    },
    taskDescription: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 12,
        lineHeight: 20
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6
    },
    infoText: {
        fontSize: 13,
        color: '#6b7280'
    },
    commentsBox: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    commentsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 4
    },
    commentsText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 18
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12
    },
    approveButton: {
        backgroundColor: '#10b981'
    },
    rejectButton: {
        backgroundColor: '#ef4444'
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff'
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 48
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280'
    }
});
