import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { approvalAPI } from '@/src/axios/approvalApi';

type ApprovalKind = 'task' | 'subtask';

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
                kind: (item?.type === 'subtask' || item?.kind === 'subtask') ? 'subtask' : 'task',
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
        return mapped.filter((entry: ApprovalItem) => entry.kind === 'subtask');
    }

    const container = payload?.data ?? payload;
    const subtasks = Array.isArray(container?.subtasks) ? container.subtasks : [];

    const items: ApprovalItem[] = [];

    subtasks.forEach((subtask: any) => {
        const status = subtask?.trangThai;
        items.push({
            key: `subtask-${subtask?.id}`,
            kind: 'subtask',
            entityId: subtask?.id,
            taskId: subtask?.taskId,
            status,
            requestDate: subtask?.requestedCompletionAt || subtask?.updatedAt || subtask?.createdAt,
            responseDate: subtask?.approvedAt || subtask?.rejectedAt,
            comments: subtask?.approvalNote || subtask?.rejectionReason || subtask?.ghiChu,
            title: subtask?.tenSubtask || subtask?.title || `Công việc con #${subtask?.id}`,
            description: subtask?.mota,
            projectName: subtask?.task?.duan?.tenduan || subtask?.task?.tentask,
            requester: subtask?.nguoiThucHien ? {
                id: subtask?.nguoiThucHien?.id,
                hoten: subtask?.nguoiThucHien?.hoten,
                manv: subtask?.nguoiThucHien?.manv
            } : undefined,
            raw: subtask
        });
    });

    return items.filter((entry: ApprovalItem) => entry.kind === 'subtask');
};

export default function TeamLeadApprovalsScreen() {
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const loadApprovals = useCallback(async () => {
        setLoading(true);
        try {
            const data = await approvalAPI.getPendingApprovals({ type: 'subtasks' });

            setApprovals(normalizeApprovalsResponse(data));
        } catch (error) {
            console.error('Load approvals error:', error);
            setApprovals([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadApprovals();
    }, [loadApprovals]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadApprovals();
    }, [loadApprovals]);

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
            if (!isPendingStatus(item.status)) return false;

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
    }, [approvals, search]);

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

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
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
                            <Text style={styles.emptyText}>Không có công việc cần phê duyệt</Text>
                        </View>
                    }
                />
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
