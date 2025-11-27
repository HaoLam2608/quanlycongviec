"use client"
import { useState, useEffect } from "react"
import {
    Search,
    Filter,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Play,
    Pause,
    FileText,
    Calendar as CalendarIcon,
    MoreHorizontal,
    Eye,
    Edit,
    MessageSquare,
    Paperclip
} from "lucide-react"
import { getMySubtasks, updateMemberTaskStatus, updateMemberSubtaskStatus, getUnassignedSubtasks, claimSubtask } from "@/axios/api"
import assignmentAPI from '@/axios/assignmentAPI'
import { useAuth } from '@/hooks/useAuth'
import { useToastContext } from '@/components/providers/toast-provider'
import Modal from "@/components/admin/Modal"
import WorklogTask from "@/components/worklog-task"
import WorklogSubtask from "@/components/worklog-subtask"
import CommentTask from "@/components/comment-task"
import CommentSubtask from "@/components/comment-subtask"

interface Task {
    id: number
    tentask: string
    mota?: string
    trangThai: string
    mucDoUuTien?: string
    ngayKetThuc?: string
    ngayBatDau?: string
    duan?: {
        id: number
        tenduan: string
        status: string
    }
    nguoiGiao?: {
        id: number
        hoten: string
        manv: string
    }
    subtasks?: any[]
}

interface Subtask {
    id: number
    tenSubtask: string
    trangThai: string
    ngayKetThuc?: string
    task?: {
        id: number
        tentask: string
        duan?: {
            id: number
            tenduan: string
        }
    }
}

