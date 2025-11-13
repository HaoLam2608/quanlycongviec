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
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProjectsByManager, createProject, updateProject, deleteProject } from '@/src/axios/api';
import { PageHeader } from '../../components/ui/PageHeader';

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
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
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
                <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                    <Text style={styles.createBtnText}>➕ Tạo dự án mới</Text>
                </TouchableOpacity>
                
                <FlatList
                    data={projects}
                    renderItem={renderProject}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>📋</Text>
                            <Text style={styles.emptyTitle}>Chưa có dự án</Text>
                            <Text style={styles.emptyDesc}>Nhấn nút "Tạo dự án mới" để bắt đầu</Text>
                        </View>
                    }
                />
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
                            <TextInput
                                style={styles.input}
                                value={formData.ngaybatdau}
                                onChangeText={(text) => setFormData({ ...formData, ngaybatdau: text })}
                                placeholder="YYYY-MM-DD"
                            />

                            <Text style={styles.label}>Ngày kết thúc</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.ngayketthuc}
                                onChangeText={(text) => setFormData({ ...formData, ngayketthuc: text })}
                                placeholder="YYYY-MM-DD"
                            />

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
    createBtn: { backgroundColor: '#3b82f6', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    listContent: { padding: 16, paddingTop: 0 },
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
});
