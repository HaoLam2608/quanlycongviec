import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import TaskCard from '../../../components/member/TaskCard';
import NotificationBell from '../../../components/NotificationBell';
import { getMemberStats, getMySubtasks, getOverdueTasks, getRecentActivities, getUpcomingTasks } from '../../../src/axios/api';
import { Activity, MemberStats, MemberSubtask, OverdueTask, UpcomingTask } from '../../../types/member';
import { styles } from './index.styles';

export default function MemberDashboardScreen() {
    const [stats, setStats] = useState<MemberStats>({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingApprovalTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
    });
    const [assignedTasks, setAssignedTasks] = useState<MemberSubtask[]>([]);
    const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
    const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
    const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, assignedData, upcomingData, overdueData, activitiesData] = await Promise.all([
                getMemberStats(),
                getMySubtasks(), // Lấy tất cả subtask được giao cho member
                getUpcomingTasks(7),
                getOverdueTasks(),
                getRecentActivities(10),
            ]);

            if (statsData) setStats(statsData);
            // Xử lý dữ liệu subtasks - có thể được wrap trong object
            if (assignedData) {
                if (Array.isArray(assignedData)) {
                    setAssignedTasks(assignedData);
                } else if (assignedData.subtasks && Array.isArray(assignedData.subtasks)) {
                    setAssignedTasks(assignedData.subtasks);
                } else if (assignedData.data && Array.isArray(assignedData.data)) {
                    setAssignedTasks(assignedData.data);
                } else {
                    setAssignedTasks([]);
                }
            } else {
                setAssignedTasks([]);
            }
            if (upcomingData && Array.isArray(upcomingData)) setUpcomingTasks(upcomingData);
            if (overdueData && Array.isArray(overdueData)) setOverdueTasks(overdueData);
            if (activitiesData && Array.isArray(activitiesData)) setRecentActivities(activitiesData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng!';
        if (hour < 18) return 'Chào buổi chiều!';
        return 'Chào buổi tối!';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>{getGreeting()}</Text>
                        <Text style={styles.subtitle}>
                            Chào mừng bạn đến với ứng dụng quản lý công việc
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <NotificationBell userRole="member" />
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: '#667eea' }]}>
                            <Text style={styles.statNumber}>{stats.totalTasks}</Text>
                            <Text style={styles.statLabel}>Tổng công việc</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#2ed573' }]}>
                            <Text style={styles.statNumber}>{stats.completedTasks}</Text>
                            <Text style={styles.statLabel}>Hoàn thành</Text>
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: '#ffa502' }]}>
                            <Text style={styles.statNumber}>{stats.inProgressTasks}</Text>
                            <Text style={styles.statLabel}>Đang xử lý</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#f39c12' }]}>
                            <Text style={styles.statNumber}>{stats.pendingApprovalTasks}</Text>
                            <Text style={styles.statLabel}>Chờ xác nhận</Text>
                        </View>
                    </View>
                    {stats.overdueTasks > 0 && (
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: '#ff4757', flex: 1 }]}>
                                <Text style={styles.statNumber}>{stats.overdueTasks}</Text>
                                <Text style={styles.statLabel}>Quá hạn</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* My Assigned Subtasks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Công việc con được giao</Text>
                        <Text style={styles.sectionCount}>{assignedTasks.length} công việc</Text>
                    </View>
                    {assignedTasks.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="briefcase-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Không có công việc con nào được giao</Text>
                        </View>
                    ) : (
                        assignedTasks.slice(0, 3).map((task) => (
                            <TaskCard
                                key={task.id}
                                id={task.id}
                                title={task.tenSubtask}
                                status={task.trangThai}
                                priority="trung_binh" // MemberSubtask không có priority, set mặc định
                                deadline={task.ngayKetThuc || ''}
                                isSubtask={true} // Luôn là subtask
                                parentTask={task.task?.tentask}
                            />
                        ))
                    )}
                </View>

                {/* Overdue Tasks */}
                {stats.overdueTasks > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>
                                Công việc quá hạn
                            </Text>
                            <View style={[styles.overdueCount, { backgroundColor: '#fee2e2' }]}>
                                <Text style={[styles.overdueCountText, { color: '#dc2626' }]}>
                                    {overdueTasks.length}
                                </Text>
                            </View>
                        </View>
                        {overdueTasks.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
                                <Text style={styles.emptyText}>Đang tải công việc quá hạn...</Text>
                            </View>
                        ) : (
                            overdueTasks.slice(0, 3).map((task) => (
                                <View key={task.id} style={styles.overdueTaskCard}>
                                    <View style={styles.overdueTaskHeader}>
                                        <View style={styles.overdueTaskTitleContainer}>
                                            <Ionicons name="alert-circle" size={18} color="#dc2626" />
                                            <Text style={styles.overdueTaskTitle} numberOfLines={1}>
                                                {task.tenSubtask || task.tentask || task.title}
                                            </Text>
                                        </View>
                                        <View style={styles.overdueDaysBadge}>
                                            <Text style={styles.overdueDaysText}>
                                                Quá {task.daysOverdue} ngày
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.overdueTaskMeta}>
                                        {task.type === 'subtask' && task.parentTask && (
                                            <View style={styles.metaItem}>
                                                <Ionicons name="link-outline" size={14} color="#666" />
                                                <Text style={styles.metaText}>{task.parentTask}</Text>
                                            </View>
                                        )}

                                        <View style={styles.metaItem}>
                                            <Ionicons name="calendar-outline" size={14} color="#dc2626" />
                                            <Text style={[styles.metaText, { color: '#dc2626' }]}>
                                                Hạn: {new Date(task.ngayKetThuc || task.deadline).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>

                                        {(task.mucDoUuTien || task.priority) && (
                                            <View style={styles.metaItem}>
                                                <Ionicons
                                                    name="flag"
                                                    size={14}
                                                    color={
                                                        (task.mucDoUuTien || task.priority) === 'cao' ? '#dc2626' :
                                                            (task.mucDoUuTien || task.priority) === 'trung_binh' ? '#f59e0b' : '#10b981'
                                                    }
                                                />
                                                <Text style={styles.metaText}>
                                                    {task.mucDoUuTien || task.priority === 'cao' ? 'Cao' :
                                                        task.mucDoUuTien || task.priority === 'trung_binh' ? 'Trung bình' : 'Thấp'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}

                        {overdueTasks.length > 3 && (
                            <TouchableOpacity style={styles.viewMoreButton}>
                                <Text style={styles.viewMoreText}>
                                    Xem thêm {overdueTasks.length - 3} công việc quá hạn
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color="#dc2626" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Upcoming Deadlines */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Deadline sắp tới</Text>
                        <Text style={styles.sectionCount}>7 ngày tới</Text>
                    </View>
                    {upcomingTasks.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="time-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Không có deadline sắp tới</Text>
                        </View>
                    ) : (
                        upcomingTasks.slice(0, 3).map((task) => (
                            <View key={task.id} style={styles.upcomingTaskCard}>
                                <View style={styles.upcomingTaskHeader}>
                                    <Text style={styles.upcomingTaskTitle} numberOfLines={1}>
                                        {task.title}
                                    </Text>
                                    <View
                                        style={[
                                            styles.upcomingTaskBadge,
                                            {
                                                backgroundColor:
                                                    task.daysLeft <= 1
                                                        ? '#FEE2E2'
                                                        : task.daysLeft <= 3
                                                            ? '#FFEDD5'
                                                            : '#DBEAFE',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.upcomingTaskBadgeText,
                                                {
                                                    color:
                                                        task.daysLeft <= 1
                                                            ? '#DC2626'
                                                            : task.daysLeft <= 3
                                                                ? '#EA580C'
                                                                : '#2563EB',
                                                },
                                            ]}
                                        >
                                            {task.daysLeft} ngày
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.upcomingTaskMeta}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color="#666" />
                                        <Text style={styles.metaText}>
                                            {new Date(task.deadline).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Recent Activities */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    {recentActivities.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="pulse-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
                        </View>
                    ) : (
                        recentActivities.slice(0, 4).map((activity) => (
                            <View key={activity.id} style={styles.activityItem}>
                                <View
                                    style={[
                                        styles.activityIconContainer,
                                        {
                                            backgroundColor:
                                                activity.type === 'status_change'
                                                    ? '#DCFCE7'
                                                    : activity.type === 'comment'
                                                        ? '#DBEAFE'
                                                        : '#F3E8FF',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={
                                            activity.type === 'status_change'
                                                ? 'checkmark-circle'
                                                : activity.type === 'comment'
                                                    ? 'chatbubble'
                                                    : 'document'
                                        }
                                        size={20}
                                        color={
                                            activity.type === 'status_change'
                                                ? '#16A34A'
                                                : activity.type === 'comment'
                                                    ? '#2563EB'
                                                    : '#9333EA'
                                        }
                                    />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityText} numberOfLines={2}>
                                        {activity.action || activity.description}
                                    </Text>
                                    <Text style={styles.activityTime}>
                                        {activity.timestamp || new Date(activity.createdAt).toLocaleString('vi-VN')}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
