import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, StyleSheet, Text, View, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProjectsByManager, getTasksByProject, createTask } from '@/src/axios/api';
import { PageHeader } from '../../components/ui/PageHeader';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Task {
    id: number;
    tentask: string;
    mota: string;
    trangThai: string;
    mucDoUuTien: string;
    ngayBatDau: string;
    ngayKetThuc: string;
    duanId: number;
    nguoiDuocGiao?: {
        id: number;
        hoten: string;
        manv: string;
    };
}

interface Project {
    id: number;
    tenduan: string;
}

export default function TaskManagement() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            console.log('📱 Tasks - User data:', userData);
            
            if (userData) {
                const user = JSON.parse(userData);
                console.log('👤 Tasks - User ID:', user.id);
                
                const projectsData = await fetchProjectsByManager(user.id);
                console.log('📋 Tasks - Projects loaded:', projectsData.length);
                setProjects(projectsData);
                
                let allTasks: any[] = [];
                for (const project of projectsData) {
                    try {
                        console.log(`🔍 Loading tasks for project ${project.id}: ${project.tenduan}`);
                        const projectTasks = await getTasksByProject(project.id);
                        console.log(`✅ Tasks found for project ${project.id}:`, projectTasks.length);
                        
                        // Add project info to each task
                        const tasksWithProject = projectTasks.map((task: any) => ({
                            ...task,
                            projectName: project.tenduan
                        }));
                        allTasks = [...allTasks, ...tasksWithProject];
                    } catch (error) {
                        console.log(`❌ No tasks for project ${project.id}:`, error);
                    }
                }
                console.log('📊 Total tasks loaded:', allTasks.length);
                setTasks(allTasks);
                // ensure a default selected project for the create modal
                if (!selectedProjectId && projectsData && projectsData.length > 0) {
                    setSelectedProjectId(projectsData[0].id);
                }
            }
        } catch (error) {
            console.error('❌ Error loading tasks:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách công việc');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTasks();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Chưa bắt đầu': return '#6b7280';
            case 'Đang chạy': return '#f59e0b';
            case 'Chờ xác nhận hoàn thành': return '#3b82f6';
            case 'Hoàn thành': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'high': return 'Cao';
            case 'medium': return 'Trung bình';
            case 'low': return 'Thấp';
            default: return priority;
        }
    };

    const filteredTasks = tasks.filter(task => {
        // Filter by status
        const matchesStatus = filter === 'all' || task.trangThai === filter;
        
        // Filter by search query
        const matchesSearch = searchQuery.trim() === '' || 
            task.tentask.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.mota?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task as any).projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.nguoiDuocGiao?.hoten.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesStatus && matchesSearch;
    });

    const renderTask = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={styles.taskCard}
            onPress={() => router.push(`/(manager)/task-detail?id=${item.id}`)}
        >
            <View style={styles.taskHeader}>
                <View style={styles.badges}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.trangThai) }]}>
                        <Text style={styles.badgeText}>{item.trangThai}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.mucDoUuTien) }]}>
                        <Text style={styles.badgeText}>{getPriorityText(item.mucDoUuTien)}</Text>
                    </View>
                </View>
            </View>
            
            <Text style={styles.taskName}>{item.tentask}</Text>
            
            {item.mota && (
                <Text style={styles.taskDesc} numberOfLines={2}>{item.mota}</Text>
            )}

            <View style={styles.taskInfo}>
                <Text style={styles.projectTag}>📁 {(item as any).projectName}</Text>
            </View>

            {item.nguoiDuocGiao && (
                <View style={styles.assignee}>
                    <Text style={styles.assigneeLabel}>👤 Người thực hiện:</Text>
                    <Text style={styles.assigneeName}>{item.nguoiDuocGiao.hoten}</Text>
                </View>
            )}

            <View style={styles.taskFooter}>
                <Text style={styles.dateText}>
                    📅 {new Date(item.ngayBatDau).toLocaleDateString('vi-VN')} - {new Date(item.ngayKetThuc).toLocaleDateString('vi-VN')}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Quản lý công việc" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Quản lý công việc" />
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm công việc, dự án, người thực hiện..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity 
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                        >
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            
            {/* Filter tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        Tất cả ({tasks.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'Chưa bắt đầu' && styles.filterTabActive]}
                    onPress={() => setFilter('Chưa bắt đầu')}
                >
                    <Text style={[styles.filterText, filter === 'Chưa bắt đầu' && styles.filterTextActive]}>
                        Chưa bắt đầu
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'Đang chạy' && styles.filterTabActive]}
                    onPress={() => setFilter('Đang chạy')}
                >
                    <Text style={[styles.filterText, filter === 'Đang chạy' && styles.filterTextActive]}>
                        Đang làm
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredTasks}
                renderItem={renderTask}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyTitle}>Chưa có công việc</Text>
                        <Text style={styles.emptyText}>
                            {filter === 'all' 
                                ? 'Chưa có công việc nào được tạo'
                                : `Không có công việc "${filter}"`
                            }
                        </Text>
                    </View>
                }
            />

            {/* Floating Create Button */}
            <TouchableOpacity style={styles.fab} onPress={() => {
                // prepare modal defaults
                setNewTitle('');
                setNewDesc('');
                setNewStartDate('');
                setNewDueDate('');
                if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
                setShowCreateModal(true);
            }}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Create Task Modal */}
            <Modal visible={showCreateModal} animationType="slide" transparent>
                <View style={modalStyles.modalOverlay}>
                    <View style={modalStyles.modalContent}>
                        <Text style={modalStyles.modalTitle}>Tạo công việc mới</Text>
                        <ScrollView showsVerticalScrollIndicator={false} style={modalStyles.scrollContent}>
                            <Text style={modalStyles.label}>Dự án</Text>
                            <ScrollView style={modalStyles.projectList} nestedScrollEnabled={true}>
                                {projects.map(p => (
                                    <TouchableOpacity key={p.id} onPress={() => setSelectedProjectId(p.id)} style={[modalStyles.projectOption, selectedProjectId === p.id && modalStyles.projectOptionSelected]}>
                                        <Text style={[modalStyles.projectOptionText, selectedProjectId === p.id && { color: '#fff' }]}>{p.tenduan}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            
                            <Text style={modalStyles.label}>Tiêu đề *</Text>
                            <TextInput placeholder="Nhập tiêu đề công việc" value={newTitle} onChangeText={setNewTitle} style={modalStyles.input} />
                            
                            <Text style={modalStyles.label}>Mô tả</Text>
                            <TextInput placeholder="Nhập mô tả (tuỳ chọn)" value={newDesc} onChangeText={setNewDesc} style={[modalStyles.input, modalStyles.textArea]} multiline numberOfLines={3} />
                            
                            <Text style={modalStyles.label}>Ngày bắt đầu *</Text>
                            <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={modalStyles.dateButton}>
                                <Text style={[modalStyles.dateButtonText, !newStartDate && modalStyles.placeholderText]}>
                                    {newStartDate ? `📅 ${new Date(newStartDate).toLocaleDateString('vi-VN')}` : '📅 Chọn ngày bắt đầu'}
                                </Text>
                            </TouchableOpacity>
                            {showStartDatePicker && (
                                <DateTimePicker
                                    value={newStartDate ? new Date(newStartDate) : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowStartDatePicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setNewStartDate(selectedDate.toISOString().split('T')[0]);
                                        }
                                    }}
                                />
                            )}
                            
                            <Text style={modalStyles.label}>Ngày kết thúc *</Text>
                            <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={modalStyles.dateButton}>
                                <Text style={[modalStyles.dateButtonText, !newDueDate && modalStyles.placeholderText]}>
                                    {newDueDate ? `📅 ${new Date(newDueDate).toLocaleDateString('vi-VN')}` : '📅 Chọn ngày kết thúc'}
                                </Text>
                            </TouchableOpacity>
                            {showEndDatePicker && (
                                <DateTimePicker
                                    value={newDueDate ? new Date(newDueDate) : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowEndDatePicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setNewDueDate(selectedDate.toISOString().split('T')[0]);
                                        }
                                    }}
                                />
                            )}
                        </ScrollView>
                        
                        <View style={modalStyles.modalActions}>
                            <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => setShowCreateModal(false)}>
                                <Text style={modalStyles.modalBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#3b82f6' }]} onPress={async () => {
                                try {
                                    if (!newTitle.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề công việc');
                                    if (!selectedProjectId) return Alert.alert('Lỗi', 'Vui lòng chọn dự án');
                                    if (!newStartDate.trim()) return Alert.alert('Lỗi', 'Vui lòng chọn ngày bắt đầu');
                                    if (!newDueDate.trim()) return Alert.alert('Lỗi', 'Vui lòng chọn ngày kết thúc');
                                    
                                    const startDate = new Date(newStartDate);
                                    const endDate = new Date(newDueDate);
                                    if (startDate > endDate) {
                                        return Alert.alert('Lỗi', 'Ngày bắt đầu phải trước ngày kết thúc');
                                    }
                                    
                                    const userData = await AsyncStorage.getItem('user');
                                    let nguoiDuocGiaoId = 0;
                                    if (userData) {
                                        const user = JSON.parse(userData);
                                        nguoiDuocGiaoId = user.id;
                                    }
                                    const duanId = selectedProjectId ?? (projects[0]?.id ?? 0);
                                    await createTask({
                                        tentask: newTitle,
                                        mota: newDesc,
                                        duanId,
                                        nguoiDuocGiaoId,
                                        ngayBatDau: newStartDate,
                                        ngayKetThuc: newDueDate,
                                    });
                                    Alert.alert('Thành công', 'Tạo công việc mới thành công');
                                    setShowCreateModal(false);
                                    setRefreshing(true);
                                    await loadTasks();
                                } catch (err: any) {
                                    console.error('Create task error', err);
                                    Alert.alert('Lỗi', err?.message || 'Không thể tạo công việc');
                                }
                            }}>
                                <Text style={[modalStyles.modalBtnText, { color: '#fff' }]}>Tạo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    searchContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        padding: 0,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    clearIcon: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '700',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: '#f59e0b',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    taskCard: {
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
    taskHeader: {
        marginBottom: 8,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    taskName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    taskDesc: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
        lineHeight: 20,
    },
    taskInfo: {
        marginBottom: 8,
    },
    projectTag: {
        fontSize: 13,
        color: '#3b82f6',
        fontWeight: '500',
    },
    assignee: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    assigneeLabel: {
        fontSize: 13,
        color: '#6b7280',
    },
    assigneeName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1f2937',
    },
    taskFooter: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
        marginTop: 8,
    },
    dateText: {
        fontSize: 12,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    fabText: {
        color: '#fff',
        fontSize: 28,
        lineHeight: 28,
        fontWeight: '700',
    },
});

const modalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        width: '100%',
        maxWidth: 720,
        maxHeight: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    scrollContent: {
        flexGrow: 0,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
        marginTop: 4,
    },
    projectList: {
        maxHeight: 100,
        marginBottom: 16,
    },
    projectOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        marginBottom: 8,
    },
    projectOptionSelected: {
        backgroundColor: '#3b82f6',
    },
    projectOptionText: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        marginBottom: 16,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
    },
    dateButtonText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    placeholderText: {
        color: '#9ca3af',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    modalBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    modalBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
});
