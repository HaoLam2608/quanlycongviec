import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyGroup, getGroupSubtasks, getMyProjects, getMyTasks } from '@/src/axios/api';
import { BarChart, PieChart } from 'react-native-chart-kit';

interface ReportStats {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    totalSubtasks: number;
    completedSubtasks: number;
    inProgressSubtasks: number;
    pendingSubtasks: number;
    groupMembers: number;
    taskCompletionRate: number;
    subtaskCompletionRate: number;
}

interface ProjectSummary {
    key: string;
    id?: number | null;
    tenduan: string;
    taskCount: number;
    completedTaskCount: number;
    progress: number;
}

const DEFAULT_STATS: ReportStats = {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    totalSubtasks: 0,
    completedSubtasks: 0,
    inProgressSubtasks: 0,
    pendingSubtasks: 0,
    groupMembers: 0,
    taskCompletionRate: 0,
    subtaskCompletionRate: 0
};

export default function TeamLeadReportsScreen() {
    const [stats, setStats] = useState<ReportStats>(DEFAULT_STATS);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = Math.max(screenWidth - 32, 240);

    const chartConfig = useMemo(
        () => ({
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity: number = 1) => `rgba(49, 46, 129, ${opacity})`,
            labelColor: (opacity: number = 1) => `rgba(55, 65, 81, ${opacity})`,
            propsForBackgroundLines: {
                strokeDasharray: ''
            }
        }),
        []
    );

    const taskStatusData = useMemo(() => {
        if (stats.totalTasks === 0) {
            return [];
        }

        return [
            {
                name: 'Chưa bắt đầu',
                population: stats.pendingTasks,
                color: '#6b7280',
                legendFontColor: '#4b5563',
                legendFontSize: 13
            },
            {
                name: 'Đang thực hiện',
                population: stats.inProgressTasks,
                color: '#3b82f6',
                legendFontColor: '#4b5563',
                legendFontSize: 13
            },
            {
                name: 'Hoàn thành',
                population: stats.completedTasks,
                color: '#10b981',
                legendFontColor: '#4b5563',
                legendFontSize: 13
            }
        ].filter(item => item.population > 0);
    }, [stats.completedTasks, stats.inProgressTasks, stats.pendingTasks, stats.totalTasks]);

    const subtaskStatusData = useMemo(() => {
        if (stats.totalSubtasks === 0) {
            return [];
        }

        return [
            {
                name: 'Chưa bắt đầu',
                population: stats.pendingSubtasks,
                color: '#6b7280',
                legendFontColor: '#4b5563',
                legendFontSize: 13
            },
            {
                name: 'Đang thực hiện',
                population: stats.inProgressSubtasks,
                color: '#3b82f6',
                legendFontColor: '#4b5563',
                legendFontSize: 13
            },
            {
                name: 'Hoàn thành',
                population: stats.completedSubtasks,
                color: '#10b981',
                legendFontColor: '#4b5563',
                legendFontSize: 13
            }
        ].filter(item => item.population > 0);
    }, [stats.completedSubtasks, stats.inProgressSubtasks, stats.pendingSubtasks, stats.totalSubtasks]);

    const projectProgressChartData = useMemo(() => {
        if (!projects.length) {
            return null;
        }

        const topProjects = projects
            .slice()
            .sort((a, b) => b.taskCount - a.taskCount)
            .slice(0, 5);

        return {
            labels: topProjects.map(project =>
                project.tenduan.length > 8 ? `${project.tenduan.slice(0, 7)}…` : project.tenduan
            ),
            datasets: [
                {
                    data: topProjects.map(project => project.progress)
                }
            ]
        };
    }, [projects]);

    const loadReportData = async () => {
        try {
            const [groupData, projectsData, tasksData, subtasksData] = await Promise.all([
                getMyGroup().catch(() => null),
                getMyProjects().catch(() => []),
                getMyTasks().catch(() => []),
                getGroupSubtasks().catch(() => ({ subtasks: [] }))
            ]);

            // Process group data
            const members = groupData?.members || groupData?.groupMembers || [];
            const groupMembers = Array.isArray(members) ? members.length : 0;

            // Process projects
            const projectList = Array.isArray(projectsData) ? projectsData : projectsData?.projects || [];
            const readProjectStatus = (project: any) => {
                const status = project?.trangthai
                    ?? project?.trangThai
                    ?? project?.status
                    ?? project?.project?.trangthai
                    ?? project?.project?.trangThai
                    ?? project?.project?.status
                    ?? '';
                return typeof status === 'string' ? status.toLowerCase() : '';
            };

            const totalProjects = projectList.length;
            const activeProjects = projectList.filter((p: any) => {
                const status = readProjectStatus(p);
                return status === 'đang thực hiện' || status === 'dang thuc hien' || status === 'active';
            }).length;
            const completedProjects = projectList.filter((p: any) => {
                const status = readProjectStatus(p);
                return status === 'hoàn thành' || status === 'completed';
            }).length;

            // Process tasks
            const taskList = Array.isArray(tasksData) ? tasksData : tasksData?.tasks || [];
            const totalTasks = taskList.length;
            const completedTasks = taskList.filter((t: any) => t.trangThai === 'Hoàn thành').length;
            const inProgressTasks = taskList.filter((t: any) => t.trangThai === 'Đang chạy').length;
            const pendingTasks = taskList.filter((t: any) => t.trangThai === 'Chưa bắt đầu').length;
            const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // Process subtasks
            const subtaskList = subtasksData?.subtasks || [];
            const totalSubtasks = subtaskList.length;
            const completedSubtasks = subtaskList.filter((st: any) => st.trangThai === 'Hoàn thành').length;
            const inProgressSubtasks = subtaskList.filter((st: any) => st.trangThai === 'Đang chạy').length;
            const pendingSubtasks = subtaskList.filter((st: any) => st.trangThai === 'Chưa bắt đầu').length;
            const subtaskCompletionRate = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

            // Process project summaries
            const projectSummaryMap = new Map<string, ProjectSummary>();

            projectList.forEach((project: any, index: number) => {
                const rawId = project?.projectId ?? project?.id ?? project?.project?.id ?? null;
                const numericId = typeof rawId === 'number' ? rawId : null;
                const mapKey = numericId !== null ? `project-${numericId}` : `project-${index}`;

                const projectTasks = numericId !== null
                    ? taskList.filter((t: any) => t.duAnId === numericId || t.projectId === numericId)
                    : [];
                const projectCompletedTasks = projectTasks.filter((t: any) => t.trangThai === 'Hoàn thành').length;
                const progress = projectTasks.length > 0 ? (projectCompletedTasks / projectTasks.length) * 100 : 0;

                const projectName = project?.tenduan
                    ?? project?.tenDuAn
                    ?? project?.project?.tenduan
                    ?? project?.project?.tenDuAn
                    ?? (numericId !== null ? `Dự án #${numericId}` : `Dự án #${index + 1}`);

                projectSummaryMap.set(mapKey, {
                    key: mapKey,
                    id: numericId,
                    tenduan: projectName,
                    taskCount: projectTasks.length,
                    completedTaskCount: projectCompletedTasks,
                    progress: Math.round(progress)
                });
            });

            const projectSummaries = Array.from(projectSummaryMap.values());

            setStats({
                totalProjects,
                activeProjects,
                completedProjects,
                totalTasks,
                completedTasks,
                inProgressTasks,
                pendingTasks,
                totalSubtasks,
                completedSubtasks,
                inProgressSubtasks,
                pendingSubtasks,
                groupMembers,
                taskCompletionRate: Math.round(taskCompletionRate),
                subtaskCompletionRate: Math.round(subtaskCompletionRate)
            });

            setProjects(projectSummaries);
        } catch (error) {
            console.error('Load report data error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadReportData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadReportData();
    }, []);

    const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) => (
        <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
            <View style={styles.statHeader}>
                <Ionicons name={icon as any} size={28} color={color} />
                <Text style={styles.statValue}>{value}</Text>
            </View>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    const ProgressBar = ({ progress, color }: { progress: number; color: string }) => (
        <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Báo cáo tổng quan</Text>
                    <Text style={styles.headerSubtitle}>Thống kê công việc nhóm</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#7c3aed" />
                        <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
                    </View>
                ) : (
                    <>
                        {/* Overview Stats */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Tổng quan</Text>
                            <View style={styles.statsGrid}>
                                <StatCard icon="people" label="Thành viên" value={stats.groupMembers} color="#7c3aed" />
                                <StatCard icon="briefcase" label="Dự án" value={stats.totalProjects} color="#3b82f6" />
                                <StatCard icon="list" label="Công việc" value={stats.totalTasks} color="#10b981" />
                                <StatCard icon="checkbox" label="Công việc con" value={stats.totalSubtasks} color="#f59e0b" />
                            </View>
                        </View>

                        {/* Project Stats */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Dự án</Text>
                            <View style={styles.statsGrid}>
                                <StatCard icon="play-circle" label="Đang thực hiện" value={stats.activeProjects} color="#3b82f6" />
                                <StatCard icon="checkmark-circle" label="Hoàn thành" value={stats.completedProjects} color="#10b981" />
                            </View>
                        </View>

                        {/* Task Stats */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Công việc</Text>
                            <View style={styles.statsGrid}>
                                <StatCard icon="pause-circle" label="Chưa bắt đầu" value={stats.pendingTasks} color="#6b7280" />
                                <StatCard icon="play-circle" label="Đang thực hiện" value={stats.inProgressTasks} color="#3b82f6" />
                                <StatCard icon="checkmark-circle" label="Hoàn thành" value={stats.completedTasks} color="#10b981" />
                            </View>
                            <View style={styles.progressCard}>
                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressLabel}>Tiến độ hoàn thành</Text>
                                    <Text style={styles.progressValue}>{stats.taskCompletionRate}%</Text>
                                </View>
                                <ProgressBar progress={stats.taskCompletionRate} color="#10b981" />
                            </View>
                            {taskStatusData.length > 0 && (
                                <View style={styles.chartCard}>
                                    <Text style={styles.chartTitle}>Phân bố trạng thái công việc</Text>
                                    <PieChart
                                        data={taskStatusData}
                                        width={chartWidth}
                                        height={220}
                                        chartConfig={chartConfig}
                                        accessor="population"
                                        backgroundColor="transparent"
                                        paddingLeft="16"
                                    />
                                </View>
                            )}
                        </View>

                        {/* Subtask Stats */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Công việc con</Text>
                            <View style={styles.statsGrid}>
                                <StatCard icon="pause-circle" label="Chưa bắt đầu" value={stats.pendingSubtasks} color="#6b7280" />
                                <StatCard icon="play-circle" label="Đang thực hiện" value={stats.inProgressSubtasks} color="#3b82f6" />
                                <StatCard icon="checkmark-circle" label="Hoàn thành" value={stats.completedSubtasks} color="#10b981" />
                            </View>
                            <View style={styles.progressCard}>
                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressLabel}>Tiến độ hoàn thành</Text>
                                    <Text style={styles.progressValue}>{stats.subtaskCompletionRate}%</Text>
                                </View>
                                <ProgressBar progress={stats.subtaskCompletionRate} color="#10b981" />
                            </View>
                            {subtaskStatusData.length > 0 && (
                                <View style={styles.chartCard}>
                                    <Text style={styles.chartTitle}>Phân bố trạng thái công việc con</Text>
                                    <PieChart
                                        data={subtaskStatusData}
                                        width={chartWidth}
                                        height={220}
                                        chartConfig={chartConfig}
                                        accessor="population"
                                        backgroundColor="transparent"
                                        paddingLeft="16"
                                    />
                                </View>
                            )}
                        </View>

                        {/* Project Details */}
                        {projects.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Chi tiết dự án</Text>
                                {projectProgressChartData && (
                                    <View style={styles.chartCard}>
                                        <Text style={styles.chartTitle}>Top dự án theo tiến độ</Text>
                                        <BarChart
                                            data={projectProgressChartData}
                                            width={chartWidth}
                                            height={240}
                                            chartConfig={chartConfig}
                                            yAxisLabel=""
                                            yAxisSuffix="%"
                                            fromZero
                                            withInnerLines={false}
                                            showValuesOnTopOfBars
                                        />
                                    </View>
                                )}
                                {projects.map(project => (
                                    <View key={project.key} style={styles.projectCard}>
                                        <Text style={styles.projectName}>{project.tenduan}</Text>
                                        <View style={styles.projectStats}>
                                            <Text style={styles.projectStatsText}>
                                                {project.completedTaskCount}/{project.taskCount} công việc
                                            </Text>
                                            <Text style={styles.projectProgress}>{project.progress}%</Text>
                                        </View>
                                        <ProgressBar progress={project.progress} color="#7c3aed" />
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    scrollContent: {
        paddingBottom: 32
    },
    header: {
        padding: 16,
        paddingTop: 18
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#312e81'
    },
    headerSubtitle: {
        marginTop: 4,
        fontSize: 14,
        color: '#6b7280'
    },
    loadingContainer: {
        padding: 48,
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280'
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#312e81',
        marginBottom: 12
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937'
    },
    statLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500'
    },
    progressCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    progressLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151'
    },
    progressValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10b981'
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: '#e5e7eb',
        borderRadius: 999,
        overflow: 'hidden'
    },
    progressBar: {
        height: '100%',
        borderRadius: 999
    },
    projectCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    projectName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8
    },
    projectStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    projectStatsText: {
        fontSize: 13,
        color: '#6b7280'
    },
    projectProgress: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7c3aed'
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    chartTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#312e81',
        marginBottom: 12
    }
});
