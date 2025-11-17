import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProjectsByManager, createProject, updateProject, deleteProject } from '@/src/axios/api';
import { PageHeader } from '../../components/ui/PageHeader';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Project {
    id: number;
    tenduan: string;
    mota: string;
    status: string;
    ngaybatdau: string;
    ngayketthuc: string;
    userId: number;
}

export default function MyProjects() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [formData, setFormData] = useState({
        tenduan: '',
        mota: '',
        status: 'chua_bat_dau',
        ngaybatdau: '',
        ngayketthuc: '',
    });

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        filterProjects();
    }, [projects, searchQuery, statusFilter]);

    const loadProjects = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                const response = await fetchProjectsByManager(user.id);
                setProjects(response);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách dự án');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterProjects = () => {
        let filtered = [...projects];

        // Lọc theo trạng thái
        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        // Tìm kiếm theo tên
        if (searchQuery.trim()) {
            filtered = filtered.filter(p => 
                p.tenduan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.mota && p.mota.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredProjects(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadProjects();
    };

    const handleCreate = () => {
        setEditingProject(null);
        setFormData({
            tenduan: '',
            mota: '',
            status: 'chua_bat_dau',
            ngaybatdau: new Date().toISOString().split('T')[0],
            ngayketthuc: new Date().toISOString().split('T')[0],
        });
        setModalVisible(true);
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setFormData({
            tenduan: project.tenduan,
            mota: project.mota || '',
            status: project.status,
            ngaybatdau: project.ngaybatdau.split('T')[0],
            ngayketthuc: project.ngayketthuc.split('T')[0],
        });
        setModalVisible(true);
    };

    const handleDelete = (project: Project) => {
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
                            await deleteProject(project.id);
                            Alert.alert('Thành công', 'Đã xóa dự án');
                            loadProjects();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa dự án');
                        }
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!formData.tenduan.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên dự án');
            return;
        }

        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) return;

            const user = JSON.parse(userData);
            const projectData = {
                ...formData,
                userId: user.id,
            };

            if (editingProject) {
                await updateProject(editingProject.id, projectData);
                Alert.alert('Thành công', 'Đã cập nhật dự án');
            } else {
                await createProject(projectData);
                Alert.alert('Thành công', 'Đã tạo dự án mới');
            }

            setModalVisible(false);
            loadProjects();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể lưu dự án');
        }
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const renderProject = ({ item }: { item: Project }) => (
        <TouchableOpacity
            style={styles.projectCard}
            onPress={() => router.push(`/(manager)/project-detail?id=${item.id}`)}
        >
            <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                    <Text style={styles.projectCode}>#{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                    </View>
                </View>
            </View>
            <Text style={styles.projectName}>{item.tenduan}</Text>
            {item.mota && <Text style={styles.projectDesc} numberOfLines={2}>{item.mota}</Text>}
            <View style={styles.projectFooter}>
                <Text style={styles.projectDate}>
                    📅 {formatDate(item.ngaybatdau)} - {formatDate(item.ngayketthuc)}
                </Text>
            </View>
            <View style={styles.projectActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={(e) => { e.stopPropagation(); handleEdit(item); }}
                >
                    <Text style={styles.actionBtnText}>✏️ Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={(e) => { e.stopPropagation(); handleDelete(item); }}
                >
                    <Text style={styles.actionBtnText}>🗑️ Xóa</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Dự án của tôi" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Dự án của tôi" />
            <View style={styles.content}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm dự án..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Status Filter */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.filterContainer}
                    contentContainerStyle={styles.filterContent}
                >
                    <TouchableOpacity
                        style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
                        onPress={() => setStatusFilter('all')}
                    >
                        <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                            Tất cả ({projects.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, statusFilter === 'chua_bat_dau' && styles.filterChipActive]}
                        onPress={() => setStatusFilter('chua_bat_dau')}
                    >
                        <View style={[styles.filterDot, { backgroundColor: '#6b7280' }]} />
                        <Text style={[styles.filterChipText, statusFilter === 'chua_bat_dau' && styles.filterChipTextActive]}>
                            Chưa bắt đầu ({projects.filter(p => p.status === 'chua_bat_dau').length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, statusFilter === 'dang_chay' && styles.filterChipActive]}
                        onPress={() => setStatusFilter('dang_chay')}
                    >
                        <View style={[styles.filterDot, { backgroundColor: '#f59e0b' }]} />
                        <Text style={[styles.filterChipText, statusFilter === 'dang_chay' && styles.filterChipTextActive]}>
                            Đang chạy ({projects.filter(p => p.status === 'dang_chay').length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, statusFilter === 'da_hoan_thanh' && styles.filterChipActive]}
                        onPress={() => setStatusFilter('da_hoan_thanh')}
                    >
                        <View style={[styles.filterDot, { backgroundColor: '#10b981' }]} />
                        <Text style={[styles.filterChipText, statusFilter === 'da_hoan_thanh' && styles.filterChipTextActive]}>
                            Hoàn thành ({projects.filter(p => p.status === 'da_hoan_thanh').length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, statusFilter === 'da_dong' && styles.filterChipActive]}
                        onPress={() => setStatusFilter('da_dong')}
                    >
                        <View style={[styles.filterDot, { backgroundColor: '#8b5cf6' }]} />
                        <Text style={[styles.filterChipText, statusFilter === 'da_dong' && styles.filterChipTextActive]}>
                            Đã đóng ({projects.filter(p => p.status === 'da_dong').length})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
                
                <FlatList
                    data={filteredProjects}
                    renderItem={renderProject}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {searchQuery || statusFilter !== 'all' ? '🔍' : '📋'}
                            </Text>
                            <Text style={styles.emptyTitle}>
                                {searchQuery || statusFilter !== 'all' ? 'Không tìm thấy dự án' : 'Chưa có dự án'}
                            </Text>
                            <Text style={styles.emptyDesc}>
                                {searchQuery || statusFilter !== 'all' 
                                    ? 'Thử thay đổi từ khóa hoặc bộ lọc' 
                                    : 'Nhấn nút + để tạo dự án mới'}
                            </Text>
                        </View>
                    }
                />

                {/* Floating Action Button */}
                <TouchableOpacity style={styles.fab} onPress={handleCreate}>
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>
                                {editingProject ? '✏️ Sửa dự án' : '➕ Tạo dự án mới'}
                            </Text>

                            <Text style={styles.label}>Tên dự án *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.tenduan}
                                onChangeText={(text) => setFormData({ ...formData, tenduan: text })}
                                placeholder="Nhập tên dự án"
                            />

                            <Text style={styles.label}>Mô tả</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.mota}
                                onChangeText={(text) => setFormData({ ...formData, mota: text })}
                                placeholder="Mô tả dự án"
                                multiline
                                numberOfLines={4}
                            />

                            <Text style={styles.label}>Trạng thái</Text>
                            <View style={styles.statusOptions}>
                                {['chua_bat_dau', 'dang_chay', 'da_hoan_thanh', 'da_dong'].map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[
                                            styles.statusOption,
                                            formData.status === status && styles.statusOptionActive,
                                        ]}
                                        onPress={() => setFormData({ ...formData, status: status })}
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                formData.status === status && styles.statusOptionTextActive,
                                            ]}
                                        >
                                            {getStatusText(status)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Ngày bắt đầu</Text>
                            <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
                                <Text style={styles.dateButtonText}>
                                    {formData.ngaybatdau ? new Date(formData.ngaybatdau).toLocaleDateString('vi-VN') : '📅 Chọn ngày bắt đầu'}
                                </Text>
                            </TouchableOpacity>
                            {showStartDatePicker && (
                                <DateTimePicker
                                    value={formData.ngaybatdau ? new Date(formData.ngaybatdau) : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowStartDatePicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setFormData({ ...formData, ngaybatdau: selectedDate.toISOString().split('T')[0] });
                                        }
                                    }}
                                />
                            )}

                            <Text style={styles.label}>Ngày kết thúc</Text>
                            <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateButton}>
                                <Text style={styles.dateButtonText}>
                                    {formData.ngayketthuc ? new Date(formData.ngayketthuc).toLocaleDateString('vi-VN') : '📅 Chọn ngày kết thúc'}
                                </Text>
                            </TouchableOpacity>
                            {showEndDatePicker && (
                                <DateTimePicker
                                    value={formData.ngayketthuc ? new Date(formData.ngayketthuc) : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowEndDatePicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setFormData({ ...formData, ngayketthuc: selectedDate.toISOString().split('T')[0] });
                                        }
                                    }}
                                />
                            )}

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.saveBtn]}
                                    onPress={handleSave}
                                >
                                    <Text style={styles.saveBtnText}>Lưu</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    content: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#6b7280' },
    searchContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        marginHorizontal: 16, 
        marginTop: 16,
        marginBottom: 12,
        paddingHorizontal: 16, 
        borderRadius: 12, 
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchIcon: { fontSize: 18, marginRight: 8 },
    searchInput: { 
        flex: 1, 
        paddingVertical: 14, 
        fontSize: 16, 
        color: '#111827',
    },
    clearBtn: { 
        padding: 4,
        marginLeft: 8,
    },
    clearBtnText: { 
        fontSize: 20, 
        color: '#9ca3af',
        fontWeight: 'bold',
    },
    filterContainer: { 
        marginBottom: 8,
        paddingVertical: 4,
    },
    filterContent: {
        paddingHorizontal: 16,
        gap: 8,
        alignItems: 'center',
    },
    filterChip: { 
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10, 
        paddingHorizontal: 18, 
        borderRadius: 20, 
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        minHeight: 40,
    },
    filterChipActive: { 
        backgroundColor: '#3b82f6', 
        borderColor: '#3b82f6',
        elevation: 3,
    },
    filterChipText: { 
        fontSize: 14, 
        color: '#6b7280',
        fontWeight: '600',
    },
    filterChipTextActive: { 
        color: '#fff',
        fontWeight: '700',
    },
    filterDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabIcon: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
        lineHeight: 32,
    },
    listContent: { padding: 16, paddingTop: 0, paddingBottom: 100 },
    projectCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3 },
    projectHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    projectInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    projectCode: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    projectName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
    projectDesc: { fontSize: 14, color: '#6b7280', marginBottom: 12, lineHeight: 20 },
    projectFooter: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12, marginBottom: 12 },
    projectDate: { fontSize: 14, color: '#6b7280' },
    projectActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    editBtn: { backgroundColor: '#f59e0b' },
    deleteBtn: { backgroundColor: '#ef4444' },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: '#6b7280' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
    textArea: { height: 100, textAlignVertical: 'top' },
    statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusOption: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
    statusOptionActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    statusOptionText: { fontSize: 14, color: '#6b7280' },
    statusOptionTextActive: { color: '#fff', fontWeight: '600' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#e5e7eb' },
    saveBtn: { backgroundColor: '#3b82f6' },
    cancelBtnText: { color: '#6b7280', fontSize: 16, fontWeight: '600' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    dateButton: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, backgroundColor: '#fff', marginBottom: 12 },
    dateButtonText: { fontSize: 16, color: '#111827' },
});
