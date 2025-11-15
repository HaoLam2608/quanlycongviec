import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getMemberProjects } from '../../../src/axios/api';
import { MemberProject } from '../../../types/member';
import { styles } from './index.styles';

export default function MemberProjectsScreen() {
    const [projects, setProjects] = useState<MemberProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedProject, setSelectedProject] = useState<MemberProject | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch projects from API
    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const data = await getMemberProjects();
            console.log("data", data);

            // Transform API data to match component interface
            // Backend trả về array trực tiếp, không có wrapper .projects
            const transformedProjects: MemberProject[] = (Array.isArray(data) ? data : data.projects || []).map((item: any) => ({
                id: item.id,
                name: item.name, // Backend trả về name trực tiếp
                tenduan: item.name,
                description: item.description || '',
                startDate: item.startDate,
                ngaybatdau: item.startDate,
                endDate: item.endDate,
                deadline: item.deadline,
                ngayketthuc: item.endDate,
                status: item.status || 'Chưa bắt đầu',
                progress: item.progress || 0,
                manager: item.manager || 'Chưa có',
                teamSize: item.teamSize || 0,
                totalMembers: item.teamSize || 0,
                totalTasks: item.totalTasks || 0,
                completedTasks: item.completedTasks || 0,
                myTasks: item.myTasks || 0,
                myCompletedTasks: item.myCompletedTasks || 0,
            }));

            setProjects(transformedProjects);
            setIsLoading(false);
        } catch (error: any) {
            console.error('❌ Lỗi lấy danh sách dự án:', error);
            Alert.alert('Lỗi', error.message || 'Không thể tải danh sách dự án');
            setProjects([]);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchProjects();
        setIsRefreshing(false);
    };

    // Filter projects based on search query
    const filteredProjects = projects.filter(
        (project) =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đang thực hiện':
                return '#3B82F6';
            case 'Hoàn thành':
                return '#10B981';
            case 'Tạm dừng':
                return '#F59E0B';
            case 'Hủy bỏ':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    // Render project card
    const renderProjectCard = (project: MemberProject) => {
        const completionRate = (project.completedTasks / project.totalTasks) * 100;

        return (
            <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                onPress={() => {
                    setSelectedProject(project);
                    setIsDetailModalOpen(true);
                }}
            >
                <View style={styles.projectHeader}>
                    <View style={styles.projectInfo}>
                        <Text style={styles.projectName}>{project.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                            <Text style={styles.statusText}>{project.status}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.projectDescription} numberOfLines={2}>
                    {project.description}
                </Text>

                <View style={styles.projectMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={16} color="#6B7280" />
                        <Text style={styles.metaText}>{project.manager}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={16} color="#6B7280" />
                        <Text style={styles.metaText}>{project.totalMembers} thành viên</Text>
                    </View>
                </View>

                <View style={styles.projectStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Tiến độ</Text>
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBar, { width: `${project.progress}%` }]} />
                        </View>
                        <Text style={styles.statValue}>{project.progress}%</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Công việc</Text>
                        <Text style={styles.statValue}>
                            {project.completedTasks}/{project.totalTasks}
                        </Text>
                        <Text style={styles.statPercent}>({completionRate.toFixed(0)}%)</Text>
                    </View>
                </View>

                <View style={styles.projectDates}>
                    <View style={styles.dateItem}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.dateText}>
                            {new Date(project.startDate).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color="#6B7280" />
                    <View style={styles.dateItem}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.dateText}>
                            {new Date(project.endDate).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loadingText}>Đang tải dự án...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dự án của tôi</Text>
                <Text style={styles.headerSubtitle}>
                    {filteredProjects.length} dự án đang tham gia
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm dự án..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Projects List */}
            <ScrollView
                style={styles.projectsList}
                contentContainerStyle={styles.projectsContent}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {filteredProjects.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>Không tìm thấy dự án</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : 'Bạn chưa tham gia dự án nào'}
                        </Text>
                    </View>
                ) : (
                    filteredProjects.map(renderProjectCard)
                )}
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={isDetailModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsDetailModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chi tiết dự án</Text>
                            <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedProject && (
                            <ScrollView style={styles.modalBody}>
                                <Text style={styles.modalProjectName}>{selectedProject.name}</Text>
                                <View
                                    style={[
                                        styles.modalStatusBadge,
                                        { backgroundColor: getStatusColor(selectedProject.status) },
                                    ]}
                                >
                                    <Text style={styles.modalStatusText}>{selectedProject.status}</Text>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionLabel}>Mô tả</Text>
                                    <Text style={styles.modalDescription}>{selectedProject.description}</Text>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionLabel}>Thông tin chi tiết</Text>
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="person-outline" size={20} color="#6B7280" />
                                        <View style={styles.modalInfoContent}>
                                            <Text style={styles.modalInfoLabel}>Quản lý</Text>
                                            <Text style={styles.modalInfoValue}>{selectedProject.manager}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="people-outline" size={20} color="#6B7280" />
                                        <View style={styles.modalInfoContent}>
                                            <Text style={styles.modalInfoLabel}>Thành viên</Text>
                                            <Text style={styles.modalInfoValue}>
                                                {selectedProject.totalMembers} người
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                        <View style={styles.modalInfoContent}>
                                            <Text style={styles.modalInfoLabel}>Thời gian</Text>
                                            <Text style={styles.modalInfoValue}>
                                                {new Date(selectedProject.startDate).toLocaleDateString('vi-VN')} -{' '}
                                                {new Date(selectedProject.endDate).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionLabel}>Tiến độ dự án</Text>
                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressInfo}>
                                            <Text style={styles.progressLabel}>Tổng quan</Text>
                                            <Text style={styles.progressValue}>{selectedProject.progress}%</Text>
                                        </View>
                                        <View style={styles.progressBarContainer}>
                                            <View
                                                style={[
                                                    styles.progressBar,
                                                    { width: `${selectedProject.progress}%` },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionLabel}>Công việc</Text>
                                    <View style={styles.statsRow}>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statBoxValue}>{selectedProject.totalTasks}</Text>
                                            <Text style={styles.statBoxLabel}>Tổng số</Text>
                                        </View>
                                        <View style={styles.statBox}>
                                            <Text style={[styles.statBoxValue, { color: '#10B981' }]}>
                                                {selectedProject.completedTasks}
                                            </Text>
                                            <Text style={styles.statBoxLabel}>Hoàn thành</Text>
                                        </View>
                                        <View style={styles.statBox}>
                                            <Text style={[styles.statBoxValue, { color: '#F59E0B' }]}>
                                                {selectedProject.totalTasks - selectedProject.completedTasks}
                                            </Text>
                                            <Text style={styles.statBoxLabel}>Đang làm</Text>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
