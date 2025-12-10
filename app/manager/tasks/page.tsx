"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import {
    CheckSquare, Clock, Calendar, User, Filter, Search, Eye, Edit3,
    Trash2, AlertCircle, CheckCircle, XCircle, PlayCircle, FolderOpen,
    Users, Download, Upload, MoreVertical, Tag,
    TrendingUp, MessageSquare, Paperclip, ChevronDown, X as CloseIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Modal from '@/components/admin/Modal'
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToastContext } from "@/components/providers/toast-provider"
import { showConfirm, showSuccess, showError } from "@/lib/notifications"
import { fetchProjectsByManager, getTasksByProject, createTask, updateTask, deleteTask, getSubtasksByTask, getProjectById } from "@/axios/api"
import { getUsers } from "@/axios/adminApi"

interface Task {
    id: number
    tentask: string
    mota?: string
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
    }
    duan?: {
        id: number
        tenduan: string
    }
}

interface Project {
    id: number
    tenduan: string
}

interface UserType {
    id: number
    hoten: string
    email?: string
    manv: string
}

export default function ManagerTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [users, setUsers] = useState<UserType[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
    const [isMobile, setIsMobile] = useState(false)
    const { showError, showSuccess } = useToastContext()
    const router = useRouter()

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const [projectFilter, setProjectFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")
    const [assigneeFilter, setAssigneeFilter] = useState<string>("all")

    // Task modal
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [taskForm, setTaskForm] = useState({
        tentask: "",
        mota: "",
        duanId: "",
        nguoiDuocGiaoId: "",
        mucDoUuTien: "trung_binh",
        ngayBatDau: "",
        ngayKetThuc: ""
    })

    // Detail modal
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [detailTask, setDetailTask] = useState<Task | null>(null)
    const [detailSubtasks, setDetailSubtasks] = useState<any[]>([])
    const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null)
    const [projectDateBounds, setProjectDateBounds] = useState<{ start?: string | null; end?: string | null }>({ start: null, end: null })

    // Bulk actions
    const [selectedTasks, setSelectedTasks] = useState<number[]>([])

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        const updateIsMobile = () => setIsMobile(window.innerWidth <= 1024)
        updateIsMobile()
        window.addEventListener('resize', updateIsMobile)
        return () => window.removeEventListener('resize', updateIsMobile)
    }, [])

    useEffect(() => {
        if (isMobile && viewMode === 'kanban') {
            setViewMode('list')
        }
    }, [isMobile, viewMode])

    const loadData = async () => {
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
                    // Ensure each task has project info
                    const tasksWithProject = projectTasks.map(task => ({
                        ...task,
                        duan: task.duan || { id: proj.id, tenduan: proj.tenduan }
                    }))
                    allTasks = [...allTasks, ...tasksWithProject]
                } catch (e) {
                    // ignore
                }
            }
            setTasks(allTasks)

            // Load users for assignment
            const usersRes = await getUsers({})
            const usersList = (usersRes.users || usersRes || []) as UserType[]
            setUsers(usersList)

        } catch (err: any) {
            console.error('Load data error', err)
            showError(err?.message || 'Không thể tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    // Create modal is opened from edit buttons; explicit create button removed per request

    const openEditModal = (task: Task) => {
        try {
            setApiErrorMessage(null)
            setIsEditMode(true)
            setSelectedTask(task)
            const duanIdStr = task.duanId !== undefined && task.duanId !== null ? String(task.duanId) : (task.duan?.id ? String(task.duan.id) : "")
            const nguoiIdStr = task.nguoiDuocGiaoId !== undefined && task.nguoiDuocGiaoId !== null ? String(task.nguoiDuocGiaoId) : (task.nguoiDuocGiao?.id ? String(task.nguoiDuocGiao.id) : "")
            setTaskForm({
                tentask: task.tentask,
                mota: task.mota || "",
                duanId: duanIdStr,
                nguoiDuocGiaoId: nguoiIdStr,
                mucDoUuTien: task.mucDoUuTien || "trung_binh",
                ngayBatDau: task.ngayBatDau || "",
                ngayKetThuc: task.ngayKetThuc || ""
            })
            setIsTaskModalOpen(true)
        } catch (err) {
            console.error('openEditModal error', err)
            setApiErrorMessage(String(err))
            showError('Có lỗi khi mở form chỉnh sửa')
        }
    }

    // Load project date bounds whenever selected project changes in the form
    useEffect(() => {
        let mounted = true
        const loadBounds = async () => {
            try {
                if (!taskForm.duanId) {
                    setProjectDateBounds({ start: null, end: null })
                    return
                }
                const projId = parseInt(taskForm.duanId)
                if (isNaN(projId)) return
                const res = await getProjectById(String(projId))
                // API may return project or { project }
                const proj = res?.project || res
                if (!mounted) return
                setProjectDateBounds({ start: proj?.ngaybatdau || null, end: proj?.ngayketthuc || null })
            } catch (err) {
                console.error('Failed to load project bounds', err)
                setProjectDateBounds({ start: null, end: null })
            }
        }

        loadBounds()

        return () => { mounted = false }
    }, [taskForm.duanId])

    const handleSaveTask = async () => {
        try {
            if (!taskForm.tentask || !taskForm.duanId || !taskForm.ngayKetThuc) {
                showError('Vui lòng điền đầy đủ thông tin bắt buộc')
                return
            }

            // Validate dates against project bounds if available
            const projStart = projectDateBounds.start ? new Date(projectDateBounds.start) : null
            const projEnd = projectDateBounds.end ? new Date(projectDateBounds.end) : null
            const tStart = taskForm.ngayBatDau ? new Date(taskForm.ngayBatDau) : null
            const tEnd = taskForm.ngayKetThuc ? new Date(taskForm.ngayKetThuc) : null

            if (projStart && tStart && tStart < projStart) {
                showError('Ngày bắt đầu phải lớn hơn hoặc bằng ngày bắt đầu của dự án')
                return
            }
            if (projEnd && tEnd && tEnd > projEnd) {
                showError('Ngày kết thúc phải nhỏ hơn hoặc bằng ngày kết thúc của dự án')
                return
            }

            const payload: any = {
                tentask: taskForm.tentask,
                mota: taskForm.mota,
                duanId: parseInt(taskForm.duanId),
                mucDoUuTien: taskForm.mucDoUuTien,
                ngayBatDau: taskForm.ngayBatDau,
                ngayKetThuc: taskForm.ngayKetThuc
            }

            // Người được giao là optional - nếu chọn 'none' hoặc blank, send null so backend treats as not assigned
            if (taskForm.nguoiDuocGiaoId && taskForm.nguoiDuocGiaoId !== 'none') {
                const parsed = parseInt(taskForm.nguoiDuocGiaoId)
                if (!isNaN(parsed)) payload.nguoiDuocGiaoId = parsed
            } else {
                payload.nguoiDuocGiaoId = null
            }

            if (isEditMode && selectedTask) {
                console.debug('Updating task', selectedTask.id, payload)
                const res = await updateTask(selectedTask.id, payload)
                console.debug('Update response', res)
                showSuccess('Cập nhật nhiệm vụ thành công')
            } else {
                console.debug('Creating task', payload)
                const res = await createTask(payload)
                console.debug('Create response', res)
                showSuccess('Tạo nhiệm vụ thành công')
            }

            setIsTaskModalOpen(false)
            loadData()
        } catch (err: any) {
            console.error('Save task error', err)
            const msg = err?.message || err?.response?.data?.message || (typeof err === 'string' ? err : JSON.stringify(err))
            setApiErrorMessage(msg || 'Không thể lưu nhiệm vụ')
            showError(msg || 'Không thể lưu nhiệm vụ')
        }
    }

    const handleDeleteTask = async (taskId: number) => {
        const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')
        if (!confirmed) return

        try {
            console.debug('Deleting task', taskId)
            const res = await deleteTask(taskId)
            console.debug('Delete response', res)
            showSuccess('Xóa nhiệm vụ thành công')
            loadData()
        } catch (err: any) {
            console.error('Delete task error', err)
            const msg = err?.message || err?.response?.data?.message || (typeof err === 'string' ? err : JSON.stringify(err))
            setApiErrorMessage(msg || 'Không thể xóa nhiệm vụ')
            showError(msg || 'Không thể xóa nhiệm vụ')
        }
    }

    const openDetailModal = async (task: Task) => {
        setDetailTask(task)
        setIsDetailModalOpen(true)
        try {
            const res = await getSubtasksByTask(task.id)
            // API may return { subtasks: [...] } or an array
            const list = res?.subtasks || res || []
            setDetailSubtasks(list)
        } catch (err) {
            console.error('Failed to load subtasks', err)
            setDetailSubtasks([])
        }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'hoan_thanh':
            case 'completed':
            case 'hoàn thành':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'dang_thuc_hien':
            case 'in_progress':
            case 'đang thực hiện':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'chua_bat_dau':
            case 'not_started':
            case 'chưa bắt đầu':
                return 'bg-gray-100 text-gray-800 border-gray-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
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
            default: return status
        }
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'cao':
            case 'high': return 'bg-red-100 text-red-800 border-red-200'
            case 'trung_binh':
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'thap':
            case 'low': return 'bg-green-100 text-green-800 border-green-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getPriorityText = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'cao':
            case 'high': return 'Cao'
            case 'trung_binh':
            case 'medium': return 'Trung bình'
            case 'thap':
            case 'low': return 'Thấp'
            default: return 'Trung bình'
        }
    }

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.tentask.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.nguoiDuocGiao?.hoten.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.duan?.tenduan.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesProject = projectFilter === "all" || task.duanId.toString() === projectFilter
        const matchesStatus = statusFilter === "all" || task.trangThai?.toLowerCase() === statusFilter.toLowerCase()
        const matchesPriority = priorityFilter === "all" || task.mucDoUuTien?.toLowerCase() === priorityFilter.toLowerCase()
        const matchesAssignee = assigneeFilter === "all" || task.nguoiDuocGiaoId.toString() === assigneeFilter

        return matchesSearch && matchesProject && matchesStatus && matchesPriority && matchesAssignee
    })

    const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => ['hoan_thanh', 'completed', 'hoàn thành'].includes(t.trangThai?.toLowerCase())).length,
        inProgress: tasks.filter(t => ['dang_thuc_hien', 'in_progress', 'đang thực hiện'].includes(t.trangThai?.toLowerCase())).length,
        pending: tasks.filter(t => ['chua_bat_dau', 'not_started', 'chưa bắt đầu'].includes(t.trangThai?.toLowerCase())).length,
    }

    const toggleTaskSelection = (taskId: number) => {
        setSelectedTasks(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        )
    }

    const toggleSelectAll = () => {
        if (selectedTasks.length === filteredTasks.length) {
            setSelectedTasks([])
        } else {
            setSelectedTasks(filteredTasks.map(t => t.id))
        }
    }

    const handleBulkDelete = async () => {
        if (selectedTasks.length === 0) return
        const confirmed = await showConfirm(`Bạn có chắc chắn muốn xóa ${selectedTasks.length} nhiệm vụ?`)
        if (!confirmed) return

        try {
            for (const taskId of selectedTasks) {
                await deleteTask(taskId)
            }
            showSuccess(`Đã xóa ${selectedTasks.length} nhiệm vụ`)
            setSelectedTasks([])
            loadData()
        } catch (err: any) {
            showError('Có lỗi xảy ra khi xóa nhiệm vụ')
        }
    }

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

                    {/* Filters Skeleton */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    </div>

                    {/* Tasks List Skeleton */}
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="h-6 bg-gray-200 rounded w-64 mb-3 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                                        <div className="flex gap-2">
                                            <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse"></div>
                                            <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                                        <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                                        <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 flex items-center gap-2 sm:gap-3">
                            <CheckSquare className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#003D82]" />
                            Quản lý nhiệm vụ
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">Theo dõi và quản lý tất cả nhiệm vụ trong các dự án</p>
                    </div>
                    {!isMobile && (
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                                <Button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    variant="ghost"
                                    size="default"
                                    className={`${viewMode === 'list' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Danh sách
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setViewMode('kanban')}
                                    variant="ghost"
                                    size="default"
                                    className={`${viewMode === 'kanban' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Kanban
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                    <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-slate-600">Tổng nhiệm vụ</p>
                                <p className="text-2xl sm:text-3xl font-bold text-blue-700">{taskStats.total}</p>
                            </div>
                            <CheckSquare className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                        </div>
                    </Card>

                    <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-slate-600">Hoàn thành</p>
                                <p className="text-2xl sm:text-3xl font-bold text-green-700">{taskStats.completed}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                        </div>
                    </Card>

                    <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-slate-600">Đang thực hiện</p>
                                <p className="text-2xl sm:text-3xl font-bold text-purple-700">{taskStats.inProgress}</p>
                            </div>
                            <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
                        </div>
                    </Card>

                    <Card className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-slate-600">Chưa bắt đầu</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-700">{taskStats.pending}</p>
                            </div>
                            <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-3 sm:p-4 lg:p-6 mb-6 sm:mb-8 bg-white shadow-lg border-slate-200">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm nhiệm vụ, người thực hiện, dự án..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Project Filter */}
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                            <SelectTrigger className="w-full lg:w-[200px]">
                                <SelectValue placeholder="Dự án" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả dự án</SelectItem>
                                {projects.map(project => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                        {project.tenduan}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full lg:w-[180px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="chua_bat_dau">Chưa bắt đầu</SelectItem>
                                <SelectItem value="dang_thuc_hien">Đang thực hiện</SelectItem>
                                <SelectItem value="hoan_thanh">Hoàn thành</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Priority Filter */}
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-full lg:w-[180px]">
                                <SelectValue placeholder="Ưu tiên" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="cao">Cao</SelectItem>
                                <SelectItem value="trung_binh">Trung bình</SelectItem>
                                <SelectItem value="thap">Thấp</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Assignee Filter */}
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="w-full lg:w-[200px]">
                                <SelectValue placeholder="Người thực hiện" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.hoten}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bulk Actions */}
                    {selectedTasks.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-700">
                                Đã chọn {selectedTasks.length} nhiệm vụ
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTasks([])}
                            >
                                Bỏ chọn
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Task List */}
                {viewMode === "list" ? (
                    isMobile ? (
                        <div className="space-y-4">
                            {filteredTasks.length === 0 ? (
                                <Card className="bg-white shadow-lg border-slate-200 p-6 text-center">
                                    <CheckSquare className="w-14 h-14 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-500 text-lg">Không tìm thấy nhiệm vụ nào</p>
                                    <p className="text-slate-400 text-sm mt-2">Thử thay đổi bộ lọc để xem các nhiệm vụ khác</p>
                                </Card>
                            ) : (
                                filteredTasks.map((task) => (
                                    <Card key={task.id} className="bg-white shadow-md border-slate-200 p-4">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTasks.includes(task.id)}
                                                    onChange={() => toggleTaskSelection(task.id)}
                                                    className="mt-1 rounded border-gray-300"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-slate-900 text-base">{task.tentask}</p>
                                                            {task.mota && (
                                                                <p className="text-sm text-slate-500 mt-1">{task.mota}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <Badge className={getStatusColor(task.trangThai)}>
                                                                {getStatusText(task.trangThai)}
                                                            </Badge>
                                                            <Badge className={getPriorityColor(task.mucDoUuTien)}>
                                                                {getPriorityText(task.mucDoUuTien)}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                                                        <div className="flex items-center gap-2">
                                                            <FolderOpen className="w-4 h-4 text-blue-600" />
                                                            <span className="font-medium">
                                                                {task.duan?.tenduan || projects.find(p => p.id === task.duanId)?.tenduan || 'Chưa xác định'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900">{task.nguoiDuocGiao?.hoten || 'N/A'}</p>
                                                                {task.nguoiDuocGiao?.email && (
                                                                    <p className="text-xs text-slate-500">{task.nguoiDuocGiao.email}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <Calendar className="w-4 h-4 text-slate-600 mt-1" />
                                                            <div>
                                                                {task.ngayKetThuc ? (
                                                                    <p className="font-medium text-slate-900">
                                                                        Hạn: {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-slate-500 italic">Chưa có hạn</p>
                                                                )}
                                                                {task.ngayBatDau && (
                                                                    <p className="text-xs text-slate-400 mt-1">
                                                                        Bắt đầu: {new Date(task.ngayBatDau).toLocaleDateString('vi-VN', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDetailModal(task)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Chi tiết
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditModal(task)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    Chỉnh sửa
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    ) : (
                        <Card className="bg-white shadow-lg border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-gray-300"
                                                />
                                            </th>
                                            <th className="p-4 text-left text-sm font-semibold text-slate-700">Nhiệm vụ</th>
                                            <th className="p-4 text-left text-sm font-semibold text-slate-700">Dự án</th>
                                            <th className="p-4 text-left text-sm font-semibold text-slate-700">Người thực hiện</th>
                                            <th className="p-4 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
                                            <th className="p-4 text-left text-sm font-semibold text-slate-700">Ưu tiên</th>
                                            <th className="p-4 text-left text-sm font-semibold text-slate-700">Hạn</th>
                                            <th className="p-4 text-center text-sm font-semibold text-slate-700">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-12 text-center">
                                                    <CheckSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                                    <p className="text-slate-500 text-lg">Không tìm thấy nhiệm vụ nào</p>
                                                    <p className="text-slate-400 text-sm mt-2">Thử thay đổi bộ lọc để xem các nhiệm vụ khác</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTasks.includes(task.id)}
                                                            onChange={() => toggleTaskSelection(task.id)}
                                                            className="rounded border-gray-300"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <p className="font-medium text-slate-900">{task.tentask}</p>
                                                                {task.mota && (
                                                                    <p className="text-sm text-slate-500 line-clamp-1">{task.mota}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <FolderOpen className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm text-slate-700 font-medium">
                                                                {task.duan?.tenduan || projects.find(p => p.id === task.duanId)?.tenduan || 'Chưa xác định'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900">
                                                                    {task.nguoiDuocGiao?.hoten || 'N/A'}
                                                                </p>
                                                                {task.nguoiDuocGiao?.email && (
                                                                    <p className="text-xs text-slate-500">{task.nguoiDuocGiao.email}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge className={getStatusColor(task.trangThai)}>
                                                            {getStatusText(task.trangThai)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge className={getPriorityColor(task.mucDoUuTien)}>
                                                            {getPriorityText(task.mucDoUuTien)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        {task.ngayKetThuc ? (
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span className="font-medium">
                                                                        {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                {task.ngayBatDau && (
                                                                    <div className="text-xs text-slate-400">
                                                                        Bắt đầu: {new Date(task.ngayBatDau).toLocaleDateString('vi-VN', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-400 italic">Chưa có hạn</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openDetailModal(task)}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openEditModal(task)}
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )
                ) : (
                    // Kanban View
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['chua_bat_dau', 'dang_thuc_hien', 'hoan_thanh'].map((status) => (
                            <Card key={status} className="bg-white shadow-lg border-slate-200 p-4">
                                <div className="mb-4">
                                    <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                                        {status === 'chua_bat_dau' && <XCircle className="w-5 h-5 text-gray-600" />}
                                        {status === 'dang_thuc_hien' && <PlayCircle className="w-5 h-5 text-blue-600" />}
                                        {status === 'hoan_thanh' && <CheckCircle className="w-5 h-5 text-green-600" />}
                                        {getStatusText(status)}
                                        <Badge variant="outline" className="ml-auto">
                                            {filteredTasks.filter(t => t.trangThai?.toLowerCase() === status).length}
                                        </Badge>
                                    </h3>
                                </div>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {filteredTasks
                                        .filter(t => t.trangThai?.toLowerCase() === status)
                                        .map((task) => (
                                            <Card key={task.id} className="p-4 hover:shadow-md transition-all border-slate-200 cursor-pointer"
                                                onClick={() => openDetailModal(task)}>
                                                <div className="mb-2">
                                                    <p className="font-medium text-slate-900 mb-1">{task.tentask}</p>
                                                    {task.mota && (
                                                        <p className="text-sm text-slate-500 line-clamp-2">{task.mota}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                                    <FolderOpen className="w-3 h-3" />
                                                    <span className="font-medium">
                                                        {task.duan?.tenduan || projects.find(p => p.id === task.duanId)?.tenduan || 'Chưa xác định'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <User className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                        <span className="text-xs text-slate-600">{task.nguoiDuocGiao?.hoten}</span>
                                                    </div>
                                                    <Badge className={getPriorityColor(task.mucDoUuTien)}>
                                                        {getPriorityText(task.mucDoUuTien)}
                                                    </Badge>
                                                </div>
                                                {task.ngayKetThuc && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                                                        <Calendar className="w-3 h-3" />
                                                        <span className="font-medium">
                                                            Hạn: {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Task Modal (copied from project detail page) */}
            <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={isEditMode ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await handleSaveTask();
                    }}
                    className="space-y-5"
                >
                    {apiErrorMessage && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                            <strong>Lỗi từ server:</strong> {apiErrorMessage}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-foreground mb-2">Tên công việc *</label>
                            <input
                                type="text"
                                required
                                value={taskForm.tentask}
                                onChange={(e) => setTaskForm(prev => ({ ...prev, tentask: e.target.value }))}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="Nhập tên công việc"
                            />

                            <label className="block text-sm font-semibold text-foreground mb-2">Dự án *</label>
                            <Select value={taskForm.duanId} onValueChange={(value) => setTaskForm(prev => ({ ...prev, duanId: value }))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn dự án" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(project => (
                                        <SelectItem key={project.id} value={project.id.toString()}>
                                            {project.tenduan}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <label className="block text-sm font-semibold text-foreground mb-2">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={taskForm.ngayBatDau}
                                onChange={(e) => setTaskForm(prev => ({ ...prev, ngayBatDau: e.target.value }))}
                                min={projectDateBounds.start ? projectDateBounds.start.slice(0, 10) : undefined}
                                max={projectDateBounds.end ? projectDateBounds.end.slice(0, 10) : undefined}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-foreground mb-2">Mô tả</label>
                            <textarea
                                value={taskForm.mota}
                                onChange={(e) => setTaskForm(prev => ({ ...prev, mota: e.target.value }))}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                                placeholder="Mô tả công việc"
                                rows={4}
                            />

                            <label className="block text-sm font-semibold text-foreground mb-2">Người phụ trách *</label>
                            <Select value={taskForm.nguoiDuocGiaoId} onValueChange={(value) => setTaskForm(prev => ({ ...prev, nguoiDuocGiaoId: value }))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn người hoặc để trống" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Không giao ai (để member tự nhận) --</SelectItem>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.hoten} ({user.manv})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Hạn chót</label>
                                    <input
                                        type="date"
                                        value={taskForm.ngayKetThuc}
                                        onChange={(e) => setTaskForm(prev => ({ ...prev, ngayKetThuc: e.target.value }))}
                                        min={projectDateBounds.start ? projectDateBounds.start.slice(0, 10) : undefined}
                                        max={projectDateBounds.end ? projectDateBounds.end.slice(0, 10) : undefined}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Mức độ ưu tiên</label>
                                    <Select value={taskForm.mucDoUuTien} onValueChange={(value) => setTaskForm(prev => ({ ...prev, mucDoUuTien: value }))}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cao">Cao</SelectItem>
                                            <SelectItem value="trung_binh">Trung bình</SelectItem>
                                            <SelectItem value="thap">Thấp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 justify-end">
                        <button
                            type="button"
                            onClick={() => setIsTaskModalOpen(false)}
                            className="px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                        >
                            Lưu thay đổi
                        </button>

                        <button
                            type="button"
                            onClick={() => selectedTask && handleDeleteTask(selectedTask.id)}
                            className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
                        >
                            Xóa công việc
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Task Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Chi tiết nhiệm vụ</DialogTitle>
                    </DialogHeader>
                    {apiErrorMessage && (
                        <div className="mb-2 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                            Lỗi từ server: {apiErrorMessage}
                        </div>
                    )}
                    {detailTask && (
                        <div className="space-y-6 py-4">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">{detailTask.tentask}</h3>
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(detailTask.trangThai)}>
                                        {getStatusText(detailTask.trangThai)}
                                    </Badge>
                                    <Badge className={getPriorityColor(detailTask.mucDoUuTien)}>
                                        {getPriorityText(detailTask.mucDoUuTien)}
                                    </Badge>
                                </div>
                            </div>

                            {detailTask.mota && (
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-2">Mô tả</h4>
                                    <p className="text-slate-600">{detailTask.mota}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3">Thông tin dự án</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <FolderOpen className="w-4 h-4 text-blue-600" />
                                            <span className="text-slate-700">{detailTask.duan?.tenduan || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3">Người thực hiện</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{detailTask.nguoiDuocGiao?.hoten || 'N/A'}</p>
                                            {detailTask.nguoiDuocGiao?.email && (
                                                <p className="text-sm text-slate-500">{detailTask.nguoiDuocGiao.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Subtasks list */}
                            {detailSubtasks && detailSubtasks.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3">Công việc con</h4>
                                    <div className="space-y-2">
                                        {detailSubtasks.map((st: any) => (
                                            <div key={st.id} className="flex items-center justify-between p-3 border rounded">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{st.tenSubtask || st.name || `ST-${st.id}`}</p>
                                                        {st.nguoiThucHien && (
                                                            <p className="text-sm text-slate-500">{st.nguoiThucHien.hoten || st.nguoiThucHien.name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <Badge className={getStatusColor(st.trangThai || st.status || '')}>
                                                        {getStatusText(st.trangThai || st.status || '')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="font-semibold text-slate-900 mb-3">Thời gian</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {detailTask.ngayBatDau && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-slate-600" />
                                            <div>
                                                <p className="text-xs text-slate-500">Bắt đầu</p>
                                                <p className="font-medium text-slate-900">
                                                    {new Date(detailTask.ngayBatDau).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {detailTask.ngayKetThuc && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-slate-600" />
                                            <div>
                                                <p className="text-xs text-slate-500">Hạn hoàn thành</p>
                                                <p className="font-medium text-slate-900">
                                                    {new Date(detailTask.ngayKetThuc).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                            Đóng
                        </Button>
                        {detailTask && (
                            <>
                                <Button variant="outline" onClick={() => router.push(`/manager/projects/${detailTask.duan?.id || detailTask.duanId}`)}>
                                    Xem dự án
                                </Button>
                                <Button onClick={() => {
                                    setIsDetailModalOpen(false)
                                    openEditModal(detailTask)
                                }} className="bg-blue-600 hover:bg-blue-700">
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Chỉnh sửa
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
