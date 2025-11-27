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
            <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-9 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg w-64 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-slate-200 rounded w-96 animate-pulse"></div>
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl animate-pulse"></div>
                                </div>
                                <div className="h-8 bg-slate-200 rounded w-16 mb-2 animate-pulse"></div>
                                <div className="h-3 bg-slate-200 rounded w-32 animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Content Grid Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Assigned Tasks Skeleton */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100">
                            <div className="h-6 bg-slate-200 rounded w-48 mb-4 animate-pulse"></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-xl">
                                        <div className="h-5 bg-slate-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                        <div className="flex gap-2">
                                            <div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div>
                                            <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming Tasks Skeleton */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100">
                            <div className="h-6 bg-slate-200 rounded w-48 mb-4 animate-pulse"></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-xl">
                                        <div className="h-5 bg-slate-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                        <div className="flex gap-2">
                                            <div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div>
                                            <div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Overdue Tasks Skeleton */}
                    <div className="mt-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-red-200">
                        <div className="h-6 bg-red-200 rounded w-48 mb-4 animate-pulse"></div>
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="p-4 bg-white rounded-xl">
                                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                    <div className="flex gap-2">
                                        <div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div>
                                        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Trang chủ Nhân viên</h1>
                    </div>
                    <p className="text-slate-600 ml-6">Chào mừng bạn quay trở lại! Đây là tổng quan công việc của bạn.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="transform transition-all duration-200 hover:scale-105 hover:-translate-y-1">
                        <StatsCard
                            title="Tổng số task"
                            value={stats.totalTasks}
                            icon={ListTodo}
                            iconColor="text-blue-600"
                            iconBgColor="bg-blue-100"
                        />
                    </div>

                    <div className="transform transition-all duration-200 hover:scale-105 hover:-translate-y-1 animation-delay-100">
                        <StatsCard
                            title="Tỷ lệ hoàn thành"
                            value={`${stats.completionRate}%`}
                            icon={Target}
                            iconColor="text-green-600"
                            iconBgColor="bg-green-100"
                            textColor="text-green-600"
                            progress={stats.completionRate}
                        />
                    </div>

                    <div className="transform transition-all duration-200 hover:scale-105 hover:-translate-y-1 animation-delay-200">
                        <StatsCard
                            title="Đang thực hiện"
                            value={stats.inProgressTasks}
                            icon={Clock}
                            iconColor="text-blue-600"
                            iconBgColor="bg-blue-100"
                            textColor="text-blue-600"
                        />
                    </div>

                    <div className="transform transition-all duration-200 hover:scale-105 hover:-translate-y-1 animation-delay-300">
                        <StatsCard
                            title="Quá hạn"
                            value={stats.overdueTasks}
                            icon={AlertTriangle}
                            iconColor="text-red-600"
                            iconBgColor="bg-red-100"
                            textColor="text-red-600"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Assigned Subtasks */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <ListTodo className="w-5 h-5 text-blue-600" />
                                </div>
                                Công việc được giao
                            </h2>
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{assignedTasks.length}</span>
                        </div>

                        <div className="space-y-3">
                            {assignedTasks.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                                        <ListTodo className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p>Không có công việc nào được giao</p>
                                </div>
                            ) : (
                                assignedTasks.slice(0, 5).map((task, idx) => (
                                    <div
                                        key={task.id}
                                        className="group flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {task.tenSubtask}
                                            </h3>
                                            {task.task?.tentask && (
                                                <p className="text-sm text-slate-600">Task: {task.task.tentask}</p>
                                            )}
                                            {task.ngayKetThuc && (
                                                <p className="text-sm text-slate-500">Hạn: {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.trangThai)}`}>
                                                {task.trangThai}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                Deadline sắp tới
                            </h2>
                            <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">7 ngày</span>
                        </div>

                        <div className="space-y-3">
                            {upcomingTasks.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                                        <Clock className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p>Không có deadline sắp tới</p>
                                </div>
                            ) : (
                                upcomingTasks.map((task, idx) => (
                                    <div
                                        key={task.id}
                                        className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{task.title}</h3>
                                            <p className="text-sm text-slate-600">
                                                {new Date(task.deadline).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.daysLeft <= 1 ? 'text-red-600 bg-red-100' :
                                                task.daysLeft <= 3 ? 'text-orange-600 bg-orange-100' :
                                                    'text-blue-600 bg-blue-100'
                                                }`}>
                                                {task.daysLeft} ngày
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
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
                    <div className="mt-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-red-200 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                Công việc quá hạn
                            </h2>
                            <div className="bg-red-100 text-red-700 text-sm font-bold px-4 py-2 rounded-full shadow-sm">
                                {overdueTasks.length}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {overdueTasks.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-300" />
                                    <p>Đang tải công việc quá hạn...</p>
                                </div>
                            ) : (
                                overdueTasks.slice(0, 3).map((task, idx) => (
                                    <div
                                        key={task.id}
                                        className="group p-4 bg-white border border-red-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-start gap-2 flex-1">
                                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                                                    {task.tenSubtask || task.tentask || task.title}
                                                </h3>
                                            </div>
                                            <div className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                                Quá {task.daysOverdue} ngày
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            {task.type === 'subtask' && task.parentTask && (
                                                <div className="flex items-center gap-1 text-sm text-slate-700">
                                                    <span>•</span>
                                                    <span>Task: {task.parentTask}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1 text-sm text-red-600 font-medium">
                                                <Calendar className="w-3 h-3" />
                                                <span>Hạn: {new Date(task.ngayKetThuc || task.deadline).toLocaleDateString('vi-VN')}</span>
                                            </div>

                                            {(task.mucDoUuTien || task.priority) && (
                                                <div className="flex items-center gap-1 text-sm text-slate-700">
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
                            <button className="w-full mt-4 text-center text-red-600 hover:text-red-800 text-sm font-semibold py-3 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105">
                                Xem thêm {overdueTasks.length - 3} công việc quá hạn
                                <TrendingUp className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Recent Activities */}
                <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            Hoạt động gần đây
                        </h2>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200">
                            Xem tất cả
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                                    <Activity className="w-8 h-8 text-slate-400" />
                                </div>
                                <p>Chưa có hoạt động nào</p>
                            </div>
                        ) : (
                            recentActivities.map((activity, idx) => (
                                <div
                                    key={activity.id}
                                    className="group flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${activity.type === 'status_change' ? 'bg-green-100' :
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
                                        <p className="font-medium text-slate-900">
                                            {activity.action} "<span className="text-blue-600">{activity.taskTitle}</span>"
                                        </p>
                                        <p className="text-sm text-slate-500">{activity.timestamp}</p>
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