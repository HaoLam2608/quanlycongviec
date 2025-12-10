"use client"
import { useState, useEffect } from "react"
import { Briefcase, Calendar, User, CheckCircle2, Clock, FolderOpen, Building2, Users, AlertCircle, X, ListTodo, Activity, TrendingUp, Mail, Phone } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'

interface Project {
    id: number
    status: 'active' | 'completed'
    createdAt: string
    Group: {
        id: number
        name: string
        status: string
    }
    project: {
        id: number
        tenduan: string
        mota: string
        ngaybatdau: string
        ngayketthuc: string
        status: string
        nguoiDamNhan: {
            id: number
            hoten: string
            manv: string
            email: string
        }
    }
}

interface Group {
    id: number
    name: string
    status: string
}

interface ProjectDetail {
    project: Project['project']
    group: {
        id: number
        name: string
        status: string
        members?: Array<{
            id: number
            hoten: string
            manv: string
            email: string
            sdt?: string
            chucvu?: string
        }>
    }
    participationStatus: 'active' | 'completed'
    tasks?: Array<{
        id: number
        tentask: string
        trangthai: string
        doUuTien: string
    }>
    stats?: {
        totalTasks: number
        completedTasks: number
        totalMembers: number
    }
}

export default function TeamLeadProjectsPage() {
    const { showError } = useToastContext()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'paused'>('active')
    const [projects, setProjects] = useState<Project[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)
    const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null)

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        setLoading(true)
        try {
            const res = await api.get('/groups/my-projects')
            const data = res.data
            
            setProjects(data.projects || [])
            setGroups(data.groups || [])
        } catch (error: any) {
            console.error('Load projects error:', error)
            if (error.response?.status !== 404) {
                showError(error.response?.data?.message || 'Lỗi tải danh sách dự án')
            }
        } finally {
            setLoading(false)
        }
    }

    const loadProjectDetail = async (projectItem: Project) => {
        setDetailLoading(true)
        setSelectedProject(projectItem)
        setShowDetailModal(true)
        
        try {
            // Load group detail with members
            const groupRes = await api.get(`/groups/${projectItem.Group.id}`)
            const groupData = groupRes.data.group
            
            // Load tasks for this project
            const tasksRes = await api.get('/tasks/my-tasks')
            const allTasks = tasksRes.data.tasks || []
            const projectTasks = allTasks.filter((t: any) => t.duanId === projectItem.project.id)
            
            const completedTasks = projectTasks.filter((t: any) => t.trangthai === 'Hoàn thành').length
            
            setProjectDetail({
                project: projectItem.project,
                group: {
                    id: groupData.id,
                    name: groupData.name,
                    status: groupData.status,
                    members: groupData.members || []
                },
                participationStatus: projectItem.status,
                tasks: projectTasks,
                stats: {
                    totalTasks: projectTasks.length,
                    completedTasks: completedTasks,
                    totalMembers: (groupData.members || []).length
                }
            })
        } catch (error: any) {
            console.error('Load project detail error:', error)
            showError('Lỗi tải chi tiết dự án')
        } finally {
            setDetailLoading(false)
        }
    }

    const closeModal = () => {
        setShowDetailModal(false)
        setSelectedProject(null)
        setProjectDetail(null)
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            'chua_bat_dau': { label: 'Chuẩn bị', className: 'bg-gray-100 text-gray-700 border-gray-200' },
            'dang_chay': { label: 'Đang chạy', className: 'bg-blue-100 text-blue-700 border-blue-200' },
            'hoan_thanh': { label: 'Hoàn thành', className: 'bg-green-100 text-green-700 border-green-200' },
            'tam_dung': { label: 'Tạm dừng', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        }
        const info = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' }
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${info.className}`}>
                {info.label}
            </span>
        )
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    }

    const activeProjects = projects.filter(p => p.status === 'active' && p.project.status !== 'da_dong')
    const completedProjects = projects.filter(p => p.status === 'completed' && p.project.status !== 'da_dong')
    const pausedProjects = projects.filter(p => p.project.status === 'da_dong')
    const currentProjects = activeTab === 'active' ? activeProjects : activeTab === 'completed' ? completedProjects : pausedProjects

    if (loading) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-7 h-7 text-blue-500" />
                        Dự Án Của Nhóm
                    </h1>
                    <p className="text-gray-600 mt-1">Danh sách dự án đang tham gia và đã hoàn thành</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{projects.length}</div>
                    <div className="text-sm text-blue-700">Tổng dự án</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-900">{activeProjects.length}</div>
                    <div className="text-sm text-green-700">Đang tham gia</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle2 className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{completedProjects.length}</div>
                    <div className="text-sm text-purple-700">Đã hoàn thành</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">{pausedProjects.length}</div>
                    <div className="text-sm text-yellow-700">Đang tạm dừng</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex gap-1 p-1">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                activeTab === 'active'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            Đang tham gia
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                activeTab === 'active' ? 'bg-white text-blue-500' : 'bg-gray-200 text-gray-700'
                            }`}>
                                {activeProjects.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('paused')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                activeTab === 'paused'
                                    ? 'bg-yellow-500 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <AlertCircle className="w-4 h-4" />
                            Đang tạm dừng
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                activeTab === 'paused' ? 'bg-white text-yellow-500' : 'bg-gray-200 text-gray-700'
                            }`}>
                                {pausedProjects.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                activeTab === 'completed'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Đã hoàn thành
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                activeTab === 'completed' ? 'bg-white text-blue-500' : 'bg-gray-200 text-gray-700'
                            }`}>
                                {completedProjects.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Project List */}
                <div className="p-6">
                    {currentProjects.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">
                                {activeTab === 'active' ? 'Chưa có dự án đang tham gia' : activeTab === 'paused' ? 'Chưa có dự án đang tạm dừng' : 'Chưa có dự án đã hoàn thành'}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                                Các dự án được gán sẽ hiển thị tại đây
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentProjects.map((projectItem) => (
                                <div
                                    key={`${projectItem.Group.id}-${projectItem.project.id}`}
                                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
                                    onClick={() => loadProjectDetail(projectItem)}
                                >
                                    {/* Header with status */}
                                    <div className={`p-4 ${
                                        projectItem.status === 'active' 
                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100' 
                                            : 'bg-gradient-to-r from-gray-50 to-gray-100'
                                    }`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <Briefcase className={`w-8 h-8 ${
                                                projectItem.status === 'active' ? 'text-blue-600' : 'text-gray-500'
                                            }`} />
                                            {getStatusBadge(projectItem.project.status)}
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                                            {projectItem.project.tenduan}
                                        </h3>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 space-y-3">
                                        {/* Description */}
                                        {projectItem.project.mota && (
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-gray-600 line-clamp-2">{projectItem.project.mota}</p>
                                            </div>
                                        )}

                                        {/* Group */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            <span className="text-gray-700 font-medium">{projectItem.Group.name}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                projectItem.Group.status === 'active' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {projectItem.Group.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                                            </span>
                                        </div>

                                        {/* Manager */}
                                        {projectItem.project.nguoiDamNhan && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                <div>
                                                    <span className="text-gray-700 font-medium">{projectItem.project.nguoiDamNhan.hoten}</span>
                                                    <span className="text-gray-500 text-xs ml-1">({projectItem.project.nguoiDamNhan.manv})</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Date Range */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                            <span className="text-gray-600">
                                                {formatDate(projectItem.project.ngaybatdau)} - {formatDate(projectItem.project.ngayketthuc)}
                                            </span>
                                        </div>

                                        {/* Participation Status */}
                                        <div className={`mt-4 pt-3 border-t ${
                                            projectItem.status === 'active' ? 'border-blue-100' : 'border-gray-200'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Trạng thái tham gia:</span>
                                                <span className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
                                                    projectItem.project.status === 'da_dong' 
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : projectItem.status === 'active' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {projectItem.project.status === 'da_dong' ? 'Đang tạm dừng' : projectItem.status === 'active' ? 'Đang tham gia' : 'Đã hoàn thành'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedProject && (
                <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-8 h-8" />
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedProject.project.tenduan}</h2>
                                    <p className="text-blue-100 text-sm mt-1">Chi tiết dự án</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {detailLoading ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-24 bg-gray-200 rounded-xl"></div>
                                    <div className="h-40 bg-gray-200 rounded-xl"></div>
                                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                                </div>
                            ) : projectDetail ? (
                                <>
                                    {/* Project Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                            <ListTodo className="w-6 h-6 text-blue-600 mb-2" />
                                            <div className="text-2xl font-bold text-blue-900">{projectDetail.stats?.totalTasks || 0}</div>
                                            <div className="text-sm text-blue-700">Tổng tasks</div>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                            <CheckCircle2 className="w-6 h-6 text-green-600 mb-2" />
                                            <div className="text-2xl font-bold text-green-900">{projectDetail.stats?.completedTasks || 0}</div>
                                            <div className="text-sm text-green-700">Hoàn thành</div>
                                        </div>
                                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                            <Users className="w-6 h-6 text-purple-600 mb-2" />
                                            <div className="text-2xl font-bold text-purple-900">{projectDetail.stats?.totalMembers || 0}</div>
                                            <div className="text-sm text-purple-700">Thành viên</div>
                                        </div>
                                    </div>

                                    {/* Project Info */}
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-blue-500" />
                                            Thông tin dự án
                                        </h3>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-gray-500 font-medium">Trạng thái dự án</label>
                                                <div className="mt-1">{getStatusBadge(selectedProject.project.status)}</div>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500 font-medium">Trạng thái tham gia</label>
                                                <div className="mt-1">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        selectedProject.project.status === 'da_dong'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : projectDetail.participationStatus === 'active' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {selectedProject.project.status === 'da_dong' ? 'Đang tạm dừng' : projectDetail.participationStatus === 'active' ? 'Đang tham gia' : 'Đã hoàn thành'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-500 font-medium">Thời gian</label>
                                            <div className="mt-1 flex items-center gap-2 text-gray-700">
                                                <Calendar className="w-4 h-4 text-orange-500" />
                                                <span>{formatDate(selectedProject.project.ngaybatdau)} → {formatDate(selectedProject.project.ngayketthuc)}</span>
                                            </div>
                                        </div>

                                        {selectedProject.project.mota && (
                                            <div>
                                                <label className="text-sm text-gray-500 font-medium">Mô tả</label>
                                                <p className="mt-1 text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                                    {selectedProject.project.mota}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm text-gray-500 font-medium">Người đảm nhận (PM)</label>
                                            <div className="mt-2 bg-white p-3 rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {selectedProject.project.nguoiDamNhan.hoten.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900">{selectedProject.project.nguoiDamNhan.hoten}</div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                                                            <span>Mã NV: {selectedProject.project.nguoiDamNhan.manv}</span>
                                                            {selectedProject.project.nguoiDamNhan.email && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="w-3 h-3" />
                                                                    {selectedProject.project.nguoiDamNhan.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Group Info */}
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-purple-500" />
                                            Nhóm tham gia: {projectDetail.group.name}
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${
                                                projectDetail.group.status === 'active' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {projectDetail.group.status === 'active' ? 'Hoạt động' : 'Đã đóng'}
                                            </span>
                                        </h3>

                                        {projectDetail.group.members && projectDetail.group.members.length > 0 && (
                                            <div className="space-y-2">
                                                <label className="text-sm text-gray-500 font-medium">
                                                    Thành viên ({projectDetail.group.members.length})
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {projectDetail.group.members.map((member) => (
                                                        <div key={member.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                                                {member.hoten.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-semibold text-gray-900 truncate">{member.hoten}</div>
                                                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                                                    <span>{member.manv}</span>
                                                                    {member.chucvu && <span>• {member.chucvu}</span>}
                                                                </div>
                                                                {member.email && (
                                                                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                                        <Mail className="w-3 h-3" />
                                                                        <span className="truncate">{member.email}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tasks List */}
                                    {projectDetail.tasks && projectDetail.tasks.length > 0 && (
                                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                                <ListTodo className="w-5 h-5 text-blue-500" />
                                                Tasks của dự án ({projectDetail.tasks.length})
                                            </h3>
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {projectDetail.tasks.map((task) => (
                                                    <div key={task.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${
                                                                task.trangthai === 'Hoàn thành' ? 'bg-green-500' :
                                                                task.trangthai === 'Đang chạy' ? 'bg-blue-500' : 'bg-gray-400'
                                                            }`}></div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{task.tentask}</div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Trạng thái: {task.trangthai}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                                                            task.doUuTien === 'Cao' ? 'bg-red-100 text-red-700' :
                                                            task.doUuTien === 'Trung bình' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {task.doUuTien}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress Bar */}
                                    {projectDetail.stats && projectDetail.stats.totalTasks > 0 && (
                                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <Activity className="w-5 h-5 text-blue-600" />
                                                    Tiến độ hoàn thành
                                                </span>
                                                <span className="text-2xl font-bold text-blue-600">
                                                    {Math.round((projectDetail.stats.completedTasks / projectDetail.stats.totalTasks) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${(projectDetail.stats.completedTasks / projectDetail.stats.totalTasks) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-2">
                                                {projectDetail.stats.completedTasks} / {projectDetail.stats.totalTasks} tasks đã hoàn thành
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Không có dữ liệu chi tiết
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
