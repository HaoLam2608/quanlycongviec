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
import { FolderKanban } from "lucide-react"
import Modal from "@/components/admin/Modal"
import { useToastContext } from "@/components/providers/toast-provider"

import {
    getProjectById,
    updateProject,
    deleteProject, fetchDocuments, uploadDocument, deleteDocument, downloadDocument,
    getTasksByProject,
    createTask,
    createSubtask,
    updateTask,
    deleteTask,
    updateSubtask,
    deleteSubtask,
    fetchUsers
} from "@/axios/api"
import { getGroups, groupAPI } from "@/axios/adminApi"
import { useRef } from "react"
import TimelineInline from "./timeline/page"

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
        <div className={`relative ${className || ''}`} ref={dropdownRef}>
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
                <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-lg shadow-lg">
                    <div className="p-3">
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhóm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                        />
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
    // helper to format nullable date strings
    const formatDate = (d?: string) => {
        if (!d) return 'Chưa xác định'
        try {
            const dt = new Date(d)
            if (isNaN(dt.getTime())) return 'Chưa xác định'
            return dt.toLocaleDateString('vi-VN')
        } catch (e) {
            return 'Chưa xác định'
        }
    }

    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const { id } = useParams()
    const { showSuccess, showError, showWarning } = useToastContext()
    const [activeTab, setActiveTab] = useState<"tasks" | "teams" | "documents" | "timeline">("tasks")
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
    const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false)
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [projectGroups, setProjectGroups] = useState<any[]>([]);
    const [showAllAssigneesFallback, setShowAllAssigneesFallback] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadDesc, setUploadDesc] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setUploadFile(f);
    }

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) {
            alert('Vui lòng chọn file');
            return;
        }
        try {
            await uploadDocument(uploadFile, Number(id), uploadDesc);
            const docs = await fetchDocuments(Number(id));
            setDocuments(docs);
            setIsUploadOpen(false);
            setUploadFile(null);
            setUploadDesc('');
        } catch (err) {
            console.error('Lỗi upload', err);
            alert('Có lỗi khi upload tài liệu');
        }
    }

    const handleOpenDocument = async (doc: any) => {
        try {
            const { blob, filename } = await downloadDocument(doc.id, false);
            const mime = doc.mimetype || blob.type || '';
            const url = URL.createObjectURL(blob);
            // image or pdf -> open inline
            if (mime.startsWith('image/') || mime === 'application/pdf') {
                window.open(url, '_blank');
                // revoke after a bit
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            } else {
                // trigger download
                const a = document.createElement('a');
                a.href = url;
                a.download = filename || doc.originalname;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            }
        } catch (err) {
            console.error('Lỗi mở tài liệu', err);
            alert('Không thể mở tài liệu');
        }
    }

    const handleForceDownload = async (doc: any) => {
        try {
            const { blob, filename } = await downloadDocument(doc.id, true);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || doc.originalname;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (err) {
            console.error('Lỗi tải xuống', err);
            alert('Không thể tải xuống tài liệu');
        }
    }

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
        startDate: "",
    })
    const [subtaskFormData, setSubtaskFormData] = useState({
        name: "",
        description: "",
        assigneeId: "",
        startDate: "",
        endDate: "",
    })





    useEffect(() => {
        const fetchProject = async () => {
            try {
                console.log("Loading project ", id);

                const data = await getProjectById(id as string);
                console.log("Project data:", data);
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
                // load documents for project
                try {
                    const docs = await fetchDocuments(Number(id));
                    setDocuments(docs);
                } catch (err) {
                    console.error('Lỗi load tài liệu', err);
                }
                // load documents for project
                try {
                    const docs = await fetchDocuments(Number(id));
                    setDocuments(docs);
                } catch (err) {
                    console.error('Lỗi load tài liệu', err);
                }
            } catch (err) {
                console.error("Lỗi load dự án:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchTasks = async () => {
            try {
                setLoadingTasks(true);
                const tasksData = await getTasksByProject(id as string);
                console.log("Tasks data:", tasksData);
                setTasks(tasksData.tasks || []);
            } catch (err) {
                console.error("Lỗi load tasks:", err);
                setTasks([]);
            } finally {
                setLoadingTasks(false);
            }
        };

        const loadUsers = async () => {
            try {
                const usersData = await fetchUsers();
                console.log("Users data:", usersData);
                setUsers(usersData || []);
            } catch (err) {
                console.error("Lỗi load users:", err);
                setUsers([]);
            }
        };

        if (id) {
            fetchProject();
            fetchTasks();
            loadUsers();
        }
    }, [id]);


    // Lấy danh sách nhóm đã tham gia dự án này (theo group_projects)
    const loadProjectGroups = async () => {
        try {
            // Lấy tất cả nhóm
            const allGroupsRes = await getGroups();
            const allGroups = allGroupsRes.groups || [];
            // removed debug log
            // Lọc nhóm đã tham gia dự án này (theo projects - association belongsToMany)
            const projectGroups = allGroups.filter((g: any) =>
                Array.isArray(g.projects) && g.projects.some((p: any) => p.id === Number(id))
            );
            setProjectGroups(projectGroups);

            // Lọc nhóm khả dụng để thêm vào dự án:
            // - Chưa tham gia dự án này
            // - Số lượng dự án đang active < 2 (dựa vào groupProjects status)
            const availableGroups = allGroups.filter((g: any) => {
                const groupProjects = Array.isArray(g.groupProjects) ? g.groupProjects : [];
                const joinedActiveProjects = groupProjects.filter((gp: any) => gp.status === 'active').length;
                const isInThisProject = groupProjects.some((gp: any) => gp.projectId === Number(id) && gp.status === 'active');
                return !isInThisProject && joinedActiveProjects < 2;
            });
            // removed debug log
            setAvailableGroups(availableGroups);
        } catch (err) {
            console.error("Lỗi load nhóm:", err);
        }
    };

    // Gọi API thêm nhóm vào dự án (cần backend endpoint mới)
    const handleAddGroupToProject = async () => {
        if (!selectedGroupId) return;
        try {
            // Gọi API thêm bản ghi group_projects
            await groupAPI.addGroupToProject(Number(selectedGroupId), Number(id));
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


    // const allMembers = projectGroups.flatMap((group) => group.members || [])

    // Sử dụng users từ API thay vì mock data
    const allMembers = users.map(user => ({
        id: user.id,
        name: user.hoten,
        role: user.chucvu,
        avatar: user.hoten?.charAt(0)?.toUpperCase() || "U"
    }));

    // Lọc chỉ những người có role 'teamleader' để dùng cho trường 'Người phụ trách'
    const teamLeaders = users
        .filter((u: any) => u.role && (u.role.name === 'teamleader' || u.role.name === 'leader' || u.chucvu === 'Trưởng nhóm'))
        .map((user: any) => ({ id: user.id, name: user.hoten, role: user.chucvu }));

    // Helper: lấy danh sách thành viên nhóm được phân công cho task
    // Logic: nếu có task.groupId thì dùng nhóm đó; nếu không, tìm nhóm trong projectGroups mà
    // - Ưu tiên: nhóm mà mainAssignee là leader (và nhóm tham gia dự án này)
    // - Fallback: nhóm mà mainAssignee là member
    // Nếu không tìm được, trả về mảng rỗng
    const getGroupMembersForTask = (task: any): Array<{ id: any; name: string; role?: any }> => {
        if (!task) return [];

        const mainAssigneeId = task.nguoiDuocGiaoId || task.nguoiDuocGiao?.id || null;
        // removed debug log

        // Nếu task có thuộc tính groupId (nếu có), ưu tiên dùng nhóm đó
        if (task.groupId) {
            const g = projectGroups.find((grp: any) => Number(grp.id) === Number(task.groupId));
            if (g && Array.isArray(g.members) && g.members.length) {
                return g.members.map((m: any) => ({ id: m.id, name: m.hoten || m.name, role: m.chucvu || m.role }));
            }
        }

        if (mainAssigneeId) {
            // 1) Tìm nhóm trong projectGroups mà mainAssignee là leader
            const leaderGrp = projectGroups.find((g: any) => {
                // leader info may be in g.leader or g.leaderId
                if (g.leader && g.leader.id) return Number(g.leader.id) === Number(mainAssigneeId);
                if (g.leaderId) return Number(g.leaderId) === Number(mainAssigneeId);
                return false;
            });
            if (leaderGrp && Array.isArray(leaderGrp.members) && leaderGrp.members.length) {
                return leaderGrp.members.map((m: any) => ({ id: m.id, name: m.hoten || m.name, role: m.chucvu || m.role }));
            }

            // 2) Fallback: tìm nhóm nơi mainAssignee là member
            const memberGrp = projectGroups.find((g: any) => Array.isArray(g.members) && g.members.some((m: any) => Number(m.id) === Number(mainAssigneeId)));
            if (memberGrp && Array.isArray(memberGrp.members) && memberGrp.members.length) {
                return memberGrp.members.map((m: any) => ({ id: m.id, name: m.hoten || m.name, role: m.chucvu || m.role }));
            }
        }

        // removed debug log
        return [];
    }

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

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createTask({
                tentask: taskFormData.name,
                mota: taskFormData.description,
                duanId: Number(id),
                nguoiDuocGiaoId: Number(taskFormData.assigneeId),
                ngayBatDau: taskFormData.startDate,
                ngayKetThuc: taskFormData.dueDate,
                mucDoUuTien: taskFormData.priority
            });

            // Refresh tasks list
            const tasksData = await getTasksByProject(id as string);
            setTasks(tasksData.tasks || []);

            setIsAddTaskModalOpen(false);
            setTaskFormData({ name: "", description: "", assigneeId: "", priority: "medium", dueDate: "", startDate: "" });
        } catch (error) {
            console.error("Lỗi tạo task:", error);
            alert("Không thể tạo công việc. Vui lòng thử lại!");
        }
    }

    const handleViewTaskDetail = (task: any) => {
        setSelectedTask(task)
        setIsTaskDetailModalOpen(true)
    }

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (!selectedTask) return;

            // Client-side validation: start date is required
            if (!subtaskFormData.startDate) {
                alert('Vui lòng chọn ngày bắt đầu cho công việc nhỏ');
                return;
            }

            const subStart = new Date(subtaskFormData.startDate);
            if (isNaN(subStart.getTime())) {
                alert('Ngày bắt đầu không hợp lệ');
                return;
            }

            // If task has a start date, ensure subStart >= task.start
            if (selectedTask.ngayBatDau) {
                const taskStart = new Date(selectedTask.ngayBatDau);
                if (!isNaN(taskStart.getTime()) && subStart < taskStart) {
                    alert('Ngày bắt đầu của công việc nhỏ phải lớn hơn hoặc bằng ngày bắt đầu của công việc chính');
                    return;
                }
            }

            // If task has an end date, ensure subStart < task.end
            if (selectedTask.ngayKetThuc) {
                const taskEnd = new Date(selectedTask.ngayKetThuc);
                if (isNaN(taskEnd.getTime())) {
                    alert('Ngày kết thúc của công việc chính không hợp lệ');
                    return;
                }
                if (!(subStart < taskEnd)) {
                    alert('Ngày bắt đầu của công việc nhỏ phải nhỏ hơn ngày kết thúc của công việc chính');
                    return;
                }
            }

            // Sanitize payload: send null for empty date strings and ensure assigneeId is number
            const payload: any = {
                tenSubtask: subtaskFormData.name,
                mota: subtaskFormData.description,
                nguoiThucHienId: subtaskFormData.assigneeId ? Number(subtaskFormData.assigneeId) : null,
                ngayBatDau: subtaskFormData.startDate || null,
                ngayKetThuc: subtaskFormData.endDate || null
            };

            await createSubtask(selectedTask.id, payload);

            // Refresh tasks to get updated subtasks
            const tasksData = await getTasksByProject(id as string);
            setTasks(tasksData.tasks || []);

            // Update selected task
            const updatedTask = tasksData.tasks?.find((t: any) => t.id === selectedTask.id);
            if (updatedTask) {
                setSelectedTask(updatedTask);
            }

            setIsAddSubtaskModalOpen(false);
            setSubtaskFormData({ name: "", description: "", assigneeId: "", startDate: "", endDate: "" });
        } catch (error) {
            console.error("Lỗi tạo subtask:", error);
            // If backend provided details, show them to help debugging
            const errData: any = error;
            if (errData && (errData.details || errData.error || errData.message || errData.sequelizeErrors)) {
                console.error('Backend error details:', errData);
                const details = errData.details || errData.error || errData.message || (Array.isArray(errData.sequelizeErrors) ? errData.sequelizeErrors.join('; ') : undefined);
                alert('Lỗi khi tạo công việc nhỏ: ' + (details || 'Xem console để biết thêm chi tiết'));
            } else {
                alert("Không thể tạo công việc nhỏ. Vui lòng thử lại!");
            }
        }
    }

    const getTaskAssignees = (task: any) => {
        if (!task.subtasks || !Array.isArray(task.subtasks)) return [];

        const assigneeIds = new Set(task.subtasks.map((st: any) => st.nguoiThucHienId || st.nguoiThucHien?.id));
        return allMembers.filter((member) => assigneeIds.has(member.id));
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
                <div className="flex items-center justify-between mb-6">
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
                            Quản lý: <span className="font-semibold text-foreground">
                                {project?.nguoiDamNhan?.hoten || "Chưa phân công"}
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={16} />
                        <span>
                            {formatDate(project?.ngaybatdau)} - {formatDate(project?.ngayketthuc)}
                        </span>
                        <div className="flex flex-wrap gap-2">
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

            </div>

            <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                <div className="flex border-b-2 border-border">
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={`flex-1 px-6 py-5 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "tasks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
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
                    <button
                        onClick={() => { setActiveTab("timeline"); }}
                        className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "timeline" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v18M3 12h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Timeline
                    </button>
                    <button
                        onClick={() => setActiveTab("documents")}
                        className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "documents" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                            }`}
                    >
                        <FolderKanban size={20} />
                        Tài liệu
                    </button>


                </div>

                <div className="p-6 bg-gradient-to-br from-white to-gray-50">
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
                                {loadingTasks ? (
                                    <p className="text-center py-4">Đang tải danh sách công việc...</p>
                                ) : tasks.length === 0 ? (
                                    <p className="text-center py-4 text-muted-foreground">Chưa có công việc nào</p>
                                ) : (
                                    <table className="w-full table-fixed">
                                        <thead>
                                            <tr className="border-b-2 border-border bg-secondary/20">
                                                <th className="text-left p-4 text-sm font-semibold text-foreground w-20">Mã</th>
                                                <th className="text-left p-4 text-sm font-semibold text-foreground w-64">Tên công việc</th>
                                                <th className="text-left p-4 text-sm font-semibold text-foreground w-40">Người phụ trách</th>
                                                <th className="text-left p-4 text-sm font-semibold text-foreground w-28">Độ ưu tiên</th>
                                                <th className="text-left p-4 text-sm font-semibold text-foreground w-32">Tiến độ</th>
                                                <th className="text-left p-4 text-sm font-semibold text-foreground w-28">Hạn chót</th>
                                                <th className="text-left p-4 text-sm font-semibold text-foreground w-28">Trạng thái</th>
                                                <th className="text-left p-4 text-sm font-semibold text-foreground w-32">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task) => (
                                                <tr
                                                    key={task.id}
                                                    className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                                                >
                                                    <td className="p-3">
                                                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-mono text-xs font-semibold">
                                                            T-{task.id}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-medium text-foreground truncate" title={task.tentask}>
                                                            {task.tentask}
                                                        </div>
                                                        {task.mota && (
                                                            <div className="text-xs text-muted-foreground mt-1 truncate" title={task.mota}>
                                                                {task.mota}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                {task.nguoiDuocGiao?.hoten?.charAt(0) || "?"}
                                                            </div>
                                                            <div className="text-sm text-foreground truncate">
                                                                {task.nguoiDuocGiao?.hoten || "Chưa phân công"}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">{getPriorityBadge(task.mucDoUuTien)}</td>
                                                    <td className="p-3">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                                                        style={{ width: `${task.progress || 0}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-center font-medium text-muted-foreground">
                                                                {task.progress || 0}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-xs text-muted-foreground">
                                                        <div>{task.ngayBatDau ? new Date(task.ngayBatDau).toLocaleDateString('vi-VN') : '—'}</div>
                                                        <div className="font-semibold">{task.ngayKetThuc ? new Date(task.ngayKetThuc).toLocaleDateString('vi-VN') : 'Chưa xác định'}</div>
                                                    </td>
                                                    <td className="p-3">{getStatusBadge(task.trangThai)}</td>
                                                    <td className="p-3">
                                                        <button
                                                            onClick={() => handleViewTaskDetail(task)}
                                                            className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-md hover:shadow-lg"
                                                        >
                                                            Xem chi tiết
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "timeline" && (
                        <div>
                            {/* Inline timeline component */}
                            <TimelineInline params={{ id: String(id) }} />
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
                                        onClick={() => {
                                            if (project?.status !== 'chua_bat_dau' && project?.status !== 'dang_chay') return;
                                            setIsAddGroupModalOpen(true);
                                        }}
                                        className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-500/30 ${(project?.status === 'chua_bat_dau' || project?.status === 'dang_chay') ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'}`}
                                        disabled={project?.status !== 'chua_bat_dau' && project?.status !== 'dang_chay'}
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
                                                    ) : project?.status === 'dong' ? (
                                                        <div className="px-3 py-1.5 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium">
                                                            Đã hoàn thành
                                                        </div>
                                                    ) : (
                                                        <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                                                            {Array.isArray(group.groupProjects) && group.groupProjects.some((gp: any) => gp.projectId === Number(id) && gp.status === 'completed')
                                                                ? 'Đã hoàn thành'
                                                                : 'Chỉ được rời khi dự án hoàn thành'}
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

                    {activeTab === "documents" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-foreground">Tài liệu dự án</h2>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsUploadOpen(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Tải lên
                                    </button>
                                    <FolderKanban className="w-8 h-8 text-gray-400" />
                                </div>
                            </div>
                            {documents.length === 0 ? (
                                <>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có tài liệu</h3>
                                    <p className="text-muted-foreground mb-4">Tải lên tài liệu để lưu giữ tài liệu liên quan đến dự án</p>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                                            <div>
                                                <div className="font-semibold text-foreground">{doc.originalname}</div>
                                                <div className="text-sm text-muted-foreground">Uploaded by: {doc.uploader?.hoten || '—'} • {new Date(doc.createdAt).toLocaleString()}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenDocument(doc)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm">Xem / Mở</button>
                                                <button onClick={() => handleForceDownload(doc)} className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm">Tải xuống</button>
                                                <button onClick={async () => {
                                                    if (!confirm('Xóa tài liệu này?')) return;
                                                    try {
                                                        await deleteDocument(doc.id);
                                                        setDocuments(docs => docs.filter(d => d.id !== doc.id));
                                                    } catch (err) {
                                                        alert('Có lỗi khi xóa tài liệu');
                                                    }
                                                }} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm">Xóa</button>
                                            </div>
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
                            {teamLeaders.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name} - {member.role}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={taskFormData.startDate}
                                onChange={(e) => setTaskFormData({ ...taskFormData, startDate: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Hạn chót</label>
                            <input
                                type="date"
                                value={taskFormData.dueDate}
                                onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
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
                                        T-{selectedTask.id}
                                    </span>
                                    <h3 className="text-2xl font-bold text-foreground mt-2">{selectedTask.tentask}</h3>
                                    <p className="text-muted-foreground mt-2">{selectedTask.mota}</p>
                                </div>
                                {getPriorityBadge(selectedTask.mucDoUuTien)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                                <div>
                                    <p className="text-sm text-muted-foreground">Người phụ trách chính</p>
                                    <p className="font-semibold text-foreground">{selectedTask.nguoiDuocGiao?.hoten || "Chưa phân công"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Hạn chót</p>
                                    <p className="font-semibold text-foreground">
                                        {selectedTask.ngayKetThuc ? new Date(selectedTask.ngayKetThuc).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-border">
                                <p className="text-sm text-muted-foreground mb-2">Trạng thái</p>
                                {getStatusBadge(selectedTask.trangThai)}
                            </div>

                            <div className="pt-3 border-t border-border">
                                <p className="text-sm text-muted-foreground mb-2">Tiến độ</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${selectedTask.progress || 0}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">{selectedTask.progress || 0}%</span>
                                </div>
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
                                    const team = projectGroups.find((group) => group.members?.some((m: any) => m.id === member.id))
                                    return (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 shadow-md"
                                            >
                                                {mounted ? (member.avatar || (member.name?.charAt(0)?.toUpperCase() || '')) : ''}
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
                            <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <ListTodo size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-800">Công việc nhỏ</h4>
                                        <p className="text-sm text-gray-600">{selectedTask.subtasks?.length || 0} nhiệm vụ</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        // Open Add Subtask modal
                                        setShowAllAssigneesFallback(false);
                                        setIsAddSubtaskModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-md"
                                >
                                    <Plus size={16} />
                                    Thêm mới
                                </button>
                            </div>

                            <div className="space-y-4">
                                {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                                    selectedTask.subtasks.map((subtask: any) => (
                                        <div
                                            key={subtask.id}
                                            className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                                        >
                                            {/* Header với ID và tên subtask */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="inline-block px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-mono text-xs font-bold shadow-sm">
                                                            ST-{subtask.id}
                                                        </span>
                                                        <h4 className="font-bold text-gray-800 text-base">{subtask.tenSubtask}</h4>
                                                    </div>

                                                    {/* Người thực hiện */}
                                                    <div className="flex items-center gap-3 mt-3">
                                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                                                            {subtask.nguoiThucHien?.hoten?.charAt(0) || "?"}
                                                        </div>
                                                        <span className="text-gray-600 font-medium">
                                                            {subtask.nguoiThucHien?.hoten || "Chưa phân công"}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        <div>Ngày bắt đầu: {subtask.ngayBatDau ? new Date(subtask.ngayBatDau).toLocaleDateString('vi-VN') : '—'}</div>
                                                        <div>Hạn chót: {subtask.ngayKetThuc ? new Date(subtask.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}</div>
                                                    </div>
                                                </div>

                                                {/* Trạng thái badge */}
                                                <div className="ml-4">
                                                    {getStatusBadge(subtask.trangThai)}
                                                </div>
                                            </div>

                                            {/* Controls section tách riêng */}
                                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
                                                    <select
                                                        value={subtask.trangThai}
                                                        onChange={async (e) => {
                                                            try {
                                                                await updateSubtask(selectedTask.id, subtask.id, { trangThai: e.target.value });
                                                                // Refresh tasks
                                                                const tasksData = await getTasksByProject(id as string);
                                                                setTasks(tasksData.tasks || []);
                                                                // Update selected task
                                                                const updatedTask = tasksData.tasks?.find((t: any) => t.id === selectedTask.id);
                                                                if (updatedTask) {
                                                                    setSelectedTask(updatedTask);
                                                                }
                                                            } catch (error) {
                                                                console.error("Lỗi cập nhật subtask:", error);
                                                                alert("Không thể cập nhật trạng thái!");
                                                            }
                                                        }}
                                                        className="px-4 py-2 border-2 border-gray-300 rounded-xl bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm font-medium"
                                                    >
                                                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                                        <option value="Đang chạy">Đang chạy</option>
                                                        <option value="Hoàn thành">Hoàn thành</option>
                                                    </select>
                                                </div>

                                                <button
                                                    onClick={async () => {
                                                        if (confirm("Bạn có chắc muốn xóa công việc nhỏ này?")) {
                                                            try {
                                                                await deleteSubtask(selectedTask.id, subtask.id);
                                                                // Refresh tasks
                                                                const tasksData = await getTasksByProject(id as string);
                                                                setTasks(tasksData.tasks || []);
                                                                // Update selected task
                                                                const updatedTask = tasksData.tasks?.find((t: any) => t.id === selectedTask.id);
                                                                if (updatedTask) {
                                                                    setSelectedTask(updatedTask);
                                                                }
                                                            } catch (error) {
                                                                console.error("Lỗi xóa subtask:", error);
                                                                alert("Không thể xóa công việc nhỏ!");
                                                            }
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-xl font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                                                >
                                                    <span>🗑️</span>
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                            <ListTodo size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-lg font-medium mb-2">Chưa có công việc nhỏ nào</p>
                                        <p className="text-gray-400 text-sm">Nhấn "Thêm" để tạo công việc nhỏ đầu tiên</p>
                                    </div>
                                )}
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
                            {(() => {
                                const members = getGroupMembersForTask(selectedTask);
                                const useAll = showAllAssigneesFallback;
                                const optionsSource = useAll ? allMembers : members;
                                if (!optionsSource || optionsSource.length === 0) {
                                    return (
                                        <option value="" disabled>
                                            (Không có thành viên nhóm được phân công cho công việc này)
                                        </option>
                                    );
                                }
                                return optionsSource.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ));
                            })()}
                        </select>

                        {/* Nếu không có thành viên nhóm, cho phép bật fallback hiển thị tất cả users */}
                        {(!getGroupMembersForTask(selectedTask) || getGroupMembersForTask(selectedTask).length === 0) && (
                            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                                <span>(Không tìm thấy thành viên nhóm phù hợp.)</span>
                                <button
                                    type="button"
                                    onClick={() => setShowAllAssigneesFallback(true)}
                                    className="underline text-primary"
                                >
                                    Hiển thị tất cả người dùng
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={subtaskFormData.startDate}
                                onChange={(e) => setSubtaskFormData({ ...subtaskFormData, startDate: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Ngày kết thúc</label>
                            <input
                                type="date"
                                value={subtaskFormData.endDate}
                                onChange={(e) => setSubtaskFormData({ ...subtaskFormData, endDate: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
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
                        <label className="block text-base font-semibold text-foreground mb-3">Chọn nhóm làm việc *</label>
                        <div className="mb-3 flex items-center gap-2">
                            <Search className="w-5 h-5 text-muted-foreground absolute ml-3" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhóm theo tên hoặc dự án..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                            />
                        </div>
                        {availableGroups.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="mb-2 text-muted-foreground">Không có nhóm nào khả dụng.</div>
                                <Link href="/admin/groups" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all">Tạo nhóm mới</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto">
                                {availableGroups.filter(group =>
                                    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (group.duan?.tenduan || '').toLowerCase().includes(searchTerm.toLowerCase())
                                ).map(group => {
                                    // Disable nếu group đã tham gia 2 dự án (có group.projectHistory >= 2)
                                    const joinedProjects = group.projectHistory ? group.projectHistory.length : 0;
                                    const overLimit = joinedProjects >= 2;
                                    return (
                                        <label key={group.id} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${selectedGroupId == group.id ? 'border-blue-500 bg-blue-50' : 'border-border bg-background hover:bg-secondary/40'} ${overLimit ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            title={overLimit ? 'Nhóm đã tham gia 2 dự án' : ''}>
                                            <input
                                                type="radio"
                                                name="select-group"
                                                value={group.id}
                                                checked={String(selectedGroupId) === String(group.id)}
                                                onChange={() => setSelectedGroupId(String(group.id))}
                                                className="accent-blue-600 w-5 h-5"
                                                disabled={overLimit}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-lg text-foreground">{group.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {group.duan?.tenduan ? `Dự án: ${group.duan.tenduan}` : 'Chưa gán dự án'}
                                                    {' • '}{group.members?.length || 0} thành viên
                                                </div>
                                                {group.leader?.hoten && (
                                                    <div className="text-xs text-blue-700 mt-1">Trưởng nhóm: {group.leader.hoten}</div>
                                                )}
                                                {overLimit && <div className="text-xs text-red-500 mt-1">Đã tham gia 2 dự án</div>}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4 justify-center">
                        <button
                            type="button"
                            onClick={() => setIsAddGroupModalOpen(false)}
                            className="px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAddGroupToProject}
                            disabled={!selectedGroupId}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Thêm nhóm
                        </button>
                    </div>
                </div>
            </Modal>



            {/* Upload Document Modal */}
            <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Tải lên tài liệu">
                <form onSubmit={handleUploadSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">File *</label>
                        <input type="file" onChange={handleFileChange} className="w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Mô tả</label>
                        <textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsUploadOpen(false)} className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all">Hủy</button>
                        <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold">Tải lên</button>
                    </div>
                </form>
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
                                <option value="chua_bat_dau">Chưa bắt đầu</option>
                                <option value="dang_chay">Đang chạy</option>
                                <option value="da_dong">Đã đóng</option>
                                <option value="da_hoan_thanh">Hoàn thành</option>
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
