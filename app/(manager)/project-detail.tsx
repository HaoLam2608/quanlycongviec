import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, FlatList, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getProjectById, getTasksByProject } from '@/src/axios/api';
import { PageHeader } from '../../components/ui/PageHeader';

interface Project {
    id: number;
    tenduan: string;
    mota: string;
    status: string;
    ngaybatdau: string;
    ngayketthuc: string;
    nguoiDamNhan?: {
        hoten: string;
        manv: string;
    };
}

interface Task {
    id: number;
    tentask: string;
    trangThai: string;
    mucDoUuTien: string;
    nguoiDuocGiao?: {
        hoten: string;
    };
}

type TabType = 'overview' | 'tasks' | 'timeline';

export default function ProjectDetail() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const projectId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    useEffect(() => {
        if (projectId) {
            loadProjectData();
        }
    }, [projectId]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            const [projectData, tasksData] = await Promise.all([
                getProjectById(projectId),
                getTasksByProject(projectId)
            ]);
            setProject(projectData);
            setTasks(tasksData);
        } catch (error) {
            console.error('Error loading project:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin dự án');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadProjectData();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'chua_bat_dau': return '#6b7280';
            case 'dang_chay': return '#f59e0b';
            case 'da_hoan_thanh': return '#10b981';
            case 'da_dong': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'chua_bat_dau': return 'Chưa bắt đầu';
            case 'dang_chay': return 'Đang chạy';
            case 'da_hoan_thanh': return 'Đã hoàn thành';
            case 'da_dong': return 'Đã đóng';
            default: return status;
        }
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'Chưa bắt đầu': return '#6b7280';
            case 'Đang chạy': return '#f59e0b';
            case 'Chờ xác nhận hoàn thành': return '#3b82f6';
            case 'Hoàn thành': return '#10b981';
            default: return '#6b7280';
        }
    };

    const renderOverview = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Mô tả</Text>
                <Text style={styles.description}>
                    {project?.mota || 'Không có mô tả'}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Trạng thái</Text>
                <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(project?.status || '') }]}>
                    <Text style={styles.statusBadgeText}>{getStatusText(project?.status || '')}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 Thời gian</Text>
                <View style={styles.dateContainer}>
                    <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Ngày bắt đầu:</Text>
                        <Text style={styles.dateValue}>
                            {project?.ngaybatdau ? new Date(project.ngaybatdau).toLocaleDateString('vi-VN') : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Ngày kết thúc:</Text>
                        <Text style={styles.dateValue}>
                            {project?.ngayketthuc ? new Date(project.ngayketthuc).toLocaleDateString('vi-VN') : 'N/A'}
                        </Text>
                    </View>
                </View>
            </View>

            {project?.nguoiDamNhan && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 Người quản lý</Text>
                    <View style={styles.managerCard}>
                        <Text style={styles.managerName}>{project.nguoiDamNhan.hoten}</Text>
                        <Text style={styles.managerCode}>{project.nguoiDamNhan.manv}</Text>
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 Thống kê công việc</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{tasks?.length || 0}</Text>
                        <Text style={styles.statLabel}>Tổng số</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
                            {tasks?.filter(t => t.trangThai === 'Đang chạy').length || 0}
                        </Text>
                        <Text style={styles.statLabel}>Đang làm</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: '#10b981' }]}>
                            {tasks?.filter(t => t.trangThai === 'Hoàn thành').length || 0}
                        </Text>
                        <Text style={styles.statLabel}>Hoàn thành</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    const renderTaskItem = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={styles.taskItem}
            onPress={() => router.push(`/(manager)/task-detail?id=${item.id}`)}
        >
            <View style={styles.taskHeader}>
                <Text style={styles.taskName} numberOfLines={2}>{item.tentask}</Text>
                <View style={[styles.taskStatusBadge, { backgroundColor: getTaskStatusColor(item.trangThai) }]}>
                    <Text style={styles.taskStatusText}>{item.trangThai}</Text>
                </View>
            </View>
            {item.nguoiDuocGiao && (
                <Text style={styles.taskAssignee}>👤 {item.nguoiDuocGiao.hoten}</Text>
            )}
        </TouchableOpacity>
    );

    const renderTasks = () => (
        <View style={styles.tabContent}>
            <FlatList
                data={tasks || []}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>Chưa có công việc nào</Text>
                    </View>
                }
            />
        </View>
    );

    const renderTimeline = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>⏱️</Text>
                <Text style={styles.emptyText}>Tính năng Timeline đang phát triển</Text>
            </View>
        </ScrollView>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết dự án" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!project) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết dự án" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>❌</Text>
                    <Text style={styles.errorText}>Không tìm thấy dự án</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <PageHeader title={project.tenduan} />

                {/* Tabs */}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                        onPress={() => setActiveTab('overview')}
                    >
                        <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                            Tổng quan
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'tasks' && styles.tabActive]}
                        onPress={() => setActiveTab('tasks')}
                    >
                        <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>
                            Công việc ({tasks.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
                        onPress={() => setActiveTab('timeline')}
                    >
                        <Text style={[styles.tabText, activeTab === 'timeline' && styles.tabTextActive]}>
                            Timeline
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'tasks' && renderTasks()}
                {activeTab === 'timeline' && renderTimeline()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#6b7280',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#f59e0b',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    tabTextActive: {
        color: '#f59e0b',
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 22,
    },
    statusBadgeLarge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    dateContainer: {
        gap: 12,
    },
    dateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    managerCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    managerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    managerCode: {
        fontSize: 14,
        color: '#6b7280',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    taskItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginRight: 8,
    },
    taskStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    taskStatusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    taskAssignee: {
        fontSize: 13,
        color: '#6b7280',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
    },
});
