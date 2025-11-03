"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
    CheckSquare,
    Clock,
    Calendar,
    User,
    Plus,
    Filter,
    Search,
    Eye,
    Edit3,
    Trash2,
    AlertCircle,
    CheckCircle,
    XCircle,
    PlayCircle,
    FolderOpen,
    Users
} from "lucide-react"

interface Task {
    id: number
    name: string
    description: string
    status: "Chưa bắt đầu" | "Đang chạy" | "Hoàn thành" | "Tạm dừng"
    priority: "Thấp" | "Trung bình" | "Cao" | "Khẩn cấp"
    assignee: string
    assigneeAvatar: string
    project: string
    startDate: string
    endDate: string
    progress: number
    createdAt: string
}

export default function ManagerTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")
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
                    name: "Thiết kế UI Dashboard",
                    description: "Thiết kế giao diện dashboard cho hệ thống quản lý dự án",
                    status: "Đang chạy",
                    priority: "Cao",
                    assignee: "Nguyễn Văn A",
                    assigneeAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
                    project: "Hệ thống quản lý",
                    startDate: "2025-10-15",
                    endDate: "2025-11-10",
                    progress: 65,
                    createdAt: "2025-10-10"
                },
                {
                    id: 2,
                    name: "Phát triển API Authentication",
                    description: "Xây dựng hệ thống xác thực và phân quyền",
                    status: "Hoàn thành",
                    priority: "Khẩn cấp",
                    assignee: "Trần Thị B",
                    assigneeAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b100?w=32&h=32&fit=crop&crop=face",
                    project: "Hệ thống quản lý",
                    startDate: "2025-10-01",
                    endDate: "2025-10-30",
                    progress: 100,
                    createdAt: "2025-09-25"
                },
                {
                    id: 3,
                    name: "Testing và Debug",
                    description: "Kiểm thử và sửa lỗi cho module user management",
                    status: "Chưa bắt đầu",
                    priority: "Trung bình",
                    assignee: "Lê Văn C",
                    assigneeAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
                    project: "Mobile App",
                    startDate: "2025-11-05",
                    endDate: "2025-11-20",
                    progress: 0,
                    createdAt: "2025-10-20"
                },
                {
                    id: 4,
                    name: "Tối ưu Performance",
                    description: "Cải thiện hiệu suất và tốc độ tải trang",
                    status: "Tạm dừng",
                    priority: "Thấp",
                    assignee: "Phạm Thị D",
                    assigneeAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
                    project: "Website",
                    startDate: "2025-10-20",
                    endDate: "2025-12-01",
                    progress: 25,
                    createdAt: "2025-10-15"
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
            case "Hoàn thành": return "bg-green-100 text-green-800"
            case "Đang chạy": return "bg-blue-100 text-blue-800"
            case "Chưa bắt đầu": return "bg-gray-100 text-gray-800"
            case "Tạm dừng": return "bg-yellow-100 text-yellow-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Khẩn cấp": return "bg-red-100 text-red-800"
            case "Cao": return "bg-orange-100 text-orange-800"
            case "Trung bình": return "bg-yellow-100 text-yellow-800"
            case "Thấp": return "bg-green-100 text-green-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Hoàn thành": return <CheckCircle className="w-4 h-4" />
            case "Đang chạy": return <PlayCircle className="w-4 h-4" />
            case "Chưa bắt đầu": return <XCircle className="w-4 h-4" />
            case "Tạm dừng": return <AlertCircle className="w-4 h-4" />
            default: return <XCircle className="w-4 h-4" />
        }
    }

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.project.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || task.status === statusFilter
        const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

        return matchesSearch && matchesStatus && matchesPriority
    })

    const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === "Hoàn thành").length,
        inProgress: tasks.filter(t => t.status === "Đang chạy").length,
        pending: tasks.filter(t => t.status === "Chưa bắt đầu").length,
        paused: tasks.filter(t => t.status === "Tạm dừng").length
    }

    const openTaskDetail = (task: Task) => {
        setSelectedTask(task)
        setIsDetailModalOpen(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải danh sách nhiệm vụ...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý nhiệm vụ</h1>
                <p className="text-gray-600">Theo dõi và quản lý tất cả nhiệm vụ trong các dự án</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tổng nhiệm vụ</p>
                            <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                        </div>
                        <CheckSquare className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                            <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Đang thực hiện</p>
                            <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
                        </div>
                        <PlayCircle className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Chưa bắt đầu</p>
                            <p className="text-2xl font-bold text-gray-600">{taskStats.pending}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-gray-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tạm dừng</p>
                            <p className="text-2xl font-bold text-yellow-600">{taskStats.paused}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhiệm vụ, người thực hiện, dự án..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                            <option value="Đang chạy">Đang thực hiện</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Tạm dừng">Tạm dừng</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tất cả độ ưu tiên</option>
                            <option value="Khẩn cấp">Khẩn cấp</option>
                            <option value="Cao">Cao</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Thấp">Thấp</option>
                        </select>

                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Thêm nhiệm vụ
                        </button>
                    </div>
                </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nhiệm vụ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dự án
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Người thực hiện
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Độ ưu tiên
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tiến độ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Deadline
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{task.name}</div>
                                            <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                                                {task.description}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <FolderOpen className="w-4 h-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">{task.project}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img
                                                src={task.assigneeAvatar}
                                                alt={task.assignee}
                                                className="w-8 h-8 rounded-full mr-3"
                                            />
                                            <span className="text-sm text-gray-900">{task.assignee}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                            {getStatusIcon(task.status)}
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${task.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm text-gray-600 min-w-0">{task.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                                            {new Date(task.endDate).toLocaleDateString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openTaskDetail(task)}
                                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTasks.length === 0 && (
                    <div className="p-12 text-center">
                        <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy nhiệm vụ</h3>
                        <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                )}
            </div>

            {/* Task Detail Modal */}
            {isDetailModalOpen && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Chi tiết nhiệm vụ</h2>
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTask.name}</h3>
                                    <p className="text-gray-600">{selectedTask.description}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                                        <div className="flex items-center">
                                            <FolderOpen className="w-4 h-4 text-gray-400 mr-2" />
                                            <span>{selectedTask.project}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Người thực hiện</label>
                                        <div className="flex items-center">
                                            <img
                                                src={selectedTask.assigneeAvatar}
                                                alt={selectedTask.assignee}
                                                className="w-6 h-6 rounded-full mr-2"
                                            />
                                            <span>{selectedTask.assignee}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                                            {getStatusIcon(selectedTask.status)}
                                            {selectedTask.status}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                                            {selectedTask.priority}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                            <span>{new Date(selectedTask.startDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                            <span>{new Date(selectedTask.endDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiến độ</label>
                                    <div className="flex items-center">
                                        <div className="flex-1 bg-gray-200 rounded-full h-3 mr-4">
                                            <div
                                                className="bg-blue-600 h-3 rounded-full"
                                                style={{ width: `${selectedTask.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{selectedTask.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Đóng
                            </button>
                            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}