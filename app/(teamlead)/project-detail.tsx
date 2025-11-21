import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { getGroupDetail, getMyProjects, getMyTasks } from '@/src/axios/api';

interface ProjectDetailState {
    projectName: string;
    projectDescription?: string;
    projectStatus?: string;
    startDate?: string;
    endDate?: string;
    participationStatus?: 'active' | 'completed';
    pm?: { hoten: string; manv?: string; email?: string } | null;
    group?: {
        id: number;
        name: string;
        status?: string;
        members: Array<{ id: number; hoten: string; manv?: string; email?: string; chucvu?: string }>;
    } | null;
    tasks: Array<{ id: number; tentask: string; trangThai: string; doUuTien?: string }>;
}

const DEFAULT_STATE: ProjectDetailState = {
    projectName: 'Dự án',
    projectDescription: '',
    projectStatus: undefined,
    startDate: undefined,
    endDate: undefined,
    participationStatus: 'active',
    pm: null,
    group: null,
    tasks: []
};

const formatDate = (value?: string) => {
    if (!value) return 'Chưa rõ';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'Chưa rõ';
    return dt.toLocaleDateString('vi-VN');
};

const statusColor = (status?: string) => {
    switch (status) {
        case 'dang_chay':
        case 'Đang chạy':
            return '#2563eb';
        case 'hoan_thanh':
        case 'Hoàn thành':
            return '#16a34a';
        case 'tam_dung':
            return '#ea580c';
        default:
            return '#6b7280';
    }
};

