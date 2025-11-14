import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    Modal,
    Platform,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/axios/config';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

interface ReportStats {
    totalProjects: number;
    completedProjects: number;
    ongoingProjects: number;
    pendingProjects: number;
    totalTasks: number;
    completedTasks: number;
    ongoingTasks: number;
    overdueTasks: number;
    totalUsers: number;
    activeUsers: number;
    completionRate: number;
    totalGroups: number;
    activeGroups: number;
    totalDocuments: number;
}

interface DetailedReport {
    id: number;
    projectName: string;
    taskCount: number;
    completedTasks: number;
    memberCount: number;
    completionRate: number;
    status: string;
}

type ReportType = 'overview' | 'projects' | 'users' | 'tasks';
type ExportFormat = 'csv' | 'json';

export default function SystemReports() {
    const [stats, setStats] = useState<ReportStats>({
        totalProjects: 0,
        completedProjects: 0,
        ongoingProjects: 0,
        pendingProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        ongoingTasks: 0,
        overdueTasks: 0,
        totalUsers: 0,
        activeUsers: 0,
        completionRate: 0,
        totalGroups: 0,
        activeGroups: 0,
        totalDocuments: 0,
    });
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [detailedReports, setDetailedReports] = useState<DetailedReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filter states
    const [reportType, setReportType] = useState<ReportType>('overview');
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        loadReportStats();
    }, [startDate, endDate]);

    useEffect(() => {
        if (projects.length > 0 && tasks.length > 0) {
            loadDetailedReports();
        }
    }, [projects, tasks]);

    const loadReportStats = async () => {
        setLoading(true);
        try {
            // Fetch real data like web admin
            const [projectsRes, usersRes, groupsRes, documentsRes] = await Promise.all([
                api.get('/duan/getAll'),
                api.get('/users'),
                api.get('/groups').catch(() => ({ data: [] })),
                api.get('/documents/list').catch(() => ({ data: [] })),
            ]);

            const projectsList = projectsRes.data || [];
            const usersList = usersRes.data?.users || usersRes.data || [];
            const groupsList = Array.isArray(groupsRes.data) ? groupsRes.data : (groupsRes.data?.groups || []);
            const documentsList = Array.isArray(documentsRes.data) ? documentsRes.data : (documentsRes.data?.documents || []);

            setProjects(projectsList);
            setUsers(usersList);
            setGroups(groupsList);
            setDocuments(documentsList);

            // Fetch all tasks for all projects
            const allTasks: any[] = [];
            for (const project of projectsList) {
                try {
                    const tasksRes = await api.get(`/tasks/project/${project.id}`);
                    const projectTasks = tasksRes.data?.tasks || tasksRes.data || [];
                    allTasks.push(...projectTasks);
                } catch (err) {
                    // Skip if project has no tasks
                }
            }
            setTasks(allTasks);

            // Calculate stats from real data
            const totalProjects = projectsList.length;
            const completedProjects = projectsList.filter((p: any) => {
                const s = (p.status || p.trangthai || '').toString().toLowerCase();
                return s === 'da_hoan_thanh' || s === 'completed';
            }).length;
            const ongoingProjects = projectsList.filter((p: any) => {
                const s = (p.status || p.trangthai || '').toString().toLowerCase();
                return s === 'dang_chay' || s === 'dang_thuc_hien' || s === 'inprogress';
            }).length;
            const pendingProjects = projectsList.filter((p: any) => {
                const s = (p.status || p.trangthai || '').toString().toLowerCase();
                return s === 'chua_bat_dau' || s === 'pending';
            }).length;

            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter((t: any) => {
                const s = (t.trangthai || t.trangThai || t.status || '').toString();
                return s === 'Hoàn thành' || s === 'hoan_thanh' || s === 'completed';
            }).length;
            const ongoingTasks = allTasks.filter((t: any) => {
                const s = (t.trangthai || t.trangThai || t.status || '').toString();
                return s === 'Đang chạy' || s === 'dang_chay' || s === 'inprogress';
            }).length;

            const now = new Date();
            const overdueTasks = allTasks.filter((t: any) => {
                const deadline = t.ngayKetThuc || t.ngayketthuc || t.deadline;
                if (!deadline) return false;
                const s = (t.trangthai || t.trangThai || t.status || '').toString();
                const isCompleted = s === 'Hoàn thành' || s === 'hoan_thanh' || s === 'completed';
                return new Date(deadline) < now && !isCompleted;
            }).length;

            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const activeGroups = groupsList.filter((g: any) => g.status === 'active').length;

            setStats({
                totalProjects,
                completedProjects,
                ongoingProjects,
                pendingProjects,
                totalTasks,
                completedTasks,
                ongoingTasks,
                overdueTasks,
                totalUsers: usersList.length,
                activeUsers: usersList.length,
                completionRate,
                totalGroups: groupsList.length,
                activeGroups,
                totalDocuments: documentsList.length,
            });
        } catch (error) {
            console.error('Error loading report stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDetailedReports = async () => {
        try {
            // Use already fetched projects and tasks data
            const detailed: DetailedReport[] = projects.map((project: any) => {
                const projectTasks = tasks.filter((t: any) => {
                    const taskProjectId = (t.duanId || t.duanid || t.duan)?.toString();
                    return taskProjectId === project.id.toString();
                });

                const completedTasks = projectTasks.filter((t: any) => {
                    const s = (t.trangthai || t.trangThai || t.status || '').toString();
                    return s === 'Hoàn thành' || s === 'hoan_thanh' || s === 'completed';
                }).length;

                const taskCount = projectTasks.length;
                const completionRate = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

                // Get unique users working on project tasks
                const projectUsers = new Set(
                    projectTasks.map((t: any) => t.nguoiDuocGiaoId || t.nguoiThucHienId || t.userId).filter(Boolean)
                );

                let managerName = '';
                if (project.nguoiDamNhan) {
                    managerName = project.nguoiDamNhan.hoten || project.nguoiDamNhan.name || '';
                } else if (project.userId) {
                    const manager = users.find((u: any) => u.id === project.userId);
                    managerName = manager ? (manager.hoten || manager.name || '') : '';
                }

                return {
                    id: project.id,
                    projectName: project.tenduan || project.ten || project.name || `Dự án ${project.id}`,
                    taskCount,
                    completedTasks,
                    memberCount: projectUsers.size,
                    completionRate,
                    status: project.trangthai || project.status || 'active',
                    managerName,
                } as DetailedReport & { managerName: string };
            });

            setDetailedReports(detailed);
        } catch (error) {
            console.error('Error loading detailed reports:', error);
        }
    };

    const handleExport = async (format: ExportFormat) => {
        try {
            let content = '';
            const filename = `report_${Date.now()}.${format}`;

            if (format === 'csv') {
                // CSV export
                const headers = 'Dự án,Số công việc,Hoàn thành,Thành viên,Tỷ lệ hoàn thành,Trạng thái\n';
                const rows = detailedReports.map(r => 
                    `"${r.projectName}",${r.taskCount},${r.completedTasks},${r.memberCount},${r.completionRate}%,${r.status}`
                ).join('\n');
                content = headers + rows;
            } else {
                // JSON export
                content = JSON.stringify({
                    exportDate: new Date().toISOString(),
                    dateRange: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString(),
                    },
                    stats,
                    detailedReports,
                }, null, 2);
            }

            // Share the content
            await Share.share({
                message: content,
                title: `Báo cáo ${format.toUpperCase()}`,
            });

            setShowExportModal(false);
            Alert.alert('Thành công', 'Đã xuất báo cáo');
        } catch (error) {
            console.error('Error exporting:', error);
            Alert.alert('Lỗi', 'Không thể xuất báo cáo');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadReportStats();
        await loadDetailedReports();
        setRefreshing(false);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('vi-VN');
    };

    const ReportTypeTab = ({ type, label, icon }: { type: ReportType; label: string; icon: string }) => (
        <TouchableOpacity
            style={[styles.reportTab, reportType === type && styles.reportTabActive]}
            onPress={() => setReportType(type)}
        >
            <Ionicons 
                name={icon as any} 
                size={18} 
                color={reportType === type ? '#06b6d4' : '#ffffff'} 
            />
            <Text style={[styles.reportTabText, reportType === type && styles.reportTabTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const StatCard = ({ icon, title, value, color, subtitle }: any) => (
        <View style={[styles.statCard, { backgroundColor: color + '20' }]}>
            <View style={[styles.statIcon, { backgroundColor: color }]}>
                <Ionicons name={icon} size={24} color="#fff" />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
                {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
            </View>
        </View>
    );

    const ProgressBar = ({ label, value, max, color }: any) => {
        const percentage = (value / max) * 100;
        
        return (
            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{label}</Text>
                    <Text style={styles.progressValue}>{value}/{max}</Text>
                </View>
                <View style={styles.progressBar}>
                    <View 
                        style={[
                            styles.progressFill, 
                            { width: `${percentage}%`, backgroundColor: color }
                        ]} 
                    />
                </View>
                <Text style={styles.progressPercentage}>{percentage.toFixed(0)}%</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Báo cáo hệ thống</Text>
                    <Text style={styles.subtitle}>
                        {formatDate(startDate)} - {formatDate(endDate)}
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsContent}
                        style={styles.tabsContainer}
                    >
                        <ReportTypeTab type="overview" label="Tổng quan" icon="stats-chart" />
                        <ReportTypeTab type="projects" label="Dự án" icon="folder-open" />
                        <ReportTypeTab type="users" label="Người dùng" icon="people" />
                        <ReportTypeTab type="tasks" label="Công việc" icon="checkmark-circle" />
                    </ScrollView>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons name="options" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => setShowExportModal(true)}
                    >
                        <Ionicons name="download" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#06b6d4" />
                        <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
                    </View>
                ) : (
                    <>
                        {/* Overview Report */}
                        {reportType === 'overview' && (
                            <>
                                {/* Overview Stats */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>📊 Tổng quan hệ thống</Text>
                                    <View style={styles.statsGrid}>
                                        <StatCard
                                            icon="folder"
                                            title="Tổng dự án"
                                            value={stats.totalProjects}
                                            color="#10b981"
                                            subtitle={`${stats.completedProjects} hoàn thành`}
                                        />
                                        <StatCard
                                            icon="checkmark-circle"
                                            title="Công việc"
                                            value={stats.totalTasks}
                                            color="#3b82f6"
                                            subtitle={`${stats.completedTasks} hoàn thành`}
                                        />
                                        <StatCard
                                            icon="people"
                                            title="Người dùng"
                                            value={stats.totalUsers}
                                            color="#8b5cf6"
                                            subtitle="hoạt động"
                                        />
                                        <StatCard
                                            icon="trending-up"
                                            title="Tỷ lệ hoàn thành"
                                            value={`${stats.completionRate}%`}
                                            color="#ec4899"
                                            subtitle="công việc"
                                        />
                                    </View>
                                </View>

                                {/* Project Status Stats */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>📁 Trạng thái dự án</Text>
                                    <View style={styles.statsGrid}>
                                        <StatCard
                                            icon="checkmark-done"
                                            title="Hoàn thành"
                                            value={stats.completedProjects}
                                            color="#10b981"
                                            subtitle="dự án"
                                        />
                                        <StatCard
                                            icon="play-circle"
                                            title="Đang chạy"
                                            value={stats.ongoingProjects}
                                            color="#3b82f6"
                                            subtitle="dự án"
                                        />
                                        <StatCard
                                            icon="time"
                                            title="Chưa bắt đầu"
                                            value={stats.pendingProjects}
                                            color="#f59e0b"
                                            subtitle="dự án"
                                        />
                                        <StatCard
                                            icon="alert-circle"
                                            title="Trễ hạn"
                                            value={stats.overdueTasks}
                                            color="#ef4444"
                                            subtitle="công việc"
                                        />
                                    </View>
                                </View>

                                {/* Additional Stats */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>📈 Thống kê khác</Text>
                                    <View style={styles.statsGrid}>
                                        <StatCard
                                            icon="people-circle"
                                            title="Nhóm"
                                            value={stats.totalGroups}
                                            color="#8b5cf6"
                                            subtitle={`${stats.activeGroups} hoạt động`}
                                        />
                                        <StatCard
                                            icon="document-attach"
                                            title="Tài liệu"
                                            value={stats.totalDocuments}
                                            color="#06b6d4"
                                            subtitle="file"
                                        />
                                    </View>
                                </View>

                                {/* Progress Section */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>📈 Tiến độ</Text>
                                    <View style={styles.progressSection}>
                                        <ProgressBar
                                            label="Công việc hoàn thành"
                                            value={stats.completedTasks}
                                            max={stats.totalTasks}
                                            color="#10b981"
                                        />
                                        <ProgressBar
                                            label="Người dùng hoạt động"
                                            value={stats.activeUsers}
                                            max={stats.totalUsers}
                                            color="#3b82f6"
                                        />
                                        <ProgressBar
                                            label="Dự án đang thực hiện"
                                            value={Math.floor(stats.totalProjects * 0.6)}
                                            max={stats.totalProjects}
                                            color="#f59e0b"
                                        />
                                    </View>
                                </View>

                                {/* Performance Cards */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>⚡ Hiệu suất</Text>
                                    
                                    <View style={styles.performanceCard}>
                                        <View style={styles.performanceHeader}>
                                            <Ionicons name="time" size={24} color="#3b82f6" />
                                            <Text style={styles.performanceTitle}>Thời gian trung bình</Text>
                                        </View>
                                        <Text style={styles.performanceValue}>5.2 ngày</Text>
                                        <Text style={styles.performanceLabel}>Hoàn thành mỗi công việc</Text>
                                    </View>

                                    <View style={styles.performanceCard}>
                                        <View style={styles.performanceHeader}>
                                            <Ionicons name="speedometer" size={24} color="#10b981" />
                                            <Text style={styles.performanceTitle}>Năng suất</Text>
                                        </View>
                                        <Text style={styles.performanceValue}>87%</Text>
                                        <Text style={styles.performanceLabel}>Tỷ lệ hoàn thành đúng hạn</Text>
                                    </View>

                                    <View style={styles.performanceCard}>
                                        <View style={styles.performanceHeader}>
                                            <Ionicons name="trophy" size={24} color="#f59e0b" />
                                            <Text style={styles.performanceTitle}>Thành tích</Text>
                                        </View>
                                        <Text style={styles.performanceValue}>{stats.completedTasks}</Text>
                                        <Text style={styles.performanceLabel}>Công việc đã hoàn thành tháng này</Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Projects Report */}
                        {reportType === 'projects' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>📁 Chi tiết dự án</Text>
                                {detailedReports.map((report) => (
                                    <View key={report.id} style={styles.detailCard}>
                                        <View style={styles.detailHeader}>
                                            <Text style={styles.detailTitle}>{report.projectName}</Text>
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: report.status === 'active' ? '#10b981' : '#6b7280' }
                                            ]} />
                                        </View>
                                        <View style={styles.detailStats}>
                                            <View style={styles.detailStat}>
                                                <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                                                <Text style={styles.detailStatText}>
                                                    {report.completedTasks}/{report.taskCount} CV
                                                </Text>
                                            </View>
                                            <View style={styles.detailStat}>
                                                <Ionicons name="people" size={16} color="#8b5cf6" />
                                                <Text style={styles.detailStatText}>
                                                    {report.memberCount} TV
                                                </Text>
                                            </View>
                                            <View style={styles.detailStat}>
                                                <Ionicons name="trending-up" size={16} color="#10b981" />
                                                <Text style={styles.detailStatText}>
                                                    {report.completionRate}%
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.progressBar}>
                                            <View 
                                                style={[
                                                    styles.progressFill, 
                                                    { width: `${report.completionRate}%`, backgroundColor: '#06b6d4' }
                                                ]} 
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Users Report */}
                        {reportType === 'users' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>👥 Thống kê người dùng</Text>
                                <View style={styles.statsGrid}>
                                    <StatCard
                                        icon="people"
                                        title="Tổng số"
                                        value={stats.totalUsers}
                                        color="#8b5cf6"
                                        subtitle="người dùng"
                                    />
                                    <StatCard
                                        icon="pulse"
                                        title="Hoạt động"
                                        value={stats.activeUsers}
                                        color="#10b981"
                                        subtitle="đang online"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Tasks Report */}
                        {reportType === 'tasks' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>✅ Thống kê công việc</Text>
                                <View style={styles.statsGrid}>
                                    <StatCard
                                        icon="list"
                                        title="Tổng số"
                                        value={stats.totalTasks}
                                        color="#3b82f6"
                                        subtitle="công việc"
                                    />
                                    <StatCard
                                        icon="checkmark-done"
                                        title="Hoàn thành"
                                        value={stats.completedTasks}
                                        color="#10b981"
                                        subtitle="công việc"
                                    />
                                </View>
                                <View style={styles.progressSection}>
                                    <ProgressBar
                                        label="Tỷ lệ hoàn thành"
                                        value={stats.completedTasks}
                                        max={stats.totalTasks}
                                        color="#10b981"
                                    />
                                </View>
                            </View>
                        )}

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Bộ lọc báo cáo</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Từ ngày:</Text>
                            <TouchableOpacity 
                                style={styles.dateButton}
                                onPress={() => setShowStartPicker(true)}
                            >
                                <Ionicons name="calendar" size={20} color="#06b6d4" />
                                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                            </TouchableOpacity>
                            
                            {showStartPicker && (
                                <DateTimePicker
                                    value={startDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, date) => {
                                        setShowStartPicker(Platform.OS === 'ios');
                                        if (date) setStartDate(date);
                                    }}
                                />
                            )}
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Đến ngày:</Text>
                            <TouchableOpacity 
                                style={styles.dateButton}
                                onPress={() => setShowEndPicker(true)}
                            >
                                <Ionicons name="calendar" size={20} color="#06b6d4" />
                                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                            </TouchableOpacity>

                            {showEndPicker && (
                                <DateTimePicker
                                    value={endDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, date) => {
                                        setShowEndPicker(Platform.OS === 'ios');
                                        if (date) setEndDate(date);
                                    }}
                                />
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => {
                                setShowFilterModal(false);
                                loadReportStats();
                                loadDetailedReports();
                            }}
                        >
                            <Text style={styles.applyButtonText}>Áp dụng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Export Modal */}
            <Modal
                visible={showExportModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowExportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.exportModal}>
                        <Text style={styles.modalTitle}>Xuất báo cáo</Text>
                        
                        <TouchableOpacity
                            style={styles.exportOption}
                            onPress={() => handleExport('csv')}
                        >
                            <Ionicons name="document-text" size={24} color="#10b981" />
                            <View style={styles.exportInfo}>
                                <Text style={styles.exportTitle}>Xuất CSV</Text>
                                <Text style={styles.exportDesc}>Định dạng bảng tính</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.exportOption}
                            onPress={() => handleExport('json')}
                        >
                            <Ionicons name="code-slash" size={24} color="#3b82f6" />
                            <View style={styles.exportInfo}>
                                <Text style={styles.exportTitle}>Xuất JSON</Text>
                                <Text style={styles.exportDesc}>Định dạng dữ liệu</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowExportModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
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
    header: {
        padding: 18,
        paddingTop: 26,
        backgroundColor: '#06b6d4',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 6,
    },
    tabsContainer: {
        backgroundColor: 'transparent',
        paddingHorizontal: 4,
    },
    reportTab: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        marginRight: 12,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    reportTabActive: {
        backgroundColor: '#fff',
    },
    reportTabText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
    reportTabTextActive: {
        color: '#06b6d4',
    },
    tabsContent: {
        paddingVertical: 12,
        paddingRight: 16,
    },
    content: {
        flex: 1,
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
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    statCard: {
        width: '50%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    statContent: {
        paddingHorizontal: 10,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    statTitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    statSubtitle: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    progressSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressPercentage: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'right',
    },
    performanceCard: {
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
    performanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    performanceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    performanceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    performanceLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        marginHorizontal: 4,
        shadowColor: '#06b6d4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    detailStats: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    detailStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailStatText: {
        fontSize: 13,
        color: '#6b7280',
    },
    reportCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    reportCardHeader: {
        marginBottom: 12,
    },
    reportCardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    reportCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    reportStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    reportStatusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    reportTypeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    reportTypeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    reportCardContent: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    reportCardMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 8,
    },
    reportMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    reportMetaText: {
        fontSize: 12,
        color: '#6b7280',
    },
    reportReviewInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    reportReviewText: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '600',
    },
    reportAttachments: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    reportAttachmentText: {
        fontSize: 12,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 12,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    filterSection: {
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#111827',
    },
    applyButton: {
        backgroundColor: '#06b6d4',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    exportModal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    exportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        marginVertical: 8,
    },
    exportInfo: {
        flex: 1,
        marginLeft: 12,
    },
    exportTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    exportDesc: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    cancelButton: {
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
});