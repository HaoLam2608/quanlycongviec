"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
    Search,
    ChevronDown,
} from "lucide-react"
import Modal from "@/components/admin/Modal"
import { useToastContext } from "@/components/providers/toast-provider"

import { getProjectById, updateProject, deleteProject } from "@/axios/api"
import { getGroups, groupAPI } from "@/axios/adminApi"
import { useRef } from "react"

// SearchableSelect Component for Group Selection
interface SearchableGroupSelectProps {
    groups: any[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
}

function SearchableGroupSelect({ groups, value, onChange, placeholder, className }: SearchableGroupSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.duan?.tenduan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedGroup = groups.find(group => String(group.id) === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 text-left bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all flex items-center justify-between"
            >
                <span className={selectedGroup ? 'text-foreground' : 'text-muted-foreground'}>
                    {selectedGroup
                        ? `${selectedGroup.name} ${selectedGroup.duan?.tenduan ? `(${selectedGroup.duan.tenduan})` : '(Chưa gán dự án)'}`
                        : placeholder
                    }
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-80 overflow-hidden">
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhóm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                                setSearchTerm('');
                            }}
                            className="w-full px-4 py-3 text-left text-muted-foreground hover:bg-secondary text-sm"
                        >
                            {placeholder}
                        </button>
                        {filteredGroups.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-muted-foreground">Không tìm thấy nhóm nào</div>
                        ) : (
                            filteredGroups.map(group => (
                                <button
                                    key={group.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(String(group.id));
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-secondary text-sm border-b border-border last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Users className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-foreground">{group.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {group.duan?.tenduan || 'Chưa gán dự án'} • {group.members?.length || 0} thành viên
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProjectDetailPage() {
    const { id } = useParams()
    const { showSuccess, showError, showWarning } = useToastContext()
    const [activeTab, setActiveTab] = useState<"tasks" | "teams">("tasks")
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
    const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false)
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [projectGroups, setProjectGroups] = useState<any[]>([]);
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const router = useRouter();

    const [editForm, setEditForm] = useState({
        tenduan: "",
        mota: "",
        ngaybatdau: "",
        ngayketthuc: "",
        status: "Chưa bắt đầu",
        userId: ""
    });
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
    useEffect(() => {
        const fetchProject = async () => {
            try {
                console.log("cac ", id);

                const data = await getProjectById(id as string);
                console.log("data ", data);
                setProject(data);
                setEditForm({
                    tenduan: data.tenduan,
                    mota: data.mota,
                    ngaybatdau: data.ngaybatdau?.slice(0, 10) || "",
                    ngayketthuc: data.ngayketthuc?.slice(0, 10) || "",
                    status: data.status,
                    userId: data.userId || "",
                });

                // Load project groups
                await loadProjectGroups();
            } catch (err) {
                console.error("Lỗi load dự án:", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProject();
    }, [id]);

    const loadProjectGroups = async () => {
        try {
            const groupsRes = await getGroups({ duanId: Number(id) });
            setProjectGroups(groupsRes.groups || []);

            // Load all groups for selection
            const allGroupsRes = await getGroups();
            const otherGroups = (allGroupsRes.groups || []).filter(
                (g: any) => g.duanId !== Number(id)
            );
            setAvailableGroups(otherGroups);
        } catch (err) {
            console.error("Lỗi load nhóm:", err);
        }
    };

    const handleAddGroupToProject = async () => {
        if (!selectedGroupId) return;
        try {
            // Update group to assign to this project
            await groupAPI.updateGroup(Number(selectedGroupId), { duanId: Number(id) });
            await loadProjectGroups();
            setIsAddGroupModalOpen(false);
            setSelectedGroupId('');
            showSuccess("Thêm nhóm vào dự án thành công!");
        } catch (err: any) {
            console.error("Lỗi thêm nhóm:", err);
            const errorMessage = err.response?.data?.message || "Có lỗi khi thêm nhóm vào dự án";
            showError(errorMessage);
        }
    };


    const allMembers = teams.flatMap((team) => team.members)
    if (loading) {
        return <p className="p-4">Đang tải dữ liệu...</p>
    }

    if (!project) {
        return <p className="p-4 text-red-500">Không tìm thấy dự án</p>
    }

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
                                {id}
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">{project?.tenduan}</h1>
                        <p className="text-muted-foreground mb-3">{project?.mota}</p>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Users size={16} />
                            Quản lý: <span className="font-semibold text-foreground">{project?.userId}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={16} />
                        <span>
                            {project?.ngaybatdau} - {project?.ngayketthuc}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
                        >
                            Sửa dự án
                        </button>
                        <button
                            onClick={async () => {
                                if (confirm("Bạn có chắc muốn xoá dự án này?")) {
                                    await deleteProject(Number(id));
                                    router.push("/admin/projects");
                                }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg"
                        >
                            Xoá dự án
                        </button>
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
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-foreground">Nhóm làm việc</h2>
                                <div className="flex gap-3">
                                    <Link
                                        href="/admin/groups"
                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all flex items-center gap-2"
                                    >
                                        <Users size={18} />
                                        Quản lý nhóm
                                    </Link>
                                    <button
                                        onClick={() => setIsAddGroupModalOpen(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Thêm nhóm có sẵn
                                    </button>
                                </div>
                            </div>

                            {projectGroups.length === 0 ? (
                                <div className="text-center py-12 bg-secondary/30 rounded-xl border border-border">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <UsersRound className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có nhóm làm việc</h3>
                                    <p className="text-muted-foreground mb-4">Thêm nhóm có sẵn hoặc tạo nhóm mới để bắt đầu</p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => setIsAddGroupModalOpen(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                                        >
                                            Thêm nhóm có sẵn
                                        </button>
                                        <Link
                                            href="/admin/groups"
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all"
                                        >
                                            Tạo nhóm mới
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {projectGroups.map((group) => (
                                        <div key={group.id} className="bg-secondary/30 border border-border rounded-xl p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                                        <UsersRound className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-foreground">{group.name}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {group.members?.length || 0} thành viên
                                                            {group.leader && (
                                                                <span className="ml-2">• Leader: {group.leader.hoten}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {project?.status === 'hoan_thanh' ? (
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('Bạn có chắc muốn rời khỏi dự án đã hoàn thành này?')) {
                                                                    try {
                                                                        await groupAPI.updateGroup(group.id, { duanId: undefined });
                                                                        await loadProjectGroups();
                                                                    } catch (err: any) {
                                                                        alert(err.message || 'Có lỗi khi rời dự án');
                                                                    }
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-all"
                                                        >
                                                            Rời dự án (Đã hoàn thành)
                                                        </button>
                                                    ) : (
                                                        <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                                                            Chỉ được rời khi dự án hoàn thành
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {group.description && (
                                                <p className="text-muted-foreground mb-4 text-sm">{group.description}</p>
                                            )}

                                            {group.members && group.members.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {group.members.map((member: any) => (
                                                        <div
                                                            key={member.id}
                                                            className="flex items-center gap-3 p-4 bg-card rounded-lg hover:shadow-md transition-all border border-border"
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 shadow-md">
                                                                {member.hoten?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-foreground">{member.hoten}</p>
                                                                <p className="text-sm text-muted-foreground">{member.manv}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
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

            <Modal isOpen={isAddGroupModalOpen} onClose={() => setIsAddGroupModalOpen(false)} title="Thêm nhóm vào dự án">
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Chọn nhóm *</label>
                        <SearchableGroupSelect
                            groups={availableGroups}
                            value={selectedGroupId}
                            onChange={setSelectedGroupId}
                            placeholder="-- Chọn nhóm --"
                            className="w-full"
                        />
                        {availableGroups.length === 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Không có nhóm nào khả dụng.
                                <Link href="/admin/groups" className="text-blue-600 hover:underline ml-1">
                                    Tạo nhóm mới
                                </Link>
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsAddGroupModalOpen(false)}
                            className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAddGroupToProject}
                            disabled={!selectedGroupId}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Thêm nhóm
                        </button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Sửa dự án">
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await updateProject(Number(id), editForm);
                        const updated = await getProjectById(id as string);
                        setProject(updated);
                        setIsEditModalOpen(false);
                    }}
                    className="space-y-6"
                >
                    {/* Tên dự án + Trạng thái */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Tên dự án *</label>
                            <input
                                type="text"
                                value={editForm.tenduan}
                                onChange={(e) => setEditForm({ ...editForm, tenduan: e.target.value })}
                                placeholder="Nhập tên dự án"
                                required
                                className="h-12 w-full rounded-xl bg-white/90 border border-white/30 px-4 text-gray-900 placeholder:text-gray-500 shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Trạng thái</label>
                            <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="h-12 w-full rounded-xl bg-white/90 border border-white/30 px-4 text-gray-900 shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            >
                                <option value="chua_bat_dat">Chưa bắt đầu</option>
                                <option value="dang_chay">Đang chạy</option>
                                <option value="da_dong">Đã đóng</option>
                                <option value="hoan_thanh">Hoàn thành</option>
                            </select>
                        </div>
                    </div>

                    {/* Mô tả */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Mô tả</label>
                        <textarea
                            value={editForm.mota}
                            onChange={(e) => setEditForm({ ...editForm, mota: e.target.value })}
                            placeholder="Mô tả ngắn gọn về dự án"
                            className="min-h-28 w-full rounded-xl bg-white/90 border border-white/30 px-4 py-3 text-gray-900 placeholder:text-gray-500 shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                        />
                    </div>

                    {/* Ngày bắt đầu / kết thúc */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={editForm.ngaybatdau}
                                onChange={(e) => setEditForm({ ...editForm, ngaybatdau: e.target.value })}
                                className="h-12 w-full rounded-xl bg-white/90 border border-white/30 px-4 text-gray-900 shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Ngày kết thúc</label>
                            <input
                                type="date"
                                value={editForm.ngayketthuc}
                                onChange={(e) => setEditForm({ ...editForm, ngayketthuc: e.target.value })}
                                className="h-12 w-full rounded-xl bg-white/90 border border-white/30 px-4 text-gray-900 shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="h-12 px-5 rounded-xl border border-border bg-background text-foreground
                   hover:bg-muted transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center h-12 px-5 rounded-xl font-semibold text-white
                   bg-gradient-to-r from-orange-500 to-red-600 shadow-lg shadow-orange-500/30
                   hover:from-orange-600 hover:to-red-700 hover:shadow-orange-500/40
                   transition-all duration-300"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    )
}