export default function TeamLeadProjectDetailScreen() {
    const params = useLocalSearchParams<{ projectId?: string; groupId?: string }>();
    const projectId = Number(params.projectId);
    const groupId = Number(params.groupId);

    const [data, setData] = useState<ProjectDetailState>(DEFAULT_STATE);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDetail = async () => {
        if (!projectId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [projectsResponse, tasksResponse, groupResponse] = await Promise.all([
                getMyProjects(),
                getMyTasks(),
                groupId ? getGroupDetail(groupId) : Promise.resolve(null)
            ]);

            const projectRecord = (projectsResponse || []).find((item: any) => {
                const id = item?.project?.id || item?.duanId || item?.id;
                return Number(id) === projectId;
            });

            const tasks = (tasksResponse?.tasks || tasksResponse || []).filter((task: any) => {
                const id = task.duan?.id || task.duanId;
                return Number(id) === projectId;
            });

            const normalized: ProjectDetailState = {
                projectName: projectRecord?.project?.tenduan || projectRecord?.tenduan || 'Dự án',
                projectDescription: projectRecord?.project?.mota,
                projectStatus: projectRecord?.project?.status,
                startDate: projectRecord?.project?.ngaybatdau,
                endDate: projectRecord?.project?.ngayketthuc,
                participationStatus: projectRecord?.status || 'active',
                pm: projectRecord?.project?.nguoiDamNhan || null,
                group: groupResponse
                    ? {
                        id: groupResponse.id,
                        name: groupResponse.name,
                        status: groupResponse.status,
                        members: groupResponse.members || []
                    }
                    : projectRecord?.Group
                        ? {
                            id: projectRecord.Group.id,
                            name: projectRecord.Group.name,
                            status: projectRecord.Group.status,
                            members: projectRecord.Group.members || []
                        }
                        : null,
                tasks: tasks.map((task: any) => ({
                    id: task.id,
                    tentask: task.tentask,
                    trangThai: task.trangThai,
                    doUuTien: task.mucDoUuTien || task.doUuTien
                }))
            };

            setData(normalized);
        } catch (error) {
            console.error('Load project detail error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, groupId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDetail();
        setRefreshing(false);
    };

    const completedTasks = useMemo(() => data.tasks.filter(task => task.trangThai === 'Hoàn thành').length, [data.tasks]);

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Đang tải chi tiết dự án...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.card}>
                    <Text style={styles.title}>{data.projectName}</Text>
                    <View style={styles.badgeRow}>
                        {data.projectStatus && (
                            <View style={[styles.badge, { backgroundColor: '#ede9fe' }] }>
                                <Text style={[styles.badgeText, { color: statusColor(data.projectStatus) }]}>
                                    {data.projectStatus}
                                </Text>
                            </View>
                        )}
                        {data.participationStatus && (
                            <View style={[styles.badge, { backgroundColor: '#dcfce7' }] }>
                                <Text style={[styles.badgeText, { color: '#15803d' }]}>
                                    {data.participationStatus === 'completed' ? 'Đã hoàn thành' : 'Đang tham gia'}
                                </Text>
                            </View>
                        )}
                    </View>
                    {data.projectDescription && (
                        <Text style={styles.description}>{data.projectDescription}</Text>
                    )}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={18} color="#7c3aed" />
                        <Text style={styles.infoText}>
                            {formatDate(data.startDate)} - {formatDate(data.endDate)}
                        </Text>
                    </View>
                    {data.pm && (
                        <View style={styles.infoRow}>
                            <Ionicons name="person" size={18} color="#7c3aed" />
                            <Text style={styles.infoText}>
                                PM: {data.pm.hoten}
                                {data.pm.manv ? ` (${data.pm.manv})` : ''}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Thống kê</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Ionicons name="list" size={20} color="#7c3aed" />
                            <Text style={styles.statValue}>{data.tasks.length}</Text>
                            <Text style={styles.statLabel}>Công việc</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="checkbox" size={20} color="#22c55e" />
                            <Text style={styles.statValue}>{completedTasks}</Text>
                            <Text style={styles.statLabel}>Hoàn thành</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="people" size={20} color="#22d3ee" />
                            <Text style={styles.statValue}>{data.group?.members?.length || 0}</Text>
                            <Text style={styles.statLabel}>Thành viên</Text>
                        </View>
                    </View>
                </View>

                {data.group && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Nhóm tham gia</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="people" size={18} color="#7c3aed" />
                            <Text style={styles.infoText}>{data.group.name}</Text>
                        </View>
                        {data.group.members.map(member => (
                            <View key={member.id} style={styles.memberRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{member.hoten?.charAt(0) || 'M'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.memberName}>{member.hoten}</Text>
                                    <View style={styles.metaRow}>
                                        {member.manv && <Text style={styles.metaText}>#{member.manv}</Text>}
                                        {member.chucvu && <Text style={styles.metaText}>• {member.chucvu}</Text>}
                                    </View>
                                    {member.email && <Text style={styles.metaText}>{member.email}</Text>}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Công việc thuộc dự án</Text>
                    {data.tasks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-outline" size={36} color="#c4b5fd" />
                            <Text style={styles.emptyText}>Chưa có công việc nào</Text>
                        </View>
                    ) : (
                        data.tasks.map(task => (
                            <View key={task.id} style={styles.taskRow}>
                                <View style={styles.taskHeader}>
                                    <View style={[styles.statusDot, { backgroundColor: statusColor(task.trangThai) }]} />
                                    <Text style={styles.taskTitle}>{task.tentask}</Text>
                                </View>
                                <Text style={styles.taskMeta}>{task.trangThai}</Text>
                                {task.doUuTien && <Text style={styles.taskMeta}>Ưu tiên: {task.doUuTien}</Text>}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    center: {
        flex: 1,
        backgroundColor: '#f5f5ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280'
    },
    scroll: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 32
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe',
        padding: 18,
        marginBottom: 18
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937'
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#312e81',
        marginBottom: 14
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12
    },
    badge: {
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 10
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600'
    },
    description: {
        color: '#4b5563',
        lineHeight: 20,
        marginTop: 12
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10
    },
    infoText: {
        color: '#4b5563',
        fontSize: 14,
        flex: 1
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    statCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ede9fe',
        borderRadius: 16,
        paddingVertical: 14,
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
        marginTop: 4
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: '#f3e8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    avatarText: {
        color: '#7c3aed',
        fontWeight: '700',
        fontSize: 18
    },
    memberName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937'
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2
    },
    metaText: {
        fontSize: 12,
        color: '#6b7280'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24
    },
    emptyText: {
        color: '#6b7280',
        marginTop: 8
    },
    taskRow: {
        borderWidth: 1,
        borderColor: '#ede9fe',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937'
    },
    taskMeta: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2
    }
});
