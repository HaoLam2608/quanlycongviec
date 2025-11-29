import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
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
import { deleteDocument, fetchDocuments, getMemberProjects } from '../../../src/axios/api';
import { MemberProject } from '../../../types/member';
import { styles } from './styles';

export default function MemberProjectsScreen() {
    const router = useRouter();
    const [projects, setProjects] = useState<MemberProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedProject, setSelectedProject] = useState<MemberProject | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isUploadingDocument, setIsUploadingDocument] = useState(false);

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

    // Fetch documents for selected project
    const fetchProjectDocuments = async (projectId: number) => {
        try {
            setIsLoadingDocuments(true);
            const response = await fetchDocuments(projectId);
            const docs = response.documents || response || [];
            setDocuments(docs);
        } catch (error: any) {
            console.error('❌ Lỗi lấy tài liệu:', error);
            Alert.alert('Lỗi', error.message || 'Không thể tải tài liệu');
            setDocuments([]);
        } finally {
            setIsLoadingDocuments(false);
        }
    };



    // Handle document upload
    const handleUploadDocument = async () => {
        if (!selectedProject) return;

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return;
            }

            const file = result.assets[0];
            if (!file) {
                Alert.alert('Lỗi', 'Không thể đọc file');
                return;
            }

            setIsUploadingDocument(true);

            // Create FormData for upload
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.mimeType || 'application/octet-stream',
                name: file.name,
            } as any);
            formData.append('duanId', String(selectedProject.id));

            // Upload using fetch API
            const token = await require('@react-native-async-storage/async-storage').default.getItem('accessToken');
            const API_BASE_URL = require('../../../src/config/api').API_CONFIG.BASE_URL;

            const response = await fetch(`${API_BASE_URL}/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Upload thất bại');
            }

            Alert.alert('Thành công', 'Tải lên tài liệu thành công');
            await fetchProjectDocuments(selectedProject.id);
        } catch (error: any) {
            console.error('❌ Lỗi upload tài liệu:', error);
            Alert.alert('Lỗi', error.message || 'Không thể tải lên tài liệu');
        } finally {
            setIsUploadingDocument(false);
        }
    };

    // Handle document delete
    const handleDeleteDocument = async (documentId: number, documentName: string) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa tài liệu "${documentName}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDocument(documentId);
                            Alert.alert('Thành công', 'Đã xóa tài liệu');
                            if (selectedProject) {
                                await fetchProjectDocuments(selectedProject.id);
                            }
                        } catch (error: any) {
                            console.error('❌ Lỗi xóa tài liệu:', error);
                            Alert.alert('Lỗi', error.message || 'Không thể xóa tài liệu');
                        }
                    },
                },
            ]
        );
    };

    // Open detail modal and fetch documents
    const openDetailModal = (project: MemberProject) => {
        setSelectedProject(project);
        setIsDetailModalOpen(true);
        fetchProjectDocuments(project.id);
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
                onPress={() => openDetailModal(project)}
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

                {/* Kanban Button */}
                <TouchableOpacity
                    style={styles.kanbanButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        router.push('/(tabs)/member-kanban' as any);
                    }}
                >
                    <Ionicons name="grid" size={18} color="#fff" />
                    <Text style={styles.kanbanButtonText}>Xem bảng Kanban</Text>
                </TouchableOpacity>
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

                                {/* Documents Section */}
                                <View style={styles.modalSection}>
                                    <View style={styles.documentsHeader}>
                                        <Text style={styles.modalSectionLabel}>Tài liệu dự án</Text>
                                        <TouchableOpacity
                                            style={styles.uploadButton}
                                            onPress={handleUploadDocument}
                                            disabled={isUploadingDocument}
                                        >
                                            {isUploadingDocument ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                                                    <Text style={styles.uploadButtonText}>Tải lên</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {isLoadingDocuments ? (
                                        <View style={styles.documentsLoading}>
                                            <ActivityIndicator size="small" color="#667eea" />
                                            <Text style={styles.documentsLoadingText}>Đang tải tài liệu...</Text>
                                        </View>
                                    ) : documents.length === 0 ? (
                                        <View style={styles.documentsEmpty}>
                                            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                                            <Text style={styles.documentsEmptyText}>Chưa có tài liệu nào</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.documentsList}>
                                            {documents.map((doc) => (
                                                <View key={doc.id} style={styles.documentItem}>
                                                    <View style={styles.documentInfo}>
                                                        <Ionicons
                                                            name="document-text-outline"
                                                            size={24}
                                                            color="#667eea"
                                                        />
                                                        <View style={styles.documentDetails}>
                                                            <Text style={styles.documentName} numberOfLines={1}>
                                                                {doc.tenTaiLieu || doc.fileName || 'Tài liệu'}
                                                            </Text>
                                                            <Text style={styles.documentMeta}>
                                                                {doc.uploadedBy || 'Không rõ'} •{' '}
                                                                {doc.createdAt
                                                                    ? new Date(doc.createdAt).toLocaleDateString('vi-VN')
                                                                    : 'N/A'}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View style={styles.documentActions}>
                                                        <TouchableOpacity
                                                            style={styles.documentActionButton}
                                                            onPress={() =>
                                                                handleDeleteDocument(
                                                                    doc.id,
                                                                    doc.tenTaiLieu || doc.fileName || 'tài liệu'
                                                                )
                                                            }
                                                        >
                                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Calendar View Button */}
                                <TouchableOpacity
                                    style={styles.calendarViewButton}
                                    onPress={() => {
                                        if (selectedProject) {
                                            setIsDetailModalOpen(false);
                                            router.push({
                                                pathname: '/(tabs)/member-calendar' as any,
                                                params: {
                                                    projectId: selectedProject.id.toString(),
                                                    projectName: selectedProject.name,
                                                },
                                            });
                                        }
                                    }}
                                >
                                    <Ionicons name="calendar" size={20} color="#fff" />
                                    <Text style={styles.calendarViewButtonText}>Xem lịch công việc</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
