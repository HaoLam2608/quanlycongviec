"use client"
import { useEffect, useState } from "react"
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    Calendar,
    TrendingUp,
    ListTodo,
    Target,
    Activity
} from "lucide-react"
import {
    getMemberStats,
    getMySubtasks,
    getUpcomingTasks,
    getOverdueTasks,
    getRecentActivities
} from "@/axios/api"
import StatsCard from "@/components/member/StatsCard"

interface TaskStats {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    overdueTasks: number
    completionRate: number
}

interface MemberSubtask {
    id: number
    tenSubtask: string
    mota?: string
    nguoiThucHienId: number
    taskId: number
    trangThai: string
    ngayBatDau?: string
    ngayKetThuc?: string
    task?: {
        tentask: string
    }
}

interface OverdueTask {
    id: number
    title: string
    tentask?: string
    tenSubtask?: string
    deadline: string
    ngayKetThuc?: string
    priority: string
    mucDoUuTien?: string
    status: string
    trangThai?: string
    daysOverdue: number
    type: 'task' | 'subtask'
    project?: string
    parentTask?: string
}

interface UpcomingTask {
    id: number
    title: string
    deadline: string
    priority: string
    daysLeft: number
}

interface Activity {
    id: number
    action: string
    taskTitle: string
    timestamp: string
    type: 'status_change' | 'comment' | 'worklog'
}

