"use client"
import { useState, useEffect } from "react"
import {
    FolderOpen,
    Users,
    Calendar,
    Clock,
    BarChart3,
    Eye,
    Download,
    FileText,
    Target,
    TrendingUp,
    CheckCircle2,
    AlertTriangle
} from "lucide-react"
import { getMemberProjects } from "@/axios/api"

interface Project {
    id: number
    name: string
    description: string
    status: string
    progress: number
    startDate: string
    endDate?: string
    deadline: string
    teamSize: number
    manager: string
    managerPosition?: string
    totalTasks: number
    completedTasks: number
    myTasks: number
    myCompletedTasks: number
    myRole?: string
    documents?: number
}

export default function MyProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            setLoading(true)
            setError(null)
            
            // Debug: Check if user is logged in
            const token = localStorage.getItem('accessToken')
            console.log('🔐 Token exists:', !!token)
            
            // Fetch real data from API
            console.log('📡 Fetching member projects...')
            const data = await getMemberProjects()
            console.log('✅ Projects received:', data.length, 'projects')
            console.log('📊 Projects data:', data)
            
            setProjects(data)
        } catch (error: any) {
            console.error("Error loading projects:", error)
            setError(error.message || "Không thể tải danh sách dự án")
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Hoàn thành": return "text-green-600 bg-green-100"
            case "Đang chạy": return "text-blue-600 bg-blue-100"
            case "Chưa bắt đầu": return "text-gray-600 bg-gray-100"
            case "Tạm dừng": return "text-orange-600 bg-orange-100"
            default: return "text-gray-600 bg-gray-100"
        }
    }

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return "bg-green-500"
        if (progress >= 50) return "bg-blue-500"
        if (progress >= 25) return "bg-yellow-500"
        return "bg-red-500"
    }

    const getDaysUntilDeadline = (deadline: string) => {
        const today = new Date()
        const deadlineDate = new Date(deadline)
        const diffTime = deadlineDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
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

                    {/* Stats Overview Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                                    </div>
                                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Projects Grid Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse"></div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="h-9 bg-gray-200 rounded-lg flex-1 animate-pulse"></div>
                                        <div className="h-9 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <p className="text-gray-900 font-semibold mb-2">Lỗi khi tải dữ liệu</p>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={loadProjects}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dự án của tôi</h1>
                    <p className="text-gray-600">Theo dõi tiến độ và thông tin các dự án đang tham gia</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tổng dự án</p>
                                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                            </div>
                            <FolderOpen className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {projects.filter(p => p.status === "Đang chạy").length}
                                </p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {projects.filter(p => p.status === "Hoàn thành").length}
                                </p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Công việc của tôi</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {projects.reduce((sum, p) => sum + p.myTasks, 0)}
                                </p>
                            </div>
                            <Target className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                {projects.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                        <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có dự án</h3>
                        <p className="text-gray-600">Bạn chưa được phân công vào dự án nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {projects.map(project => (
                            <div key={project.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                {/* Project Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                Quản lý: {project.manager}
                                                {project.managerPosition && ` (${project.managerPosition})`}
                                            </span>
                                        </div>
                                    </div>
                                <button
                                    onClick={() => {
                                        setSelectedProject(project)
                                        setIsDetailModalOpen(true)
                                    }}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    Chi tiết
                                </button>
                            </div>

                            {/* Progress */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Tiến độ tổng thể</span>
                                    <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Project Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Nhóm</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">{project.teamSize} thành viên</p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Target className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Công việc</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {project.completedTasks}/{project.totalTasks}
                                    </p>
                                </div>
                            </div>

                            {/* My Tasks */}
                            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">Công việc của tôi</span>
                                </div>
                                <p className="text-lg font-bold text-blue-900">
                                    {project.myCompletedTasks}/{project.myTasks} hoàn thành
                                </p>
                                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${project.myTasks > 0 ? (project.myCompletedTasks / project.myTasks) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Bắt đầu: {new Date(project.startDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span className={
                                        getDaysUntilDeadline(project.deadline) < 0 && project.status !== "Hoàn thành"
                                            ? "text-red-600 font-medium"
                                            : getDaysUntilDeadline(project.deadline) <= 7 && project.status !== "Hoàn thành"
                                                ? "text-orange-600 font-medium"
                                                : ""
                                    }>
                                        Deadline: {new Date(project.deadline).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>

                            {/* Warning for overdue projects */}
                            {getDaysUntilDeadline(project.deadline) < 0 && project.status !== "Hoàn thành" && (
                                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm font-medium">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Dự án đã quá hạn {Math.abs(getDaysUntilDeadline(project.deadline))} ngày</span>
                                </div>
                            )}
                        </div>
                    ))}
                    </div>
                )}

                {/* Project Detail Modal */}
                {isDetailModalOpen && selectedProject && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                                    <button
                                        onClick={() => setIsDetailModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Project Overview */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tổng quan dự án</h3>
                                    <p className="text-gray-600 mb-4">{selectedProject.description}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                                <span className="font-medium text-gray-700">Trạng thái</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.status)}`}>
                                                {selectedProject.status}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                                <span className="font-medium text-gray-700">Tiến độ</span>
                                            </div>
                                            <span className="text-2xl font-bold text-gray-900">{selectedProject.progress}%</span>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="w-5 h-5 text-purple-600" />
                                                <span className="font-medium text-gray-700">Vai trò</span>
                                            </div>
                                            <span className="text-lg font-semibold text-gray-900">{selectedProject.myRole}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline & Deadlines */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Thời gian thực hiện</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                                <span className="font-medium text-blue-700">Ngày bắt đầu</span>
                                            </div>
                                            <span className="text-lg font-semibold text-blue-900">
                                                {new Date(selectedProject.startDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>

                                        <div className="bg-red-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-5 h-5 text-red-600" />
                                                <span className="font-medium text-red-700">Deadline</span>
                                            </div>
                                            <span className="text-lg font-semibold text-red-900">
                                                {new Date(selectedProject.deadline).toLocaleDateString('vi-VN')}
                                            </span>
                                            <p className="text-sm text-red-600 mt-1">
                                                {getDaysUntilDeadline(selectedProject.deadline) >= 0
                                                    ? `Còn ${getDaysUntilDeadline(selectedProject.deadline)} ngày`
                                                    : `Quá hạn ${Math.abs(getDaysUntilDeadline(selectedProject.deadline))} ngày`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Thống kê</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center bg-gray-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-gray-900">{selectedProject.teamSize}</div>
                                            <div className="text-sm text-gray-600">Thành viên</div>
                                        </div>

                                        <div className="text-center bg-blue-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-blue-600">{selectedProject.totalTasks}</div>
                                            <div className="text-sm text-gray-600">Tổng công việc</div>
                                        </div>

                                        <div className="text-center bg-green-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-green-600">{selectedProject.myTasks}</div>
                                            <div className="text-sm text-gray-600">Công việc của tôi</div>
                                        </div>

                                        <div className="text-center bg-purple-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-purple-600">{selectedProject.documents}</div>
                                            <div className="text-sm text-gray-600">Tài liệu</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Manager */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Quản lý dự án</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{selectedProject.manager}</p>
                                            <p className="text-sm text-gray-600">Project Manager</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                        <Eye className="w-5 h-5" />
                                        Xem Timeline
                                    </button>
                                    <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Công việc của tôi
                                    </button>
                                    <button className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Tài liệu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {projects.length === 0 && (
                    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                        <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dự án</h3>
                        <p className="text-gray-500">Bạn chưa được giao tham gia dự án nào.</p>
                    </div>
                )}
            </div>
        </div>
    )
}