export default function MyTasksPage() {
    const { showSuccess, showError } = useToastContext()
    const auth = useAuth()
    const [tasks, setTasks] = useState<Task[]>([])
    const [subtasks, setSubtasks] = useState<Subtask[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")
    const [projectFilter, setProjectFilter] = useState<string>("all")
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isAvailableModalOpen, setIsAvailableModalOpen] = useState(false)
    const [availableItems, setAvailableItems] = useState<Array<{ type: 'task' | 'subtask'; item: any }>>([])
    const [requestedIds, setRequestedIds] = useState<number[]>([])

    useEffect(() => {
        loadTasks()
    }, [])

    const loadTasks = async () => {
        try {
            setLoading(true)
            setError(null)

            console.log('📡 Fetching my subtasks...')

            // Get all subtasks assigned to current member
            const data = await getMySubtasks()
            console.log('✅ Subtasks received:', data)
            console.log('📊 Subtasks count:', Array.isArray(data) ? data.length : data.subtasks?.length || 0)

            // Handle response structure - could be array or wrapped in object
            let subtasksArray: Subtask[] = []
            if (Array.isArray(data)) {
                subtasksArray = data
            } else if (data.subtasks && Array.isArray(data.subtasks)) {
                subtasksArray = data.subtasks
            } else if (data.data && Array.isArray(data.data)) {
                subtasksArray = data.data
            }

            // Log first subtask to check data structure
            if (subtasksArray.length > 0) {
                console.log('📝 Sample subtask:', subtasksArray[0])
            }

            setTasks([]) // No tasks, only subtasks
            setSubtasks(subtasksArray)
        } catch (error: any) {
            console.error("❌ Error loading tasks:", error)
            setError(error.message || "Không thể tải danh sách công việc")
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Hoàn thành": return "text-green-600 bg-green-100"
            case "Đang chạy": return "text-blue-600 bg-blue-100"
            case "Chờ xác nhận hoàn thành": return "text-yellow-600 bg-yellow-100"
            case "Chưa bắt đầu": return "text-gray-600 bg-gray-100"
            default: return "text-gray-600 bg-gray-100"
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

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case "high": return "Cao"
            case "medium": return "Trung bình"
            case "low": return "Thấp"
            default: return "Chưa xác định"
        }
    }

    const getDaysUntilDeadline = (deadline?: string) => {
        if (!deadline) return null
        const today = new Date()
        const deadlineDate = new Date(deadline)
        const diffTime = deadlineDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // Only display subtasks (member-focused view)
    const allItems = subtasks.map(subtask => ({
        id: subtask.id,
        title: subtask.tenSubtask,
        description: '',
        status: subtask.trangThai,
        priority: 'medium',
        deadline: subtask.ngayKetThuc,
        project: subtask.task?.duan?.tenduan || 'Chưa có dự án',
        projectId: subtask.task?.duan?.id,
        type: 'subtask' as const,
        parentTask: subtask.task?.tentask,
        progress: subtask.trangThai === 'Hoàn thành' ? 100 : subtask.trangThai === 'Chờ xác nhận hoàn thành' ? 90 : subtask.trangThai === 'Đang chạy' ? 50 : 0,
        createdAt: (subtask as any).createdAt || null,
        // include assignee info so we can hide request button when already assigned
        assigneeId: (subtask as any).nguoiThucHienId || (subtask as any).nguoiThucHien?.id || null
    }))

    // Sort items newest-first. Prefer createdAt if available, otherwise fall back to id descending.
    const sortedItems = allItems.slice().sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : null
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : null

        if (aDate && bDate) return bDate - aDate
        if (aDate && !bDate) return -1
        if (!aDate && bDate) return 1

        // fallback to id (assumes higher id == newer)
        return (b.id || 0) - (a.id || 0)
    })

    const filteredTasks = sortedItems.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.project.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || task.status === statusFilter
        const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
        const matchesProject = projectFilter === "all" || task.projectId?.toString() === projectFilter

        return matchesSearch && matchesStatus && matchesPriority && matchesProject
    })

    // Debug logging for filters
    console.log('🔍 Filter state:', { statusFilter, priorityFilter, projectFilter, searchTerm })
    console.log('📦 All items:', allItems.length)
    console.log('✅ Filtered items:', filteredTasks.length)
    if (allItems.length > 0 && filteredTasks.length === 0) {
        console.log('⚠️ No items after filtering. First item status:', allItems[0]?.status)
        console.log('⚠️ Status filter:', statusFilter)
    }

    // Get unique projects by id (remove duplicates)
    const projectsMap = new Map<number, { id: number; name: string }>();
    subtasks.forEach(subtask => {
        const projectId = subtask.task?.duan?.id;
        const projectName = subtask.task?.duan?.tenduan;
        if (projectId && projectName && !projectsMap.has(projectId)) {
            projectsMap.set(projectId, { id: projectId, name: projectName });
        }
    });
    const projects = Array.from(projectsMap.values());

    const updateTaskStatus = async (taskId: number, newStatus: string, type: 'task' | 'subtask') => {
        try {
            console.log('🔄 [updateTaskStatus] Starting update:', { taskId, newStatus, type });

            if (type === 'task') {
                console.log('📤 [updateTaskStatus] Calling updateMemberTaskStatus...');
                const response = await updateMemberTaskStatus(taskId, newStatus)
                console.log('✅ [updateTaskStatus] Response:', response);

                // Backend returns actual status (may be "Chờ xác nhận hoàn thành" instead of "Hoàn thành")
                const actualStatus = response.task?.trangThai || (newStatus === 'Hoàn thành' ? 'Chờ xác nhận hoàn thành' : newStatus)

                setTasks(tasks.map(task =>
                    task.id === taskId
                        ? { ...task, trangThai: actualStatus }
                        : task
                ))

                // Show success message
                if (actualStatus === 'Chờ xác nhận hoàn thành') {
                    showSuccess('Đã gửi yêu cầu xác nhận hoàn thành. Chờ quản lý phê duyệt.')
                } else if (newStatus === 'Đang chạy') {
                    showSuccess('Đã bắt đầu công việc')
                } else {
                    showSuccess('Cập nhật trạng thái thành công')
                }
            } else {
                console.log('🔍 [updateTaskStatus] Finding subtask in list...');
                const subtask = subtasks.find(st => st.id === taskId)
                console.log('📋 [updateTaskStatus] Found subtask:', subtask);

                if (!subtask) {
                    console.error('❌ [updateTaskStatus] Subtask not found in list:', taskId);
                    showError('Không tìm thấy công việc con');
                    return;
                }

                if (!subtask.task) {
                    console.error('❌ [updateTaskStatus] Subtask has no parent task:', subtask);
                    showError('Công việc con không có task cha');
                    return;
                }

                console.log('📤 [updateTaskStatus] Calling updateMemberSubtaskStatus...', {
                    taskId: subtask.task.id,
                    subtaskId: taskId,
                    newStatus
                });

                const response = await updateMemberSubtaskStatus(subtask.task.id, taskId, newStatus)
                console.log('✅ [updateTaskStatus] Response:', response);

                // Backend returns actual status (may be "Chờ xác nhận hoàn thành" instead of "Hoàn thành")
                const actualStatus = response.subtask?.trangThai || (newStatus === 'Hoàn thành' ? 'Chờ xác nhận hoàn thành' : newStatus)

                setSubtasks(subtasks.map(st =>
                    st.id === taskId
                        ? { ...st, trangThai: actualStatus }
                        : st
                ))

                // Show success message
                if (actualStatus === 'Chờ xác nhận hoàn thành') {
                    showSuccess('Đã gửi yêu cầu xác nhận hoàn thành. Chờ quản lý phê duyệt.')
                } else if (newStatus === 'Đang chạy') {
                    showSuccess('Đã bắt đầu công việc')
                } else {
                    showSuccess('Cập nhật trạng thái thành công')
                }
            }
        } catch (error: any) {
            console.error('❌ [updateTaskStatus] Error updating status:', error);
            console.error('❌ [updateTaskStatus] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            showError(error.response?.data?.message || error.message || 'Không thể cập nhật trạng thái')
        }
    }

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex-1">
                            <div className="h-9 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
                            <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
                        </div>
                        <div className="text-right">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Filters Skeleton */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    </div>

                    {/* Tasks List Skeleton */}
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
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
                                    <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <p className="text-gray-900 font-semibold mb-2">Lỗi khi tải dữ liệu</p>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadTasks}
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
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Công việc nhỏ của tôi</h1>
                        <p className="text-gray-600">Quản lý và theo dõi tiến độ các subtask được giao</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Tổng số subtask</p>
                        <p className="text-2xl font-bold text-blue-600">{allItems.length}</p>
                    </div>
                </div>

                {/* Request available tasks button */}
                <div className="mb-4 flex justify-end">
                    <button
                        disabled={loading}
                        onClick={async () => {
                            // Load unassigned subtasks từ team lead
                            try {
                                setLoading(true)
                                console.log('🔄 Fetching unassigned subtasks...')
                                const res = await getUnassignedSubtasks()
                                console.log('📋 Unassigned subtasks response:', res)

                                if (res && res.subtasks) {
                                    // Format subtasks thành availableItems
                                    const formattedItems = res.subtasks.map((subtask: any) => ({
                                        type: 'subtask' as const,
                                        item: {
                                            id: subtask.id,
                                            tenSubtask: subtask.tenSubtask,
                                            mota: subtask.mota,
                                            trangThai: subtask.trangThai,
                                            ngayKetThuc: subtask.ngayKetThuc,
                                            task: {
                                                id: subtask.task?.id,
                                                tentask: subtask.task?.tentask,
                                                nguoiGiao: subtask.task?.nguoiGiao,
                                                duan: subtask.task?.duan
                                            }
                                        }
                                    }))

                                    console.log('✅ Formatted items:', formattedItems)
                                    setAvailableItems(formattedItems)
                                    console.log('🔓 Opening modal...')
                                    setIsAvailableModalOpen(true)

                                    if (formattedItems.length === 0) {
                                        showSuccess('Hiện không có công việc nào chưa được nhận từ team lead của bạn')
                                    }
                                } else {
                                    showError('Không thể lấy danh sách công việc chưa có người nhận')
                                }
                            } catch (err: any) {
                                console.error('load unassigned subtasks error', err)
                                showError(err?.response?.data?.message || err?.message || 'Lỗi khi tải danh sách công việc chưa có người nhận')
                            } finally {
                                setLoading(false)
                            }
                        }}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <span>{loading ? '⏳' : '🎯'}</span>
                        <span>{loading ? 'Đang tải...' : 'Yêu cầu nhận công việc'}</span>
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm công việc..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                            <option value="Đang chạy">Đang chạy</option>
                            <option value="Chờ xác nhận hoàn thành">Chờ xác nhận</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tất cả độ ưu tiên</option>
                            <option value="high">Cao</option>
                            <option value="medium">Trung bình</option>
                            <option value="low">Thấp</option>
                        </select>

                        {/* Project Filter */}
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tất cả dự án</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id?.toString()}>{project.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                    {filteredTasks.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có công việc</h3>
                            <p className="text-gray-500">Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div key={task.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {task.type === 'subtask' ? '• ' : ''}{task.title}
                                            </h3>
                                            {task.type === 'subtask' && (
                                                <span className="text-sm text-gray-500">
                                                    (Subtask của: {task.parentTask})
                                                </span>
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-gray-600 mb-3">{task.description}</p>
                                        )}

                                        <div className="flex items-center gap-4 mb-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                {getPriorityLabel(task.priority)}
                                            </span>
                                            <span className="text-sm text-gray-500">{task.project}</span>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            {task.deadline && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span className={
                                                        getDaysUntilDeadline(task.deadline)! < 0 && task.status !== "Hoàn thành"
                                                            ? "text-red-600 font-medium"
                                                            : getDaysUntilDeadline(task.deadline)! <= 2 && task.status !== "Hoàn thành"
                                                                ? "text-orange-600 font-medium"
                                                                : ""
                                                    }>
                                                        Deadline: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                                                        {getDaysUntilDeadline(task.deadline)! < 0 && task.status !== "Hoàn thành" && " (Quá hạn)"}
                                                        {getDaysUntilDeadline(task.deadline)! >= 0 && task.status !== "Hoàn thành" &&
                                                            ` (${getDaysUntilDeadline(task.deadline)} ngày)`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {task.progress !== undefined && (
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-gray-600">Tiến độ</span>
                                                    <span className="text-sm font-medium text-gray-900">{task.progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${task.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        {/* Status Update Buttons */}
                                        {task.status === "Chưa bắt đầu" && (
                                            <button
                                                onClick={() => updateTaskStatus(task.id, "Đang chạy", task.type)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                                            >
                                                <Play className="w-4 h-4" />
                                                Bắt đầu
                                            </button>
                                        )}
                                        {task.status === "Đang chạy" && (
                                            <>
                                                <button
                                                    onClick={() => updateTaskStatus(task.id, "Chưa bắt đầu", task.type)}
                                                    className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                                                >
                                                    <Pause className="w-4 h-4" />
                                                    Tạm dừng
                                                </button>
                                                <button
                                                    onClick={() => updateTaskStatus(task.id, "Hoàn thành", task.type)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Hoàn thành
                                                </button>
                                            </>
                                        )}
                                        {task.status === "Chờ xác nhận hoàn thành" && (
                                            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                Chờ phê duyệt
                                            </div>
                                        )}

                                        {/* Task Details Button */}
                                        <button
                                            onClick={() => {
                                                setSelectedTask(task)
                                                setIsDetailModalOpen(true)
                                            }}
                                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Chi tiết
                                        </button>
                                        {/* Request to join button - hidden if already has an assignee */}
                                        {!task.assigneeId && (
                                            <button
                                                onClick={async () => {
                                                    // For subtasks we send subtaskId and taskId
                                                    try {
                                                        const payload: any = {}
                                                        if (task.type === 'subtask') {
                                                            payload.subtaskId = task.id
                                                        } else {
                                                            payload.taskId = task.id
                                                        }
                                                        const res = await assignmentAPI.requestToJoin(payload)
                                                        if (res && res.success) {
                                                            showSuccess('Đã gửi yêu cầu tham gia tới người quản lý')
                                                        } else {
                                                            showError(res?.message || 'Không thể gửi yêu cầu')
                                                        }
                                                    } catch (err: any) {
                                                        console.error('requestToJoin error', err)
                                                        showError(err?.response?.data?.message || 'Lỗi khi gửi yêu cầu')
                                                    }
                                                }}
                                                className="px-3 py-1 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors flex items-center gap-1"
                                            >
                                                Yêu cầu nhận việc
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Available Tasks Modal */}
                {isAvailableModalOpen && (
                    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Công việc chưa có người nhận từ Team Lead</h3>
                                <button
                                    onClick={() => setIsAvailableModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none px-2"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-4 space-y-3">
                                {availableItems.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p className="mb-2">✨ Không có công việc nào chưa được nhận</p>
                                        <p className="text-sm">Tất cả công việc từ team lead của bạn đã có người đảm nhận</p>
                                    </div>
                                ) : (
                                    availableItems.map((ai, idx) => (
                                        <div key={idx} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="font-medium text-lg mb-1">
                                                        {ai.type === 'subtask' ? ai.item.tenSubtask : ai.item.tentask}
                                                    </div>
                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        {ai.type === 'subtask' && ai.item.task && (
                                                            <>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-500">📋 Task cha:</span>
                                                                    <span className="font-medium">{ai.item.task.tentask}</span>
                                                                </div>
                                                                {ai.item.task.duan && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-500">📁 Dự án:</span>
                                                                        <span>{ai.item.task.duan.tenduan}</span>
                                                                    </div>
                                                                )}
                                                                {ai.item.task.nguoiGiao && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-500">👤 Team Lead:</span>
                                                                        <span>{ai.item.task.nguoiGiao.hoten} ({ai.item.task.nguoiGiao.manv})</span>
                                                                    </div>
                                                                )}
                                                                {ai.item.ngayKetThuc && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-500">⏰ Deadline:</span>
                                                                        <span>{new Date(ai.item.ngayKetThuc).toLocaleDateString('vi-VN')}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    {ai.item.mota && (
                                                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                            {ai.item.mota}
                                                        </div>
                                                    )}
                                                </div>
                                                {requestedIds.includes(ai.item.id) ? (
                                                    <button disabled className="px-4 py-2 bg-gray-300 text-white rounded-lg whitespace-nowrap flex items-center gap-2">
                                                        <span>⏳</span>
                                                        <span>Đã gửi yêu cầu</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await claimSubtask(ai.item.id)
                                                                showSuccess('Yêu cầu nhận việc đã được gửi tới người phê duyệt.')
                                                                setRequestedIds(prev => [...prev, ai.item.id])
                                                            } catch (err: any) {
                                                                console.error('claimSubtask error', err)
                                                                showError(err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu nhận công việc')
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap flex items-center gap-2"
                                                    >
                                                        <span>✅</span>
                                                        <span>Yêu cầu nhận việc</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Task Detail Modal */}
                <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Chi tiết công việc">
                    {selectedTask && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {selectedTask.type === 'subtask' ? '• ' : ''}{selectedTask.title}
                                </h3>
                                {selectedTask.description && (
                                    <p className="text-muted-foreground">{selectedTask.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
                                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTask.status)}`}>
                                        {selectedTask.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Độ ưu tiên</label>
                                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTask.priority)}`}>
                                        {getPriorityLabel(selectedTask.priority)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Deadline</label>
                                    <p className="mt-1 text-foreground">
                                        {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Task cha</label>
                                    <p className="mt-1 text-foreground">{selectedTask.parentTask || 'Không có'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Dự án</label>
                                <p className="mt-1 text-foreground">{selectedTask.project}</p>
                            </div>

                            {selectedTask.progress !== undefined && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tiến độ</label>
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Hoàn thành</span>
                                            <span className="text-sm font-medium text-foreground">{selectedTask.progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${selectedTask.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Worklog và Comments - chỉ cho subtasks */}
                            <div className="pt-4 border-t border-gray-200 space-y-4">
                                {selectedTask.id ? (
                                    <>
                                        <WorklogSubtask subtaskId={selectedTask.id} subtaskStatus={selectedTask.status} />
                                        <CommentSubtask subtaskId={selectedTask.id} subtaskStatus={selectedTask.status} />
                                    </>
                                ) : null}
                            </div>

                            {/* Action Buttons - có thể bỏ vì đã có Worklog và Comment components */}
                            <div className="flex justify-end pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    )
}