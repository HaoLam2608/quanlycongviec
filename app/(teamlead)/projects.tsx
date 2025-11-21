import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getMyProjects } from '@/src/axios/api';

interface ProjectItem {
    groupId: number;
    groupName: string;
    groupStatus?: string;
    status: 'active' | 'completed';
    project: {
        id: number;
        tenduan: string;
        mota?: string;
        ngaybatdau?: string;
        ngayketthuc?: string;
        status?: string;
        nguoiDamNhan?: {
            id: number;
            hoten: string;
            manv?: string;
            email?: string;
        } | null;
    };
}

const mapParticipationStatus = (rawStatus?: string) => {
    if (!rawStatus) return 'active';
    if (rawStatus === 'completed' || rawStatus === 'hoan_thanh') return 'completed';
    return 'active';
};

export default function TeamLeadProjectsScreen() {
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

    const loadProjects = async () => {
        setLoading(true);
        try {
            const data = await getMyProjects();
            const normalized: ProjectItem[] = (data || []).map((item: any) => ({
                groupId: item?.Group?.id || item?.groupId,
                groupName: item?.Group?.name || item?.groupName || 'Nhóm chưa rõ',
                groupStatus: item?.Group?.status,
                status: mapParticipationStatus(item?.status),
                project: {
                    id: item?.project?.id || item?.duanId || item?.id,
                    tenduan: item?.project?.tenduan || item?.project?.name || item?.tenduan || 'Dự án',
                    mota: item?.project?.mota || item?.projectDescription,
                    ngaybatdau: item?.project?.ngaybatdau,
                    ngayketthuc: item?.project?.ngayketthuc,
                    status: item?.project?.status,
                    nguoiDamNhan: item?.project?.nguoiDamNhan || null
                }
            }));
            setProjects(normalized);
        } catch (error) {
            console.error('Load team lead projects error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProjects();
        setRefreshing(false);
    };

    const filteredProjects = useMemo(
        () => projects.filter(project => project.status === activeTab),
        [projects, activeTab]
    );

    const formatDate = (date?: string) => {
        if (!date) return 'Chưa rõ';
        const dt = new Date(date);
        if (Number.isNaN(dt.getTime())) return 'Chưa rõ';
        return dt.toLocaleDateString('vi-VN');
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="folder-open" size={48} color="#c4b5fd" />
            <Text style={styles.emptyTitle}>
                {activeTab === 'active' ? 'Chưa có dự án đang tham gia' : 'Chưa có dự án đã hoàn thành'}
            </Text>
            <Text style={styles.emptyText}>Các dự án tham gia sẽ hiển thị tại đây</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Dự án của nhóm</Text>
                    <Text style={styles.headerSubtitle}>Theo dõi các dự án mà nhóm đang tham gia</Text>
                </View>

                <View style={styles.statRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="briefcase" size={20} color="#7c3aed" />
                        <Text style={styles.statValue}>{projects.length}</Text>
                        <Text style={styles.statLabel}>Tổng dự án</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="time" size={20} color="#22d3ee" />
                        <Text style={styles.statValue}>{projects.filter(p => p.status === 'active').length}</Text>
                        <Text style={styles.statLabel}>Đang tham gia</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                        <Text style={styles.statValue}>{projects.filter(p => p.status === 'completed').length}</Text>
                        <Text style={styles.statLabel}>Hoàn thành</Text>
                    </View>
                </View>

                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Đang tham gia</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('completed')}
                    >
                        <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>Đã hoàn thành</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#7c3aed" />
                        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                    </View>
                ) : filteredProjects.length === 0 ? (
                    renderEmptyState()
                ) : (
                    filteredProjects.map(item => (
                        <TouchableOpacity
                            key={`${item.groupId}-${item.project.id}`}
                            style={styles.projectCard}
                            onPress={() =>
                                router.push({
                                    pathname: '/(teamlead)/project-detail',
                                    params: {
                                        projectId: item.project.id.toString(),
                                        groupId: item.groupId?.toString() || ''
                                    }
                                })
                            }
                        >
                            <View style={styles.projectHeader}>
                                <Text style={styles.projectTitle} numberOfLines={2}>
                                    {item.project.tenduan}
                                </Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusBadgeText}>
                                        {item.status === 'active' ? 'Đang tham gia' : 'Đã hoàn thành'}
                                    </Text>
                                </View>
                            </View>
                            {item.project.mota && (
                                <Text style={styles.projectDescription} numberOfLines={2}>
                                    {item.project.mota}
                                </Text>
                            )}
                            <View style={styles.metaRow}>
                                <Ionicons name="people" size={16} color="#7c3aed" />
                                <Text style={styles.metaText}>{item.groupName}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Ionicons name="calendar" size={16} color="#7c3aed" />
                                <Text style={styles.metaText}>
                                    {formatDate(item.project.ngaybatdau)} - {formatDate(item.project.ngayketthuc)}
                                </Text>
                            </View>
                            {item.project.nguoiDamNhan && (
                                <View style={styles.metaRow}>
                                    <Ionicons name="person" size={16} color="#7c3aed" />
                                    <Text style={styles.metaText}>
                                        {item.project.nguoiDamNhan.hoten}
                                        {item.project.nguoiDamNhan.manv ? ` (${item.project.nguoiDamNhan.manv})` : ''}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    scroll: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 32
    },
    header: {
        marginBottom: 20
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#312e81'
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderColor: '#ede9fe',
        borderWidth: 1,
        paddingVertical: 18,
        alignItems: 'center'
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 8,
        color: '#1f2937'
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: '#e9d5ff',
        borderRadius: 999,
        padding: 4,
        marginBottom: 16
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 999,
        alignItems: 'center'
    },
    tabButtonActive: {
        backgroundColor: '#7c3aed'
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280'
    },
    tabTextActive: {
        color: '#fff'
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280'
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe',
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#312e81',
        marginTop: 12
    },
    emptyText: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 6,
        textAlign: 'center'
    },
    projectCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe',
        padding: 18,
        marginBottom: 16
    },
    projectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 10
    },
    projectTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: '#1f2937'
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#ede9fe',
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 10
    },
    statusBadgeText: {
        color: '#5b21b6',
        fontWeight: '600',
        fontSize: 12
    },
    projectDescription: {
        color: '#4b5563',
        marginBottom: 12,
        lineHeight: 20
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6
    },
    metaText: {
        color: '#4b5563',
        fontSize: 13
    }
});
