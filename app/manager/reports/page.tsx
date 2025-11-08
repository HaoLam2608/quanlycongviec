"use client"
import { useState, useEffect } from "react"
import {
    BarChart3,
    TrendingUp,
    Calendar,
    Download,       
    Users,
    FolderOpen,
    CheckCircle,
    Clock,
    AlertTriangle,
    Target,
    Activity,
    PieChart,
    LineChart,
    XCircle,
    PlayCircle,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    Briefcase
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToastContext } from "@/components/providers/toast-provider"
import { fetchProjectsByManager, getTasksByProject } from "@/axios/api"
import { getUsers } from "@/axios/adminApi"

interface Project {
    id: number
    tenduan: string
    mota?: string
    ngayBatDau?: string
    ngayKetThuc?: string
    trangThai?: string
}

interface Task {
    id: number
    tentask: string
    trangThai: string
    mucDoUuTien?: string
    nguoiDuocGiaoId: number
    duanId: number
    ngayBatDau?: string
    ngayKetThuc?: string
    nguoiDuocGiao?: {
        id: number
        hoten: string
        email?: string
        avatar?: string
    }
}

interface UserType {
    id: number
    hoten: string
    email?: string
    manv: string
    avatar?: string
}

export default function ManagerReportsPage() {
    const [loading, setLoading] = useState(true)
    const [reportType, setReportType] = useState<"overview" | "projects" | "team">("overview")
    const [dateRange, setDateRange] = useState("thisMonth")
    const [projects, setProjects] = useState<Project[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [users, setUsers] = useState<UserType[]>([])
    const { showError } = useToastContext()

    // Helper function to create full URL for images
    const makeFullUrl = (path?: string) => {
        if (!path) return undefined
        if (path.startsWith('http://') || path.startsWith('https://')) return path
        return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`
    }

    useEffect(() => {
        loadReportData()
    }, [dateRange])

    const loadReportData = async () => {
        try {
            setLoading(true)
            const manv = localStorage.getItem('manv')
            if (!manv) {
                showError('Không tìm thấy thông tin người dùng')
                return
            }

            // Load projects
            const projRes = await fetchProjectsByManager(manv)
            const projectsList = (projRes.projects || projRes || []) as Project[]
            setProjects(projectsList)

            // Load all tasks from all projects
            let allTasks: Task[] = []
            for (const proj of projectsList) {
                try {
                    const taskRes = await getTasksByProject(proj.id)
                    const projectTasks = (taskRes.tasks || taskRes || []) as Task[]
                    allTasks = [...allTasks, ...projectTasks]
                } catch (e) {
                    // ignore
                }
            }
            setTasks(allTasks)

            // Load users
            const usersRes = await getUsers({})
            const usersList = (usersRes.users || usersRes || []) as UserType[]
            setUsers(usersList)

        } catch (err: any) {
            console.error('Load report data error', err)
            showError(err?.message || 'Không thể tải dữ liệu báo cáo')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'hoan_thanh':
            case 'completed':
            case 'hoàn thành': return 'bg-green-100 text-green-800 border-green-200'
            case 'dang_thuc_hien':
            case 'in_progress':
            case 'đang thực hiện': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'chua_bat_dau':
            case 'not_started':
            case 'chưa bắt đầu': return 'bg-gray-100 text-gray-800 border-gray-200'
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
    }

    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'hoan_thanh':
            case 'completed': return 'Hoàn thành'
            case 'dang_thuc_hien':
            case 'in_progress': return 'Đang thực hiện'
            case 'chua_bat_dau':
            case 'not_started': return 'Chưa bắt đầu'
            default: return status || 'Chưa xác định'
        }
    }

    // Calculate project statistics
    const projectsWithStats = projects.map(project => {
        const projectTasks = tasks.filter(t => t.duanId === project.id)
        const completedTasks = projectTasks.filter(t => 
            ['hoan_thanh', 'completed', 'hoàn thành'].includes(t.trangThai?.toLowerCase())
        ).length
        const inProgressTasks = projectTasks.filter(t => 
            ['dang_thuc_hien', 'in_progress', 'đang thực hiện'].includes(t.trangThai?.toLowerCase())
        ).length
        const pendingTasks = projectTasks.filter(t => 
            ['chua_bat_dau', 'not_started', 'chưa bắt đầu'].includes(t.trangThai?.toLowerCase())
        ).length
        const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0

        // Check if project is delayed
        const endDate = project.ngayKetThuc ? new Date(project.ngayKetThuc) : null
        const now = new Date()
        const isDelayed = endDate && endDate < now && progress < 100
        
        return {
            ...project,
            totalTasks: projectTasks.length,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            progress,
            status: progress === 100 ? 'Hoàn thành' : (isDelayed ? 'Trễ tiến độ' : 'Đang thực hiện')
        }
    })

    // Calculate user statistics
    const usersWithStats = users.map(user => {
        const userTasks = tasks.filter(t => t.nguoiDuocGiaoId === user.id)
        const completedTasks = userTasks.filter(t => 
            ['hoan_thanh', 'completed', 'hoàn thành'].includes(t.trangThai?.toLowerCase())
        ).length
        const inProgressTasks = userTasks.filter(t => 
            ['dang_thuc_hien', 'in_progress', 'đang thực hiện'].includes(t.trangThai?.toLowerCase())
        ).length
        const efficiency = userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0
        const workload = userTasks.length

        return {
            ...user,
            totalTasks: userTasks.length,
            completedTasks,
            inProgressTasks,
            efficiency,
            workload
        }
    }).filter(u => u.totalTasks > 0) // Only show users with tasks

    const totalStats = {
        totalProjects: projects.length,
        completedProjects: projectsWithStats.filter(p => p.status === 'Hoàn thành').length,
        inProgressProjects: projectsWithStats.filter(p => p.status === 'Đang thực hiện').length,
        delayedProjects: projectsWithStats.filter(p => p.status === 'Trễ tiến độ').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => ['hoan_thanh', 'completed', 'hoàn thành'].includes(t.trangThai?.toLowerCase())).length,
        inProgressTasks: tasks.filter(t => ['dang_thuc_hien', 'in_progress', 'đang thực hiện'].includes(t.trangThai?.toLowerCase())).length,
        pendingTasks: tasks.filter(t => ['chua_bat_dau', 'not_started', 'chưa bắt đầu'].includes(t.trangThai?.toLowerCase())).length,
        totalTeamMembers: usersWithStats.length,
        avgEfficiency: usersWithStats.length > 0 ? Math.round(usersWithStats.reduce((sum, m) => sum + m.efficiency, 0) / usersWithStats.length) : 0
    }

    const completionRate = totalStats.totalTasks > 0 
        ? Math.round((totalStats.completedTasks / totalStats.totalTasks) * 100) 
        : 0

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-9 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
                    </div>

                    {/* Filters Skeleton */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                </div>
                                <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                                <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
                                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <BarChart3 className="w-10 h-10 text-[#003D82]" />
                        Báo cáo thống kê
                    </h1>
                    <p className="text-slate-600">Theo dõi và phân tích hiệu suất dự án, nhiệm vụ và nhân sự</p>
                </div>

                {/* Filters */}
                <Card className="p-6 mb-8 bg-white shadow-lg border-slate-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => setReportType("overview")}
                                variant={reportType === "overview" ? "default" : "outline"}
                                className={reportType === "overview" ? "bg-[#003D82] hover:bg-[#0052A3]" : ""}
                            >
                                <Activity className="w-4 h-4 mr-2" />
                                Tổng quan
                            </Button>
                            <Button
                                onClick={() => setReportType("projects")}
                                variant={reportType === "projects" ? "default" : "outline"}
                                className={reportType === "projects" ? "bg-[#003D82] hover:bg-[#0052A3]" : ""}
                            >
                                <FolderOpen className="w-4 h-4 mr-2" />
                                Dự án
                            </Button>
                            <Button
                                onClick={() => setReportType("team")}
                                variant={reportType === "team" ? "default" : "outline"}
                                className={reportType === "team" ? "bg-[#003D82] hover:bg-[#0052A3]" : ""}
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Nhân sự
                            </Button>
                        </div>

                        <div className="flex gap-3">
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="w-[180px]">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="thisWeek">Tuần này</SelectItem>
                                    <SelectItem value="thisMonth">Tháng này</SelectItem>
                                    <SelectItem value="thisQuarter">Quý này</SelectItem>
                                    <SelectItem value="thisYear">Năm này</SelectItem>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button className="bg-green-600 hover:bg-green-700 gap-2">
                                <Download className="w-4 h-4" />
                                Xuất Excel
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Overview Stats */}
                {reportType === "overview" && (
                    <>
                        {/* Main Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Tổng dự án</p>
                                        <p className="text-3xl font-bold text-blue-700">{totalStats.totalProjects}</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-green-600 font-medium">Đang quản lý</span>
                                        </div>
                                    </div>
                                    <FolderOpen className="w-12 h-12 text-blue-600 opacity-80" />
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Nhiệm vụ hoàn thành</p>
                                        <p className="text-3xl font-bold text-green-700">{totalStats.completedTasks}</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-slate-600">/{totalStats.totalTasks} tổng</span>
                                        </div>
                                    </div>
                                    <CheckCircle className="w-12 h-12 text-green-600 opacity-80" />
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Nhân sự</p>
                                        <p className="text-3xl font-bold text-purple-700">{totalStats.totalTeamMembers}</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <TrendingUp className="w-4 h-4 text-purple-600" />
                                            <span className="text-sm text-purple-600 font-medium">Hiệu suất {totalStats.avgEfficiency}%</span>
                                        </div>
                                    </div>
                                    <Users className="w-12 h-12 text-purple-600 opacity-80" />
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Tỷ lệ hoàn thành</p>
                                        <p className="text-3xl font-bold text-orange-700">{completionRate}%</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <Target className="w-4 h-4 text-orange-600" />
                                            <span className="text-sm text-slate-600">Mục tiêu 90%</span>
                                        </div>
                                    </div>
                                    <Target className="w-12 h-12 text-orange-600 opacity-80" />
                                </div>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            {/* Project Status Distribution */}
                            <Card className="p-6 bg-white shadow-lg border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-[#003D82]" />
                                    Phân bổ trạng thái dự án
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="font-medium text-slate-900">Hoàn thành</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-green-700">{totalStats.completedProjects}</span>
                                            <p className="text-xs text-slate-500">dự án</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                                <PlayCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="font-medium text-slate-900">Đang thực hiện</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-blue-700">{totalStats.inProgressProjects}</span>
                                            <p className="text-xs text-slate-500">dự án</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                                <AlertTriangle className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="font-medium text-slate-900">Trễ tiến độ</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-red-700">{totalStats.delayedProjects}</span>
                                            <p className="text-xs text-slate-500">dự án</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Task Status Distribution */}
                            <Card className="p-6 bg-white shadow-lg border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-[#003D82]" />
                                    Phân bổ nhiệm vụ
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700">Hoàn thành</span>
                                            <span className="text-sm font-bold text-green-700">{totalStats.completedTasks} / {totalStats.totalTasks}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${(totalStats.completedTasks / totalStats.totalTasks) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700">Đang thực hiện</span>
                                            <span className="text-sm font-bold text-blue-700">{totalStats.inProgressTasks} / {totalStats.totalTasks}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${(totalStats.inProgressTasks / totalStats.totalTasks) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700">Chưa bắt đầu</span>
                                            <span className="text-sm font-bold text-gray-700">{totalStats.pendingTasks} / {totalStats.totalTasks}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-gray-500 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${(totalStats.pendingTasks / totalStats.totalTasks) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Recent Projects Summary */}
                        <Card className="p-6 bg-white shadow-lg border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-[#003D82]" />
                                Dự án gần đây
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projectsWithStats.slice(0, 6).map(project => (
                                    <div key={project.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all">
                                        <h4 className="font-semibold text-slate-900 mb-2 line-clamp-1">{project.tenduan}</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Tiến độ:</span>
                                                <span className="font-bold text-[#003D82]">{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${project.progress === 100 ? 'bg-green-500' : project.progress >= 70 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                                    style={{ width: `${project.progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>{project.completedTasks}/{project.totalTasks} nhiệm vụ</span>
                                                <Badge className={getStatusColor(project.status)} variant="outline">
                                                    {project.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                )}

                {/* Projects Report */}
                {reportType === "projects" && (
                    <Card className="bg-white shadow-lg border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                <FolderOpen className="w-6 h-6 text-[#003D82]" />
                                Báo cáo chi tiết dự án
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Dự án
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Tiến độ
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Nhiệm vụ
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Thời gian
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {projectsWithStats.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                Không có dự án nào
                                            </td>
                                        </tr>
                                    ) : (
                                        projectsWithStats.map((project) => (
                                            <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-slate-900">{project.tenduan}</div>
                                                        {project.mota && (
                                                            <div className="text-sm text-slate-500 line-clamp-1">{project.mota}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                                            <div
                                                                className={`h-2.5 rounded-full transition-all ${
                                                                    project.progress === 100 ? 'bg-green-500' : 
                                                                    project.progress >= 70 ? 'bg-blue-500' : 'bg-yellow-500'
                                                                }`}
                                                                style={{ width: `${project.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-slate-700 font-semibold min-w-[45px]">{project.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                            <span className="text-green-700 font-medium">{project.completedTasks} hoàn thành</span>
                                                        </div>
                                                        <div className="text-slate-500">{project.totalTasks} tổng cộng</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm space-y-1">
                                                        {project.ngayBatDau && (
                                                            <div className="text-slate-600">
                                                                Bắt đầu: {new Date(project.ngayBatDau).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        )}
                                                        {project.ngayKetThuc && (
                                                            <div className="text-slate-600">
                                                                Kết thúc: {new Date(project.ngayKetThuc).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={getStatusColor(project.status)} variant="outline">
                                                        {project.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Team Report */}
                {reportType === "team" && (
                    <Card className="bg-white shadow-lg border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                <Users className="w-6 h-6 text-[#003D82]" />
                                Báo cáo hiệu suất nhân sự
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Thành viên
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Nhiệm vụ hoàn thành
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Đang thực hiện
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Tổng nhiệm vụ
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Hiệu suất
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {usersWithStats.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                Không có dữ liệu nhân sự
                                            </td>
                                        </tr>
                                    ) : (
                                        usersWithStats.map((member) => (
                                            <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                                            {member.avatar ? (
                                                                <img
                                                                    src={makeFullUrl(member.avatar)}
                                                                    alt={member.hoten}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-blue-700 font-semibold">
                                                                    {member.hoten.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-900">{member.hoten}</div>
                                                            <div className="text-sm text-slate-500">{member.manv}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm font-semibold text-green-700">{member.completedTasks}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-blue-500" />
                                                        <span className="text-sm font-semibold text-blue-700">{member.inProgressTasks}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-700">{member.totalTasks}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                                                            <div
                                                                className={`h-2.5 rounded-full ${
                                                                    member.efficiency >= 80 ? 'bg-green-500' :
                                                                    member.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${member.efficiency}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-900 min-w-[45px]">{member.efficiency}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}