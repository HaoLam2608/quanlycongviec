import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProjectsByManager, getKanbanTasks } from '@/src/axios/api';
import { PageHeader } from '../../components/ui/PageHeader';

interface Task {
    id: number;
    tentask: string;
    mota?: string;
    trangThai: string;
    mucDoUuTien: string;
    ngayKetThuc: string;
    nguoiDuocGiao?: {
        id: number;
        hoten: string;
    };
}

interface KanbanColumn {
    status: string;
    title: string;
    tasks: Task[];
    color: string;
}

export default function KanbanBoard() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [columns, setColumns] = useState<KanbanColumn[]>([
        { status: 'Chưa bắt đầu', title: 'Chưa bắt đầu', tasks: [], color: '#6b7280' },
        { status: 'Đang chạy', title: 'Đang làm', tasks: [], color: '#f59e0b' },
        { status: 'Chờ xác nhận hoàn thành', title: 'Chờ xác nhận', tasks: [], color: '#3b82f6' },
        { status: 'Hoàn thành', title: 'Hoàn thành', tasks: [], color: '#10b981' },
    ]);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (params.projectId && projects.length > 0) {
            const project = projects.find(p => p.id === Number(params.projectId));
            if (project) {
                setSelectedProject(project);
                loadKanbanData(project.id);
            }
        }
    }, [params.projectId, projects]);

    const loadProjects = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                const projectsData = await fetchProjectsByManager(user.id);
                setProjects(projectsData);
                
                // Auto-select first project if not specified
                if (!params.projectId && projectsData.length > 0) {
                    setSelectedProject(projectsData[0]);
                    loadKanbanData(projectsData[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách dự án');
            setLoading(false);
        }
    };

    const loadKanbanData = async (projectId: number) => {
        try {
            setLoading(true);
            const kanbanData = await getKanbanTasks(projectId);
            
            // Organize tasks by status
            const newColumns = columns.map(col => ({
                ...col,
                tasks: kanbanData[col.status] || []
            }));
            
            setColumns(newColumns);
        } catch (error) {
            console.error('Error loading kanban data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu Kanban');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        if (selectedProject) {
            setRefreshing(true);
            loadKanbanData(selectedProject.id);
        }
    };

    const selectProject = (project: any) => {
        setSelectedProject(project);
        loadKanbanData(project.id);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const renderTaskCard = (task: Task) => (
        <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            onPress={() => router.push(`/(manager)/task-detail?id=${task.id}`)}
        >
            <View style={styles.taskHeader}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.mucDoUuTien) }]} />
                <Text style={styles.taskTitle} numberOfLines={2}>{task.tentask}</Text>
            </View>
            
            {task.mota && (
                <Text style={styles.taskDesc} numberOfLines={2}>{task.mota}</Text>
            )}
            
            {task.nguoiDuocGiao && (
                <View style={styles.assigneeContainer}>
                    <View style={styles.assigneeAvatar}>
                        <Text style={styles.assigneeInitial}>
                            {task.nguoiDuocGiao.hoten.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.assigneeName} numberOfLines={1}>
                        {task.nguoiDuocGiao.hoten}
                    </Text>
                </View>
            )}
            
            <Text style={styles.dueDate}>
                📅 {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}
            </Text>
        </TouchableOpacity>
    );

    const renderColumn = (column: KanbanColumn) => (
        <View key={column.status} style={styles.column}>
            <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
                <Text style={styles.columnTitle}>{column.title}</Text>
                <View style={styles.columnCount}>
                    <Text style={styles.columnCountText}>{column.tasks.length}</Text>
                </View>
            </View>
            
            <ScrollView 
                style={styles.columnContent}
                showsVerticalScrollIndicator={false}
            >
                {column.tasks.length > 0 ? (
                    column.tasks.map(task => renderTaskCard(task))
                ) : (
                    <View style={styles.emptyColumn}>
                        <Text style={styles.emptyColumnText}>Không có công việc</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );

    if (loading && !selectedProject) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Kanban Board" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Kanban Board" />
            
            {/* Project selector */}
            {projects.length > 0 && (
                <View style={styles.projectSelector}>
                    <Text style={styles.selectorLabel}>Chọn dự án:</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.projectList}
                    >
                        {projects.map((project) => (
                            <TouchableOpacity
                                key={project.id}
                                style={[
                                    styles.projectChip,
                                    selectedProject?.id === project.id && styles.projectChipActive
                                ]}
                                onPress={() => selectProject(project)}
                            >
                                <Text style={[
                                    styles.projectChipText,
                                    selectedProject?.id === project.id && styles.projectChipTextActive
                                ]}>
                                    {project.tenduan}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {selectedProject ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.boardContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {columns.map(column => renderColumn(column))}
                </ScrollView>
            ) : (
                <View style={styles.noProjectContainer}>
                    <Text style={styles.noProjectIcon}>📋</Text>
                    <Text style={styles.noProjectTitle}>Chưa có dự án</Text>
                    <Text style={styles.noProjectText}>Vui lòng tạo dự án mới để sử dụng Kanban Board</Text>
                </View>
            )}
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
    projectSelector: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    selectorLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    projectList: {
        flexDirection: 'row',
    },
    projectChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    projectChipActive: {
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
    },
    projectChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    projectChipTextActive: {
        color: '#fff',
    },
    boardContainer: {
        flex: 1,
        padding: 16,
    },
    column: {
        width: 280,
        marginRight: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    columnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    columnTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    columnCount: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    columnCountText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    columnContent: {
        flex: 1,
        padding: 12,
        maxHeight: 600,
    },
    taskCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
        marginTop: 4,
    },
    taskTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        lineHeight: 18,
    },
    taskDesc: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
        lineHeight: 16,
    },
    assigneeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    assigneeAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    assigneeInitial: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    assigneeName: {
        flex: 1,
        fontSize: 12,
        color: '#1f2937',
        fontWeight: '500',
    },
    dueDate: {
        fontSize: 11,
        color: '#6b7280',
    },
    emptyColumn: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyColumnText: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    noProjectContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    noProjectIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    noProjectTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    noProjectText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});
