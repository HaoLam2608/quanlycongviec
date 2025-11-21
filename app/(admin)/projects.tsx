import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import ProjectFormModal from './components/ProjectFormModal';

interface Project {
    id: number;
    tenduan: string;
    mota: string;
    status: string;
    ngaybatdau: string;
    ngayketthuc: string;
    userId?: number;
    nguoiDamNhan?: {
        id: number;
        hoten: string;
        manv: string;
    };
}

export default function ProjectsManagement() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [projectFilter, setProjectFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        filterProjects();
    }, [searchQuery, projects, projectFilter]);

    const getFilterStatuses = (filter: 'not_started' | 'in_progress' | 'completed') => {
        switch (filter) {
            case 'not_started':
                return ['chua_bat_dau', 'not_started'];
            case 'in_progress':
                return ['dang_chay', 'in_progress'];
            case 'completed':
                return ['da_hoan_thanh', 'completed'];
            default:
                return [];
        }
    };

    const loadProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/duan/getAll');

            if (response.data) {
                setProjects(Array.isArray(response.data) ? response.data : (response.data.duans || []));
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách dự án');
        } finally {
            setLoading(false);
        }
    };

    const filterProjects = () => {
        const q = searchQuery.trim().toLowerCase();

        // apply project status filter first (support multiple status vocabularies)
        let base = projects;
        if (projectFilter !== 'all') {
            const allowed = getFilterStatuses(projectFilter as any);
            base = projects.filter(p => allowed.includes(p.status));
        }

        if (q === '') {
            setFilteredProjects(base);
            return;
        }

        const filtered = base.filter(project =>
            project.tenduan.toLowerCase().includes(q) ||
            (project.mota || '').toLowerCase().includes(q)
        );
        setFilteredProjects(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProjects();
        setRefreshing(false);
    };

    const handleDeleteProject = (project: Project) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa dự án "${project.tenduan}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/duan/delete/${project.id}`);
                            Alert.alert('Thành công', 'Đã xóa dự án');
                            loadProjects();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa dự án');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'dang_chay':
            case 'in_progress':
                return '#10b981';
            case 'da_hoan_thanh':
            case 'completed':
                return '#3b82f6';
            case 'chua_bat_dau':
            case 'not_started':
                return '#f59e0b';
            default:
                return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'dang_chay':
            case 'in_progress':
                return 'Đang thực hiện';
            case 'da_hoan_thanh':
            case 'completed':
                return 'Hoàn thành';
            case 'chua_bat_dau':
            case 'not_started':
                return 'Chưa bắt đầu';
            default:
                return status;
        }
    };

    const ProjectCard = ({ project }: { project: Project }) => {
        const statusColor = getStatusColor(project.status);
        
        return (
            <TouchableOpacity 
                style={styles.projectCard}
                onPress={() => router.push(`/(admin)/project-detail?id=${project.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.projectHeader}>
                    <View style={styles.projectIcon}>
                        <Ionicons name="folder" size={24} color="#10b981" />
                    </View>
                    <View style={styles.projectInfo}>
                        <Text style={styles.projectName}>{project.tenduan}</Text>
                        <Text style={styles.projectDescription} numberOfLines={2}>
                            {project.mota || 'Không có mô tả'}
                        </Text>
                    </View>
                </View>

                <View style={styles.projectDetails}>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                        <Text style={styles.detailText}>
                            {new Date(project.ngaybatdau).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {getStatusText(project.status)}
                        </Text>
                    </View>
                </View>

                <View style={styles.projectFooter}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                            setShowFormModal(true);
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color="#3b82f6" />
                        <Text style={styles.actionButtonText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteActionButton]}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project);
                        }}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Xóa</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý dự án</Text>
                <Text style={styles.subtitle}>Tổng số: {projects.length} dự án</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm dự án..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#6b7280" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                    <Text style={styles.statValue}>
                        {projects.filter(p => p.status === 'chua_bat_dau' || p.status === 'not_started').length}
                    </Text>
                    <Text style={styles.statLabel}>Chưa bắt đầu</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
                    <Text style={styles.statValue}>
                        {projects.filter(p => p.status === 'dang_chay' || p.status === 'in_progress').length}
                    </Text>
                    <Text style={styles.statLabel}>Đang thực hiện</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
                    <Text style={styles.statValue}>
                        {projects.filter(p => p.status === 'da_hoan_thanh' || p.status === 'completed').length}
                    </Text>
                    <Text style={styles.statLabel}>Hoàn thành</Text>
                </View>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.filterScrollContent}
                >
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'not_started', label: 'Chưa bắt đầu' },
                        { key: 'in_progress', label: 'Đang chạy' },
                        { key: 'completed', label: 'Hoàn thành' },
                    ].map((f) => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.pill, projectFilter === (f.key as any) && styles.pillActive]}
                            onPress={() => setProjectFilter(f.key as any)}
                        >
                            <Text style={[styles.pillText, projectFilter === (f.key as any) && styles.pillTextActive]}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Projects List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </View>
                ) : filteredProjects.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'Không tìm thấy dự án' : 'Chưa có dự án'}
                        </Text>
                    </View>
                ) : (
                    filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)
                )}
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => {
                    setEditingProject(null);
                    setShowFormModal(true);
                }}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Project Form Modal */}
            <ProjectFormModal
                visible={showFormModal}
                project={editingProject}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingProject(null);
                }}
                onSuccess={() => {
                    loadProjects();
                }}
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    statLabel: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center',
    },
    filterContainer: {
        paddingHorizontal: 16,
        marginTop: 6,
        marginBottom: 6,
    },
    filterScrollContent: {
        paddingVertical: 8,
    },
    pill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        marginRight: 8,
    },
    pillActive: {
        backgroundColor: '#10b981',
    },
    pillText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
    },
    pillTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    projectCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    projectHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    projectIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    projectInfo: {
        flex: 1,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    projectDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    projectDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        color: '#6b7280',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    projectFooter: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        gap: 4,
    },
    deleteActionButton: {
        backgroundColor: '#fee2e2',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});