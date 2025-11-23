"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { getMemberProjects, getTasksByProject, fetchUsers } from "@/axios/api"
import ProjectTimelineClient from '@/components/ProjectTimelineClient'
import MyTasksModal from '@/components/MyTasksModal'
import ProjectDocumentsClient from '@/components/ProjectDocumentsClient'
import ProjectTasksList from '@/components/ProjectTasksList'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

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
    const router = useRouter()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [showTimeline, setShowTimeline] = useState(false)
    const [showMyTasks, setShowMyTasks] = useState(false)
    const [projectMembers, setProjectMembers] = useState<any[]>([])
    const [projectTasksCount, setProjectTasksCount] = useState<number | null>(null)
    const [showDocuments, setShowDocuments] = useState(false)
    const [showKanban, setShowKanban] = useState(false)
    // removed showAllTasks (all tasks stays in overview)
    const [error, setError] = useState<string | null>(null)

    const fmt = (v: any) => {
        if (v === null || v === undefined) return '—'
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
        if (typeof v === 'object') {
            if (v.hoten) return String(v.hoten)
            if (v.name) return String(v.name)
            try { return JSON.stringify(v) } catch (e) { return 'object' }
        }
        return String(v)
    }
    useEffect(() => {
        loadProjects()
    }, [])

    // When opening detail modal, fetch tasks for the project to compute members and total tasks
    useEffect(() => {
        let mounted = true
        const loadProjectMeta = async () => {
            if (!isDetailModalOpen || !selectedProject) return
            try {
                // Fetch tasks for project
                const tasksRes = await getTasksByProject(selectedProject.id)
                const tasksArr = tasksRes.tasks || tasksRes || []
                if (!mounted) return
                setProjectTasksCount(tasksArr.length)

                // Derive unique user IDs from tasks
                const ids = new Set<string>()
                tasksArr.forEach((t: any) => {
                    const uid = t.nguoiDuocGiaoId || t.nguoiThucHienId || t.userId || t.creatorId
                    if (uid) ids.add(String(uid))
                })

                if (ids.size === 0) {
                    setProjectMembers([])
                    return
                }

                // Fetch all users (small optimization: could call a project-members endpoint if exists)
                const usersRes = await fetchUsers()
                let usersArr: any[] = []
                if (Array.isArray(usersRes)) usersArr = usersRes
                else if ((usersRes as any)?.users) usersArr = (usersRes as any).users
                else usersArr = usersRes || []
                if (!mounted) return
                const members = usersArr.filter((u: any) => ids.has(String(u.id) || String(u.userId) || String(u.manv)))
                setProjectMembers(members)
            } catch (err) {
                console.error('Load project meta error', err)
            }
        }
        loadProjectMeta()
        return () => { mounted = false }
    }, [isDetailModalOpen, selectedProject])

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

                {/* Quick actions removed from top — actions now live inside each project's detail modal */}

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
                                                Quản lý: {fmt(project.manager)}
                                                {project.managerPosition && ` (${fmt(project.managerPosition)})`}
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
                    <div 
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                        onClick={() => {
                            setIsDetailModalOpen(false)
                            setShowTimeline(false)
                            setShowMyTasks(false)
                            setShowDocuments(false)
                        }}
                    >
                        <div 
                            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                                <button
                                    onClick={() => {
                                            setIsDetailModalOpen(false)
                                            setShowTimeline(false)
                                            setShowMyTasks(false)
                                            setShowDocuments(false)
                                        }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Action buttons for this project (in-detail) */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { 
                                            setShowTimeline(!showTimeline); 
                                            setShowMyTasks(false); 
                                            setShowDocuments(false);
                                            setShowKanban(false);
                                        }}
                                        className={`px-3 py-2 rounded-md transition-colors ${
                                            showTimeline 
                                                ? 'bg-blue-700 text-white' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        👁️ Xem Timeline
                                    </button>
                                    <button
                                        onClick={() => { 
                                            setShowMyTasks(!showMyTasks); 
                                            setShowTimeline(false); 
                                            setShowDocuments(false);
                                            setShowKanban(false);
                                        }}
                                        className={`px-3 py-2 rounded-md transition-colors ${
                                            showMyTasks 
                                                ? 'bg-green-700 text-white' 
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                    >
                                        🎯 Công việc của tôi
                                    </button>
                                    {/* Tất cả công việc button removed as requested */}
                                    <button
                                        onClick={() => { 
                                            setShowKanban(!showKanban); 
                                            setShowTimeline(false); 
                                            setShowMyTasks(false); 
                                            setShowDocuments(false);
                                        }}
                                        className={`px-3 py-2 rounded-md transition-colors ${
                                            showKanban 
                                                ? 'bg-indigo-700 text-white' 
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                    >
                                        🗂️ Kanban
                                    </button>

                                    <button
                                        onClick={() => { 
                                            setShowDocuments(!showDocuments); 
                                            setShowTimeline(false); 
                                            setShowMyTasks(false); 
                                            setShowKanban(false);
                                        }}
                                        className={`px-3 py-2 rounded-md transition-colors ${
                                            showDocuments 
                                                ? 'bg-violet-700 text-white' 
                                                : 'bg-violet-600 text-white hover:bg-violet-700'
                                        }`}
                                    >
                                        📄 Tài liệu
                                    </button>
                                </div>

                                {/* Selected panel (shows above the project overview) */}
                                {(showTimeline || showMyTasks || showDocuments || showKanban) && (
                                    <div className="space-y-4">
                                        {showTimeline && (
                                            <div>
                                                <ProjectTimelineClient projectId={selectedProject.id} />
                                            </div>
                                        )}

                                        {showMyTasks && (
                                            <div>
                                                <MyTasksModal projectId={selectedProject.id} />
                                            </div>
                                        )}

                                        {showKanban && (
                                            <div>
                                                <KanbanBoard projectId={selectedProject.id} />
                                            </div>
                                        )}

                                        {showDocuments && (
                                            <div>
                                                <ProjectDocumentsClient projectId={selectedProject.id} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Always show the full overview/details below the selected panel */}
                                <div className="space-y-6">
                                    {/* Description and progress */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Tổng quan dự án</h3>
                                        <p className="text-gray-600 mt-2">{selectedProject.description}</p>

                                        <div className="mt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-sm font-medium text-gray-700">Tiến độ tổng thể</div>
                                                <div className="text-sm font-bold text-gray-900">{selectedProject.progress}%</div>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(selectedProject.progress)}`}
                                                    style={{ width: `${selectedProject.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline & Deadlines */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                                <span className="font-medium text-blue-700">Ngày bắt đầu</span>
                                            </div>
                                            <div className="text-lg font-semibold text-blue-900">{selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString('vi-VN') : '—'}</div>
                                        </div>

                                        <div className="bg-red-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-5 h-5 text-red-600" />
                                                <span className="font-medium text-red-700">Deadline</span>
                                            </div>
                                            <div className="text-lg font-semibold text-red-900">{selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString('vi-VN') : '—'}</div>
                                            {selectedProject.deadline && (
                                                <p className={`text-sm mt-1 ${getDaysUntilDeadline(selectedProject.deadline) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {getDaysUntilDeadline(selectedProject.deadline) >= 0
                                                        ? `Còn ${getDaysUntilDeadline(selectedProject.deadline)} ngày`
                                                        : `Quá hạn ${Math.abs(getDaysUntilDeadline(selectedProject.deadline))} ngày`}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Statistics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center bg-gray-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-gray-900">{selectedProject.teamSize ?? '—'}</div>
                                            <div className="text-sm text-gray-600">Thành viên</div>
                                        </div>

                                        <div className="text-center bg-blue-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-blue-600">{selectedProject.totalTasks ?? '—'}</div>
                                            <div className="text-sm text-gray-600">Tổng công việc</div>
                                        </div>

                                        <div className="text-center bg-green-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-green-600">{selectedProject.myTasks ?? '—'}</div>
                                            <div className="text-sm text-gray-600">Công việc của tôi</div>
                                        </div>

                                        <div className="text-center bg-purple-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-purple-600">{selectedProject.documents ?? 0}</div>
                                            <div className="text-sm text-gray-600">Tài liệu</div>
                                        </div>
                                    </div>

                                    {/* Project Manager */}
                                    <div>
                                        <h4 className="text-lg font-semibold mt-2">Quản lý dự án</h4>
                                        <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 mt-3">
                                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                {String(fmt(selectedProject.manager)).slice(0,1).toUpperCase() || 'P'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{fmt(selectedProject.manager)}</p>
                                                <p className="text-sm text-gray-600">{fmt(selectedProject.managerPosition) === '—' ? '' : fmt(selectedProject.managerPosition)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Members list & total tasks */}
                                    <div>
                                        <h4 className="text-lg font-semibold mt-4">Thành viên dự án</h4>
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {projectMembers.length === 0 ? (
                                                <div className="text-sm text-muted-foreground">Chưa có thành viên được ghi nhận</div>
                                            ) : (
                                                projectMembers.map((m: any) => (
                                                    <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">{m.hoten ? String(m.hoten).slice(0,1).toUpperCase() : String(m.manv || m.id).slice(0,1).toUpperCase()}</div>
                                                        <div className="text-sm">
                                                            <div className="font-medium">{m.hoten || m.name || m.manv || m.username}</div>
                                                            <div className="text-xs text-muted-foreground">{m.chucvu || m.position || ''}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="mt-4 text-sm text-gray-700">Tổng công việc: <span className="font-semibold">{projectTasksCount ?? selectedProject.totalTasks ?? '—'}</span></div>
                                    </div>
                                    {/* Project Tasks (show by default inside details) */}
                                    <div>
                                        <h4 className="text-lg font-semibold mt-4">Danh sách công việc (tất cả)</h4>
                                        <div className="mt-3">
                                            <ProjectTasksList projectId={selectedProject.id} />
                                        </div>
                                    </div>

                                    {/* Warning for overdue projects (duplicate check inside modal too) */}
                                    {selectedProject.deadline && getDaysUntilDeadline(selectedProject.deadline) < 0 && selectedProject.status !== 'Hoàn thành' && (
                                        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm font-medium">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Dự án đã quá hạn {Math.abs(getDaysUntilDeadline(selectedProject.deadline))} ngày</span>
                                        </div>
                                    )}
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