export default function MemberDashboard() {
    const [stats, setStats] = useState<TaskStats>({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        completionRate: 0
    })
    const [assignedTasks, setAssignedTasks] = useState<MemberSubtask[]>([])
    const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])
    const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([])
    const [recentActivities, setRecentActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch dữ liệu thật từ database
            const [statsData, assignedData, upcomingData, overdueData, activitiesData] = await Promise.all([
                getMemberStats(),
                getMySubtasks(),
                getUpcomingTasks(7),
                getOverdueTasks(),
                getRecentActivities(10)
            ]);

            // Set dữ liệu từ API
            if (statsData) {
                setStats(statsData);
            }

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

            if (upcomingData && Array.isArray(upcomingData)) {
                setUpcomingTasks(upcomingData);
            } else {
                setUpcomingTasks([]);
            }

            if (overdueData && Array.isArray(overdueData)) {
                setOverdueTasks(overdueData);
            } else {
                setOverdueTasks([]);
            }

            if (activitiesData && Array.isArray(activitiesData)) {
                setRecentActivities(activitiesData);
            } else {
                setRecentActivities([]);
            }

        } catch (error) {
            console.error("Error loading dashboard data:", error);
            // Hiển thị dữ liệu rỗng khi có lỗi
            setStats({
                totalTasks: 0,
                completedTasks: 0,
                inProgressTasks: 0,
                overdueTasks: 0,
                completionRate: 0
            });
            setAssignedTasks([]);
            setUpcomingTasks([]);
            setOverdueTasks([]);
            setRecentActivities([]);
        } finally {
            setLoading(false);
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "text-red-600 bg-red-100"
            case "medium": return "text-yellow-600 bg-yellow-100"
            case "low": return "text-green-600 bg-green-100"
            default: return "text-gray-600 bg-gray-100"
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Hoàn thành": return "text-green-600 bg-green-100"
            case "Đang chạy": return "text-blue-600 bg-blue-100"
            case "Chưa bắt đầu": return "text-gray-600 bg-gray-100"
            default: return "text-gray-600 bg-gray-100"
        }
    }

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-9 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                                </div>
                                <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Content Grid Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Assigned Tasks Skeleton */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                        <div className="flex gap-2">
                                            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming Tasks Skeleton */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                        <div className="flex gap-2">
                                            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Overdue Tasks Skeleton */}
                    <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="p-4 bg-red-50 rounded-lg">
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                    <div className="flex gap-2">
                                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                    <p className="text-gray-600">Chào mừng bạn quay trở lại! Đây là tổng quan công việc của bạn.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title="Tổng số task"
                        value={stats.totalTasks}
                        icon={ListTodo}
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />

                    <StatsCard
                        title="Tỷ lệ hoàn thành"
                        value={`${stats.completionRate}%`}
                        icon={Target}
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                        textColor="text-green-600"
                        progress={stats.completionRate}
                    />

                    <StatsCard
                        title="Đang thực hiện"
                        value={stats.inProgressTasks}
                        icon={Clock}
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                        textColor="text-blue-600"
                    />

                    <StatsCard
                        title="Quá hạn"
                        value={stats.overdueTasks}
                        icon={AlertTriangle}
                        iconColor="text-red-600"
                        iconBgColor="bg-red-100"
                        textColor="text-red-600"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Assigned Subtasks */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <ListTodo className="w-5 h-5 text-blue-600" />
                                Công việc được giao
                            </h2>
                            <span className="text-sm text-gray-500">{assignedTasks.length} công việc</span>
                        </div>

                        <div className="space-y-4">
                            {assignedTasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <ListTodo className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Không có công việc nào được giao</p>
                                </div>
                            ) : (
                                assignedTasks.slice(0, 5).map(task => (
                                    <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {task.tenSubtask}
                                            </h3>
                                            {task.task?.tentask && (
                                                <p className="text-sm text-gray-600">Task: {task.task.tentask}</p>
                                            )}
                                            {task.ngayKetThuc && (
                                                <p className="text-sm text-gray-500">Hạn: {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.trangThai)}`}>
                                                {task.trangThai}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                                Deadline sắp tới
                            </h2>
                            <span className="text-sm text-gray-500">7 ngày tới</span>
                        </div>

                        <div className="space-y-4">
                            {upcomingTasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Không có deadline sắp tới</p>
                                </div>
                            ) : (
                                upcomingTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{task.title}</h3>
                                            <p className="text-sm text-gray-600">
                                                {new Date(task.deadline).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.daysLeft <= 1 ? 'text-red-600 bg-red-100' :
                                                task.daysLeft <= 3 ? 'text-orange-600 bg-orange-100' :
                                                    'text-blue-600 bg-blue-100'
                                                }`}>
                                                {task.daysLeft} ngày
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Overdue Tasks */}
                {stats.overdueTasks > 0 && (
                    <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                Công việc quá hạn
                            </h2>
                            <div className="bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full">
                                {overdueTasks.length}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {overdueTasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-300" />
                                    <p>Đang tải công việc quá hạn...</p>
                                </div>
                            ) : (
                                overdueTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-start gap-2 flex-1">
                                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                                                <h3 className="font-semibold text-gray-900 line-clamp-1">
                                                    {task.tenSubtask || task.tentask || task.title}
                                                </h3>
                                            </div>
                                            <div className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded">
                                                Quá {task.daysOverdue} ngày
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            {task.type === 'subtask' && task.parentTask && (
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <span>•</span>
                                                    <span>Task: {task.parentTask}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1 text-sm text-red-600">
                                                <Calendar className="w-3 h-3" />
                                                <span>Hạn: {new Date(task.ngayKetThuc || task.deadline).toLocaleDateString('vi-VN')}</span>
                                            </div>

                                            {(task.mucDoUuTien || task.priority) && (
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <span className={`w-2 h-2 rounded-full ${(task.mucDoUuTien || task.priority) === 'cao' ? 'bg-red-500' :
                                                            (task.mucDoUuTien || task.priority) === 'trung_binh' ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}></span>
                                                    <span>
                                                        {(task.mucDoUuTien || task.priority) === 'cao' ? 'Cao' :
                                                            (task.mucDoUuTien || task.priority) === 'trung_binh' ? 'Trung bình' : 'Thấp'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {overdueTasks.length > 3 && (
                            <button className="w-full mt-4 text-center text-red-600 hover:text-red-800 text-sm font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                                Xem thêm {overdueTasks.length - 3} công việc quá hạn
                                <TrendingUp className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Recent Activities */}
                <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-600" />
                            Hoạt động gần đây
                        </h2>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Xem tất cả
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>Chưa có hoạt động nào</p>
                            </div>
                        ) : (
                            recentActivities.map(activity => (
                                <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'status_change' ? 'bg-green-100' :
                                        activity.type === 'comment' ? 'bg-blue-100' :
                                            'bg-purple-100'
                                        }`}>
                                        {activity.type === 'status_change' ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        ) : activity.type === 'comment' ? (
                                            <Activity className="w-5 h-5 text-blue-600" />
                                        ) : (
                                            <Clock className="w-5 h-5 text-purple-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {activity.action} "<span className="text-blue-600">{activity.taskTitle}</span>"
                                        </p>
                                        <p className="text-sm text-gray-500">{activity.timestamp}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}