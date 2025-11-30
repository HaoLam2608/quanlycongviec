import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { cacheDirectory, EncodingType, StorageAccessFramework, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Linking,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { getWorklogs } from '../../src/axios/api';
import api from '../../src/axios/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

interface ReportStats {
    totalProjects: number;
    completedProjects: number;
    ongoingProjects: number;
    pendingProjects: number;
    totalTasks: number;
    completedTasks: number;
    ongoingTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalUsers: number;
    activeUsers: number;
    usersWithNoTasks: number;
    avgTasksPerUser: number;
    avgTasksPerActiveUser: number;
    completionRate: number;
    avgCompletionDays: number;
    onTimeCompletionRate: number;
    totalGroups: number;
    activeGroups: number;
    totalSubtasks: number;
    completedSubtasks: number;
    ongoingSubtasks: number;
    pendingSubtasks: number;
    totalDocuments: number;
    documentsPerProject: number;
    totalHoursLogged: number;
    avgHoursPerUser: number;
}

interface DetailedReport {
    id: number;
    projectName: string;
    taskCount: number;
    completedTasks: number;
    memberCount: number;
    completionRate: number;
    status: string;
    manager?: string;
    deadline?: string;
}


interface TopPerformer {
    name: string;
    tasks: number;
    avatar?: string;
}

type ReportType = 'overview' | 'projects' | 'users' | 'tasks';
type ExportFormat = 'csv' | 'json' | 'pdf';

export default function SystemReports() {
    const [stats, setStats] = useState<ReportStats>({
        totalProjects: 0,
        completedProjects: 0,
        ongoingProjects: 0,
        pendingProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        ongoingTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalUsers: 0,
    activeUsers: 0,
    usersWithNoTasks: 0,
    avgTasksPerUser: 0,
    avgTasksPerActiveUser: 0,
        completionRate: 0,
    avgCompletionDays: 0,
    onTimeCompletionRate: 0,
        totalGroups: 0,
        activeGroups: 0,
        totalSubtasks: 0,
        completedSubtasks: 0,
        ongoingSubtasks: 0,
        pendingSubtasks: 0,
        totalDocuments: 0,
        documentsPerProject: 0,
        totalHoursLogged: 0,
        avgHoursPerUser: 0,
    });
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [detailedReports, setDetailedReports] = useState<DetailedReport[]>([]);
    const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
    const [usersStats, setUsersStats] = useState<any[]>([]);
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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    
    // Chart data
    const [chartData, setChartData] = useState({
        projectStatus: [
            { name: 'Hoàn thành', population: 0, color: '#10b981', legendFontColor: '#374151', legendFontSize: 12 },
            { name: 'Đang chạy', population: 0, color: '#3b82f6', legendFontColor: '#374151', legendFontSize: 12 },
            { name: 'Chưa bắt đầu', population: 0, color: '#f59e0b', legendFontColor: '#374151', legendFontSize: 12 },
        ],
        monthlyTrend: {
            labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0],
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                strokeWidth: 2,
            }],
            legend: ['Công việc hoàn thành'],
        },
        userPerformance: {
            labels: ['User 1', 'User 2', 'User 3', 'User 4', 'User 5'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
            }],
        },
    });

    useEffect(() => {
        loadReportStats(startDate, endDate);
    }, [startDate, endDate]);

    useEffect(() => {
        if (projects.length > 0 && tasks.length > 0) {
            loadDetailedReports();
        }
    }, [projects, tasks]);

    const loadReportStats = async (filterStart?: Date, filterEnd?: Date) => {
        setLoading(true);
        try {
            // Use provided dates or state dates
            const startFilter = filterStart || startDate;
            const endFilter = filterEnd || endDate;
            
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

            // Filter projects by date range (include ongoing projects that started before endFilter)
            const filteredProjects = projectsList.filter((p: any) => {
                const start = p.ngayBatDau || p.createdAt || null;
                const end = p.ngayKetThuc || null;

                if (!start && !end) return true;

                const startDateProj = start ? new Date(start) : null;
                const endDateProj = end ? new Date(end) : null;

                // If we have both start and end, include when it overlaps the filter range
                if (startDateProj && endDateProj) {
                    return startDateProj <= endFilter && endDateProj >= startFilter;
                }

                // If only start date exists (ongoing), include if it started on or before the filter end
                if (startDateProj && !endDateProj) {
                    return startDateProj <= endFilter;
                }

                // If only end date exists, include if it ends on or after the filter start
                if (!startDateProj && endDateProj) {
                    return endDateProj >= startFilter;
                }

                return false;
            });

            setProjects(filteredProjects);
            setUsers(usersList);
            setGroups(groupsList);
            setDocuments(documentsList);

            // Fetch all tasks for filtered projects
            const allTasks: any[] = [];
            for (const project of filteredProjects) {
                try {
                    const tasksRes = await api.get(`/tasks/project/${project.id}`);
                    const projectTasks = tasksRes.data?.tasks || tasksRes.data || [];
                    
                    // Filter tasks by date range (include ongoing tasks that started before endFilter)
                    const filteredTasks = projectTasks.filter((t: any) => {
                        const start = t.ngayBatDau || t.createdAt || null;
                        const end = t.ngayKetThuc || null;

                        if (!start && !end) return true;

                        const startDateTask = start ? new Date(start) : null;
                        const endDateTask = end ? new Date(end) : null;

                        if (startDateTask && endDateTask) {
                            return startDateTask <= endFilter && endDateTask >= startFilter;
                        }

                        if (startDateTask && !endDateTask) {
                            return startDateTask <= endFilter;
                        }

                        if (!startDateTask && endDateTask) {
                            return endDateTask >= startFilter;
                        }

                        return false;
                    });

                    allTasks.push(...filteredTasks);
                } catch (err) {
                    // Skip if project has no tasks
                }
            }
            setTasks(allTasks);

            // Fetch worklogs for the filtered tasks to compute total hours
            let worklogsList: any[] = [];
            try {
                const taskIds = Array.from(new Set(allTasks.map(t => t.id).filter(Boolean)));
                // Fetch worklogs per taskId to satisfy API requirement (taskId or subtaskId required)
                for (const tid of taskIds) {
                    try {
                        const res = await getWorklogs({ taskId: tid });
                        const arr = Array.isArray(res) ? res : (res.worklogs || res.data || []);
                        if (Array.isArray(arr)) worklogsList.push(...arr);
                    } catch (e) {
                        // ignore single-task errors
                    }
                }
            } catch (err) {
                // ignore if worklogs endpoint unavailable
                worklogsList = [];
            }
            
            // Calculate total hours logged for tasks in the filtered range
            const taskIdsSet = new Set(allTasks.map(t => String(t.id)));
            const totalHoursLogged = worklogsList.reduce((sum: number, w: any) => {
                const tid = String(w.taskId || w.taskID || w.task || w.taskId);
                if (!taskIdsSet.has(tid)) return sum;
                return sum + (parseFloat(w.hours) || 0);
            }, 0);


            // Calculate stats from filtered data
            const totalProjects = filteredProjects.length;

            // Robust project status classification: match Vietnamese and English keywords,
            // handle common variants and use dates as fallback when status text is ambiguous.
            const normalizeStr = (v: any) => (v || '').toString().toLowerCase();
            const hasAny = (s: string, keys: string[]) => keys.some(k => s.includes(k));

            const completedKeys = ['hoàn', 'hoan', 'complete', 'completed', 'done', 'da_hoan', 'đã hoàn', 'hoan_thanh', 'da_hoan_thanh', "Hoàn Thành"];
            const ongoingKeys = ['đang', 'dang', 'inprogress', 'in progress', 'running', 'doing', 'dang_chay', 'dang_thuc_hien', 'in_progress', "Đang chạy"];
            const pendingKeys = ['chưa', 'chua', 'pending', 'not started', 'chua_bat_dau', 'not_started', 'chuabatdau', 'chua bat dau', "Chưa bắt đầu"];

            let completedProjects = 0;
            let ongoingProjects = 0;
            let pendingProjects = 0;

            for (const p of filteredProjects) {
                const raw = p.status || p.trangthai || p.trangThai || p.tinhtrang || '';
                const s = normalizeStr(raw);

                if (hasAny(s, completedKeys)) {
                    completedProjects += 1;
                    continue;
                }

                if (hasAny(s, ongoingKeys)) {
                    ongoingProjects += 1;
                    continue;
                }

                if (hasAny(s, pendingKeys)) {
                    pendingProjects += 1;
                    continue;
                }

                // Fallback: infer from dates
                const start = p.ngayBatDau || p.createdAt || null;
                const end = p.ngayKetThuc || null;
                if (start && !end) {
                    // started but no end -> likely ongoing
                    ongoingProjects += 1;
                } else if (!start && end) {
                    // only end set -> if end in future, consider pending, else completed
                    try {
                        const endDate = new Date(end);
                        if (!isNaN(endDate.getTime())) {
                            if (endDate.getTime() >= Date.now()) pendingProjects += 1;
                            else completedProjects += 1;
                        } else {
                            pendingProjects += 1;
                        }
                    } catch (e) {
                        pendingProjects += 1;
                    }
                } else {
                    // default to pending when unclear
                    pendingProjects += 1;
                }
            }

            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter((t: any) => {
                const s = (t.trangthai || t.trangThai || t.status || '').toString();
                return s === 'Hoàn thành' || s === 'hoan_thanh' || s === 'completed';
            }).length;
            const ongoingTasks = allTasks.filter((t: any) => {
                const s = (t.trangthai || t.trangThai || t.status || '').toString();
                return s === 'Đang chạy' || s === 'dang_chay' || s === 'inprogress';
            }).length;

            // Collect subtasks from tasks and compute their stats
            let allSubtasks: any[] = [];
            allTasks.forEach(task => {
                if (Array.isArray(task.subtasks)) {
                    // ensure subtask has dates normalized like tasks
                    allSubtasks.push(...task.subtasks);
                }
            });

            const totalSubtasks = allSubtasks.length;
            const completedSubtasks = allSubtasks.filter((st: any) => {
                const s = (st.trangthai || st.trangThai || st.status || '').toString();
                return s === 'Hoàn thành' || s === 'hoan_thanh' || s === 'completed';
            }).length;
            const ongoingSubtasks = allSubtasks.filter((st: any) => {
                const s = (st.trangthai || st.trangThai || st.status || '').toString();
                return s === 'Đang chạy' || s === 'dang_chay' || s === 'inprogress';
            }).length;
            const pendingSubtasks = totalSubtasks - completedSubtasks - ongoingSubtasks;

            // Combine tasks + subtasks for inclusive statistics
            const totalItems = totalTasks + totalSubtasks;
            const completedItems = completedTasks + completedSubtasks;
            const ongoingItems = ongoingTasks + ongoingSubtasks;

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

            const pendingTasks = totalTasks - completedTasks - ongoingTasks;
            const documentsPerProject = totalProjects > 0 ? Math.round(documentsList.length / totalProjects) : 0;

            // Calculate user-task mappings and top performers
            const userTaskMap = new Map<string, { total: number; completed: number }>();
            allTasks.forEach((t: any) => {
                const uid = String(t.nguoiDuocGiaoId || t.nguoiThucHienId || t.userId || '');
                if (!uid) return;
                const entry = userTaskMap.get(uid) || { total: 0, completed: 0 };
                entry.total += 1;
                const s = (t.trangthai || t.trangThai || t.status || '').toString();
                const isCompleted = s === 'Hoàn thành' || s === 'hoan_thanh' || s === 'completed';
                if (isCompleted) entry.completed += 1;
                userTaskMap.set(uid, entry);
            });

            const fullUserStats = usersList.map((user: any) => {
                const uid = String(user.id);
                const entry = userTaskMap.get(uid) || { total: 0, completed: 0 };
                return {
                    id: uid,
                    name: user.hoten || user.name || user.manv || `User ${user.id}`,
                    completed: entry.completed,
                    totalTasks: entry.total,
                    avatar: user.avatar,
                    completionRate: entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0,
                };
            }).sort((a: any, b: any) => b.completed - a.completed);

            setUsersStats(fullUserStats);
            setTopPerformers(fullUserStats.slice(0, 5));

            const activeUsersCount = Array.from(userTaskMap.keys()).filter(k => usersList.find((u: any) => String(u.id) === k)).length;
            const usersWithNoTasks = usersList.length - activeUsersCount;
            // Use totalItems (tasks + subtasks) for averages and show one decimal place
            const avgTasksPerUser = usersList.length > 0 ? parseFloat((totalItems / usersList.length).toFixed(1)) : 0;
            const avgTasksPerActiveUser = activeUsersCount > 0 ? parseFloat((totalItems / activeUsersCount).toFixed(1)) : 0;

            // Update chart data
            // Build monthly trend for last 6 months based on completed tasks' completion date (ngayHoanThanh)
            const months: { label: string; year: number; month: number }[] = [];
            const monthFormatter = new Intl.DateTimeFormat('vi-VN', { month: 'short' });
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({ label: monthFormatter.format(d), year: d.getFullYear(), month: d.getMonth() + 1 });
            }

            const monthlyCounts = months.map(m => {
                const count = allTasks.filter((t: any) => {
                    // Use ngayHoanThanh as completion date, fallback to updatedAt/createdAt
                    const comp = t.ngayHoanThanh || t.ngayhoanthanh || t.completedAt || t.updatedAt || t.createdAt || null;
                    if (!comp) return false;
                    const cd = new Date(comp);
                    return cd.getFullYear() === m.year && (cd.getMonth() + 1) === m.month && ((t.trangthai || t.trangThai || t.status || '').toString().toLowerCase().includes('hoàn') || (t.trangthai || t.trangThai || t.status || '').toString().toLowerCase().includes('complete') );
                }).length;
                return count;
            });

            setChartData(prev => ({
                ...prev,
                projectStatus: [
                    { name: 'Hoàn thành', population: completedProjects, color: '#10b981', legendFontColor: '#374151', legendFontSize: 12 },
                    { name: 'Đang chạy', population: ongoingProjects, color: '#3b82f6', legendFontColor: '#374151', legendFontSize: 12 },
                    { name: 'Chưa bắt đầu', population: pendingProjects, color: '#f59e0b', legendFontColor: '#374151', legendFontSize: 12 },
                ],
                monthlyTrend: {
                    labels: months.map(m => m.label),
                    datasets: [{
                        data: monthlyCounts,
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        strokeWidth: 2,
                    }],
                    legend: ['Công việc hoàn thành'],
                },
                userPerformance: {
                    labels: fullUserStats.slice(0, 5).map((u: any) => (u.name || '').substring(0, 10)),
                    datasets: [{
                        data: fullUserStats.slice(0, 5).map((u: any) => u.completed > 0 ? u.completed : 0),
                    }],
                },
            }));

            const avgHoursPerUser = usersList.length > 0 ? Math.round(totalHoursLogged / usersList.length) : 0;

            // Compute average completion time (days) and on-time completion rate across completed tasks+subtasks
            const completedItemsList: any[] = [];
            // tasks
            allTasks.forEach((t: any) => {
                const s = (t.trangthai || t.trangThai || t.status || '').toString();
                const isCompleted = s === 'Hoàn thành' || s === 'hoan_thanh' || s === 'completed';
                if (isCompleted) {
                    completedItemsList.push({
                        start: t.ngayBatDau || t.createdAt || null,
                        completedAt: t.ngayHoanThanh || t.ngayhoanthanh || t.completedAt || t.updatedAt || t.createdAt || null,
                        deadline: t.ngayKetThuc || t.ngayketthuc || t.deadline || null,
                    });
                }
            });
            // subtasks
            allSubtasks.forEach((st: any) => {
                const s = (st.trangthai || st.trangThai || st.status || '').toString();
                const isCompleted = s === 'Hoàn thành' || s === 'hoan_thanh' || s === 'completed';
                if (isCompleted) {
                    completedItemsList.push({
                        start: st.ngayBatDau || st.createdAt || null,
                        completedAt: st.ngayHoanThanh || st.ngayhoanthanh || st.completedAt || st.updatedAt || st.createdAt || null,
                        deadline: st.ngayKetThuc || st.ngayketthuc || st.deadline || null,
                    });
                }
            });

            let totalCompletionDays = 0;
            let completionCount = 0;
            let onTimeCount = 0;
            completedItemsList.forEach(it => {
                if (it.completedAt) {
                    const start = it.start ? new Date(it.start) : null;
                    const end = new Date(it.completedAt);
                    if (start) {
                        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                        totalCompletionDays += days;
                        completionCount += 1;
                    }
                    if (it.deadline) {
                        const dl = new Date(it.deadline);
                        if (end.getTime() <= dl.getTime()) onTimeCount += 1;
                    } else {
                        // if no deadline, don't count in onTime metric
                    }
                }
            });

            const avgCompletionDays = completionCount > 0 ? Math.round((totalCompletionDays / completionCount) * 10) / 10 : 0;
            const onTimeCompletionRate = completionCount > 0 ? Math.round((onTimeCount / completionCount) * 100) : 0;

            setStats({
                totalProjects,
                completedProjects,
                ongoingProjects,
                pendingProjects,
                totalTasks: totalItems,
                completedTasks: completedItems,
                ongoingTasks: ongoingItems,
                pendingTasks,
                overdueTasks,
                totalUsers: usersList.length,
                activeUsers: activeUsersCount,
                usersWithNoTasks,
                avgTasksPerUser,
                avgTasksPerActiveUser,
                completionRate,
                totalGroups: groupsList.length,
                activeGroups,
                totalSubtasks,
                completedSubtasks,
                ongoingSubtasks,
                pendingSubtasks,
                totalDocuments: documentsList.length,
                documentsPerProject,
                totalHoursLogged: Math.round(totalHoursLogged),
                avgHoursPerUser,
                avgCompletionDays,
                onTimeCompletionRate,
            });
        } catch (error) {
            console.error('Error loading report stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDetailedReports = async () => {
    try {
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

            const projectUsers = new Set(
                projectTasks
                    .map((t: any) => t.nguoiDuocGiaoId || t.nguoiThucHienId || t.userId)
                    .filter(Boolean)
            );

            let manager = '';
            if (project.nguoiDamNhan) {
                manager = project.nguoiDamNhan.hoten || project.nguoiDamNhan.name || '';
            } else if (project.userId) {
                const m = users.find((u: any) => u.id === project.userId);
                manager = m ? (m.hoten || m.name || '') : '';
            }

            const deadline =
                project.ngayKetThuc ||
                project.ngayketthuc ||
                project.deadline ||
                '';

            return {
                id: project.id,
                projectName: project.tenduan || project.ten || project.name || `Dự án ${project.id}`,
                taskCount,
                completedTasks,
                memberCount: projectUsers.size,
                completionRate,
                status: project.trangthai || project.status || 'active',
                manager,
                deadline,
            };
        });

        setDetailedReports(detailed);
    } catch (error) {
        console.error('Error loading detailed reports:', error);
    }
};


    const handleExport = async (format: ExportFormat) => {
    try {
        console.log('📤 Starting export:', format);

        let content = '';
        let fileName = '';
        let mimeType = '';

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

        if (format === 'csv') {
            const headers = 'STT,Tên dự án,Quản lý,Tổng tasks,Hoàn thành,Tiến độ (%),Deadline,Trạng thái,Thành viên\n';
            const rows = detailedReports.map((r, index) =>
                `${index + 1},"${r.projectName}","${r.manager || 'N/A'}",${r.taskCount},${r.completedTasks},${r.completionRate},"${r.deadline || 'N/A'}","${r.status}",${r.memberCount}`
            ).join('\n');

            const statsSection =
                `\n\nTHỐNG KÊ TỔNG QUAN\n` +
                `Tổng dự án,${stats.totalProjects}\n` +
                `Dự án hoàn thành,${stats.completedProjects}\n` +
                `Tổng tasks (bao gồm subtasks),${stats.totalTasks}\n` +
                `Tasks hoàn thành (bao gồm subtasks),${stats.completedTasks}\n` +
                `Tỷ lệ hoàn thành,${stats.completionRate}%\n` +
                `Tasks quá hạn,${stats.overdueTasks}\n` +
                `Tổng subtasks,${stats.totalSubtasks}\n` +
                `Subtasks hoàn thành,${stats.completedSubtasks}\n` +
                `Nhân viên,${stats.totalUsers}\n` +
                `Nhóm,${stats.totalGroups}\n` +
                `Tài liệu,${stats.totalDocuments}\n`;

            const topPerformersSection =
                `\n\nTOP NHÂN VIÊN\n` +
                `Hạng,Tên,Tasks hoàn thành\n` +
                topPerformers.map((p, i) => `${i + 1},${p.name},${p.tasks}`).join('\n');

            content = headers + rows + statsSection + topPerformersSection;
            fileName = `Bao_cao_${timestamp}.csv`;
            mimeType = 'text/csv';
        } else if (format === 'json') {
            const exportData = {
                exportDate: new Date().toISOString(),
                dateRange: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                },
                summary: stats,
                topPerformers,
                projects: detailedReports,
                charts: {
                    projectStatus: chartData.projectStatus.map(p => ({ name: p.name, value: p.population })),
                },
            };
            content = JSON.stringify(exportData, null, 2);
            fileName = `Bao_cao_${timestamp}.json`;
            mimeType = 'application/json';
        } else if (format === 'pdf') {
            Alert.alert('Thông báo', 'Xuất PDF sẽ được hỗ trợ trong phiên bản sau. Vui lòng sử dụng CSV hoặc JSON.');
            setShowExportModal(false);
            return;
        }

        console.log('📝 Creating file:', fileName);
        const fileSizeKB = Math.round(content.length / 1024);

        if (Platform.OS === 'android') {
            try {
                console.log('📱 Android: Using Storage Access Framework');

                Alert.alert('Đang xuất báo cáo', 'Vui lòng đợi...');

                const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

                if (!permissions.granted) {
                    console.log('⚠️ Permission denied');
                    Alert.alert('Lỗi', 'Cần quyền truy cập để lưu file');
                    setShowExportModal(false);
                    return;
                }

                console.log('✅ Permission granted, directory URI:', permissions.directoryUri);

                const fileUri = await StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    fileName,
                    mimeType
                );

                console.log('📄 File created:', fileUri);

                await StorageAccessFramework.writeAsStringAsync(fileUri, content);

                console.log('✅ File written successfully');

                setShowExportModal(false);
                Alert.alert(
                    'Thành công!',
                    `Đã tải báo cáo ${format.toUpperCase()} về máy!\n\nTên file: ${fileName}\nKích thước: ${fileSizeKB} KB`,
                    [
                        { text: 'OK' },
                        {
                            text: 'Mở file',
                            onPress: async () => {
                                try {
                                    const cacheUri = `${cacheDirectory}${fileName}`;
                                    await writeAsStringAsync(cacheUri, content, {
                                        encoding: EncodingType.UTF8,
                                    });

                                    try {
                                        const canOpen = await Linking.canOpenURL(cacheUri);
                                        if (canOpen) {
                                            await Linking.openURL(cacheUri);
                                        } else {
                                            await Sharing.shareAsync(cacheUri, { mimeType, dialogTitle: 'Mở báo cáo' });
                                        }
                                    } catch (openErr) {
                                        console.error('Open error, falling back to share:', openErr);
                                        await Sharing.shareAsync(cacheUri, { mimeType, dialogTitle: 'Mở báo cáo' });
                                    }
                                } catch (err) {
                                    console.error('Error preparing/opening file:', err);
                                    Alert.alert(
                                        'Lỗi',
                                        `Không thể mở file tự động. File đã được lưu tại thư mục bạn chọn với tên: ${fileName}.`
                                    );
                                }
                            },
                        },
                    ]
                );
            } catch (error: any) {
                console.error('❌ Export error:', error);

                Alert.alert(
                    'Lỗi',
                    'Không thể lưu file. Bạn có muốn chia sẻ file không?',
                    [
                        { text: 'Hủy', style: 'cancel', onPress: () => setShowExportModal(false) },
                        {
                            text: 'Chia sẻ',
                            onPress: async () => {
                                try {
                                    const tempUri = `${cacheDirectory}${fileName}`;
                                    await writeAsStringAsync(tempUri, content, {
                                        encoding: EncodingType.UTF8,
                                    });

                                    await Sharing.shareAsync(tempUri, {
                                        mimeType,
                                        dialogTitle: 'Lưu báo cáo',
                                    });
                                    setShowExportModal(false);
                                } catch (shareError) {
                                    console.error('Share error:', shareError);
                                    Alert.alert('Lỗi', 'Không thể chia sẻ file');
                                    setShowExportModal(false);
                                }
                            },
                        },
                    ]
                );
            }
        } else {
            console.log('📱 iOS: Using share dialog');

            Alert.alert('Đang xuất báo cáo', 'Vui lòng đợi...');

            try {
                const fileUri = `${cacheDirectory}${fileName}`;
                await writeAsStringAsync(fileUri, content, {
                    encoding: EncodingType.UTF8,
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri, {
                        mimeType,
                        dialogTitle: 'Lưu báo cáo',
                    });

                    setShowExportModal(false);
                    Alert.alert(
                        'Thành công',
                        `File đã sẵn sàng để lưu.\n\nTên file: ${fileName}\nKích thước: ${fileSizeKB} KB\n\nChọn "Save to Files" để lưu vào thiết bị.`,
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert('Lỗi', 'Thiết bị không hỗ trợ tính năng lưu file');
                    setShowExportModal(false);
                }
            } catch (error: any) {
                console.error('❌ iOS export error:', error);
                Alert.alert('Lỗi', 'Không thể xuất báo cáo: ' + error.message);
                setShowExportModal(false);
            }
        }
    } catch (error: any) {
        console.error('❌ Export error:', error);
        Alert.alert('Lỗi', 'Không thể xuất báo cáo: ' + error.message);
        setShowExportModal(false);
    }
};


    const applyPresetFilter = async (preset: 'thisMonth' | 'thisQuarter' | 'thisYear') => {
        const now = new Date();
        let start: Date;
        let end: Date;

        switch (preset) {
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'thisQuarter':
                const month = now.getMonth();
                const quarterStartMonth = Math.floor(month / 3) * 3;
                start = new Date(now.getFullYear(), quarterStartMonth, 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'thisYear':
                start = new Date(now.getFullYear(), 0, 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(now.getFullYear(), 11, 31);
                end.setHours(23, 59, 59, 999);
                break;
        }

        setStartDate(start);
        setEndDate(end);
        
        // Call loadReportStats with new dates
        await loadReportStats(start, end);
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
        const percentage = max > 0 ? (value / max) * 100 : 0;

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
                        <Text style={styles.subtitle}>{formatDate(startDate)} - {formatDate(endDate)}</Text>

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
                {/* Preset Filters */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.presetFiltersContainer}
                    contentContainerStyle={styles.presetFiltersContent}
                >
                    <TouchableOpacity 
                        style={styles.presetButton}
                        onPress={() => applyPresetFilter('thisMonth')}
                    >
                        <Ionicons name="calendar" size={16} color="#3b82f6" />
                        <Text style={styles.presetButtonText}>Tháng này</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.presetButton}
                        onPress={() => applyPresetFilter('thisQuarter')}
                    >
                        <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                        <Text style={styles.presetButtonText}>Quý này</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.presetButton}
                        onPress={() => applyPresetFilter('thisYear')}
                    >
                        <Ionicons name="calendar-number" size={16} color="#3b82f6" />
                        <Text style={styles.presetButtonText}>Năm này</Text>
                    </TouchableOpacity>
                </ScrollView>

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
                                {/* Overview simplified: major stat cards removed to prioritize charts below */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Tổng quan hệ thống</Text>
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
                                            {/* Subtasks moved to 'tasks' report view */}
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
                                        <Text style={styles.performanceValue}>{stats.avgCompletionDays} ngày</Text>
                                        <Text style={styles.performanceLabel}>Trung bình hoàn thành (task + subtask)</Text>
                                    </View>
                                    <View style={styles.performanceCard}>
                                        <View style={styles.performanceHeader}>
                                            <Ionicons name="speedometer" size={24} color="#10b981" />
                                            <Text style={styles.performanceTitle}>Tỷ lệ đúng hạn</Text>
                                        </View>
                                        <Text style={styles.performanceValue}>{stats.onTimeCompletionRate}%</Text>
                                        <Text style={styles.performanceLabel}>Tỷ lệ hoàn thành đúng hạn</Text>
                                    </View>

                                    <View style={styles.performanceCard}>
                                        <View style={styles.performanceHeader}>
                                            <Ionicons name="trophy" size={24} color="#f59e0b" />
                                            <Text style={styles.performanceTitle}>Thành tích</Text>
                                        </View>
                                        <Text style={styles.performanceValue}>{stats.completedTasks}</Text>
                                        <Text style={styles.performanceLabel}>Công việc đã hoàn thành trong khoảng</Text>
                                    </View>
                                </View>

                                {/* Charts Section */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>📊 Biểu đồ phân tích</Text>
                                    
                                    {/* Pie Chart - Project Status */}
                                    <View style={styles.chartCard}>
                                        <Text style={styles.chartTitle}>Trạng thái dự án</Text>
                                        {chartData.projectStatus.reduce((sum, item) => sum + item.population, 0) > 0 ? (
                                            <PieChart
                                                data={chartData.projectStatus}
                                                width={CHART_WIDTH}
                                                height={220}
                                                chartConfig={{
                                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                                }}
                                                accessor="population"
                                                backgroundColor="transparent"
                                                paddingLeft="15"
                                                absolute
                                            />
                                        ) : (
                                            <View style={styles.emptyChart}>
                                                <Text style={styles.emptyChartText}>Không có dữ liệu</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Line Chart - Monthly Trend */}
                                    <View style={styles.chartCard}>
                                        <Text style={styles.chartTitle}>Xu hướng hoàn thành theo tháng</Text>
                                        <LineChart
                                            data={chartData.monthlyTrend}
                                            width={CHART_WIDTH}
                                            height={220}
                                            chartConfig={{
                                                backgroundGradientFrom: '#fff',
                                                backgroundGradientTo: '#fff',
                                                decimalPlaces: 0,
                                                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                                style: {
                                                    borderRadius: 16
                                                },
                                                propsForDots: {
                                                    r: '6',
                                                    strokeWidth: '2',
                                                    stroke: '#10b981'
                                                }
                                            }}
                                            bezier
                                            style={styles.chart}
                                        />
                                    </View>

                                    {/* Bar Chart - User Performance */}
                                    {chartData.userPerformance.labels.length > 0 && (
                                        <View style={styles.chartCard}>
                                            <Text style={styles.chartTitle}>Hiệu suất nhân viên</Text>
                                            <BarChart
                                                data={chartData.userPerformance}
                                                width={CHART_WIDTH}
                                                height={220}
                                                yAxisLabel=""
                                                yAxisSuffix=""
                                                chartConfig={{
                                                    backgroundGradientFrom: '#fff',
                                                    backgroundGradientTo: '#fff',
                                                    decimalPlaces: 0,
                                                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                                    style: {
                                                        borderRadius: 16
                                                    },
                                                    barPercentage: 0.7,
                                                }}
                                                style={styles.chart}
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Top performers and user details moved to 'users' report view */}
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
                                {/* Users tab kept minimal: per-user task summary removed (moved to Tasks tab) */}
                                {topPerformers.length > 0 && (
                                    <View style={[styles.section, { marginTop: 8 }] }>
                                        <Text style={styles.sectionTitle}>🏆 Top 5 nhân viên xuất sắc</Text>
                                        {topPerformers.map((performer, index) => (
                                            <View key={index} style={styles.performerCard}>
                                                <View style={styles.performerRank}>
                                                    <Text style={styles.performerRankText}>#{index + 1}</Text>
                                                </View>
                                                <View style={styles.performerInfo}>
                                                    <Text style={styles.performerName}>{performer.name}</Text>
                                                    <Text style={styles.performerTasks}>{performer.tasks} tasks hoàn thành</Text>
                                                </View>
                                                <Ionicons
                                                    name="trophy"
                                                    size={24}
                                                    color={index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#f97316'}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Detailed Users list */}
                                {usersStats.length > 0 && (
                                    <View style={[styles.section, { marginTop: 8 }] }>
                                        <Text style={styles.sectionTitle}>👥 Chi tiết người dùng</Text>
                                        {usersStats.slice(0, 50).map((u, idx) => (
                                            <View key={u.id || idx} style={styles.userDetailRow}>
                                                <View style={styles.userDetailLeft}>
                                                    <Text style={styles.userName}>{u.name}</Text>
                                                    <Text style={styles.userMeta}>{u.totalTasks} tasks • {u.completed} hoàn thành • {u.completionRate}%</Text>
                                                </View>
                                                <View style={styles.userDetailRight}>
                                                    <Text style={styles.userSmall}>{u.totalTasks > 0 ? `${Math.round((u.completed / u.totalTasks) * 100)}%` : '0%'}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Tasks Report */}
                        {reportType === 'tasks' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>✅ Thống kê công việc</Text>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 6 }]}>Công việc lớn</Text>
                                <View style={styles.statsGrid}>
                                    <StatCard
                                        icon="list"
                                        title="Tổng lớn"
                                        value={Math.max(0, (stats.totalTasks || 0) - (stats.totalSubtasks || 0))}
                                        color="#3b82f6"
                                        subtitle="công việc chính"
                                    />
                                    <StatCard
                                        icon="checkmark-done"
                                        title="Hoàn thành lớn"
                                        value={Math.max(0, (stats.completedTasks || 0) - (stats.completedSubtasks || 0))}
                                        color="#10b981"
                                        subtitle="công việc chính"
                                    />
                                </View>

                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 8 }]}>Công việc nhỏ (Subtasks)</Text>
                                <View style={styles.statsGrid}>
                                    <StatCard
                                        icon="list"
                                        title="Tổng nhỏ"
                                        value={stats.totalSubtasks || 0}
                                        color="#06b6d4"
                                        subtitle="subtasks"
                                    />
                                    <StatCard
                                        icon="checkmark-done"
                                        title="Hoàn thành nhỏ"
                                        value={stats.completedSubtasks || 0}
                                        color="#10b981"
                                        subtitle="subtasks"
                                    />
                                </View>

                                {/* Combined total shown separately */}
                                <View style={[styles.section, { marginTop: 8 }]}> 
                                    <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Tổng (lớn + nhỏ)</Text>
                                    <View style={styles.statsGrid}>
                                        <StatCard
                                            icon="layers"
                                            title="Tổng"
                                            value={stats.totalTasks || 0}
                                            color="#10b981"
                                            subtitle="Tổng (lớn + nhỏ)"
                                        />
                                    </View>
                                </View>

                                <View style={styles.progressSection}>
                                    <ProgressBar
                                        label="Tỷ lệ hoàn thành (tổng)"
                                        value={stats.completedTasks}
                                        max={stats.totalTasks > 0 ? stats.totalTasks : 1}
                                        color="#10b981"
                                    />
                                    <ProgressBar
                                        label="Tỷ lệ hoàn thành (subtasks)"
                                        value={stats.completedSubtasks}
                                        max={stats.totalSubtasks > 0 ? stats.totalSubtasks : 1}
                                        color="#06b6d4"
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
                            onPress={async () => {
                                setShowFilterModal(false);
                                await loadReportStats();
                                await loadDetailedReports();
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
        columnGap: 12,   // gap ngang
        rowGap: 12,      // gap dọc
    },
    statCard: {
        width: '48.2%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        paddingHorizontal: 6,
       
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
    // Chart styles
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    chart: {
        borderRadius: 16,
    },
    emptyChart: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyChartText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    // Performer styles
    performerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    performerRank: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fbbf24',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    performerRankText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    performerInfo: {
        flex: 1,
    },
    performerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    performerTasks: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    userDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
    },
    userDetailLeft: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    userMeta: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    userDetailRight: {
        width: 64,
        alignItems: 'flex-end',
    },
    userSmall: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981',
    },
    presetFiltersContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
    },
    presetFiltersContent: {
        gap: 8,
    },
    presetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3b82f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    presetButtonText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
});