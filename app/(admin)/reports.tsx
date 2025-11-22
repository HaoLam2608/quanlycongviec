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
    completionRate: number;
    totalGroups: number;
    activeGroups: number;
    totalDocuments: number;
    documentsPerProject: number;
    totalSubtasks: number;
    completedSubtasks: number;
    ongoingSubtasks: number;
    pendingSubtasks: number;
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
        completionRate: 0,
        totalGroups: 0,
        activeGroups: 0,
        totalDocuments: 0,
        documentsPerProject: 0,
        totalSubtasks: 0,
        completedSubtasks: 0,
        ongoingSubtasks: 0,
        pendingSubtasks: 0,
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

            // Filter projects by date range
            const filteredProjects = projectsList.filter((p: any) => {
                // If no dates on project, include it
                if (!p.ngayBatDau && !p.ngayKetThuc && !p.createdAt) return true;
                
                // Check ngayBatDau (start date)
                if (p.ngayBatDau) {
                    const projectStart = new Date(p.ngayBatDau);
                    if (projectStart >= startFilter && projectStart <= endFilter) return true;
                }
                
                // Check ngayKetThuc (end date)
                if (p.ngayKetThuc) {
                    const projectEnd = new Date(p.ngayKetThuc);
                    if (projectEnd >= startFilter && projectEnd <= endFilter) return true;
                }
                
                // Check createdAt
                if (p.createdAt) {
                    const createdDate = new Date(p.createdAt);
                    if (createdDate >= startFilter && createdDate <= endFilter) return true;
                }
                
                // Also include if project spans across the filter range
                if (p.ngayBatDau && p.ngayKetThuc) {
                    const projectStart = new Date(p.ngayBatDau);
                    const projectEnd = new Date(p.ngayKetThuc);
                    if (projectStart <= endFilter && projectEnd >= startFilter) return true;
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
                    
                    // Filter tasks by date
                    const filteredTasks = projectTasks.filter((t: any) => {
                        // If no dates on task, include it
                        if (!t.ngayBatDau && !t.ngayKetThuc && !t.createdAt) return true;
                        
                        // Check ngayBatDau (start date)
                        if (t.ngayBatDau) {
                            const taskStart = new Date(t.ngayBatDau);
                            if (taskStart >= startFilter && taskStart <= endFilter) return true;
                        }
                        
                        // Check ngayKetThuc (end date)
                        if (t.ngayKetThuc) {
                            const taskEnd = new Date(t.ngayKetThuc);
                            if (taskEnd >= startFilter && taskEnd <= endFilter) return true;
                        }
                        
                        // Check createdAt
                        if (t.createdAt) {
                            const createdDate = new Date(t.createdAt);
                            if (createdDate >= startFilter && createdDate <= endFilter) return true;
                        }
                        
                        // Also include if task spans across the filter range
                        if (t.ngayBatDau && t.ngayKetThuc) {
                            const taskStart = new Date(t.ngayBatDau);
                            const taskEnd = new Date(t.ngayKetThuc);
                            if (taskStart <= endFilter && taskEnd >= startFilter) return true;
                        }
                        
                        return false;
                    });
                    
                    allTasks.push(...filteredTasks);
                } catch (err) {
                    // Skip if project has no tasks
                }
            }
            setTasks(allTasks);

            // Calculate stats from filtered data
            const totalProjects = filteredProjects.length;
            const completedProjects = filteredProjects.filter((p: any) => {
                const s = (p.status || p.trangthai || '').toString().toLowerCase();
                return s === 'da_hoan_thanh' || s === 'completed';
            }).length;
            const ongoingProjects = filteredProjects.filter((p: any) => {
                const s = (p.status || p.trangthai || '').toString().toLowerCase();
                return s === 'dang_chay' || s === 'dang_thuc_hien' || s === 'inprogress';
            }).length;
            const pendingProjects = filteredProjects.filter((p: any) => {
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

            // Calculate subtasks statistics
            let allSubtasks: any[] = [];
            allTasks.forEach(task => {
                if (Array.isArray(task.subtasks)) {
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
            const pendingSubtasks = allSubtasks.filter((st: any) => {
                const s = (st.trangthai || st.trangThai || st.status || '').toString();
                return s === 'Chưa bắt đầu' || s === 'chua_bat_dau' || s === 'pending';
            }).length;

            const pendingTasks = totalTasks - completedTasks - ongoingTasks;
            const documentsPerProject = totalProjects > 0 ? Math.round(documentsList.length / totalProjects) : 0;

            // Calculate top performers
            const userTaskCounts = usersList.map((user: any) => {
                const userCompletedTasks = allTasks.filter((t: any) => {
                    const userId = t.nguoiDuocGiaoId || t.nguoiThucHienId || t.userId;
                    const s = (t.trangthai || t.trangThai || t.status || '').toString();
                    const isCompleted = s === 'Hoàn thành' || s === 'hoan_thanh' || s === 'completed';
                    return String(userId) === String(user.id) && isCompleted;
                }).length;
                return {
                    name: user.hoten || user.name || user.manv || `User ${user.id}`,
                    tasks: userCompletedTasks,
                    avatar: user.avatar,
                };
            }).sort((a: TopPerformer, b: TopPerformer) => b.tasks - a.tasks).slice(0, 5);
            
            setTopPerformers(userTaskCounts);

            // Update chart data
            setChartData(prev => ({
                ...prev,
                projectStatus: [
                    { name: 'Hoàn thành', population: completedProjects, color: '#10b981', legendFontColor: '#374151', legendFontSize: 12 },
                    { name: 'Đang chạy', population: ongoingProjects, color: '#3b82f6', legendFontColor: '#374151', legendFontSize: 12 },
                    { name: 'Chưa bắt đầu', population: pendingProjects, color: '#f59e0b', legendFontColor: '#374151', legendFontSize: 12 },
                ],
                monthlyTrend: {
                    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
                    datasets: [{
                        data: [20, 25, 30, 28, 35, completedTasks > 0 ? completedTasks : 1],
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        strokeWidth: 2,
                    }],
                    legend: ['Công việc hoàn thành'],
                },
                userPerformance: {
                    labels: userTaskCounts.map((u: TopPerformer) => u.name.substring(0, 10)),
                    datasets: [{
                        data: userTaskCounts.map((u: TopPerformer) => u.tasks > 0 ? u.tasks : 1),
                    }],
                },
            }));

            setStats({
                totalProjects,
                completedProjects,
                ongoingProjects,
                pendingProjects,
                totalTasks,
                completedTasks,
                ongoingTasks,
                pendingTasks,
                overdueTasks,
                totalUsers: usersList.length,
                activeUsers: usersList.length,
                completionRate,
                totalGroups: groupsList.length,
                activeGroups,
                totalDocuments: documentsList.length,
                documentsPerProject,
                totalSubtasks,
                completedSubtasks,
                ongoingSubtasks,
                pendingSubtasks,
                totalHoursLogged: 0, // Can be calculated from worklogs if API available
                avgHoursPerUser: 0,
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
                `Tổng tasks,${stats.totalTasks}\n` +
                `Tasks hoàn thành,${stats.completedTasks}\n` +
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

                                {/* Top Performers Section */}
                                {topPerformers.length > 0 && (
                                    <View style={styles.section}>
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

                                {/* Subtasks Statistics */}
                                {stats.totalSubtasks > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>📋 Thống kê Subtasks</Text>
                                        <View style={styles.statsGrid}>
                                            <StatCard
                                                icon="list"
                                                title="Tổng subtasks"
                                                value={stats.totalSubtasks}
                                                color="#06b6d4"
                                                subtitle={`${stats.completedSubtasks} hoàn thành`}
                                            />
                                            <StatCard
                                                icon="checkmark-done"
                                                title="Hoàn thành"
                                                value={stats.completedSubtasks}
                                                color="#10b981"
                                                subtitle={`${Math.round((stats.completedSubtasks / stats.totalSubtasks) * 100)}%`}
                                            />
                                            <StatCard
                                                icon="play-circle"
                                                title="Đang thực hiện"
                                                value={stats.ongoingSubtasks}
                                                color="#3b82f6"
                                                subtitle="subtasks"
                                            />
                                            <StatCard
                                                icon="time"
                                                title="Chưa bắt đầu"
                                                value={stats.pendingSubtasks}
                                                color="#f59e0b"
                                                subtitle="subtasks"
                                            />
                                        </View>
                                    </View>
                                )}
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