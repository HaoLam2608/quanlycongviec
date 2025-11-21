import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ProjectCalendar } from '../../../components/ProjectCalendar';
import { ProjectTimeline } from '../../../components/ProjectTimeline';
import { getTasksByProject } from '../../../src/axios/api';

export default function CalendarViewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;

    const [projectTasks, setProjectTasks] = useState<any[]>([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    useEffect(() => {
        if (projectId) {
            fetchTasksForCalendar(Number(projectId));
        }
    }, [projectId]);

    const fetchTasksForCalendar = async (id: number) => {
        try {
            setIsLoadingTasks(true);
            const response = await getTasksByProject(id);
            const tasks = Array.isArray(response) ? response : (response.tasks || response.data || []);

            // Flatten tasks và subtasks thành một mảng duy nhất
            const allItems: any[] = [];

            tasks.forEach((task: any) => {
                // Thêm task chính với type = 'task'
                allItems.push({
                    ...task,
                    type: 'task',
                    parentId: null,
                });

                // Thêm các subtasks với type = 'subtask'
                if (task.subtasks && Array.isArray(task.subtasks)) {
                    task.subtasks.forEach((subtask: any) => {
                        allItems.push({
                            ...subtask,
                            type: 'subtask',
                            parentId: task.id,
                            taskId: task.id,
                        });
                    });
                }
            });

            setProjectTasks(allItems);
        } catch (error: any) {
            console.error('❌ Lỗi lấy công việc:', error);
            setProjectTasks([]);
        } finally {
            setIsLoadingTasks(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {projectName || 'Dự án'}
                    </Text>
                    <Text style={styles.headerSubtitle}>Lịch công việc</Text>
                </View>
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                >
                    <Ionicons
                        name={viewMode === 'calendar' ? 'list' : 'calendar'}
                        size={24}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            {isLoadingTasks ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Đang tải công việc...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                >
                    {viewMode === 'calendar' ? (
                        <>
                            {/* Calendar */}
                            <ProjectCalendar
                                tasks={projectTasks}
                                year={selectedYear}
                                month={selectedMonth}
                                onMonthChange={(newYear, newMonth) => {
                                    setSelectedYear(newYear);
                                    setSelectedMonth(newMonth);
                                }}
                            />

                            {/* Task List for Selected Month */}
                            <View style={styles.taskListSection}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="list" size={20} color="#667eea" />
                                    <Text style={styles.sectionTitle}>
                                        Công việc trong tháng
                                    </Text>
                                </View>
                                <ProjectTimeline tasks={projectTasks} />
                            </View>
                        </>
                    ) : (
                        <View style={styles.listOnlyView}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="list" size={20} color="#667eea" />
                                <Text style={styles.sectionTitle}>
                                    Danh sách công việc
                                </Text>
                            </View>
                            <ProjectTimeline tasks={projectTasks} />
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#667eea',
        paddingTop: 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#E0E7FF',
    },
    toggleButton: {
        padding: 8,
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    taskListSection: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginLeft: 8,
    },
    listOnlyView: {
        flex: 1,
    },
});
