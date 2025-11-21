import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getMyTasks } from '@/src/axios/api';

interface TaskItem {
    id: number;
    tentask: string;
    moTa?: string;
    trangThai: string;
    mucDoUuTien?: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    duan?: { id: number; tenduan?: string };
    nguoiDuocGiao?: { hoten: string; manv?: string };
}

const STATUS_TABS = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Chưa bắt đầu', value: 'Chưa bắt đầu' },
    { label: 'Đang chạy', value: 'Đang chạy' },
    { label: 'Chờ duyệt', value: 'Chờ xác nhận hoàn thành' },
    { label: 'Hoàn thành', value: 'Hoàn thành' }
];

export default function TeamLeadTasksScreen() {
    const router = useRouter();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const loadTasks = async () => {
        setLoading(true);
        setInfoMessage(null);
        try {
            const response = await getMyTasks();
            const records = Array.isArray(response?.tasks)
                ? response.tasks
                : Array.isArray(response?.data?.tasks)
                    ? response.data.tasks
                    : Array.isArray(response)
                        ? response
                        : [];
            const normalized: TaskItem[] = records.map((task: any) => ({
                id: task.id,
                tentask: task.tentask || task.tenTask || task.title || `Công việc #${task.id}`,
                moTa: task.moTa || task.description,
                trangThai: task.trangThai,
                mucDoUuTien: task.mucDoUuTien || task.doUuTien,
                ngayBatDau: task.ngayBatDau,
                ngayKetThuc: task.ngayKetThuc,
                duan: task.duan || (task.project ? { id: task.project.id, tenduan: task.project.tenduan } : undefined),
                nguoiDuocGiao: task.nguoiDuocGiao || task.assignee
            }));
            setTasks(normalized);

            if (normalized.length === 0) {
                setInfoMessage(response?.message || 'Chưa có công việc nào được giao cho bạn');
            }
        } catch (error: any) {
            console.error('Load team lead tasks error:', error);
            const message = error?.message || error?.error || 'Không thể tải danh sách công việc';
            setInfoMessage(typeof message === 'string' ? message : 'Không thể tải danh sách công việc');
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTasks();
        setRefreshing(false);
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = !search || task.tentask.toLowerCase().includes(search.toLowerCase())
                || task.moTa?.toLowerCase().includes(search.toLowerCase())
                || task.duan?.tenduan?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || task.trangThai === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tasks, search, statusFilter]);

    const formatDate = (value?: string) => {
        if (!value) return 'Chưa rõ';
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return 'Chưa rõ';
        return dt.toLocaleDateString('vi-VN');
    };

    const renderTask = ({ item }: { item: TaskItem }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/(teamlead)/task-detail', params: { id: item.id.toString() } })}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor(item.trangThai)}1A` }] }>
                    <Text style={[styles.statusText, { color: statusColor(item.trangThai) }]}>{item.trangThai}</Text>
                </View>
                {item.mucDoUuTien && (
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor(item.mucDoUuTien) }] }>
                        <Text style={styles.priorityText}>{priorityLabel(item.mucDoUuTien)}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.taskTitle}>{item.tentask}</Text>
            {item.moTa && <Text style={styles.taskDescription} numberOfLines={2}>{item.moTa}</Text>}
            {item.duan?.tenduan && (
                <View style={styles.metaRow}>
                    <Ionicons name="folder-open" size={16} color="#7c3aed" />
                    <Text style={styles.metaText}>{item.duan.tenduan}</Text>
                </View>
            )}
            <View style={styles.metaRow}>
                <Ionicons name="calendar" size={16} color="#7c3aed" />
                <Text style={styles.metaText}>
                    {formatDate(item.ngayBatDau)} - {formatDate(item.ngayKetThuc)}
                </Text>
            </View>
            {item.nguoiDuocGiao && (
                <View style={styles.metaRow}>
                    <Ionicons name="person" size={16} color="#7c3aed" />
                    <Text style={styles.metaText}>{item.nguoiDuocGiao.hoten}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Công việc của nhóm</Text>
                <Text style={styles.headerSubtitle}>Theo dõi và quản lý các công việc chính</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm công việc, dự án..."
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

            <View style={styles.tabRow}>
                {STATUS_TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.value}
                        style={[styles.tabButton, statusFilter === tab.value && styles.tabButtonActive]}
                        onPress={() => setStatusFilter(tab.value)}
                    >
                        <Text style={[styles.tabText, statusFilter === tab.value && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                    <Text style={styles.loadingText}>Đang tải công việc...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTasks}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderTask}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="clipboard-outline" size={48} color="#c4b5fd" />
                            <Text style={styles.emptyText}>
                                {infoMessage
                                    ? infoMessage
                                    : statusFilter === 'all'
                                        ? 'Chưa có công việc nào'
                                        : `Không có công việc ở trạng thái "${statusFilter}"`}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

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

const priorityColor = (priority?: string) => {
    if (!priority) return '#e5e7eb';
    const normalized = priority.toLowerCase();
    if (normalized.includes('cao') || normalized === 'high') return '#fee2e2';
    if (normalized.includes('trung') || normalized === 'medium') return '#fef3c7';
    if (normalized.includes('thap') || normalized === 'low') return '#dcfce7';
    return '#e5e7eb';
};

const priorityLabel = (priority?: string) => {
    if (!priority) return 'Ưu tiên';
    const normalized = priority.toLowerCase();
    if (normalized === 'high' || normalized.includes('cao')) return 'Cao';
    if (normalized === 'medium' || normalized.includes('trung')) return 'Trung bình';
    if (normalized === 'low' || normalized.includes('thap')) return 'Thấp';
    return priority;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#ede9fe'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#312e81'
    },
    headerSubtitle: {
        marginTop: 4,
        color: '#6b7280'
    },
    searchContainer: {
        margin: 16,
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
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8
    },
    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: '#ede9fe'
    },
    tabButtonActive: {
        backgroundColor: '#7c3aed'
    },
    tabText: {
        color: '#5b21b6',
        fontWeight: '600'
    },
    tabTextActive: {
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
        paddingBottom: 24
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderColor: '#ede9fe',
        borderWidth: 1,
        padding: 18,
        marginBottom: 16
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600'
    },
    priorityBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '600'
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 12
    },
    taskDescription: {
        color: '#4b5563',
        marginTop: 6,
        lineHeight: 20
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8
    },
    metaText: {
        color: '#4b5563'
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40
    },
    emptyText: {
        marginTop: 12,
        color: '#6b7280'
    }
});
