"use client"
import { useState, useEffect, DragEvent } from "react"
import { Search, CheckSquare, Clock, AlertCircle, RefreshCw, User, Calendar, ClipboardList } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'

type ItemType = 'task' | 'subtask'

interface Subtask {
    id: number
    ten: string
    trangThai: string
    rawStatus?: string
    ngayKetThuc?: string
    ngayBatDau?: string
    nguoiThucHien?: { id: number; hoten: string; manv: string }
    task?: { id: number; tentask: string; duan?: { id: number; tenduan: string } }
    taskId?: number
    duan?: { id: number; tenduan: string }
    itemType: ItemType
}

export default function TeamLeadSubtasksPage() {
    const { showError, showSuccess } = useToastContext()
    const [subtasks, setSubtasks] = useState<Subtask[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [projectFilter, setProjectFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>("all")
    const [draggedItem, setDraggedItem] = useState<Subtask | null>(null)
    const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)

    useEffect(() => {
        loadSubtasks()
    }, [])

    const loadSubtasks = async () => {
        setLoading(true)
        try {
            const [subtaskRes, taskRes] = await Promise.all([
                api.get('/tasks/subtasks/group-subtasks'),
                api.get('/tasks/my-tasks')
            ])

            const normalizeStatus = (status?: string) => {
                if (!status) return 'Chưa bắt đầu'
                const normalized = status.trim()
                if ([
                    'Đang chờ duyệt',
                    'Chờ duyệt',
                    'Chờ xác nhận',
                    'Chờ xác nhận hoàn thành'
                ].includes(normalized)) {
                    return 'Đang chờ duyệt'
                }
                return normalized
            }

            const projectFromTask = (task: any) => task?.duan || task?.project || null

            const subtaskData: Subtask[] = (subtaskRes.data.subtasks || subtaskRes.data || []).map((item: any) => ({
                id: item.id,
                ten: item.ten || item.tenSubtask || item.tensubtask || 'Chưa đặt tên',
                trangThai: normalizeStatus(item.trangThai),
                rawStatus: item.trangThai,
                ngayKetThuc: item.ngayKetThuc,
                ngayBatDau: item.ngayBatDau,
                nguoiThucHien: item.nguoiThucHien,
                task: item.task,
                taskId: item.task?.id || item.taskId,
                duan: projectFromTask(item.task),
                itemType: 'subtask'
            }))

            const taskData: Subtask[] = (taskRes.data.tasks || taskRes.data || []).map((task: any) => {
                const project = projectFromTask(task)
                const assignee = task.nguoiThucHien || task.nguoiDuocGiao
                const rawStatus = task.trangThai
                return {
                    id: task.id,
                    ten: task.tentask,
                    trangThai: normalizeStatus(rawStatus),
                    rawStatus,
                    ngayKetThuc: task.ngayKetThuc,
                    ngayBatDau: task.ngayBatDau,
                    nguoiThucHien: assignee,
                    task: { id: task.id, tentask: task.tentask, duan: project },
                    taskId: task.id,
                    duan: project,
                    itemType: 'task'
                }
            })

            setSubtasks([...taskData, ...subtaskData])
        } catch (error: any) {
            console.error('Load subtasks error:', error)
            showError(error.response?.data?.message || 'Lỗi tải danh sách công việc con')
        } finally {
            setLoading(false)
        }
    }

    const projectOptions = subtasks.reduce((acc: { id: number; name: string }[], subtask) => {
        const project = subtask.duan || subtask.task?.duan
        if (project && project.id && !acc.some(item => item.id === project.id)) {
            acc.push({ id: project.id, name: project.tenduan })
        }
        return acc
    }, [])

    const filteredSubtasks = subtasks.filter(subtask => {
        const matchesSearch = (subtask.ten?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (subtask.task?.tentask?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || subtask.trangThai === statusFilter
        const matchesProject = projectFilter === "all" || String(subtask.duan?.id ?? subtask.task?.duan?.id ?? '') === projectFilter
        const matchesType = typeFilter === 'all' || subtask.itemType === typeFilter
        return matchesSearch && matchesStatus && matchesProject && matchesType
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hoàn thành': return 'bg-green-100 text-green-800 border-green-200'
            case 'Đang chạy': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'Chưa bắt đầu': return 'bg-gray-100 text-gray-800 border-gray-200'
            case 'Đang chờ duyệt': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Chưa có'
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const groupedByStatus = {
        'Chưa bắt đầu': filteredSubtasks.filter(s => s.trangThai === 'Chưa bắt đầu'),
        'Đang chạy': filteredSubtasks.filter(s => s.trangThai === 'Đang chạy'),
        'Đang chờ duyệt': filteredSubtasks.filter(s => s.trangThai === 'Đang chờ duyệt'),
        'Hoàn thành': filteredSubtasks.filter(s => s.trangThai === 'Hoàn thành'),
    }

    const handleDragStart = (subtask: Subtask) => {
        setDraggedItem(subtask)
    }

    const handleDragEnd = () => {
        setDraggedItem(null)
        setDragOverStatus(null)
    }

    const handleDragOver = (event: DragEvent<HTMLDivElement>, status: string) => {
        event.preventDefault()
        if (dragOverStatus !== status) {
            setDragOverStatus(status)
        }
    }

    const handleDragLeave = (event: DragEvent<HTMLDivElement>, status: string) => {
        const related = event.relatedTarget as Node | null
        if (!related || !event.currentTarget.contains(related)) {
            if (dragOverStatus === status) {
                setDragOverStatus(null)
            }
        }
    }

    const mapStatusToApi = (status: string, itemType: ItemType) => {
        if (status === 'Đang chờ duyệt') {
            return itemType === 'task' ? 'Chờ xác nhận hoàn thành' : 'Đang chờ duyệt'
        }
        return status
    }

    const handleDrop = async (event: DragEvent<HTMLDivElement>, newStatus: string) => {
        event.preventDefault()
        if (!draggedItem) return

        setDragOverStatus(null)

        if (draggedItem.trangThai === newStatus) {
            handleDragEnd()
            return
        }

        const targetTaskId = draggedItem.itemType === 'subtask' ? (draggedItem.task?.id || draggedItem.taskId) : draggedItem.id
        if (!targetTaskId) {
            showError('Không xác định được công việc cha của công việc con này')
            handleDragEnd()
            return
        }

        const previousSubtasks = subtasks.map(item => ({ ...item }))

        const apiStatus = mapStatusToApi(newStatus, draggedItem.itemType)

        setSubtasks(prev => prev.map(item => {
            if (item.id !== draggedItem.id) return item
            return {
                ...item,
                trangThai: newStatus,
                rawStatus: apiStatus
            }
        }))

        try {
            if (draggedItem.itemType === 'task') {
                await api.patch(`/tasks/${draggedItem.id}/status`, { trangThai: apiStatus })
            } else {
                await api.put(`/tasks/${targetTaskId}/subtasks/${draggedItem.id}`, { trangThai: apiStatus })
            }
            showSuccess('Cập nhật trạng thái thành công!')
            loadSubtasks()
        } catch (error: any) {
            console.error('Update item status error:', error)
            setSubtasks(previousSubtasks)
            showError(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái công việc')
        } finally {
            handleDragEnd()
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <CheckSquare className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Công việc & công việc con</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Quản lý toàn bộ công việc nhóm phụ trách</p>
                        </div>
                    </div>
                    <button
                        onClick={loadSubtasks}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium text-sm flex items-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm công việc..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer min-w-[200px]"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                            <option value="Đang chạy">Đang chạy</option>
                            <option value="Đang chờ duyệt">Đang chờ duyệt</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                        </select>
                        <select
                            value={projectFilter}
                            onChange={e => setProjectFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer min-w-[220px]"
                        >
                            <option value="all">Tất cả dự án</option>
                            {projectOptions.map(project => (
                                <option key={project.id} value={String(project.id)}>{project.name}</option>
                            ))}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as ItemType | 'all')}
                            className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer min-w-[200px]"
                        >
                            <option value="all">Tất cả loại công việc</option>
                            <option value="task">Công việc chính</option>
                            <option value="subtask">Công việc con</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">Tổng số: <span className="text-purple-600 font-bold">{filteredSubtasks.length}</span> công việc</span>
                </div>
            </div>

            {/* Kanban View */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-96 bg-gray-200 rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(groupedByStatus).map(([status, items]) => (
                        <div
                            key={status}
                            className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex flex-col transition-all ${dragOverStatus === status ? 'ring-2 ring-purple-400 border-purple-300 bg-purple-50/60' : ''}`}
                            onDragOver={event => handleDragOver(event, status)}
                            onDragLeave={event => handleDragLeave(event, status)}
                            onDrop={event => handleDrop(event, status)}
                        >
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                <h3 className="font-bold text-gray-900">{status}</h3>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                    {items.length}
                                </span>
                            </div>
                            <div className="space-y-3 overflow-y-auto flex-1">
                                {items.map(subtask => (
                                    <div
                                        key={subtask.id}
                                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 cursor-move"
                                        draggable
                                        onDragStart={() => handleDragStart(subtask)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold border mb-2 ${getStatusColor(subtask.trangThai)}`}>
                                            {subtask.trangThai}
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold ${subtask.itemType === 'task' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                                {subtask.itemType === 'task' ? (
                                                    <ClipboardList className="w-3 h-3" />
                                                ) : (
                                                    <CheckSquare className="w-3 h-3" />
                                                )}
                                                {subtask.itemType === 'task' ? 'Công việc chính' : 'Công việc con'}
                                            </span>
                                            {subtask.duan && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                    {subtask.duan.tenduan}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{subtask.ten}</h4>
                                        <div className="space-y-2 text-xs text-gray-600">
                                            {subtask.itemType === 'subtask' ? (
                                                <div className="flex items-center gap-2">
                                                    <CheckSquare className="w-4 h-4 text-purple-600" />
                                                    <span className="truncate">{subtask.task?.tentask || 'N/A'}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                                                    <span className="truncate">Công việc chính</span>
                                                </div>
                                            )}
                                            {subtask.nguoiThucHien && (
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                    <span className="truncate">{subtask.nguoiThucHien.hoten}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-amber-600" />
                                                <span>{formatDate(subtask.ngayKetThuc)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-sm">Không có công việc</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
