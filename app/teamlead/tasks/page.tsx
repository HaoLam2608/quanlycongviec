"use client"
import { useState, useEffect } from "react"
import { Search, Plus, Filter, Clock, Users, Calendar, AlertCircle, CheckCircle2, Folder, Edit, Trash2, Eye, Building2, X, ArrowLeft } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'
import { showConfirm } from '@/lib/notifications'

interface Task {
    id: number
    tentask: string
    moTa?: string
    trangThai: string
    mucDoUuTien?: string
    ngayBatDau?: string
    ngayKetThuc?: string
    ngayHoanThanh?: string
    ghiChu?: string
    nguoiThucHienId?: number
    nguoiThucHien?: { id: number; hoten: string; manv: string }
    duan?: { id: number; tenduan: string }
    duanId?: number
    subtasks?: any[]
}

interface Project {
    id: number
    tenduan: string
}

interface Group {
    id: number
    name: string
    status: string
}

export default function TeamLeadTasksPage() {
    const { showError, showSuccess } = useToastContext()
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")
    const [projectFilter, setProjectFilter] = useState<string>("all")
    const [groupFilter, setGroupFilter] = useState<string>("all")
    
    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    
    // Subtask modal states
    const [showSubtaskModal, setShowSubtaskModal] = useState(false)
    const [subtaskFormData, setSubtaskFormData] = useState({
        tenSubtask: '',
        mota: '',
        ngayBatDau: '',
        ngayKetThuc: '',
        nguoiThucHienId: '',
        ghiChu: ''
    })
    const [groupMembers, setGroupMembers] = useState<any[]>([])
    
    // Subtask list and detail modals
    const [showSubtaskListModal, setShowSubtaskListModal] = useState(false)
    const [showSubtaskDetailModal, setShowSubtaskDetailModal] = useState(false)
    const [selectedSubtask, setSelectedSubtask] = useState<any>(null)

    useEffect(() => {
        loadTasks()
        loadProjects()
        loadGroups()
        
        // Auto refresh every 30 seconds to catch updates from members
        const interval = setInterval(() => {
            loadTasks()
        }, 30000)
        
        return () => clearInterval(interval)
    }, [])

    const loadTasks = async () => {
        setLoading(true)
        try {
            // Lấy tasks của nhóm mà teamlead quản lý
            const res = await api.get('/tasks/my-tasks')
            const tasks = res.data.tasks || res.data || []
            
            // Load subtasks for each task
            const tasksWithSubtasks = await Promise.all(
                tasks.map(async (task: Task) => {
                    try {
                        const subtaskRes = await api.get(`/tasks/${task.id}/subtasks`)
                        return {
                            ...task,
                            subtasks: subtaskRes.data.subtasks || subtaskRes.data || []
                        }
                    } catch (error) {
                        console.error(`Load subtasks error for task ${task.id}:`, error)
                        return { ...task, subtasks: [] }
                    }
                })
            )
            
            setTasks(tasksWithSubtasks)
        } catch (error: any) {
            console.error('Load tasks error:', error)
            showError(error.response?.data?.message || 'Lỗi tải danh sách công việc')
        } finally {
            setLoading(false)
        }
    }

    const loadProjects = async () => {
        try {
            const res = await api.get('/groups/my-projects')
            const allProjects = res.data.projects || []
            // Extract unique projects
            const uniqueProjects = allProjects.reduce((acc: Project[], item: any) => {
                const exists = acc.find(p => p.id === item.project.id)
                if (!exists) {
                    acc.push({
                        id: item.project.id,
                        tenduan: item.project.tenduan
                    })
                }
                return acc
            }, [])
            setProjects(uniqueProjects)
        } catch (error: any) {
            console.error('Load projects error:', error)
        }
    }

    const loadGroups = async () => {
        try {
            const res = await api.get('/groups/my-group')
            setGroups(res.data.groups || [])
        } catch (error: any) {
            console.error('Load groups error:', error)
        }
    }

    const openViewModal = async (task: Task) => {
        setSelectedTask(task)
        setShowModal(true)
        
        // Load subtasks for this task
        try {
            const res = await api.get(`/tasks/${task.id}/subtasks`)
            const updatedTask = {
                ...task,
                subtasks: res.data.subtasks || res.data || []
            }
            setSelectedTask(updatedTask)
        } catch (error) {
            console.error('Load subtasks error:', error)
        }
    }

    const openSubtaskModal = async (task: Task) => {
        setSelectedTask(task)
        setSubtaskFormData({
            tenSubtask: '',
            mota: '',
            ngayBatDau: task.ngayBatDau || '',
            ngayKetThuc: task.ngayKetThuc || '',
            nguoiThucHienId: '',
            ghiChu: ''
        })
        
        // Load group members if task has a project
        if (task.duanId) {
            try {
                const res = await api.get(`/groups/my-group`)
                const allMembers = res.data.groups?.flatMap((g: any) => g.members || []) || []
                setGroupMembers(allMembers)
            } catch (error) {
                console.error('Load members error:', error)
            }
        }
        
        setShowSubtaskModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedTask(null)
    }
    
    const closeSubtaskModal = () => {
        setShowSubtaskModal(false)
        setSubtaskFormData({
            tenSubtask: '',
            mota: '',
            ngayBatDau: '',
            ngayKetThuc: '',
            nguoiThucHienId: '',
            ghiChu: ''
        })
    }
    
    const openSubtaskListModal = (task: Task) => {
        setSelectedTask(task)
        setShowSubtaskListModal(true)
    }
    
    const closeSubtaskListModal = () => {
        setShowSubtaskListModal(false)
    }
    
    const openSubtaskDetailModal = (subtask: any) => {
        setSelectedSubtask(subtask)
        setShowSubtaskDetailModal(true)
    }
    
    const closeSubtaskDetailModal = () => {
        setShowSubtaskDetailModal(false)
        setSelectedSubtask(null)
    }

    const handleDeleteTask = async (taskId: number) => {
        const confirmed = await showConfirm('Bạn có chắc muốn xóa task này?')
        if (!confirmed) return

        try {
            await api.delete(`/tasks/${taskId}`)
            showSuccess('Xóa task thành công')
            loadTasks()
        } catch (error: any) {
            console.error('Delete task error:', error)
            showError(error.response?.data?.message || 'Lỗi xóa task')
        }
    }

    const handleCreateSubtask = async () => {
        if (!subtaskFormData.tenSubtask.trim()) {
            showError('Vui lòng nhập tên công việc con')
            return
        }
        
        if (!subtaskFormData.ngayBatDau) {
            showError('Vui lòng chọn ngày bắt đầu')
            return
        }

        try {
            const payload = {
                tenSubtask: subtaskFormData.tenSubtask,
                mota: subtaskFormData.mota || null,
                ngayBatDau: subtaskFormData.ngayBatDau,
                ngayKetThuc: subtaskFormData.ngayKetThuc || null,
                nguoiThucHienId: subtaskFormData.nguoiThucHienId ? parseInt(subtaskFormData.nguoiThucHienId) : null,
                ghiChu: subtaskFormData.ghiChu || null
            }
            
            await api.post(`/tasks/${selectedTask?.id}/subtasks`, payload)
            showSuccess('Tạo công việc con thành công!')
            closeSubtaskModal()
            loadTasks()
        } catch (error: any) {
            console.error('Create subtask error:', error)
            showError(error.response?.data?.error || 'Lỗi khi tạo công việc con')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hoàn thành': return 'bg-green-100 text-green-800 border-green-200'
            case 'Đang chạy': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'Chưa bắt đầu': return 'bg-gray-100 text-gray-800 border-gray-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const normalizePriority = (priority?: string) => {
        const key = priority?.toLowerCase()
        switch (key) {
            case 'cao':
            case 'high':
                return 'high'
            case 'trung bình':
            case 'trung binh':
            case 'medium':
                return 'medium'
            case 'thấp':
            case 'thap':
            case 'low':
                return 'low'
            default:
                return 'unknown'
        }
    }

    const getPriorityLabel = (priority?: string) => {
        switch (normalizePriority(priority)) {
            case 'high':
                return 'Cao'
            case 'medium':
                return 'Trung bình'
            case 'low':
                return 'Thấp'
            default:
                return 'Chưa xác định'
        }
    }

    const getPriorityColor = (priority?: string) => {
        switch (normalizePriority(priority)) {
            case 'high':
                return 'text-red-600 bg-red-50'
            case 'medium':
                return 'text-yellow-600 bg-yellow-50'
            case 'low':
                return 'text-green-600 bg-green-50'
            default:
                return 'text-gray-600 bg-gray-50'
        }
    }

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.tentask.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.moTa?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || task.trangThai === statusFilter
        const matchesPriority = priorityFilter === "all" || normalizePriority(task.mucDoUuTien) === priorityFilter
        const matchesProject = projectFilter === "all" || String(task.duanId) === projectFilter || (task.duan && String(task.duan.id) === projectFilter)
        const matchesGroup = groupFilter === "all" // Group filter can be implemented based on task assignment
        return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesGroup
    })

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Task</h1>
                    <p className="text-gray-600 mt-1">Quản lý các task lớn và tạo subtask cho nhóm</p>
                </div>
                <button
                    onClick={() => loadTasks()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Làm mới
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm task..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white"
                    >
                        <option value="all">Tất cả dự án</option>
                        {projects.map(project => (
                            <option key={project.id} value={String(project.id)}>{project.tenduan}</option>
                        ))}
                    </select>
                    <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white"
                    >
                        <option value="all">Tất cả nhóm</option>
                        {groups.map(group => (
                            <option key={group.id} value={String(group.id)}>{group.name}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang chạy">Đang chạy</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white"
                    >
                        <option value="all">Tất cả mức độ</option>
                        <option value="high">Cao</option>
                        <option value="medium">Trung bình</option>
                        <option value="low">Thấp</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Folder className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tổng task</p>
                            <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Đang chạy</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {tasks.filter(t => t.trangThai === 'Đang chạy').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Hoàn thành</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {tasks.filter(t => t.trangThai === 'Hoàn thành').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Ưu tiên cao</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {tasks.filter(t => normalizePriority(t.mucDoUuTien) === 'high').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Danh sách Task ({filteredTasks.length})</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredTasks.length === 0 ? (
                        <div className="p-12 text-center">
                            <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Không có task nào</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div 
                                key={task.id} 
                                className="p-6 hover:bg-blue-50 transition-all cursor-pointer"
                                onClick={() => openViewModal(task)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                                <Folder className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{task.tentask}</h3>
                                                {task.moTa && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">{task.moTa}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm">
                                            <span className={`px-3 py-1 rounded-lg font-semibold border ${getStatusColor(task.trangThai)}`}>
                                                {task.trangThai}
                                            </span>
                                            {task.mucDoUuTien && (
                                                <span className={`px-3 py-1 rounded-lg font-semibold ${getPriorityColor(task.mucDoUuTien)}`}>
                                                    {getPriorityLabel(task.mucDoUuTien)}
                                                </span>
                                            )}
                                            {task.nguoiThucHien && (
                                                <span className="flex items-center gap-1.5 text-gray-700">
                                                    <Users className="w-4 h-4" />
                                                    {task.nguoiThucHien.hoten}
                                                </span>
                                            )}
                                            {task.duan && (
                                                <span className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
                                                    <Building2 className="w-4 h-4" />
                                                    {task.duan.tenduan}
                                                </span>
                                            )}
                                            {task.subtasks && task.subtasks.length > 0 && (
                                                <span className="text-gray-600">
                                                    {task.subtasks.length} công việc con
                                                </span>
                                            )}
                                            {task.ngayKetThuc && (
                                                <span className="flex items-center gap-1.5 text-gray-700">
                                                    <Calendar className="w-4 h-4" />
                                                    Kết thúc: {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => openViewModal(task)}
                                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                                            title="Xem chi tiết"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                                            title="Xóa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Chi Tiết Task</h2>
                                <p className="text-blue-100 text-sm mt-1">Xem thông tin chi tiết task</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {selectedTask && (
                                <div className="space-y-5">
                                    {/* Task Name */}
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <Folder className="w-4 h-4" />
                                            Tên công việc
                                        </label>
                                        <p className="text-xl font-bold text-gray-900 mt-2">{selectedTask.tentask}</p>
                                    </div>

                                    {/* Description */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Mô tả chi tiết
                                        </label>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedTask.moTa || 'Không có mô tả'}
                                        </p>
                                    </div>

                                    {/* Status Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm">
                                            <label className="text-sm font-medium text-gray-500 mb-2 block">Trạng thái</label>
                                            <div className={`px-3 py-2 rounded-lg font-semibold text-center ${getStatusColor(selectedTask.trangThai)}`}>
                                                {selectedTask.trangThai}
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm">
                                            <label className="text-sm font-medium text-gray-500 mb-2 block">Độ ưu tiên</label>
                                            <div className={`px-3 py-2 rounded-lg font-semibold text-center ${getPriorityColor(selectedTask.mucDoUuTien)}`}>
                                                {getPriorityLabel(selectedTask.mucDoUuTien)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project Info */}
                                    {selectedTask.duan && (
                                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                            <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                                                <Building2 className="w-4 h-4" />
                                                Dự án
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{selectedTask.duan.tenduan}</p>
                                                    <p className="text-xs text-gray-500">ID: {selectedTask.duan.id}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                            <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Ngày bắt đầu
                                            </label>
                                            <p className="text-gray-900 font-semibold">
                                                {selectedTask.ngayBatDau ? new Date(selectedTask.ngayBatDau).toLocaleDateString('vi-VN', { 
                                                    weekday: 'short', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                }) : 'Chưa xác định'}
                                            </p>
                                        </div>
                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                            <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Ngày kết thúc
                                            </label>
                                            <p className="text-gray-900 font-semibold">
                                                {selectedTask.ngayKetThuc ? new Date(selectedTask.ngayKetThuc).toLocaleDateString('vi-VN', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : 'Chưa xác định'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Completion Date */}
                                    {selectedTask.ngayHoanThanh && (
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-300">
                                            <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                Ngày hoàn thành
                                            </label>
                                            <p className="text-green-700 font-bold text-lg">
                                                {new Date(selectedTask.ngayHoanThanh).toLocaleDateString('vi-VN', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {selectedTask.ghiChu && (
                                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-300">
                                            <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                                Ghi chú
                                            </label>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg shadow-sm">
                                                {selectedTask.ghiChu}
                                            </p>
                                        </div>
                                    )}

                                    {/* Assignee */}
                                    {selectedTask.nguoiThucHien && (
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                            <label className="text-sm font-medium text-gray-500 mb-3 block flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Người thực hiện
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {selectedTask.nguoiThucHien.hoten.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{selectedTask.nguoiThucHien.hoten}</p>
                                                    <p className="text-sm text-gray-500">Mã NV: {selectedTask.nguoiThucHien.manv}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Subtasks Summary */}
                                    {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                                        <div 
                                            onClick={() => {
                                                closeModal()
                                                openSubtaskListModal(selectedTask)
                                            }}
                                            className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors"
                                        >
                                            <label className="text-sm font-medium text-gray-500 mb-3 block flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Công việc con (Click để xem chi tiết)
                                            </label>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center">
                                                        <p className="text-3xl font-bold text-indigo-600">{selectedTask.subtasks.length}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Tổng số</p>
                                                    </div>
                                                    <div className="h-12 w-px bg-gray-300"></div>
                                                    <div className="text-center">
                                                        <p className="text-3xl font-bold text-green-600">
                                                            {selectedTask.subtasks.filter((s: any) => s.trangThai === 'Hoàn thành').length}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">Hoàn thành</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-gray-900">
                                                        {Math.round((selectedTask.subtasks.filter((s: any) => s.trangThai === 'Hoàn thành').length / selectedTask.subtasks.length) * 100)}%
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">Tiến độ</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Task ID */}
                                    <div className="text-center pt-2 border-t border-gray-200">
                                        <p className="text-xs text-gray-400">Task ID: #{selectedTask.id}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between gap-3">
                            <div className="flex gap-3">
                                {selectedTask && (
                                    <button
                                        onClick={() => {
                                            closeModal()
                                            openSubtaskListModal(selectedTask)
                                        }}
                                        className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-medium flex items-center gap-2 shadow-lg"
                                    >
                                        <Eye className="w-5 h-5" />
                                        Xem danh sách subtask ({selectedTask.subtasks?.length || 0})
                                    </button>
                                )}
                                {selectedTask && (
                                    <button
                                        onClick={() => {
                                            closeModal()
                                            openSubtaskModal(selectedTask)
                                        }}
                                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tạo công việc con
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtask Creation Modal */}
            {showSubtaskModal && selectedTask && (
                <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-green-50 to-emerald-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <Plus className="w-6 h-6 text-green-600" />
                                        Tạo công việc con
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">Cho task: {selectedTask.tentask}</p>
                                </div>
                                <button onClick={closeSubtaskModal} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên công việc con <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subtaskFormData.tenSubtask}
                                    onChange={(e) => setSubtaskFormData({...subtaskFormData, tenSubtask: e.target.value})}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                    placeholder="Nhập tên công việc con..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                                <textarea
                                    value={subtaskFormData.mota}
                                    onChange={(e) => setSubtaskFormData({...subtaskFormData, mota: e.target.value})}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all resize-none"
                                    placeholder="Nhập mô tả..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày bắt đầu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={subtaskFormData.ngayBatDau}
                                        onChange={(e) => setSubtaskFormData({...subtaskFormData, ngayBatDau: e.target.value})}
                                        min={selectedTask.ngayBatDau || undefined}
                                        max={selectedTask.ngayKetThuc || undefined}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={subtaskFormData.ngayKetThuc}
                                        onChange={(e) => setSubtaskFormData({...subtaskFormData, ngayKetThuc: e.target.value})}
                                        min={subtaskFormData.ngayBatDau || selectedTask.ngayBatDau || undefined}
                                        max={selectedTask.ngayKetThuc || undefined}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Người thực hiện</label>
                                <select
                                    value={subtaskFormData.nguoiThucHienId}
                                    onChange={(e) => setSubtaskFormData({...subtaskFormData, nguoiThucHienId: e.target.value})}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none bg-white"
                                >
                                    <option value="">Tự nhận (mặc định)</option>
                                    {groupMembers.map(member => (
                                        <option key={member.id} value={String(member.id)}>
                                            {member.hoten} ({member.manv})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                <textarea
                                    value={subtaskFormData.ghiChu}
                                    onChange={(e) => setSubtaskFormData({...subtaskFormData, ghiChu: e.target.value})}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all resize-none"
                                    placeholder="Nhập ghi chú..."
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between gap-3">
                            <button
                                onClick={() => {
                                    closeSubtaskModal()
                                    setShowModal(true)
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={closeSubtaskModal}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleCreateSubtask}
                                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium"
                                >
                                    Tạo công việc con
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtask List Modal */}
            {showSubtaskListModal && selectedTask ? (
                <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                                        Danh sách công việc con
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">Task: {selectedTask.tentask}</p>
                                </div>
                                <button onClick={closeSubtaskListModal} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedTask.subtasks.map((subtask: any, index: number) => (
                                        <div 
                                            key={subtask.id}
                                            onClick={() => {
                                                closeSubtaskListModal()
                                                openSubtaskDetailModal(subtask)
                                            }}
                                            className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                                                        <h3 className="text-lg font-semibold text-gray-900">{subtask.tenSubtask}</h3>
                                                    </div>
                                                    {subtask.mota && (
                                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{subtask.mota}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                                            subtask.trangThai === 'Hoàn thành' ? 'bg-green-100 text-green-700' :
                                                            subtask.trangThai === 'Đang chạy' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {subtask.trangThai}
                                                        </div>
                                                        {subtask.nguoiThucHien && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Users className="w-3 h-3" />
                                                                <span>{subtask.nguoiThucHien.hoten}</span>
                                                            </div>
                                                        )}
                                                        {subtask.ngayKetThuc && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Calendar className="w-3 h-3" />
                                                                <span>{new Date(subtask.ngayKetThuc).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Eye className="w-5 h-5 text-indigo-500 flex-shrink-0 ml-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Chưa có công việc con nào</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between gap-3">
                            <button
                                onClick={() => {
                                    closeSubtaskListModal()
                                    setShowModal(true)
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại
                            </button>
                            <button
                                onClick={closeSubtaskListModal}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Subtask Detail Modal */}
            {showSubtaskDetailModal && selectedSubtask && (
                <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Chi Tiết Công Việc Con</h2>
                                    <p className="text-purple-100 text-sm mt-1">Xem thông tin chi tiết</p>
                                </div>
                                <button onClick={closeSubtaskDetailModal} className="text-white hover:text-purple-100">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Subtask Name */}
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                    <Folder className="w-4 h-4" />
                                    Tên công việc con
                                </label>
                                <p className="text-xl font-bold text-gray-900 mt-2">{selectedSubtask.tenSubtask}</p>
                            </div>

                            {/* Description */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Mô tả
                                </label>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedSubtask.mota || 'Không có mô tả'}
                                </p>
                            </div>

                            {/* Status */}
                            <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm">
                                <label className="text-sm font-medium text-gray-500 mb-2 block">Trạng thái</label>
                                <div className={`px-3 py-2 rounded-lg font-semibold text-center ${
                                    selectedSubtask.trangThai === 'Hoàn thành' ? 'bg-green-100 text-green-700' :
                                    selectedSubtask.trangThai === 'Đang chạy' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {selectedSubtask.trangThai}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                    <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Ngày bắt đầu
                                    </label>
                                    <p className="text-gray-900 font-semibold">
                                        {selectedSubtask.ngayBatDau ? new Date(selectedSubtask.ngayBatDau).toLocaleDateString('vi-VN', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'Chưa xác định'}
                                    </p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                    <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Ngày kết thúc
                                    </label>
                                    <p className="text-gray-900 font-semibold">
                                        {selectedSubtask.ngayKetThuc ? new Date(selectedSubtask.ngayKetThuc).toLocaleDateString('vi-VN', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'Chưa xác định'}
                                    </p>
                                </div>
                            </div>

                            {/* Assignee */}
                            {selectedSubtask.nguoiThucHien && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                    <label className="text-sm font-medium text-gray-500 mb-3 block flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Người thực hiện
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {selectedSubtask.nguoiThucHien.hoten.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{selectedSubtask.nguoiThucHien.hoten}</p>
                                            <p className="text-sm text-gray-500">Mã NV: {selectedSubtask.nguoiThucHien.manv}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedSubtask.ghiChu && (
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-300">
                                    <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                        Ghi chú
                                    </label>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg shadow-sm">
                                        {selectedSubtask.ghiChu}
                                    </p>
                                </div>
                            )}

                            {/* Subtask ID */}
                            <div className="text-center pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-400">Subtask ID: #{selectedSubtask.id}</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between gap-3">
                            <button
                                onClick={() => {
                                    closeSubtaskDetailModal()
                                    setShowSubtaskListModal(true)
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại
                            </button>
                            <button
                                onClick={closeSubtaskDetailModal}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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
