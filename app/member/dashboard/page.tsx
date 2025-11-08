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
    getTodayTasks,
    getUpcomingTasks,
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

interface TodayTask {
    id: number
    tentask: string
    tenSubtask?: string
    priority: string
    deadline: string
    status: string
    type: 'task' | 'subtask'
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
    const [todayTasks, setTodayTasks] = useState<TodayTask[]>([])
    const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])
    const [recentActivities, setRecentActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch dữ liệu thật từ database
            const [statsData, todayData, upcomingData, activitiesData] = await Promise.all([
                getMemberStats(),
                getTodayTasks(),
                getUpcomingTasks(7),
                getRecentActivities(10)
            ]);

            // Set dữ liệu từ API
            if (statsData) {
                setStats(statsData);
            }

            if (todayData && Array.isArray(todayData)) {
                setTodayTasks(todayData);
            } else {
                setTodayTasks([]);
            }

            if (upcomingData && Array.isArray(upcomingData)) {
                setUpcomingTasks(upcomingData);
            } else {
                setUpcomingTasks([]);
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
            setTodayTasks([]);
            setUpcomingTasks([]);
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
                        {/* Today Tasks Skeleton */}
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
                    {/* Today's Tasks */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Công việc hôm nay
                            </h2>
                            <span className="text-sm text-gray-500">{todayTasks.length} công việc</span>
                        </div>

                        <div className="space-y-4">
                            {todayTasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Không có công việc nào hôm nay</p>
                                </div>
                            ) : (
                                todayTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {task.type === 'subtask' ? '• ' : ''}{task.tenSubtask || task.tentask}
                                            </h3>
                                            {task.type === 'subtask' && (
                                                <p className="text-sm text-gray-600">Task: {task.tentask}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                {task.status}
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