"use client"

import { useState, useEffect } from "react"
import {
    Users, Shield, FolderKanban, TrendingUp, Activity, Clock,
    CheckCircle, AlertCircle, Briefcase, UserCheck, ArrowUpRight,
    ArrowDownRight, Calendar, Target, BarChart3, PieChart, Zap
} from "lucide-react"
import { getDashboardStats } from "@/axios/adminApi"
import { fetchProjects } from "@/axios/api"

export default function AdminDashboard() {
    const [users, setUsers] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])

    const [stats, setStats] = useState([
        {
            title: "Tổng người dùng",
            value: "0",
            change: "0%",
            trend: "up",
            icon: Users,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-700",
        },
        {
            title: "Quản trị viên",
            value: "0",
            change: "0%",
            trend: "up",
            icon: Shield,
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-50",
            textColor: "text-purple-700",
        },
        {
            title: "Quản lý dự án",
            value: "0",
            change: "0%",
            trend: "up",
            icon: Briefcase,
            color: "from-green-500 to-green-600",
            bgColor: "bg-green-50",
            textColor: "text-green-700",
        },
        {
            title: "Nhân viên",
            value: "0",
            change: "0%",
            trend: "up",
            icon: UserCheck,
            color: "from-orange-500 to-orange-600",
            bgColor: "bg-orange-50",
            textColor: "text-orange-700",
        },
    ])

    const [loading, setLoading] = useState(true)
    const [recentActivities, setRecentActivities] = useState<any[]>([])
    const [projectStats, setProjectStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
        pending: 0,
        completionRate: 0
    })

    useEffect(() => {
        // Add delay to ensure token is properly set after login
        const timer = setTimeout(() => {
            loadStats()
            loadProjects()
        }, 500)

        return () => clearTimeout(timer)
    }, [])

    const loadProjects = async () => {
        try {
            const response = await fetchProjects()
            
            // Handle response structure: backend returns { success, data: [...], pagination: {...} }
            let projectsData: any[] = []
            
            if (Array.isArray(response)) {
                projectsData = response
            } else if (response?.data && Array.isArray(response.data)) {
                projectsData = response.data
            } else if (response?.projects && Array.isArray(response.projects)) {
                projectsData = response.projects
            }
            
            setProjects(projectsData)
            console.log("Projects fetched:", projectsData)

            // Calculate project statistics
            const total = projectsData.length
            
            // Map status values - be explicit about status codes/names
            const completed = projectsData.filter((p: any) => {
                const status = String(p.status || '').toLowerCase().trim()
                return status === 'da_hoan_thanh' || status === 'completed' || status === '3'
            }).length
            
            const active = projectsData.filter((p: any) => {
                const status = String(p.status || '').toLowerCase().trim()
                return status === 'dang_chay' || status === 'in_progress' || status === '2'
            }).length
            
            const pending = projectsData.filter((p: any) => {
                const status = String(p.status || '').toLowerCase().trim()
                return status === 'chua_bat_dau' || status === 'not_started' || status === '1'
            }).length
            
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

            setProjectStats({ total, active, completed, pending, completionRate })
            
            console.log("Project stats calculated:", { total, active, completed, pending, completionRate })
            console.log("Sample projects:", projectsData.slice(0, 3).map(p => ({ id: p.id, status: p.status, tenduan: p.tenduan })))
        } catch (error) {
            console.error("Load projects error:", error)
            setProjectStats({ total: 0, active: 0, completed: 0, pending: 0, completionRate: 0 })
        }
    }

    const loadStats = async () => {
        setLoading(true)
        try {
            const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null

            // Verify we have admin role
            if (role !== 'admin') {
                setLoading(false)
                return
            }

            const res = await getDashboardStats()
            const data = res.stats || res

            const totalUsers = data.totalUsers || 0
            const usersByRole = data.usersByRole || []
            const adminCount = usersByRole.find((r: any) => r.role === "admin")?.count || 0
            const managerCount = usersByRole.find((r: any) => r.role === "manager")?.count || 0
            const userCount = usersByRole.find((r: any) => r.role === "employee")?.count || 0

            setStats([
                {
                    title: "Tổng người dùng",
                    value: String(totalUsers),
                    change: "",
                    trend: "up",
                    icon: Users,
                    color: "from-blue-500 to-blue-600",
                    bgColor: "bg-blue-50",
                    textColor: "text-blue-700",
                },
                {
                    title: "Quản trị viên",
                    value: String(adminCount),
                    change: "",
                    trend: "up",
                    icon: Shield,
                    color: "from-purple-500 to-purple-600",
                    bgColor: "bg-purple-50",
                    textColor: "text-purple-700",
                },
                {
                    title: "Quản lý dự án",
                    value: String(managerCount),
                    change: "",
                    trend: "up",
                    icon: Briefcase,
                    color: "from-green-500 to-green-600",
                    bgColor: "bg-green-50",
                    textColor: "text-green-700",
                },
                {
                    title: "Nhân viên",
                    value: String(userCount),
                    change: "",
                    trend: "up",
                    icon: UserCheck,
                    color: "from-orange-500 to-orange-600",
                    bgColor: "bg-orange-50",
                    textColor: "text-orange-700",
                },
            ])

            const rawActs = res.recentActivities || []
            const mapped = rawActs.map((u: any) => {
                const name = u.hoten || u.manv || u.name || u.username || ""
                const action = u.action || "cập nhật thông tin"
                const project = u.duanName || u.project || ""
                const time = u.updatedAt ? timeAgo(new Date(u.updatedAt)) : ""
                return { user: name || "—", action, project, time }
            })

            setRecentActivities(mapped)
        } catch (error: any) {
            console.error("Load stats error:", error)
        } finally {
            setLoading(false)
        }
    }

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
        const intervals: [number, string][] = [
            [31536000, "năm"],
            [2592000, "tháng"],
            [86400, "ngày"],
            [3600, "giờ"],
            [60, "phút"],
            [1, "giây"],
        ]

        for (const [sec, label] of intervals) {
            const count = Math.floor(seconds / sec)
            if (count > 0) return `${count} ${label} trước`
        }
        return "vừa xong"
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            <div className="space-y-6 md:space-y-8 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 md:mb-3 flex items-center gap-2 md:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                            </div>
                            Trang chủ
                        </h1>
                        <p className="text-slate-600 text-sm md:text-base lg:text-lg flex items-center gap-2">
                            <Calendar className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                            <span className="hidden sm:inline">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <span className="sm:hidden">{new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-lg md:rounded-xl text-sm md:text-base font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            onClick={() => window.location.href = '/admin/reports'}
                        >
                            <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                            Báo cáo
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {loading
                        ? Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg animate-pulse">
                                <div className="flex items-start justify-between mb-3 md:mb-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-slate-200"></div>
                                    <div className="w-14 h-5 md:w-16 md:h-6 bg-slate-200 rounded"></div>
                                </div>
                                <div>
                                    <div className="w-24 md:w-28 h-3 md:h-4 bg-slate-200 rounded mb-2 md:mb-3"></div>
                                    <div className="w-16 md:w-20 h-8 md:h-10 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ))
                        : stats.map((stat, index) => {
                            const Icon = stat.icon
                            const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight
                            return (
                                <div
                                    key={index}
                                    className="relative group overflow-hidden bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 shadow-lg"
                                >
                                    {/* Background decoration */}
                                    <div className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 ${stat.bgColor} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>

                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-3 md:mb-4">
                                            <div
                                                className={`w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform`}
                                            >
                                                <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-slate-600 text-xs md:text-sm font-medium mb-1 md:mb-2">{stat.title}</p>
                                            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">{stat.value}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                </div>

                {/* Projects Overview & Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Project Stats */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <FolderKanban className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                                    Tổng quan dự án
                                </h2>
                                <p className="text-xs md:text-sm text-slate-600">Thống kê trạng thái các dự án</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-2xl md:text-3xl font-bold text-blue-600">{projectStats.total}</p>
                                <p className="text-xs md:text-sm text-slate-600">Tổng dự án</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                            <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                    <span className="text-xs md:text-sm font-medium text-green-900">Hoàn thành</span>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold text-green-700">{projectStats.completed}</p>
                            </div>
                            <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                    <span className="text-xs md:text-sm font-medium text-blue-900">Đang chạy</span>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold text-blue-700">{projectStats.active}</p>
                            </div>
                            <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                                    <span className="text-xs md:text-sm font-medium text-orange-900">Chưa bắt đầu</span>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold text-orange-700">{projectStats.pending}</p>
                            </div>
                        </div>

                        {/* Progress Bar removed as requested */}
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg text-white">
                        <div className="mb-4 md:mb-6">
                            <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
                                <PieChart className="w-5 h-5 md:w-6 md:h-6" />
                                Thống kê nhanh
                            </h3>
                            <p className="text-blue-100 text-xs md:text-sm">Cập nhật theo thời gian thực</p>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs md:text-sm font-medium">Tổng người dùng</span>
                                    <span className="text-xl md:text-2xl font-bold">{stats[0]?.value || '0'}</span>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs md:text-sm font-medium">Dự án đang chạy</span>
                                    <span className="text-xl md:text-2xl font-bold">{projectStats.active}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                                <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                                Hoạt động gần đây
                            </h2>
                            <p className="text-xs md:text-sm text-slate-600">Theo dõi các hoạt động mới nhất trong hệ thống</p>
                        </div>
                        <button className="px-3 md:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-colors whitespace-nowrap">
                            Xem tất cả
                        </button>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-8 md:py-12">
                                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Activity className="w-8 h-8 md:w-10 md:h-10 text-slate-400" />
                                </div>
                                <p className="text-slate-500 text-base md:text-lg font-medium">Chưa có hoạt động nào</p>
                                <p className="text-slate-400 text-xs md:text-sm">Các hoạt động mới sẽ xuất hiện ở đây</p>
                            </div>
                        ) : (
                            recentActivities.map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200"
                                >
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                                        {activity.user.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm md:text-base text-slate-900 font-medium break-words">
                                            <span className="font-bold text-blue-600">{activity.user}</span>{" "}
                                            <span className="text-slate-600">{activity.action}</span>{" "}
                                            {activity.project && (
                                                <span className="font-semibold text-slate-900">{activity.project}</span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-1 md:gap-2 mt-1 text-xs text-slate-500">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            {activity.time}
                                        </div>
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
