"use client"
import { useState, useEffect } from "react"
import { Search, Plus, Filter, Clock, Users, Calendar, AlertCircle, CheckCircle2, Folder, Edit, Trash2, Eye, Building2, X, ArrowLeft, MessageSquare, ListChecks, ThumbsUp, ThumbsDown, Hand } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'
import { showConfirm, showWarning } from '@/lib/notifications'
import { updateTask, getPendingTaskAssignments, getUnassignedTasks, requestToClaimTask, acceptAssignment, declineAssignment } from "@/axios/api"
import CommentTask from "@/components/comment-task"
import WorklogTask from "@/components/worklog-task"
import CommentSubtask from "@/components/comment-subtask"
import WorklogSubtask from "@/components/worklog-subtask"

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
    assignments?: any[]  // Thêm field để kiểm tra trạng thái chấp nhận
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
    const [pendingAssignments, setPendingAssignments] = useState<any[]>([])
    const [unassignedTasks, setUnassignedTasks] = useState<any[]>([])
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

    // Edit task modal states
    const [showEditTaskModal, setShowEditTaskModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [editTaskForm, setEditTaskForm] = useState({
        name: '',
        description: '',
        priority: 'medium',
        startDate: '',
        dueDate: ''
    })

    // Edit subtask modal states
    const [showEditSubtaskModal, setShowEditSubtaskModal] = useState(false)
    const [editingSubtask, setEditingSubtask] = useState<any>(null)
    const [editSubtaskForm, setEditSubtaskForm] = useState({
        tenSubtask: '',
        mota: '',
        ngayBatDau: '',
        ngayKetThuc: '',
        nguoiThucHienId: '',
        ghiChu: ''
    })

    // Comment and Worklog expand states
    const [expandedCommentTaskId, setExpandedCommentTaskId] = useState<number | null>(null)
    const [expandedWorklogTaskId, setExpandedWorklogTaskId] = useState<number | null>(null)
    const [expandedCommentSubtaskId, setExpandedCommentSubtaskId] = useState<number | null>(null)
    const [expandedWorklogSubtaskId, setExpandedWorklogSubtaskId] = useState<number | null>(null)

    // Decline assignment modal states
    const [showDeclineModal, setShowDeclineModal] = useState(false)
    const [declineReason, setDeclineReason] = useState('')
    const [declineAssignmentId, setDeclineAssignmentId] = useState<number | null>(null)

    // Claim task modal states
    const [showClaimModal, setShowClaimModal] = useState(false)
    const [claimTaskId, setClaimTaskId] = useState<number | null>(null)
    const [claimTaskDetails, setClaimTaskDetails] = useState<any>(null)

    useEffect(() => {
        console.log('Edit subtask form updated:', editSubtaskForm)
    }, [editSubtaskForm])

    useEffect(() => {
        loadTasks()
        loadProjects()
        loadGroups()
        loadPendingAssignments()
        loadUnassignedTasks()

        // Auto refresh every 30 seconds to catch updates from members
        const interval = setInterval(() => {
            loadTasks()
            loadPendingAssignments()
            loadUnassignedTasks()
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
                        const subtasks = subtaskRes.data.subtasks || subtaskRes.data || []

                        // Debug: Log để kiểm tra subtasks có assignments không
                        if (subtasks.length > 0) {
                            console.log(`Task ${task.id} subtasks:`, subtasks)
                        }

                        return {
                            ...task,
                            subtasks: subtasks
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

    const loadPendingAssignments = async () => {
        try {
            const res = await getPendingTaskAssignments()
            setPendingAssignments(res.data || [])
        } catch (error: any) {
            console.error('Load pending assignments error:', error)
            // Không hiển thị error, chỉ log
        }
    }

    const handleAcceptAssignment = async (assignmentId: number) => {
        try {
            await acceptAssignment(assignmentId)
            showSuccess('Đã chấp nhận công việc!')
            await loadPendingAssignments()
            await loadTasks()
        } catch (error: any) {
            console.error('Accept assignment error:', error)
            showError(error.message || 'Lỗi khi chấp nhận công việc')
        }
    }

    const handleDeclineAssignment = (assignmentId: number) => {
        setDeclineAssignmentId(assignmentId)
        setShowDeclineModal(true)
        setDeclineReason('')
    }

    const handleDeclineAssignmentConfirm = async (assignmentId: number) => {
        if (!declineReason.trim()) {
            showError('Vui lòng nhập lý do từ chối')
            return
        }

        try {
            await declineAssignment(assignmentId, declineReason)
            showSuccess('Đã từ chối công việc!')
            setShowDeclineModal(false)
            setDeclineReason('')
            setDeclineAssignmentId(null)
            await loadPendingAssignments()
        } catch (error: any) {
            console.error('Decline assignment error:', error)
            showError(error.message || 'Lỗi khi từ chối công việc')
        }
    }

    const loadUnassignedTasks = async () => {
        try {
            const res = await getUnassignedTasks()
            console.log('Unassigned tasks loaded:', res)
            setUnassignedTasks(res || [])
        } catch (error: any) {
            console.error('Load unassigned tasks error:', error)
            // Không hiển thị error, chỉ log
        }
    }

    const handleClaimTask = (task: any) => {
        setClaimTaskId(task.id)
        setClaimTaskDetails(task)
        setShowClaimModal(true)
    }

    const handleClaimTaskConfirm = async () => {
        if (!claimTaskId) return

        try {
            await requestToClaimTask(claimTaskId)
            showSuccess('Đã gửi yêu cầu nhận công việc!')
            setShowClaimModal(false)
            setClaimTaskId(null)
            setClaimTaskDetails(null)
            await loadUnassignedTasks()
            await loadPendingAssignments()
        } catch (error: any) {
            console.error('Claim task error:', error)
            showError(error.message || 'Lỗi khi gửi yêu cầu nhận công việc')
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

    const loadGroupMembersForTask = async (task: Task | null | undefined, fallbackMember?: any) => {
        console.log('Loading group members for task', task?.id, 'project', task?.duanId)
        try {
            const res = await api.get('/groups/my-group')
            let allMembers = res.data.groups?.flatMap((g: any) => g.members || []) || []

            if (fallbackMember?.id) {
                const exists = allMembers.some((m: any) => m.id === fallbackMember.id)
                if (!exists) {
                    allMembers = [...allMembers, {
                        id: fallbackMember.id,
                        hoten: fallbackMember.hoten,
                        manv: fallbackMember.manv,
                        email: fallbackMember.email
                    }]
                }
            }

            console.log('Group members loaded:', allMembers)
            setGroupMembers(allMembers)
        } catch (error) {
            console.error('Load members error:', error)
        }
    }

    const openSubtaskModal = (task: Task) => {
        setSelectedTask(task)
        setSubtaskFormData({
            tenSubtask: '',
            mota: '',
            ngayBatDau: task.ngayBatDau || '',
            ngayKetThuc: task.ngayKetThuc || '',
            nguoiThucHienId: '',
            ghiChu: ''
        })

        loadGroupMembersForTask(task)
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
        console.log('Open subtask list for task', task.id, task.subtasks)
        setSelectedTask(task)
        loadGroupMembersForTask(task)
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

    const handleCreateSubtask = async () => {
        if (!subtaskFormData.tenSubtask.trim()) {
            showError('Vui lòng nhập tên công việc con')
            return
        }

        // Cho phép tạo subtask không cần chọn người thực hiện (member có thể tự nhận sau)
        // if (!subtaskFormData.nguoiThucHienId) {
        //     showError('Vui lòng chọn người thực hiện')
        //     return
        // }

        if (!subtaskFormData.ngayBatDau) {
            showWarning('Vui lòng chọn ngày bắt đầu cho công việc con')
            return
        }

        const subStart = new Date(subtaskFormData.ngayBatDau)
        if (isNaN(subStart.getTime())) {
            showWarning('Ngày bắt đầu không hợp lệ')
            return
        }

        // If task has a start date, ensure subStart >= task.start
        if (selectedTask?.ngayBatDau) {
            const taskStart = new Date(selectedTask.ngayBatDau)
            if (!isNaN(taskStart.getTime()) && subStart < taskStart) {
                showWarning('Ngày bắt đầu của công việc con phải lớn hơn hoặc bằng ngày bắt đầu của công việc chính')
                return
            }
        }

        // If task has an end date, ensure subStart < task.end
        if (selectedTask?.ngayKetThuc) {
            const taskEnd = new Date(selectedTask.ngayKetThuc)
            if (isNaN(taskEnd.getTime())) {
                showWarning('Ngày kết thúc của công việc chính không hợp lệ')
                return
            }
            if (!(subStart < taskEnd)) {
                showWarning('Ngày bắt đầu của công việc con phải nhỏ hơn ngày kết thúc của công việc chính')
                return
            }
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

            // Reload tasks to get updated data with assignments
            await loadTasks()

            // If modal is still showing selected task, reload it with assignments
            if (selectedTask) {
                try {
                    const taskRes = await api.get(`/tasks/${selectedTask.id}`)
                    const taskWithAssignments = taskRes.data

                    // Load subtasks
                    const subtaskRes = await api.get(`/tasks/${selectedTask.id}/subtasks`)
                    const updatedTask = {
                        ...taskWithAssignments,
                        subtasks: subtaskRes.data.subtasks || subtaskRes.data || []
                    }
                    setSelectedTask(updatedTask)
                } catch (error) {
                    console.error('Error reloading task:', error)
                }
            }
        } catch (error: any) {
            console.error('Create subtask error:', error)
            const errData: any = error.response?.data
            if (errData && (errData.details || errData.error || errData.message || errData.sequelizeErrors)) {
                console.error('Backend error details:', errData)
                const details = errData.details || errData.error || errData.message || (Array.isArray(errData.sequelizeErrors) ? errData.sequelizeErrors.join('; ') : undefined)
                showError('Lỗi khi tạo công việc con: ' + (details || 'Xem console để biết thêm chi tiết'))
            } else {
                showError(error.response?.data?.error || 'Lỗi khi tạo công việc con')
            }
        }
    }

    const openEditTaskModal = (task: Task) => {
        setEditingTask(task)
        setEditTaskForm({
            name: task.tentask || '',
            description: task.moTa || '',
            priority: task.mucDoUuTien || 'medium',
            startDate: task.ngayBatDau ? new Date(task.ngayBatDau).toISOString().split('T')[0] : '',
            dueDate: task.ngayKetThuc ? new Date(task.ngayKetThuc).toISOString().split('T')[0] : ''
        })
        setShowEditTaskModal(true)
    }

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!editingTask) return

        // Validate dates
        const taskStart = editTaskForm.startDate ? new Date(editTaskForm.startDate) : null
        const taskEnd = editTaskForm.dueDate ? new Date(editTaskForm.dueDate) : null

        if (taskStart && taskEnd && taskStart > taskEnd) {
            showWarning('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc!')
            return
        }

        // Check if task belongs to a project
        if (editingTask.duanId && editingTask.duan) {
            try {
                const projectRes = await api.get(`/duans/${editingTask.duanId}`)
                const project = projectRes.data

                const projectStart = project.ngaybatdau ? new Date(project.ngaybatdau) : null
                const projectEnd = project.ngayketthuc ? new Date(project.ngayketthuc) : null

                if (projectStart && taskStart && taskStart < projectStart) {
                    showWarning('Ngày bắt đầu của công việc phải lớn hơn hoặc bằng ngày bắt đầu của dự án!')
                    return
                }
                if (projectEnd && taskEnd && taskEnd > projectEnd) {
                    showWarning('Ngày kết thúc của công việc phải nhỏ hơn hoặc bằng ngày kết thúc của dự án!')
                    return
                }
            } catch (error) {
                console.error('Error fetching project:', error)
            }
        }

        try {
            await updateTask(editingTask.id, {
                tentask: editTaskForm.name,
                mota: editTaskForm.description,
                mucDoUuTien: editTaskForm.priority,
                ngayBatDau: editTaskForm.startDate,
                ngayKetThuc: editTaskForm.dueDate
            })

            showSuccess('Cập nhật công việc thành công!')
            setShowEditTaskModal(false)
            setEditingTask(null)
            loadTasks()
        } catch (error: any) {
            console.error('Update task error:', error)
            showError(error.response?.data?.message || 'Lỗi khi cập nhật công việc!')
        }
    }

    const openEditSubtaskModal = (subtask: any) => {
        loadGroupMembersForTask(selectedTask, subtask?.nguoiThucHien)
        const assigneeId = subtask?.nguoiThucHienId ?? subtask?.nguoiThucHien?.id ?? ''
        console.log('Open edit subtask modal assigneeId:', assigneeId, 'subtask:', subtask)

        setEditingSubtask(subtask)
        setEditSubtaskForm({
            tenSubtask: subtask.tenSubtask || '',
            mota: subtask.mota || '',
            ngayBatDau: subtask.ngayBatDau ? new Date(subtask.ngayBatDau).toISOString().split('T')[0] : '',
            ngayKetThuc: subtask.ngayKetThuc ? new Date(subtask.ngayKetThuc).toISOString().split('T')[0] : '',
            nguoiThucHienId: assigneeId ? String(assigneeId) : '',
            ghiChu: subtask.ghiChu || ''
        })
        setShowEditSubtaskModal(true)
    }

    const handleUpdateSubtask = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!editingSubtask || !selectedTask) return

        // Validate
        if (!editSubtaskForm.tenSubtask.trim()) {
            showError('Vui lòng nhập tên công việc con')
            return
        }

        if (!editSubtaskForm.nguoiThucHienId) {
            showError('Vui lòng chọn người thực hiện')
            return
        }

        try {
            const payload = {
                tenSubtask: editSubtaskForm.tenSubtask,
                mota: editSubtaskForm.mota || null,
                ngayBatDau: editSubtaskForm.ngayBatDau || null,
                ngayKetThuc: editSubtaskForm.ngayKetThuc || null,
                nguoiThucHienId: parseInt(editSubtaskForm.nguoiThucHienId),
                ghiChu: editSubtaskForm.ghiChu || null
            }

            await api.put(`/tasks/${selectedTask.id}/subtasks/${editingSubtask.id}`, payload)
            showSuccess('Cập nhật công việc con thành công!')
            setShowEditSubtaskModal(false)
            setEditingSubtask(null)

            // Reload tasks and update selected task
            await loadTasks()

            if (selectedTask) {
                try {
                    const subtaskRes = await api.get(`/tasks/${selectedTask.id}/subtasks`)
                    const updatedTask = {
                        ...selectedTask,
                        subtasks: subtaskRes.data.subtasks || subtaskRes.data || []
                    }
                    setSelectedTask(updatedTask)
                } catch (error) {
                    console.error('Error reloading subtasks:', error)
                }
            }
        } catch (error: any) {
            console.error('Update subtask error:', error)
            showError(error.response?.data?.message || 'Lỗi khi cập nhật công việc con!')
        }
    }

    const handleDeleteSubtask = async (subtaskId: number) => {
        if (!selectedTask) return

        const confirmed = await showConfirm('Bạn có chắc muốn xóa công việc con này?')
        if (!confirmed) return

        try {
            await api.delete(`/tasks/${selectedTask.id}/subtasks/${subtaskId}`)
            showSuccess('Xóa công việc con thành công!')

            // Reload tasks and update selected task
            await loadTasks()

            if (selectedTask) {
                try {
                    const subtaskRes = await api.get(`/tasks/${selectedTask.id}/subtasks`)
                    const updatedTask = {
                        ...selectedTask,
                        subtasks: subtaskRes.data.subtasks || subtaskRes.data || []
                    }
                    setSelectedTask(updatedTask)
                } catch (error) {
                    console.error('Error reloading subtasks:', error)
                }
            }
        } catch (error: any) {
            console.error('Delete subtask error:', error)
            showError(error.response?.data?.message || 'Lỗi khi xóa công việc con!')
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
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý công việc chính</h1>
                    <p className="text-gray-600 mt-1">Quản lý các công việc lớn và tạo công việc nhỏ cho nhóm</p>
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

            {/* Unassigned Tasks Section - Available to Claim */}
            {unassignedTasks.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200 bg-blue-50">
                    <div className="p-6 border-b border-blue-300 bg-blue-100">
                        <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                            <Hand className="w-6 h-6" />
                            Công việc chưa ai nhận ({unassignedTasks.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-blue-200">
                        {unassignedTasks.map(task => (
                            <div key={task.id} className="p-6 hover:bg-blue-100 transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                                <Folder className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{task.tentask}</h3>
                                                {task.mota && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">{task.mota}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                                            <span className="px-3 py-1 rounded-lg font-semibold bg-blue-200 text-blue-900">
                                                Chưa giao
                                            </span>
                                            {task.mucDoUuTien && (
                                                <span className={`px-3 py-1 rounded-lg font-semibold ${getPriorityColor(task.mucDoUuTien)}`}>
                                                    {getPriorityLabel(task.mucDoUuTien)}
                                                </span>
                                            )}
                                            <span className="text-gray-600">
                                                <span className="font-semibold">Tạo bởi:</span> {task.nguoiGiao?.hoten || 'Quản lý'}
                                            </span>
                                            {task.ngayKetThuc && (
                                                <span className="text-gray-600">
                                                    <span className="font-semibold">Hạn chót:</span> {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                        {task.duan && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-semibold">Dự án:</span> {task.duan?.tenduan}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleClaimTask(task)}
                                        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors flex items-center gap-2 flex-shrink-0"
                                    >
                                        <Hand className="w-4 h-4" />
                                        Yêu cầu nhận
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Assignments Section */}
            {pendingAssignments.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-amber-200 bg-amber-50">
                    <div className="p-6 border-b border-amber-300 bg-amber-100">
                        <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6" />
                            Công việc chờ xác nhận ({pendingAssignments.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-amber-200">
                        {pendingAssignments.map(assignment => (
                            <div key={assignment.id} className="p-6 hover:bg-amber-100 transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                                <Folder className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{assignment.task?.tentask}</h3>
                                                {assignment.task?.moTa && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">{assignment.task?.moTa}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                                            <span className="px-3 py-1 rounded-lg font-semibold bg-amber-200 text-amber-900">
                                                Chờ xác nhận
                                            </span>
                                            {assignment.task?.mucDoUuTien && (
                                                <span className={`px-3 py-1 rounded-lg font-semibold ${getPriorityColor(assignment.task?.mucDoUuTien)}`}>
                                                    {getPriorityLabel(assignment.task?.mucDoUuTien)}
                                                </span>
                                            )}
                                            <span className="text-gray-600">
                                                <span className="font-semibold">Giao bởi:</span> {assignment.task?.user?.hoVaTen || 'Quản lý'}
                                            </span>
                                            {assignment.task?.hanChot && (
                                                <span className="text-gray-600">
                                                    <span className="font-semibold">Hạn chót:</span> {new Date(assignment.task?.hanChot).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                        {assignment.task?.duAn && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-semibold">Dự án:</span> {assignment.task?.duAn?.tenDuAn}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleAcceptAssignment(assignment.id)}
                                            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors flex items-center gap-2"
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                            Chấp nhận
                                        </button>
                                        <button
                                            onClick={() => handleDeclineAssignment(assignment.id)}
                                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2"
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                            Từ chối
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                                            {/* Hiển thị người thực hiện hoặc trạng thái chờ xác nhận */}
                                            {(() => {
                                                // Kiểm tra xem có assignment pending không
                                                const hasPendingAssignment = task.assignments?.some(
                                                    (a: any) => a.status === 'pending'
                                                )

                                                if (hasPendingAssignment) {
                                                    // Hiển thị trạng thái "Đang chờ xác nhận"
                                                    return (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                                                            <Clock className="w-4 h-4" />
                                                            Đang chờ xác nhận
                                                        </span>
                                                    )
                                                } else if (task.nguoiThucHien) {
                                                    // Hiển thị tên người thực hiện khi đã chấp nhận
                                                    return (
                                                        <span className="flex items-center gap-1.5 text-gray-700">
                                                            <Users className="w-4 h-4" />
                                                            {task.nguoiThucHien.hoten}
                                                        </span>
                                                    )
                                                }
                                                return null
                                            })()}
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
                                            onClick={() => openEditTaskModal(task)}
                                            className="p-2 hover:bg-yellow-100 text-yellow-600 rounded-lg transition-all"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit size={18} />
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

                                    {/* Assignee - Hiển thị người thực hiện hoặc trạng thái chờ xác nhận */}
                                    {(() => {
                                        const hasPendingAssignment = selectedTask.assignments?.some(
                                            (a: any) => a.status === 'pending'
                                        )

                                        if (hasPendingAssignment) {
                                            return (
                                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                                    <label className="text-sm font-medium text-gray-500 mb-3 block flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        Người thực hiện
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                                                            <Clock className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">Đang chờ xác nhận</p>
                                                            <p className="text-sm text-gray-600">Đã gửi đến: {selectedTask.assignments?.find((a: any) => a.status === 'pending')?.assignedUser?.hoten || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        } else if (selectedTask.nguoiThucHien) {
                                            return (
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
                                            )
                                        }
                                        return null
                                    })()}

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

                                    {/* Worklog and Comment sections for Task - Always visible */}
                                    <div className="mt-4 pt-4 border-t border-gray-200 bg-blue-50 rounded-lg p-4">
                                        <WorklogTask taskId={selectedTask.id} taskStatus={selectedTask.trangThai} />
                                    </div>
                                    <div className="mt-4 bg-purple-50 rounded-lg p-4">
                                        <CommentTask taskId={selectedTask.id} taskStatus={selectedTask.trangThai} />
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
                                    onChange={(e) => setSubtaskFormData({ ...subtaskFormData, tenSubtask: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                    placeholder="Nhập tên công việc con..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                                <textarea
                                    value={subtaskFormData.mota}
                                    onChange={(e) => setSubtaskFormData({ ...subtaskFormData, mota: e.target.value })}
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
                                        onChange={(e) => setSubtaskFormData({ ...subtaskFormData, ngayBatDau: e.target.value })}
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
                                        onChange={(e) => setSubtaskFormData({ ...subtaskFormData, ngayKetThuc: e.target.value })}
                                        min={subtaskFormData.ngayBatDau || selectedTask.ngayBatDau || undefined}
                                        max={selectedTask.ngayKetThuc || undefined}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Người thực hiện <span className="text-gray-400 text-xs">(Tùy chọn)</span>
                                </label>
                                <select
                                    value={subtaskFormData.nguoiThucHienId}
                                    onChange={(e) => setSubtaskFormData({ ...subtaskFormData, nguoiThucHienId: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none bg-white"
                                >
                                    <option value="">Không chọn - Member tự nhận sau</option>
                                    {groupMembers.map(member => (
                                        <option key={member.id} value={String(member.id)}>
                                            {member.hoten} ({member.manv})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Nếu chọn người: Nhân viên sẽ nhận thông báo. Nếu không: Member có thể tự nhận việc
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                <textarea
                                    value={subtaskFormData.ghiChu}
                                    onChange={(e) => setSubtaskFormData({ ...subtaskFormData, ghiChu: e.target.value })}
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
                        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50">
                            {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedTask.subtasks.map((subtask: any, index: number) => (
                                        <div
                                            key={subtask.id}
                                            className="group bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Number Badge */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                        <span className="text-white font-bold text-lg">#{index + 1}</span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Title */}
                                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                                        {subtask.tenSubtask}
                                                    </h3>

                                                    {/* Description */}
                                                    {subtask.mota && (
                                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                                                            {subtask.mota}
                                                        </p>
                                                    )}

                                                    {/* Info Tags */}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        {/* Status Badge */}
                                                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${subtask.trangThai === 'Hoàn thành' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                                                            subtask.trangThai === 'Đang chạy' ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
                                                                subtask.trangThai === 'Chờ xác nhận hoàn thành' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                                                                    'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                                                            }`}>
                                                            {subtask.trangThai}
                                                        </div>

                                                        {/* Assignee - Kiểm tra assignment status */}
                                                        {(() => {
                                                            const hasPendingAssignment = subtask.assignments?.some(
                                                                (a: any) => a.status === 'pending'
                                                            )

                                                            if (hasPendingAssignment) {
                                                                return (
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-200">
                                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                                                                            <Clock className="w-3 h-3 text-white" />
                                                                        </div>
                                                                        <span className="text-xs font-semibold text-orange-700">Đang chờ xác nhận</span>
                                                                    </div>
                                                                )
                                                            } else if (subtask.nguoiThucHien) {
                                                                return (
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                                            <Users className="w-3 h-3 text-white" />
                                                                        </div>
                                                                        <span className="text-xs font-semibold text-blue-700">{subtask.nguoiThucHien.hoten}</span>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}

                                                        {/* Due Date */}
                                                        {subtask.ngayKetThuc && (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-200">
                                                                <Calendar className="w-3 h-3 text-orange-600" />
                                                                <span className="text-xs font-semibold text-orange-700">
                                                                    {new Date(subtask.ngayKetThuc).toLocaleDateString('vi-VN', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex-shrink-0 flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            closeSubtaskListModal()
                                                            openEditSubtaskModal(subtask)
                                                        }}
                                                        className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center hover:bg-yellow-100 transition-colors group/edit"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-5 h-5 text-yellow-600 group-hover/edit:scale-110 transition-transform" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteSubtask(subtask.id)
                                                        }}
                                                        className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors group/delete"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-5 h-5 text-red-600 group-hover/delete:scale-110 transition-transform" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openSubtaskDetailModal(subtask)
                                                        }}
                                                        className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors group/view"
                                                    >
                                                        <Eye className="w-5 h-5 text-indigo-500 group-hover/view:scale-110 transition-transform" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setExpandedWorklogSubtaskId(expandedWorklogSubtaskId === subtask.id ? null : subtask.id)
                                                        }}
                                                        className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors group/worklog"
                                                        title="Nhật ký công việc"
                                                    >
                                                        <ListChecks className="w-5 h-5 text-blue-600 group-hover/worklog:scale-110 transition-transform" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setExpandedCommentSubtaskId(expandedCommentSubtaskId === subtask.id ? null : subtask.id)
                                                        }}
                                                        className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center hover:bg-purple-100 transition-colors group/comment"
                                                        title="Bình luận"
                                                    >
                                                        <MessageSquare className="w-5 h-5 text-purple-600 group-hover/comment:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Worklog and Comment sections for Subtask */}
                                            {expandedWorklogSubtaskId === subtask.id && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 bg-blue-50/50 rounded-lg p-4">
                                                    <WorklogSubtask subtaskId={subtask.id} subtaskStatus={subtask.trangThai} />
                                                </div>
                                            )}
                                            {expandedCommentSubtaskId === subtask.id && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 bg-purple-50/50 rounded-lg p-4">
                                                    <CommentSubtask subtaskId={subtask.id} subtaskStatus={subtask.trangThai} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <CheckCircle2 className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có công việc con</h3>
                                    <p className="text-sm text-gray-500">Hãy tạo công việc con để bắt đầu làm việc</p>
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
                            <div className="flex gap-3">
                                {selectedTask && (
                                    <button
                                        onClick={() => {
                                            closeSubtaskListModal()
                                            openSubtaskModal(selectedTask)
                                        }}
                                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center gap-2 shadow-lg"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Tạo công việc con
                                    </button>
                                )}
                                <button
                                    onClick={closeSubtaskListModal}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Đóng
                                </button>
                            </div>
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
                                <div className={`px-3 py-2 rounded-lg font-semibold text-center ${selectedSubtask.trangThai === 'Hoàn thành' ? 'bg-green-100 text-green-700' :
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
                            <div className={`p-4 rounded-xl border ${selectedSubtask.nguoiThucHien
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-yellow-50 border-yellow-300'
                                }`}>
                                <label className="text-sm font-medium text-gray-500 mb-3 block flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Người thực hiện
                                </label>
                                {selectedSubtask.nguoiThucHien ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {selectedSubtask.nguoiThucHien.hoten.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{selectedSubtask.nguoiThucHien.hoten}</p>
                                            <p className="text-sm text-gray-500">Mã NV: {selectedSubtask.nguoiThucHien.manv}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Chờ xác nhận</p>
                                            <p className="text-sm text-gray-600">Đang chờ nhân viên chấp nhận công việc</p>
                                        </div>
                                    </div>
                                )}
                            </div>

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

            {/* Edit Task Modal */}
            {showEditTaskModal && editingTask && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Chỉnh sửa công việc</h2>
                                <p className="text-yellow-100 text-sm mt-1">Cập nhật thông tin công việc</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowEditTaskModal(false)
                                    setEditingTask(null)
                                }}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleUpdateTask} className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tên công việc *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editTaskForm.name}
                                    onChange={(e) => setEditTaskForm({ ...editTaskForm, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                                    placeholder="Nhập tên công việc"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Mô tả
                                </label>
                                <textarea
                                    value={editTaskForm.description}
                                    onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all resize-none"
                                    placeholder="Mô tả công việc"
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ngày bắt đầu
                                    </label>
                                    <input
                                        type="date"
                                        value={editTaskForm.startDate}
                                        onChange={(e) => setEditTaskForm({ ...editTaskForm, startDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ngày kết thúc
                                    </label>
                                    <input
                                        type="date"
                                        value={editTaskForm.dueDate}
                                        onChange={(e) => setEditTaskForm({ ...editTaskForm, dueDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Độ ưu tiên *
                                </label>
                                <select
                                    required
                                    value={editTaskForm.priority}
                                    onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                                >
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditTaskModal(false)
                                        setEditingTask(null)
                                    }}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Subtask Modal */}
            {showEditSubtaskModal && editingSubtask && (
                <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleUpdateSubtask}>
                            {/* Modal Header */}
                            <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Edit className="w-7 h-7 text-yellow-600" />
                                    Chỉnh sửa công việc con
                                </h2>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên công việc con <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editSubtaskForm.tenSubtask}
                                        onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, tenSubtask: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                                        placeholder="Nhập tên công việc con..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                                    <textarea
                                        value={editSubtaskForm.mota}
                                        onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, mota: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all resize-none"
                                        placeholder="Nhập mô tả công việc..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                                        <input
                                            type="date"
                                            value={editSubtaskForm.ngayBatDau}
                                            onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, ngayBatDau: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                                        <input
                                            type="date"
                                            value={editSubtaskForm.ngayKetThuc}
                                            onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, ngayKetThuc: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Người thực hiện <span className="text-gray-400 text-xs">(Tùy chọn)</span>
                                    </label>
                                    <select
                                        value={editSubtaskForm.nguoiThucHienId}
                                        onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, nguoiThucHienId: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                                        required
                                    >
                                        <option value="">-- Chọn người thực hiện --</option>
                                        {groupMembers.map((member: any) => (
                                            <option key={member.id} value={String(member.id)}>
                                                {member.hoten} ({member.manv})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Nhân viên sẽ nhận thông báo nếu thay đổi người thực hiện
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                    <textarea
                                        value={editSubtaskForm.ghiChu}
                                        onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, ghiChu: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all resize-none"
                                        placeholder="Nhập ghi chú..."
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditSubtaskModal(false)
                                        setEditingSubtask(null)
                                        setShowSubtaskListModal(true)
                                    }}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Quay lại
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditSubtaskModal(false)
                                            setEditingSubtask(null)
                                        }}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all font-medium"
                                    >
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Claim Task Modal */}
            {showClaimModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Hand className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-bold text-gray-900">Xác nhận nhận công việc</h2>
                        </div>
                        <div className="mb-6">
                            <p className="text-gray-600 mb-3">Bạn muốn nhận công việc này?</p>
                            {claimTaskDetails && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p className="font-semibold text-gray-900 mb-2">{claimTaskDetails.tentask}</p>
                                    {claimTaskDetails.mota && (
                                        <p className="text-sm text-gray-600 line-clamp-2">{claimTaskDetails.mota}</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowClaimModal(false)
                                    setClaimTaskId(null)
                                    setClaimTaskDetails(null)
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleClaimTaskConfirm}
                                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                            >
                                Xác nhận nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decline Assignment Modal */}
            {showDeclineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <ThumbsDown className="w-6 h-6 text-red-600" />
                            <h2 className="text-xl font-bold text-gray-900">Từ chối công việc</h2>
                        </div>
                        <p className="text-gray-600 mb-4">Vui lòng cho biết lý do từ chối công việc này:</p>
                        <textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Nhập lý do từ chối..."
                            rows={4}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none mb-4"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeclineModal(false)
                                    setDeclineReason('')
                                    setDeclineAssignmentId(null)
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={async () => {
                                    if (declineAssignmentId) {
                                        await handleDeclineAssignmentConfirm(declineAssignmentId)
                                    }
                                }}
                                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                            >
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
