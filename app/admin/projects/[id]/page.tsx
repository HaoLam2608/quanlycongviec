"use client"
import { useState } from "react"
import type React from "react"

import { useParams } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Users,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Plus,
    ListTodo,
    UsersRound,
    ChevronRight,
    User,
} from "lucide-react"
import Modal from "@/components/admin/Modal"

export default function ProjectDetailPage() {
    const { id } = useParams()
    const [activeTab, setActiveTab] = useState<"tasks" | "teams">("tasks")
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
    const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [taskFormData, setTaskFormData] = useState({
        name: "",
        description: "",
        assigneeId: "",
        priority: "medium",
        dueDate: "",
    })
    const [subtaskFormData, setSubtaskFormData] = useState({
        name: "",
        description: "",
        assigneeId: "",
        status: "Chưa bắt đầu",
    })

    const project = {
        id,
        name: "Hệ thống CRM",
        manager: "Nguyễn Văn A",
        startDate: "01/01/2025",
        endDate: "30/06/2025",
        description: "Xây dựng hệ thống quản lý quan hệ khách hàng toàn diện",
    }

    const teams = [
        {
            id: "TEAM001",
            name: "Frontend Team",
            color: "from-blue-500 to-indigo-600",
            members: [
                { id: "EMP001", name: "Nguyễn Văn B", role: "Frontend Lead", avatar: "B" },
                { id: "EMP002", name: "Trần Thị C", role: "Frontend Dev", avatar: "C" },
                { id: "EMP003", name: "Lê Văn D", role: "Frontend Dev", avatar: "D" },
            ],
        },
        {
            id: "TEAM002",
            name: "Backend Team",
            color: "from-green-500 to-emerald-600",
            members: [
                { id: "EMP004", name: "Phạm Văn E", role: "Backend Lead", avatar: "E" },
                { id: "EMP005", name: "Hoàng Thị F", role: "Backend Dev", avatar: "F" },
            ],
        },
        {
            id: "TEAM003",
            name: "Design Team",
            color: "from-purple-500 to-pink-600",
            members: [
                { id: "EMP006", name: "Vũ Thị G", role: "UI/UX Lead", avatar: "G" },
                { id: "EMP007", name: "Đỗ Văn H", role: "UI/UX Designer", avatar: "H" },
            ],
        },
    ]

    const tasks = [
        {
            id: "T001",
            name: "Phân tích yêu cầu",
            description: "Thu thập và phân tích yêu cầu từ khách hàng, xác định phạm vi dự án",
            assignee: "Nguyễn Văn B",
            assigneeId: "EMP001",
            status: "Hoàn thành",
            priority: "high",
            dueDate: "15/01/2025",
            subtasks: [
                {
                    id: "ST001",
                    name: "Họp với khách hàng",
                    assignee: "Nguyễn Văn B",
                    assigneeId: "EMP001",
                    status: "Hoàn thành",
                },
                {
                    id: "ST002",
                    name: "Viết tài liệu yêu cầu",
                    assignee: "Trần Thị C",
                    assigneeId: "EMP002",
                    status: "Hoàn thành",
                },
                {
                    id: "ST003",
                    name: "Review và phê duyệt",
                    assignee: "Nguyễn Văn B",
                    assigneeId: "EMP001",
                    status: "Hoàn thành",
                },
            ],
        },
        {
            id: "T002",
            name: "Thiết kế Database",
            description: "Thiết kế cấu trúc cơ sở dữ liệu, quan hệ giữa các bảng",
            assignee: "Phạm Văn E",
            assigneeId: "EMP004",
            status: "Đang chạy",
            priority: "high",
            dueDate: "20/01/2025",
            subtasks: [
                { id: "ST004", name: "Vẽ ERD diagram", assignee: "Phạm Văn E", assigneeId: "EMP004", status: "Hoàn thành" },
                {
                    id: "ST005",
                    name: "Tạo migration scripts",
                    assignee: "Hoàng Thị F",
                    assigneeId: "EMP005",
                    status: "Đang chạy",
                },
                {
                    id: "ST006",
                    name: "Seed dữ liệu mẫu",
                    assignee: "Hoàng Thị F",
                    assigneeId: "EMP005",
                    status: "Chưa bắt đầu",
                },
            ],
        },
        {
            id: "T003",
            name: "Xây dựng API",
            description: "Phát triển các API endpoints cho hệ thống",
            assignee: "Hoàng Thị F",
            assigneeId: "EMP005",
            status: "Đang chạy",
            priority: "medium",
            dueDate: "30/01/2025",
            subtasks: [
                { id: "ST007", name: "API Authentication", assignee: "Hoàng Thị F", assigneeId: "EMP005", status: "Đang chạy" },
                {
                    id: "ST008",
                    name: "API User Management",
                    assignee: "Phạm Văn E",
                    assigneeId: "EMP004",
                    status: "Chưa bắt đầu",
                },
                {
                    id: "ST009",
                    name: "API Customer Management",
                    assignee: "Hoàng Thị F",
                    assigneeId: "EMP005",
                    status: "Chưa bắt đầu",
                },
            ],
        },
        {
            id: "T004",
            name: "Thiết kế UI/UX",
            description: "Thiết kế giao diện người dùng và trải nghiệm sử dụng",
            assignee: "Vũ Thị G",
            assigneeId: "EMP006",
            status: "Chưa bắt đầu",
            priority: "medium",
            dueDate: "25/01/2025",
            subtasks: [
                {
                    id: "ST010",
                    name: "Wireframe các màn hình",
                    assignee: "Vũ Thị G",
                    assigneeId: "EMP006",
                    status: "Chưa bắt đầu",
                },
                { id: "ST011", name: "Design system", assignee: "Đỗ Văn H", assigneeId: "EMP007", status: "Chưa bắt đầu" },
                {
                    id: "ST012",
                    name: "Prototype tương tác",
                    assignee: "Vũ Thị G",
                    assigneeId: "EMP006",
                    status: "Chưa bắt đầu",
                },
            ],
        },
    ]

    const allMembers = teams.flatMap((team) => team.members)

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Hoàn thành":
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 w-fit">
                        <CheckCircle2 size={12} />
                        {status}
                    </span>
                )
            case "Đang chạy":
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
                        <Clock size={12} />
                        {status}
                    </span>
                )
            case "Chưa bắt đầu":
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 w-fit">
                        <AlertCircle size={12} />
                        {status}
                    </span>
                )
            default:
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                        {status}
                    </span>
                )
        }
    }

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "high":
                return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Cao</span>
            case "medium":
                return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Trung bình</span>
            case "low":
                return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Thấp</span>
            default:
                return null
        }
    }

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("[v0] Adding task:", taskFormData)
        setIsAddTaskModalOpen(false)
        setTaskFormData({ name: "", description: "", assigneeId: "", priority: "medium", dueDate: "" })
    }

    const handleViewTaskDetail = (task: any) => {
        setSelectedTask(task)
        setIsTaskDetailModalOpen(true)
    }

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("[v0] Adding subtask:", subtaskFormData, "to task:", selectedTask?.id)
        setIsAddSubtaskModalOpen(false)
        setSubtaskFormData({ name: "", description: "", assigneeId: "", status: "Chưa bắt đầu" })
    }

    const getTaskAssignees = (task: any) => {
        const assigneeIds = new Set(task.subtasks.map((st: any) => st.assigneeId))
        return allMembers.filter((member) => assigneeIds.has(member.id))
    }

    return (
        <div className="space-y-6">
            <Link
                href="/admin/projects"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Quay lại danh sách dự án</span>
            </Link>

            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-sm font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-lg">
                                {project.id}
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">{project.name}</h1>
                        <p className="text-muted-foreground mb-3">{project.description}</p>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Users size={16} />
                            Quản lý: <span className="font-semibold text-foreground">{project.manager}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={16} />
                        <span>
                            {project.startDate} - {project.endDate}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "tasks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                            }`}
                    >
                        <ListTodo size={20} />
                        Công việc
                    </button>
                    <button
                        onClick={() => setActiveTab("teams")}
                        className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "teams" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                            }`}
                    >
                        <UsersRound size={20} />
                        Nhóm làm việc
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === "tasks" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-foreground">Danh sách công việc</h2>
                                <button
                                    onClick={() => setIsAddTaskModalOpen(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Thêm công việc
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left p-4 text-sm font-semibold text-foreground">Mã</th>
                                            <th className="text-left p-4 text-sm font-semibold text-foreground">Tên công việc</th>
                                            <th className="text-left p-4 text-sm font-semibold text-foreground">Người phụ trách</th>
                                            <th className="text-left p-4 text-sm font-semibold text-foreground">Độ ưu tiên</th>
                                            <th className="text-left p-4 text-sm font-semibold text-foreground">Hạn chót</th>
                                            <th className="text-left p-4 text-sm font-semibold text-foreground">Trạng thái</th>
                                            <th className="text-left p-4 text-sm font-semibold text-foreground">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.map((task) => (
                                            <tr
                                                key={task.id}
                                                className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                                            >
                                                <td className="p-4">
                                                    <span className="font-mono text-sm text-muted-foreground">{task.id}</span>
                                                </td>
                                                <td className="p-4 font-medium text-foreground">{task.name}</td>
                                                <td className="p-4 text-muted-foreground">{task.assignee}</td>
                                                <td className="p-4">{getPriorityBadge(task.priority)}</td>
                                                <td className="p-4 text-sm text-muted-foreground">{task.dueDate}</td>
                                                <td className="p-4">{getStatusBadge(task.status)}</td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => handleViewTaskDetail(task)}
                                                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
                                                    >
                                                        Xem chi tiết
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "teams" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-foreground mb-4">Nhóm làm việc</h2>
                            {teams.map((team) => (
                                <div key={team.id} className="bg-secondary/30 border border-border rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${team.color} flex items-center justify-center shadow-md`}
                                        >
                                            <UsersRound className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">{team.name}</h3>
                                            <p className="text-sm text-muted-foreground">{team.members.length} thành viên</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {team.members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-3 p-4 bg-card rounded-lg hover:shadow-md transition-all border border-border"
                                            >
                                                <div
                                                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${team.color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md`}
                                                >
                                                    {member.avatar}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{member.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} title="Thêm công việc mới">
                <form onSubmit={handleAddTask} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Tên công việc *</label>
                        <input
                            type="text"
                            required
                            value={taskFormData.name}
                            onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Nhập tên công việc"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Mô tả</label>
                        <textarea
                            value={taskFormData.description}
                            onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            placeholder="Mô tả công việc"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Người phụ trách *</label>
                        <select
                            required
                            value={taskFormData.assigneeId}
                            onChange={(e) => setTaskFormData({ ...taskFormData, assigneeId: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                            <option value="">Chọn người phụ trách</option>
                            {allMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name} - {member.role}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Độ ưu tiên *</label>
                            <select
                                required
                                value={taskFormData.priority}
                                onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            >
                                <option value="low">Thấp</option>
                                <option value="medium">Trung bình</option>
                                <option value="high">Cao</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Hạn chót *</label>
                            <input
                                type="date"
                                required
                                value={taskFormData.dueDate}
                                onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsAddTaskModalOpen(false)}
                            className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                        >
                            Thêm công việc
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isTaskDetailModalOpen} onClose={() => setIsTaskDetailModalOpen(false)} title="Chi tiết công việc">
                {selectedTask && (
                    <div className="space-y-6">
                        {/* Task Info */}
                        <div className="bg-secondary/30 rounded-xl p-5 space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                                        {selectedTask.id}
                                    </span>
                                    <h3 className="text-2xl font-bold text-foreground mt-2">{selectedTask.name}</h3>
                                    <p className="text-muted-foreground mt-2">{selectedTask.description}</p>
                                </div>
                                {getPriorityBadge(selectedTask.priority)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                                <div>
                                    <p className="text-sm text-muted-foreground">Người phụ trách chính</p>
                                    <p className="font-semibold text-foreground">{selectedTask.assignee}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Hạn chót</p>
                                    <p className="font-semibold text-foreground">{selectedTask.dueDate}</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-border">
                                <p className="text-sm text-muted-foreground mb-2">Trạng thái</p>
                                {getStatusBadge(selectedTask.status)}
                            </div>
                        </div>

                        {/* Assignees working on this task */}
                        <div>
                            <h4 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                <User size={18} />
                                Nhân viên tham gia ({getTaskAssignees(selectedTask).length})
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {getTaskAssignees(selectedTask).map((member) => {
                                    const team = teams.find((t) => t.members.some((m) => m.id === member.id))
                                    return (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border"
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${team?.color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md`}
                                            >
                                                {member.avatar}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground text-sm">{member.name}</p>
                                                <p className="text-xs text-muted-foreground">{member.role}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Subtasks */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <ListTodo size={18} />
                                    Công việc nhỏ ({selectedTask.subtasks.length})
                                </h4>
                                <button
                                    onClick={() => setIsAddSubtaskModalOpen(true)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-1"
                                >
                                    <Plus size={14} />
                                    Thêm
                                </button>
                            </div>

                            <div className="space-y-2">
                                {selectedTask.subtasks.map((subtask: any) => (
                                    <div
                                        key={subtask.id}
                                        className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-all"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-muted-foreground">{subtask.id}</span>
                                                <span className="font-medium text-foreground">{subtask.name}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <User size={12} />
                                                {subtask.assignee}
                                            </p>
                                        </div>
                                        <div>{getStatusBadge(subtask.status)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setIsTaskDetailModalOpen(false)}
                                className="px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isAddSubtaskModalOpen} onClose={() => setIsAddSubtaskModalOpen(false)} title="Thêm công việc nhỏ">
                <form onSubmit={handleAddSubtask} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Tên công việc nhỏ *</label>
                        <input
                            type="text"
                            required
                            value={subtaskFormData.name}
                            onChange={(e) => setSubtaskFormData({ ...subtaskFormData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Nhập tên công việc nhỏ"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Mô tả</label>
                        <textarea
                            value={subtaskFormData.description}
                            onChange={(e) => setSubtaskFormData({ ...subtaskFormData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            placeholder="Mô tả công việc nhỏ"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Người thực hiện *</label>
                        <select
                            required
                            value={subtaskFormData.assigneeId}
                            onChange={(e) => setSubtaskFormData({ ...subtaskFormData, assigneeId: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                            <option value="">Chọn người thực hiện</option>
                            {allMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name} - {member.role}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Trạng thái *</label>
                        <select
                            required
                            value={subtaskFormData.status}
                            onChange={(e) => setSubtaskFormData({ ...subtaskFormData, status: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                            <option value="Đang chạy">Đang chạy</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsAddSubtaskModalOpen(false)}
                            className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                        >
                            Thêm công việc nhỏ
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
