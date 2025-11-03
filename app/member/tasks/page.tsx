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

interface Task {
    id: number
    title: string
    description?: string
    status: "Chưa bắt đầu" | "Đang chạy" | "Hoàn thành"
    priority: "low" | "medium" | "high"
    deadline?: string
    startDate?: string
    project: string
    type: "task" | "subtask"
    parentTask?: string
    progress?: number
    assignedBy?: string
}

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")
    const [projectFilter, setProjectFilter] = useState<string>("all")
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    useEffect(() => {
        loadTasks()
    }, [])

    const loadTasks = async () => {
        try {
            // Mock data for now
            const mockTasks: Task[] = [
                {
                    id: 1,
                    title: "Thiết kế UI Dashboard",
                    description: "Tạo wireframe và mockup cho trang dashboard admin",
                    status: "Đang chạy",
                    priority: "high",
                    deadline: "2025-11-05",
                    startDate: "2025-11-01",
                    project: "Hệ thống quản lý",
                    type: "task",
                    progress: 75,
                    assignedBy: "Nguyễn Văn A"
                },
                {
                    id: 2,
                    title: "Code API endpoints",
                    description: "Phát triển RESTful API cho module user management",
                    status: "Chưa bắt đầu",
                    priority: "medium",
                    deadline: "2025-11-07",
                    startDate: "2025-11-04",
                    project: "Hệ thống quản lý",
                    type: "task",
                    progress: 0,
                    assignedBy: "Trần Thị B"
                },
                {
                    id: 3,
                    title: "Viết unit tests",
                    description: "Tạo test cases cho các API đã phát triển",
                    status: "Hoàn thành",
                    priority: "low",
                    deadline: "2025-11-03",
                    project: "Hệ thống quản lý",
                    type: "subtask",
                    parentTask: "Code API endpoints",
                    progress: 100,
                    assignedBy: "Trần Thị B"
                },
                {
                    id: 4,
                    title: "Setup CI/CD pipeline",
                    description: "Cấu hình automated deployment với GitHub Actions",
                    status: "Đang chạy",
                    priority: "high",
                    deadline: "2025-11-06",
                    startDate: "2025-11-02",
                    project: "DevOps",
                    type: "task",
                    progress: 40,
                    assignedBy: "Lê Văn C"
                }
            ]
            setTasks(mockTasks)
        } catch (error) {
            console.error("Error loading tasks:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Hoàn thành": return "text-green-600 bg-green-100"
            case "Đang chạy": return "text-blue-600 bg-blue-100"
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

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.project.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || task.status === statusFilter
        const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
        const matchesProject = projectFilter === "all" || task.project === projectFilter

        return matchesSearch && matchesStatus && matchesPriority && matchesProject
    })

    const projects = Array.from(new Set(tasks.map(task => task.project)))

    const updateTaskStatus = (taskId: number, newStatus: string) => {
        setTasks(tasks.map(task =>
            task.id === taskId
                ? { ...task, status: newStatus as any }
                : task
        ))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải công việc...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Công việc của tôi</h1>
                    <p className="text-gray-600">Quản lý và theo dõi tiến độ công việc được giao</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tổng số</p>
                                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Đang làm</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {tasks.filter(t => t.status === "Đang chạy").length}
                                </p>
                            </div>
                            <Play className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {tasks.filter(t => t.status === "Hoàn thành").length}
                                </p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Quá hạn</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {tasks.filter(t => {
                                        if (!t.deadline || t.status === "Hoàn thành") return false
                                        return getDaysUntilDeadline(t.deadline)! < 0
                                    }).length}
                                </p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
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
                                <option key={project} value={project}>{project}</option>
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
                                            {task.startDate && (
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <span>Bắt đầu: {new Date(task.startDate).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            )}
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
                                            {task.assignedBy && (
                                                <span>Giao bởi: {task.assignedBy}</span>
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
                                                onClick={() => updateTaskStatus(task.id, "Đang chạy")}
                                                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                                            >
                                                <Play className="w-4 h-4" />
                                                Bắt đầu
                                            </button>
                                        )}
                                        {task.status === "Đang chạy" && (
                                            <>
                                                <button
                                                    onClick={() => updateTaskStatus(task.id, "Chưa bắt đầu")}
                                                    className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                                                >
                                                    <Pause className="w-4 h-4" />
                                                    Tạm dừng
                                                </button>
                                                <button
                                                    onClick={() => updateTaskStatus(task.id, "Hoàn thành")}
                                                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Hoàn thành
                                                </button>
                                            </>
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
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Task Detail Modal */}
                {isDetailModalOpen && selectedTask && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Chi tiết công việc</h2>
                                    <button
                                        onClick={() => setIsDetailModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {selectedTask.type === 'subtask' ? '• ' : ''}{selectedTask.title}
                                    </h3>
                                    {selectedTask.description && (
                                        <p className="text-gray-600">{selectedTask.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTask.status)}`}>
                                            {selectedTask.status}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Độ ưu tiên</label>
                                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTask.priority)}`}>
                                            {getPriorityLabel(selectedTask.priority)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                                        <p className="mt-1 text-gray-900">
                                            {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Deadline</label>
                                        <p className="mt-1 text-gray-900">
                                            {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Dự án</label>
                                    <p className="mt-1 text-gray-900">{selectedTask.project}</p>
                                </div>

                                {selectedTask.assignedBy && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Được giao bởi</label>
                                        <p className="mt-1 text-gray-900">{selectedTask.assignedBy}</p>
                                    </div>
                                )}

                                {selectedTask.progress !== undefined && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Tiến độ</label>
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-gray-600">Hoàn thành</span>
                                                <span className="text-sm font-medium text-gray-900">{selectedTask.progress}%</span>
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

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Thêm comment
                                    </button>
                                    <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                        <Paperclip className="w-4 h-4" />
                                        Đính kèm file
                                    </button>
                                    <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Log thời gian
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}