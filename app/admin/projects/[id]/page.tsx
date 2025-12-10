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
    FileText,
} from "lucide-react"
import { FolderKanban } from "lucide-react"
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import Modal from "@/components/admin/Modal"
// import EditTaskModal from "@/components/admin/EditTaskModal"
import { useToastContext } from "@/components/providers/toast-provider"
import { showConfirm, showSuccess, showError, showWarning } from "@/lib/notifications"

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
import api from "@/axios/config"
import WorklogSubtask from "@/components/worklog-subtask"
import WorklogTask from "@/components/worklog-task"
import CommentTask from "@/components/comment-task"
import CommentSubtask from "@/components/comment-subtask"
import TimelineInline from "./timeline/page"
import ProjectCalendarPage from "./calendar/page"
import ProjectReportsAdvanced from "@/components/project-reports-advanced"

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
    // Ensure there is NO stray '}' here before return
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
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
    const [editTask, setEditTask] = useState<any>(null);

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

    // ...existing code...
    // ...existing code...
    // State for edit task form
    const [editTaskForm, setEditTaskForm] = useState({
        name: "",
        description: "",
        assigneeId: "",
        priority: "medium",
        status: "Chưa bắt đầu",
        dueDate: "",
        startDate: "",
    });
    // Sync editTask to form state when opening modal
    useEffect(() => {
        if (isEditTaskModalOpen && editTask) {
            setEditTaskForm({
                name: editTask.tentask || "",
                description: editTask.mota || "",
                assigneeId: editTask.nguoiDuocGiaoId?.toString() || editTask.nguoiDuocGiao?.id?.toString() || "",
                priority: editTask.mucDoUuTien || "medium",
                status: editTask.trangThai || "Chưa bắt đầu",
                dueDate: editTask.ngayKetThuc ? editTask.ngayKetThuc.slice(0, 10) : "",
                startDate: editTask.ngayBatDau ? editTask.ngayBatDau.slice(0, 10) : "",
            });
        }
    }, [isEditTaskModalOpen, editTask]);

    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const { id } = useParams()
    const { showSuccess, showError, showWarning } = useToastContext()
    const [activeTab, setActiveTab] = useState<"tasks" | "teams" | "documents" | "timeline" | "calendar" | "kanban" | "reports">("tasks")
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
    const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false)
    const [isEditSubtaskModalOpen, setIsEditSubtaskModalOpen] = useState(false);
    const [selectedSubtask, setSelectedSubtask] = useState<any>(null);
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
    const [expandedWorklogTaskId, setExpandedWorklogTaskId] = useState<number | null>(null);

    // Pagination state for tasks
    const [taskCurrentPage, setTaskCurrentPage] = useState(1);
    const [taskTotalPages, setTaskTotalPages] = useState(1);
    const [taskTotalItems, setTaskTotalItems] = useState(0);
    const [taskItemsPerPage] = useState(10);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setUploadFile(f);
    }

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) {
            showWarning('Vui lòng chọn file');
            return;
        }
        try {
            console.log('Uploading file:', uploadFile.name, 'to project:', id);
            const result = await uploadDocument(uploadFile, Number(id), uploadDesc);
            console.log('Upload successful:', result);

            showSuccess('Tải lên tài liệu thành công!');

            const docs = await fetchDocuments(Number(id));
            setDocuments(docs.documents || docs || []);
            setIsUploadOpen(false);
            setUploadFile(null);
            setUploadDesc('');
            showSuccess('Upload tài liệu thành công');
        } catch (err) {
            console.error('Lỗi upload', err);
            showError('Có lỗi khi upload tài liệu');
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
            showError('Không thể mở tài liệu');
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
            showError('Không thể tải xuống tài liệu');
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
    const [editSubtaskForm, setEditSubtaskForm] = useState({
        name: "",
        description: "",
        assigneeId: "",
        startDate: "",
        endDate: "",
    });

    // Effect to populate edit subtask form when a subtask is selected for editing
    useEffect(() => {
        if (selectedSubtask) {
            setEditSubtaskForm({
                name: selectedSubtask.tenSubtask || "",
                description: selectedSubtask.mota || "",
                assigneeId: selectedSubtask.nguoiThucHienId?.toString() || "",
                startDate: selectedSubtask.ngayBatDau ? new Date(selectedSubtask.ngayBatDau).toISOString().slice(0, 10) : "",
                endDate: selectedSubtask.ngayKetThuc ? new Date(selectedSubtask.ngayKetThuc).toISOString().slice(0, 10) : "",
            });
        }
    }, [selectedSubtask]);





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
                    setDocuments(docs.documents || docs || []);
                } catch (err) {
                    console.error('Lỗi load tài liệu', err);
                    setDocuments([]);
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
                const response = await api.get(`/tasks/project/${id}`, {
                    params: {
                        page: taskCurrentPage,
                        limit: taskItemsPerPage
                    }
                });
                console.log("Tasks response:", response.data);

                if (response.data.tasks) {
                    setTasks(response.data.tasks);
                    if (response.data.pagination) {
                        setTaskTotalPages(response.data.pagination.pages);
                        setTaskTotalItems(response.data.pagination.total);
                    }
                } else {
                    // Fallback for old API format
                    setTasks(response.data);
                }
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

    // Reload tasks when page changes
    useEffect(() => {
        if (id && !loading) {
            const reloadTasks = async () => {
                try {
                    setLoadingTasks(true);
                    const response = await api.get(`/tasks/project/${id}`, {
                        params: {
                            page: taskCurrentPage,
                            limit: taskItemsPerPage
                        }
                    });

                    if (response.data.tasks) {
                        setTasks(response.data.tasks);
                        if (response.data.pagination) {
                            setTaskTotalPages(response.data.pagination.pages);
                            setTaskTotalItems(response.data.pagination.total);
                        }
                    } else {
                        setTasks(response.data);
                    }
                } catch (err) {
                    console.error("Lỗi reload tasks:", err);
                } finally {
                    setLoadingTasks(false);
                }
            };
            reloadTasks();
        }
    }, [taskCurrentPage]);


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
            // - Nhóm chưa đóng (status !== 'closed')
            // - Chưa tham gia dự án này
            // - Số lượng dự án chưa hoàn thành < 2 (tức là đang tham gia 0 hoặc 1 dự án chưa hoàn thành)
            const availableGroups = allGroups.filter((g: any) => {
                // 1. Loại bỏ nhóm đã đóng
                if (g.status === 'closed') {
                    console.log(`Nhóm ${g.name} (ID: ${g.id}) bị loại vì đã đóng`);
                    return false;
                }

                const groupProjects = Array.isArray(g.groupProjects) ? g.groupProjects : [];

                // 2. Kiểm tra nhóm đã tham gia dự án này chưa
                const isInThisProject = groupProjects.some((gp: any) =>
                    gp.projectId === Number(id) && gp.status === 'active'
                );
                if (isInThisProject) {
                    console.log(`Nhóm ${g.name} (ID: ${g.id}) bị loại vì đã tham gia dự án này`);
                    return false;
                }

                // 3. Đếm số dự án chưa hoàn thành mà nhóm đang tham gia
                // Sử dụng thông tin từ g.projects (belongsToMany association)
                const projects = Array.isArray(g.projects) ? g.projects : [];

                // Lọc các dự án chưa hoàn thành từ danh sách projects
                // Giả sử status của project được map từ backend (nếu có)
                // Nếu không có status trong projects, ta phải dựa vào groupProjects đang active
                const activeProjectIds = groupProjects
                    .filter((gp: any) => gp.status === 'active')
                    .map((gp: any) => gp.projectId);

                // Đếm số dự án đang active (chưa hoàn thành)
                // Vì backend không trả về status của project trong include, 
                // ta giả định các project trong groupProjects có status='active' là chưa hoàn thành
                const incompleteProjectCount = activeProjectIds.length;

                // Loại bỏ nhóm đã tham gia 2 hoặc nhiều hơn dự án chưa hoàn thành
                if (incompleteProjectCount >= 2) {
                    console.log(`Nhóm ${g.name} (ID: ${g.id}) bị loại vì đã tham gia ${incompleteProjectCount} dự án chưa hoàn thành`);
                    return false;
                }

                console.log(`Nhóm ${g.name} (ID: ${g.id}) khả dụng (${incompleteProjectCount} dự án chưa hoàn thành)`);
                return true;
            });

            console.log('Available groups after filtering:', availableGroups.map((g: any) => ({
                id: g.id,
                name: g.name,
                status: g.status,
                activeProjects: g.groupProjects?.filter((gp: any) => gp.status === 'active').length || 0
            })));
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

    // Xóa nhóm khỏi dự án
    const handleRemoveGroupFromProject = async (groupId: number) => {
        const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa nhóm này khỏi dự án?');
        if (!confirmed) return;

        try {
            await groupAPI.removeGroupFromProject(groupId, Number(id));
            await loadProjectGroups();
            showSuccess("Đã xóa nhóm khỏi dự án thành công!");
        } catch (err: any) {
            console.error("Lỗi xóa nhóm:", err);
            const errorMessage = err.response?.data?.message || "Có lỗi khi xóa nhóm khỏi dự án";
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

    // Lọc teamleader của các nhóm đã tham gia dự án (projectGroups)
    const teamLeaders = projectGroups
        .map((g: any) => g.leader)
        .filter((leader: any) => leader && leader.id)
        .reduce((acc: any[], leader: any) => {
            if (!acc.some((l) => l.id === leader.id)) acc.push({ id: leader.id, name: leader.hoten, role: leader.chucvu });
            return acc;
        }, []);

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

    const handleDeleteTask = async () => {
        const confirmed = await showConfirm('Bạn có chắc muốn xóa task này?')
        if (!confirmed) return

        try {
            await deleteTask(editTask.id)
            showSuccess('Xóa task thành công')

            // Reload tasks with pagination
            const response = await api.get(`/tasks/project/${id}`, {
                params: {
                    page: taskCurrentPage,
                    limit: taskItemsPerPage
                }
            });

            if (response.data.tasks) {
                setTasks(response.data.tasks);
                if (response.data.pagination) {
                    setTaskTotalPages(response.data.pagination.pages);
                    setTaskTotalItems(response.data.pagination.total);
                }
            }

            setIsEditTaskModalOpen(false)
            setEditTask(null)
        } catch (error: any) {
            console.error('Delete task error:', error)
            showError(error.response?.data?.message || 'Lỗi xóa task')
        }
    }

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editTask) return

        try {
            await api.put(`/tasks/${editTask.id}`, {
                tentask: editTaskForm.name,
                mota: editTaskForm.description,
                nguoiDuocGiaoId: editTaskForm.assigneeId ? Number(editTaskForm.assigneeId) : null,
                mucDoUuTien: editTaskForm.priority,
                trangThai: editTaskForm.status,
                ngayBatDau: editTaskForm.startDate,
                ngayKetThuc: editTaskForm.dueDate
            })

            showSuccess('Cập nhật công việc thành công!')

            // Reload tasks with pagination
            const response = await api.get(`/tasks/project/${id}`, {
                params: {
                    page: taskCurrentPage,
                    limit: taskItemsPerPage
                }
            });

            if (response.data.tasks) {
                setTasks(response.data.tasks);
                if (response.data.pagination) {
                    setTaskTotalPages(response.data.pagination.pages);
                    setTaskTotalItems(response.data.pagination.total);
                }
            }

            setIsEditTaskModalOpen(false)
            setEditTask(null)
        } catch (error: any) {
            console.error('Update task error:', error)
            showError(error.response?.data?.message || 'Lỗi cập nhật công việc')
        }
    }

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        // Kiểm tra ngày bắt đầu và kết thúc của task phải nằm trong khoảng ngày của dự án
        const projectStart = project?.ngaybatdau ? new Date(project.ngaybatdau) : null;
        const projectEnd = project?.ngayketthuc ? new Date(project.ngayketthuc) : null;
        const taskStart = taskFormData.startDate ? new Date(taskFormData.startDate) : null;
        const taskEnd = taskFormData.dueDate ? new Date(taskFormData.dueDate) : null;

        if (projectStart && taskStart && taskStart < projectStart) {
            showWarning('Ngày bắt đầu của công việc phải lớn hơn hoặc bằng ngày bắt đầu của dự án!');
            return;
        }
        if (projectEnd && taskEnd && taskEnd > projectEnd) {
            showWarning('Ngày kết thúc của công việc phải nhỏ hơn hoặc bằng ngày kết thúc của dự án!');
            return;
        }
        if (taskStart && taskEnd && taskStart > taskEnd) {
            showWarning('Ngày bắt đầu của công việc phải nhỏ hơn hoặc bằng ngày kết thúc!');
            return;
        }
        try {
            const createResponse = await createTask({
                tentask: taskFormData.name,
                mota: taskFormData.description,
                duanId: Number(id),
                nguoiDuocGiaoId: taskFormData.assigneeId ? Number(taskFormData.assigneeId) : null,
                ngayBatDau: taskFormData.startDate,
                ngayKetThuc: taskFormData.dueDate,
                mucDoUuTien: taskFormData.priority
            });

            // Refresh tasks list with pagination
            const response = await api.get(`/tasks/project/${id}`, {
                params: {
                    page: taskCurrentPage,
                    limit: taskItemsPerPage
                }
            });

            if (response.data.tasks) {
                setTasks(response.data.tasks);
                if (response.data.pagination) {
                    setTaskTotalPages(response.data.pagination.pages);
                    setTaskTotalItems(response.data.pagination.total);
                }
            }

            setIsAddTaskModalOpen(false);
            setTaskFormData({ name: "", description: "", assigneeId: "", priority: "medium", dueDate: "", startDate: "" });

            // Show message based on whether assignment was created
            if (createResponse?.requiresConfirmation) {
                showSuccess('Đã tạo công việc. Đang chờ người được giao xác nhận.');
            } else {
                showSuccess('Đã tạo công việc thành công!');
            }
        } catch (error) {
            console.error("Lỗi tạo task:", error);
            showError("Không thể tạo công việc. Vui lòng thử lại!");
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
                showWarning('Vui lòng chọn ngày bắt đầu cho công việc nhỏ');
                return;
            }

            const subStart = new Date(subtaskFormData.startDate);
            if (isNaN(subStart.getTime())) {
                showWarning('Ngày bắt đầu không hợp lệ');
                return;
            }

            // If task has a start date, ensure subStart >= task.start
            if (selectedTask.ngayBatDau) {
                const taskStart = new Date(selectedTask.ngayBatDau);
                if (!isNaN(taskStart.getTime()) && subStart < taskStart) {
                    showWarning('Ngày bắt đầu của công việc nhỏ phải lớn hơn hoặc bằng ngày bắt đầu của công việc chính');
                    return;
                }
            }

            // If task has an end date, ensure subStart < task.end
            if (selectedTask.ngayKetThuc) {
                const taskEnd = new Date(selectedTask.ngayKetThuc);
                if (isNaN(taskEnd.getTime())) {
                    showWarning('Ngày kết thúc của công việc chính không hợp lệ');
                    return;
                }
                if (!(subStart < taskEnd)) {
                    showWarning('Ngày bắt đầu của công việc nhỏ phải nhỏ hơn ngày kết thúc của công việc chính');
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
                showError('Lỗi khi tạo công việc nhỏ: ' + (details || 'Xem console để biết thêm chi tiết'));
            } else {
                showError("Không thể tạo công việc nhỏ. Vui lòng thử lại!");
            }
        }
    }

    const handleUpdateSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !selectedSubtask) return;

        try {
            const payload = {
                tenSubtask: editSubtaskForm.name,
                mota: editSubtaskForm.description,
                nguoiThucHienId: editSubtaskForm.assigneeId ? Number(editSubtaskForm.assigneeId) : null,
                ngayBatDau: editSubtaskForm.startDate || null,
                ngayKetThuc: editSubtaskForm.endDate || null,
            };

            await updateSubtask(selectedTask.id, selectedSubtask.id, payload);

            // Refresh data
            const tasksData = await getTasksByProject(id as string);
            setTasks(tasksData.tasks || []);

            const updatedTask = tasksData.tasks?.find((t: any) => t.id === selectedTask.id);
            if (updatedTask) {
                setSelectedTask(updatedTask);
            }

            setIsEditSubtaskModalOpen(false);
            setSelectedSubtask(null);
            showSuccess("Cập nhật công việc nhỏ thành công!");

        } catch (error) {
            console.error("Lỗi cập nhật subtask:", error);
            const errData: any = error;
            const details = errData.details || errData.error || errData.message;
            showError(`Lỗi khi cập nhật công việc nhỏ: ${details || 'Vui lòng thử lại.'}`);
        }
    };


    const getTaskAssignees = (task: any) => {
        if (!task.subtasks || !Array.isArray(task.subtasks)) return [];
        const assigneeIds = new Set(task.subtasks.map((st: any) => st.nguoiThucHienId || st.nguoiThucHien?.id));
        return allMembers.filter((member) => assigneeIds.has(member.id));
    };

    return (
        <div className="space-y-3 sm:space-y-6">
            <Link
                href="/admin/projects"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm md:text-base"
            >
                <ArrowLeft size={16} className="md:w-5 md:h-5" />
                <span>Quay lại danh sách dự án</span>
            </Link>

            <div className="bg-card border border-border rounded-lg md:rounded-2xl p-3 md:p-6 lg:p-8 shadow-sm">
                <div className="flex flex-col gap-3 md:gap-4 mb-3 md:mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <span className="text-[10px] md:text-sm font-mono text-muted-foreground bg-secondary px-2 py-0.5 md:py-1 rounded">
                                {id}
                            </span>
                        </div>
                        <h1 className="text-base md:text-2xl lg:text-3xl font-bold text-foreground mb-1 md:mb-2">{project?.tenduan}</h1>
                        <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2 line-clamp-2">{project?.mota}</p>
                        <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 md:gap-2">
                            <Users size={12} className="md:w-4 md:h-4" />
                            Quản lý: <span className="font-semibold text-foreground truncate">
                                {project?.nguoiDamNhan?.hoten || "Chưa phân công"}
                            </span>
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                            <Calendar size={12} className="md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate">
                                {formatDate(project?.ngaybatdau)} - {formatDate(project?.ngayketthuc)}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="w-full sm:w-auto px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
                            >
                                Sửa
                            </button>
                            <button
                                onClick={async () => {
                                    const confirmed = await showConfirm("Bạn có chắc muốn xoá dự án này?");
                                    if (confirmed) {
                                        await deleteProject(Number(id));
                                        router.push("/admin/projects");
                                    }
                                }}
                                className="w-full sm:w-auto px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Xoá
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <div className="bg-card border border-border rounded-lg md:rounded-2xl shadow-lg overflow-hidden">
                <div className="flex border-b-2 border-border overflow-x-auto md:overflow-x-visible">
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={`flex-shrink-0 md:flex-1 px-3 sm:px-4 md:px-2 lg:px-4 py-3 md:py-4 lg:py-5 font-semibold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap border-b-4 ${activeTab === "tasks" ? "bg-primary text-primary-foreground border-primary-foreground" : "text-muted-foreground hover:bg-secondary border-transparent"}`}>
                        <ListTodo size={16} className="md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Công việc</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("teams")}
                        className={`flex-shrink-0 md:flex-1 px-3 sm:px-4 md:px-2 lg:px-4 py-3 md:py-4 lg:py-5 font-semibold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap border-b-4 ${activeTab === "teams" ? "bg-primary text-primary-foreground border-primary-foreground" : "text-muted-foreground hover:bg-secondary border-transparent"
                            }`}
                    >
                        <UsersRound size={16} className="md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Nhóm</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab("timeline"); }}
                        className={`flex-shrink-0 md:flex-1 px-3 sm:px-4 md:px-2 lg:px-4 py-3 md:py-4 lg:py-5 font-semibold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap border-b-4 ${activeTab === "timeline" ? "bg-primary text-primary-foreground border-primary-foreground" : "text-muted-foreground hover:bg-secondary border-transparent"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v18M3 12h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span className="hidden sm:inline">Timeline</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab("calendar"); }}
                        className={`flex-shrink-0 md:flex-1 px-3 sm:px-4 md:px-2 lg:px-4 py-3 md:py-4 lg:py-5 font-semibold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap border-b-4 ${activeTab === "calendar" ? "bg-primary text-primary-foreground border-primary-foreground" : "text-muted-foreground hover:bg-secondary border-transparent"
                            }`}
                    >
                        <Calendar size={16} className="md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Calendar</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("kanban")}
                        className={`flex-shrink-0 md:flex-1 px-3 sm:px-4 md:px-2 lg:px-4 py-3 md:py-4 lg:py-5 font-semibold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap border-b-4 ${activeTab === "kanban" ? "bg-primary text-primary-foreground border-primary-foreground" : "text-muted-foreground hover:bg-secondary border-transparent"
                            }`}
                    >
                        <FolderKanban size={16} className="md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Kanban</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("documents")}
                        className={`flex-shrink-0 md:flex-1 px-3 sm:px-4 md:px-2 lg:px-4 py-3 md:py-4 lg:py-5 font-semibold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap border-b-4 ${activeTab === "documents" ? "bg-primary text-primary-foreground border-primary-foreground" : "text-muted-foreground hover:bg-secondary border-transparent"
                            }`}
                    >
                        <FolderKanban size={16} className="md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Tài liệu</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("reports")}
                        className={`flex-shrink-0 md:flex-1 px-3 sm:px-4 md:px-2 lg:px-4 py-3 md:py-4 lg:py-5 font-semibold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap border-b-4 ${activeTab === "reports" ? "bg-primary text-primary-foreground border-primary-foreground" : "text-muted-foreground hover:bg-secondary border-transparent"
                            }`}
                    >
                        <FileText size={16} className="md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Báo cáo</span>
                    </button>
                </div>

                <div className="p-3 sm:p-6 bg-gradient-to-br from-white to-gray-50">
                    {activeTab === "tasks" && (
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                                <h2 className="text-lg md:text-2xl font-bold text-foreground">Danh sách công việc</h2>
                                <button
                                    onClick={() => setIsAddTaskModalOpen(true)}
                                    className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} className="md:w-5 md:h-5" />
                                    <span>Thêm công việc</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto -mx-4 md:-mx-6">
                                {loadingTasks ? (
                                    <p className="text-center py-4 text-xs md:text-sm">Đang tải danh sách công việc...</p>
                                ) : tasks.length === 0 ? (
                                    <p className="text-center py-4 text-xs md:text-sm text-muted-foreground">Chưa có công việc nào</p>
                                ) : (
                                    <table className="w-full table-fixed text-xs md:text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-border bg-secondary/20">
                                                <th className="text-left p-4 text-sm font-semibold text-foreground w-20">Mã</th>
                                                <th className="text-left p-2 md:p-4 text-xs md:text-sm font-semibold text-foreground w-24 md:w-64">Tên</th>
                                                <th className="text-left p-2 md:p-4 text-xs md:text-sm font-semibold text-foreground w-20 md:w-40 hidden md:table-cell">Người phụ trách</th>
                                                <th className="text-left p-2 md:p-4 text-xs md:text-sm font-semibold text-foreground w-16 md:w-28 hidden lg:table-cell">Ưu tiên</th>
                                                <th className="text-left p-2 md:p-4 text-xs md:text-sm font-semibold text-foreground w-16 md:w-32 hidden lg:table-cell">Tiến độ</th>
                                                <th className="text-left p-2 md:p-4 text-xs md:text-sm font-semibold text-foreground w-16 md:w-28 hidden md:table-cell">Hạn chót</th>
                                                <th className="text-left p-2 md:p-4 text-xs md:text-sm font-semibold text-foreground w-16 md:w-28 hidden sm:table-cell">Trạng thái</th>
                                                <th className="text-left p-2 md:p-4 text-xs md:text-sm font-semibold text-foreground w-20 md:w-32">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task) => ([
                                                <tr
                                                    key={task.id}
                                                    className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                                                >
                                                    <td className="p-3">
                                                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-mono text-xs font-semibold">
                                                            T-{task.id}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 md:p-3">
                                                        <div className="font-medium text-xs md:text-sm text-foreground truncate" title={task.tentask}>
                                                            {task.tentask}
                                                        </div>
                                                        {task.mota && (
                                                            <div className="text-xs text-muted-foreground mt-1 truncate" title={task.mota}>
                                                                {task.mota}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-2 md:p-3 hidden md:table-cell">
                                                        <div className="font-medium text-xs md:text-sm text-foreground truncate" title={task.tentask}>
                                                            {task.tentask}
                                                        </div>
                                                        {task.mota && (
                                                            <div className="text-xs text-muted-foreground mt-1 truncate" title={task.mota}>
                                                                {task.mota}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-2 md:p-3 hidden md:table-cell">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                                {task.nguoiDuocGiao?.hoten?.charAt(0) || "?"}
                                                            </div>
                                                            <div className="text-xs md:text-sm text-foreground truncate hidden md:block">
                                                                {task.nguoiDuocGiao?.hoten || "Chưa phân công"}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 md:p-3 hidden lg:table-cell">{getPriorityBadge(task.mucDoUuTien)}</td>
                                                    <td className="p-2 md:p-3 hidden lg:table-cell">
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
                                                    <td className="p-2 md:p-3 text-xs text-muted-foreground hidden md:table-cell">
                                                        <div>{task.ngayBatDau ? new Date(task.ngayBatDau).toLocaleDateString('vi-VN') : '—'}</div>
                                                        <div className="font-semibold">{task.ngayKetThuc ? new Date(task.ngayKetThuc).toLocaleDateString('vi-VN') : 'Chưa xác định'}</div>
                                                    </td>
                                                    <td className="p-2 md:p-3 hidden sm:table-cell">{getStatusBadge(task.trangThai)}</td>
                                                    <td className="p-2 md:p-3">
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => handleViewTaskDetail(task)}
                                                                className="w-full px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-md hover:shadow-lg"
                                                            >
                                                                Chi tiết
                                                                <ChevronRight size={12} className="md:w-4 md:h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditTask(task); setIsEditTaskModalOpen(true); }}
                                                                className="w-full px-3 py-2 bg-yellow-400 text-white rounded-lg text-xs font-medium hover:bg-yellow-500 transition-all duration-200 flex items-center justify-center gap-1 shadow-md hover:shadow-lg"
                                                            >
                                                                Chỉnh sửa
                                                            </button>
                                                            <Modal isOpen={isEditTaskModalOpen} onClose={() => setIsEditTaskModalOpen(false)} title="Chỉnh sửa công việc">
                                                                <form
                                                                    onSubmit={async (e) => {
                                                                        e.preventDefault();
                                                                        // Kiểm tra ngày bắt đầu và kết thúc của task phải nằm trong khoảng ngày của dự án
                                                                        const projectStart = project?.ngaybatdau ? new Date(project.ngaybatdau) : null;
                                                                        const projectEnd = project?.ngayketthuc ? new Date(project.ngayketthuc) : null;
                                                                        const taskStart = editTaskForm.startDate ? new Date(editTaskForm.startDate) : null;
                                                                        const taskEnd = editTaskForm.dueDate ? new Date(editTaskForm.dueDate) : null;
                                                                        if (projectStart && taskStart && taskStart < projectStart) {
                                                                            showWarning('Ngày bắt đầu của công việc phải lớn hơn hoặc bằng ngày bắt đầu của dự án!');
                                                                            return;
                                                                        }
                                                                        if (projectEnd && taskEnd && taskEnd > projectEnd) {
                                                                            showWarning('Ngày kết thúc của công việc phải nhỏ hơn hoặc bằng ngày kết thúc của dự án!');
                                                                            return;
                                                                        }
                                                                        if (taskStart && taskEnd && taskStart > taskEnd) {
                                                                            showWarning('Ngày bắt đầu của công việc phải nhỏ hơn hoặc bằng ngày kết thúc!');
                                                                            return;
                                                                        }
                                                                        await handleUpdateTask(e);
                                                                    }}
                                                                    className="space-y-5"
                                                                >
                                                                    <div>
                                                                        <label className="block text-sm font-semibold text-foreground mb-2">Tên công việc *</label>
                                                                        <input
                                                                            type="text"
                                                                            required
                                                                            value={editTaskForm.name}
                                                                            onChange={(e) => setEditTaskForm({ ...editTaskForm, name: e.target.value })}
                                                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                                                            placeholder="Nhập tên công việc"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-semibold text-foreground mb-2">Mô tả</label>
                                                                        <textarea
                                                                            value={editTaskForm.description}
                                                                            onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                                                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                                                                            placeholder="Mô tả công việc"
                                                                            rows={3}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-semibold text-foreground mb-2">Người phụ trách *</label>
                                                                        <select
                                                                            required
                                                                            value={editTaskForm.assigneeId}
                                                                            onChange={(e) => setEditTaskForm({ ...editTaskForm, assigneeId: e.target.value })}
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
                                                                                value={editTaskForm.startDate}
                                                                                onChange={(e) => setEditTaskForm({ ...editTaskForm, startDate: e.target.value })}
                                                                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-semibold text-foreground mb-2">Hạn chót</label>
                                                                            <input
                                                                                type="date"
                                                                                value={editTaskForm.dueDate}
                                                                                onChange={(e) => setEditTaskForm({ ...editTaskForm, dueDate: e.target.value })}
                                                                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <label className="block text-sm font-semibold text-foreground mb-2">Độ ưu tiên *</label>
                                                                            <select
                                                                                required
                                                                                value={editTaskForm.priority}
                                                                                onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                                                                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                                                            >
                                                                                <option value="low">Thấp</option>
                                                                                <option value="medium">Trung bình</option>
                                                                                <option value="high">Cao</option>
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-semibold text-foreground mb-2">Trạng thái *</label>
                                                                            <select
                                                                                required
                                                                                value={editTaskForm.status}
                                                                                onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                                                                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                                                            >
                                                                                <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                                                                <option value="Đang chạy">Đang chạy</option>
                                                                                <option value="Chờ xác nhận hoàn thành">Chờ xác nhận hoàn thành</option>
                                                                                <option value="Hoàn thành">Hoàn thành</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-3 pt-4">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setIsEditTaskModalOpen(false)}
                                                                            className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                                                                        >
                                                                            Hủy
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleDeleteTask}
                                                                            className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
                                                                        >
                                                                            Xóa Task
                                                                        </button>
                                                                        <button
                                                                            type="submit"
                                                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                                                                        >
                                                                            Lưu thay đổi
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            </Modal>
                                                            <button
                                                                onClick={() => setExpandedWorklogTaskId(expandedWorklogTaskId === task.id ? null : task.id)}
                                                                className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-1 border border-slate-200"
                                                            >
                                                                Nhật ký
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>,
                                                expandedWorklogTaskId === task.id && (
                                                    <tr key={`${task.id}-worklog`} className="bg-slate-50 border-b border-border">
                                                        <td colSpan={8} className="p-0">
                                                            <div className="space-y-4 p-4">
                                                                <WorklogTask taskId={task.id} taskStatus={task.trangThai} />
                                                                <CommentTask taskId={task.id} taskStatus={task.trangThai} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            ]))}
                                        </tbody>
                                    </table>
                                )}

                                {/* Tasks Pagination */}
                                {!loadingTasks && taskTotalPages > 1 && (
                                    <div className="mt-4 md:mt-6 p-3 md:p-4 bg-card border border-border rounded-lg md:rounded-xl">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <div className="text-xs md:text-sm text-muted-foreground">
                                                Hiển thị <span className="font-medium text-foreground">{tasks.length}</span> / <span className="font-medium text-foreground">{taskTotalItems}</span> công việc
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setTaskCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={taskCurrentPage === 1}
                                                    className="px-3 py-1.5 text-xs md:text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                                >
                                                    Trước
                                                </button>

                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: Math.min(5, taskTotalPages) }, (_, i) => {
                                                        let pageNum;
                                                        if (taskTotalPages <= 5) {
                                                            pageNum = i + 1;
                                                        } else if (taskCurrentPage <= 3) {
                                                            pageNum = i + 1;
                                                        } else if (taskCurrentPage >= taskTotalPages - 2) {
                                                            pageNum = taskTotalPages - 4 + i;
                                                        } else {
                                                            pageNum = taskCurrentPage - 2 + i;
                                                        }

                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setTaskCurrentPage(pageNum)}
                                                                className={`px-3 py-1.5 text-xs md:text-sm rounded-lg transition-all font-medium ${taskCurrentPage === pageNum
                                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                                                    : 'border border-border hover:bg-secondary'
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    onClick={() => setTaskCurrentPage(prev => Math.min(taskTotalPages, prev + 1))}
                                                    disabled={taskCurrentPage === taskTotalPages}
                                                    className="px-3 py-1.5 text-xs md:text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                                >
                                                    Sau
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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

                    {activeTab === "calendar" && (
                        <div>
                            {/* Inline calendar component */}
                            <ProjectCalendarPage params={{ id: String(id) }} />
                        </div>
                    )}

                    {activeTab === "teams" && (
                        <div className="space-y-3 md:space-y-4 md:space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                                <h2 className="text-lg md:text-2xl font-bold text-foreground">Nhóm làm việc</h2>
                                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
                                    <Link
                                        href="/admin/groups"
                                        className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-gray-500 text-white rounded-lg md:rounded-xl font-semibold hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Users size={16} className="md:w-5 md:h-5" />
                                        <span>Quản lý nhóm</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            if (project?.status !== 'chua_bat_dau' && project?.status !== 'dang_chay') return;
                                            setIsAddGroupModalOpen(true);
                                        }}
                                        className={`w-full sm:w-auto px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-500/30 ${(project?.status === 'chua_bat_dau' || project?.status === 'dang_chay') ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'}`}
                                        disabled={project?.status !== 'chua_bat_dau' && project?.status !== 'dang_chay'}
                                    >
                                        <Plus size={16} className="md:w-5 md:h-5" />
                                        <span>Thêm nhóm có sẵn</span>
                                    </button>
                                </div>
                            </div>

                            {projectGroups.length === 0 ? (
                                <div className="text-center py-8 md:py-12 bg-secondary/30 rounded-lg md:rounded-xl border border-border">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                                        <UsersRound className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Chưa có nhóm làm việc</h3>
                                    <p className="text-xs md:text-sm text-muted-foreground mb-4">Thêm nhóm có sẵn hoặc tạo nhóm mới để bắt đầu</p>
                                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
                                        <button
                                            onClick={() => setIsAddGroupModalOpen(true)}
                                            className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-blue-600 text-white rounded-lg md:rounded-xl font-medium hover:bg-blue-700 transition-all"
                                        >
                                            Thêm nhóm có sẵn
                                        </button>
                                        <Link
                                            href="/admin/groups"
                                            className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-gray-600 text-white rounded-lg md:rounded-xl font-medium hover:bg-gray-700 transition-all flex items-center justify-center"
                                        >
                                            Tạo nhóm mới
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 md:space-y-4">
                                    {projectGroups.map((group) => (
                                        <div key={group.id} className="bg-secondary/30 border border-border rounded-lg md:rounded-xl p-4 md:p-6">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                                                        <UsersRound className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base md:text-xl font-bold text-foreground">{group.name}</h3>
                                                        <p className="text-xs md:text-sm text-muted-foreground">
                                                            {group.members?.length || 0} thành viên
                                                            {group.leader && (
                                                                <span className="ml-2">• Leader: {group.leader.hoten}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
                                                    {/* Nút xóa nhóm khỏi dự án */}
                                                    {(project?.status === 'chua_bat_dau' || project?.status === 'dang_chay') ? (
                                                        <button
                                                            onClick={() => handleRemoveGroupFromProject(group.id)}
                                                            className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-red-500 text-white rounded-lg md:rounded-xl font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-1 md:gap-2 shadow-md hover:shadow-lg"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            <span className="hidden sm:inline">Xóa</span>
                                                        </button>
                                                    ) : project?.status === 'da_hoan_thanh' ? (
                                                        <button
                                                            onClick={() => handleRemoveGroupFromProject(group.id)}
                                                            className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-green-100 text-green-700 rounded-lg md:rounded-xl font-semibold hover:bg-green-200 transition-all flex items-center justify-center gap-1 md:gap-2"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            <span className="hidden sm:inline">Xóa</span>
                                                        </button>
                                                    ) : (
                                                        <div className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-gray-100 text-gray-500 rounded-lg md:rounded-xl font-medium flex items-center justify-center gap-1 md:gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                            </svg>
                                                            <span className="hidden sm:inline">Đóng</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {group.description && (
                                                <p className="text-muted-foreground mb-4 text-sm">{group.description}</p>
                                            )}

                                            {group.members && group.members.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                                    {group.members.map((member: any) => (
                                                        <div
                                                            key={member.id}
                                                            className="flex items-center gap-2 md:gap-3 p-2 md:p-4 bg-card rounded-lg md:rounded-xl hover:shadow-md transition-all border border-border"
                                                        >
                                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 shadow-md text-xs md:text-sm">
                                                                {member.hoten?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-foreground text-xs md:text-sm truncate">{member.hoten}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{member.manv}</p>
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
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                                <h2 className="text-lg md:text-2xl font-bold text-foreground">Tài liệu dự án</h2>
                                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => setIsUploadOpen(true)}
                                        className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} className="md:w-5 md:h-5" />
                                        <span>Tải lên</span>
                                    </button>
                                    <FolderKanban className="hidden sm:block w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                                </div>
                            </div>
                            {documents.length === 0 ? (
                                <>
                                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Chưa có tài liệu</h3>
                                    <p className="text-xs md:text-sm text-muted-foreground mb-4">Tải lên tài liệu để lưu giữ tài liệu liên quan đến dự án</p>
                                </>
                            ) : (
                                <div className="space-y-2 md:space-y-3">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 p-3 md:p-4 bg-card border border-border rounded-lg md:rounded-xl hover:shadow-md transition-all">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-xs md:text-sm text-foreground truncate">{doc.originalname}</div>
                                                <div className="text-xs text-muted-foreground truncate">Tải bởi: {doc.uploader?.hoten || '—'} • {new Date(doc.createdAt).toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
                                                <button onClick={() => handleOpenDocument(doc)} className="flex-1 sm:flex-none px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">Xem / Mở</button>
                                                <button onClick={() => handleForceDownload(doc)} className="flex-1 sm:flex-none px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all">Tải xuống</button>
                                                <button onClick={async () => {
                                                    const confirmed = await showConfirm('Xóa tài liệu này?');
                                                    if (!confirmed) return;
                                                    try {
                                                        await deleteDocument(doc.id);
                                                        setDocuments(docs => docs.filter(d => d.id !== doc.id));
                                                    } catch (err) {
                                                        showError('Có lỗi khi xóa tài liệu');
                                                    }
                                                }} className="flex-1 sm:flex-none px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">Xóa</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {activeTab === "kanban" && (
                    <div className="p-3 md:p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 overflow-x-auto -mx-4 md:-mx-6">
                        <KanbanBoard projectId={Array.isArray(id) ? id[0] : id} />
                    </div>
                )}
                {activeTab === "reports" && project && (
                    <div className="p-3 md:p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 overflow-x-auto -mx-4 md:-mx-6">
                        <ProjectReportsAdvanced duanId={Number(id)} duanName={project.tenduan} userRole="admin" />
                    </div>
                )}
            </div>

            <Modal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} title="Thêm công việc mới">
                <form onSubmit={handleAddTask} className="space-y-3 md:space-y-5">
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Tên công việc *</label>
                        <input
                            type="text"
                            required
                            value={taskFormData.name}
                            onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                            className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Nhập tên công việc"
                        />
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Mô tả</label>
                        <textarea
                            value={taskFormData.description}
                            onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                            className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            placeholder="Mô tả công việc"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Người phụ trách</label>
                        <select
                            value={taskFormData.assigneeId}
                            onChange={(e) => setTaskFormData({ ...taskFormData, assigneeId: e.target.value })}
                            className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                            <option value="">Không gán người (để trống)</option>
                            {teamLeaders.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name} - {member.role}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">Nếu chọn người, họ sẽ phải chấp nhận/từ chối công việc</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={taskFormData.startDate}
                                onChange={(e) => setTaskFormData({ ...taskFormData, startDate: e.target.value })}
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Hạn chót</label>
                            <input
                                type="date"
                                value={taskFormData.dueDate}
                                onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Độ ưu tiên *</label>
                            <select
                                required
                                value={taskFormData.priority}
                                onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            >
                                <option value="low">Thấp</option>
                                <option value="medium">Trung bình</option>
                                <option value="high">Cao</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-4">
                        <button
                            type="button"
                            onClick={() => setIsAddTaskModalOpen(false)}
                            className="flex-1 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm bg-secondary text-foreground rounded-lg md:rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            className="flex-1 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                        >
                            Thêm công việc
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isTaskDetailModalOpen} onClose={() => setIsTaskDetailModalOpen(false)} title="Chi tiết công việc">
                {selectedTask && (
                    <div className="space-y-6">
                        <div onClick={() => setActiveTab('kanban')} className="inline-block px-3 py-2 bg-blue-600 text-white rounded-md cursor-pointer">Xem Kanban</div>
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
                            <h4 className="text-base md:text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                <User size={16} className="md:w-[18px] md:h-[18px]" />
                                Nhân viên tham gia ({getTaskAssignees(selectedTask).length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                                {getTaskAssignees(selectedTask).map((member) => {
                                    const team = projectGroups.find((group) => group.members?.some((m: any) => m.id === member.id))
                                    return (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-secondary/30 rounded-lg border border-border"
                                        >
                                            <div
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 shadow-md text-xs md:text-sm"
                                            >
                                                {mounted ? (member.avatar || (member.name?.charAt(0)?.toUpperCase() || '')) : ''}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-foreground text-xs md:text-sm truncate">{member.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Subtasks */}
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl md:rounded-2xl border border-blue-200">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                        <ListTodo size={16} className="md:w-5 md:h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-base md:text-xl font-bold text-gray-800">Công việc nhỏ</h4>
                                        <p className="text-xs md:text-sm text-gray-600">{selectedTask.subtasks?.length || 0} nhiệm vụ</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        // Open Add Subtask modal
                                        setShowAllAssigneesFallback(false);
                                        setIsAddSubtaskModalOpen(true);
                                    }}
                                    className="w-full sm:w-auto px-3 md:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-semibold hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Plus size={14} className="md:w-4 md:h-4" />
                                    Thêm mới
                                </button>
                            </div>

                            <div className="space-y-3 md:space-y-4">
                                {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                                    selectedTask.subtasks.map((subtask: any) => (
                                        <div
                                            key={subtask.id}
                                            className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-3 md:p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                                        >
                                            {/* Header với ID và tên subtask */}
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 md:mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                                        <span className="inline-block px-2 md:px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-mono text-xs font-bold shadow-sm flex-shrink-0">
                                                            ST-{subtask.id}
                                                        </span>
                                                        <h4 className="font-bold text-gray-800 text-sm md:text-base break-words">{subtask.tenSubtask}</h4>
                                                    </div>

                                                    {/* Người thực hiện */}
                                                    <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3">
                                                        {subtask.assignments && subtask.assignments.length > 0 && subtask.assignments[0].status === 'pending' ? (
                                                            <>
                                                                <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md animate-pulse flex-shrink-0">
                                                                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className="text-orange-600 font-semibold text-xs md:text-sm">Đang chờ xác nhận</span>
                                                                    <div className="text-xs text-gray-500 truncate">
                                                                        Đã gửi đến: {subtask.assignments[0].assignee?.hoten || subtask.assignments[0].assignee?.manv}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-md flex-shrink-0">
                                                                    {subtask.nguoiThucHien?.hoten?.charAt(0) || "?"}
                                                                </div>
                                                                <span className="text-gray-600 font-medium text-xs md:text-sm truncate">
                                                                    {subtask.nguoiThucHien?.hoten || "Chưa phân công"}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        <div>Ngày bắt đầu: {subtask.ngayBatDau ? new Date(subtask.ngayBatDau).toLocaleDateString('vi-VN') : '—'}</div>
                                                        <div>Hạn chót: {subtask.ngayKetThuc ? new Date(subtask.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}</div>
                                                    </div>
                                                </div>

                                                {/* Trạng thái badge */}
                                                <div className="sm:ml-4">
                                                    {getStatusBadge(subtask.trangThai)}
                                                </div>
                                            </div>

                                            {/* Controls section tách riêng */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 md:pt-4 mt-3 md:mt-4 border-t border-gray-200">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 w-full sm:w-auto">
                                                    <label className="text-xs md:text-sm font-medium text-gray-700 flex-shrink-0">Trạng thái:</label>
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
                                                                showError("Không thể cập nhật trạng thái!");
                                                            }
                                                        }}
                                                        className="w-full sm:w-auto px-3 md:px-4 py-2 border-2 border-gray-300 rounded-lg md:rounded-xl bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-xs md:text-sm font-medium"
                                                    >
                                                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                                        <option value="Đang chạy">Đang chạy</option>
                                                        <option value="Hoàn thành">Hoàn thành</option>
                                                    </select>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSubtask(subtask);
                                                            setIsEditSubtaskModalOpen(true);
                                                        }}
                                                        className="w-full sm:w-auto px-3 md:px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs md:text-sm rounded-lg md:rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
                                                    >
                                                        Chỉnh sửa
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const confirmed = await showConfirm("Bạn có chắc muốn xóa công việc nhỏ này?");
                                                            if (confirmed) {
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
                                                                    showError("Không thể xóa công việc nhỏ!");
                                                                }
                                                            }
                                                        }}
                                                        className="w-full sm:w-auto px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm rounded-lg md:rounded-xl font-medium transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                                    >
                                                        <span>🗑️</span>
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Worklog và Comments cho subtask */}
                                            <div className="mt-6 space-y-4">
                                                <WorklogSubtask subtaskId={subtask.id} subtaskStatus={subtask.trangThai} />
                                                <CommentSubtask subtaskId={subtask.id} subtaskStatus={subtask.trangThai} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 md:py-12 bg-gray-50 rounded-xl md:rounded-2xl border-2 border-dashed border-gray-300">
                                        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                            <ListTodo size={24} className="md:w-8 md:h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-base md:text-lg font-medium mb-2">Chưa có công việc nhỏ nào</p>
                                        <p className="text-gray-400 text-xs md:text-sm">Nhấn "Thêm" để tạo công việc nhỏ đầu tiên</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tổng hợp Worklog và Comments cho Task */}
                        <div className="space-y-4">
                            <WorklogTask taskId={selectedTask.id} taskStatus={selectedTask.trangThai} />
                            <CommentTask taskId={selectedTask.id} taskStatus={selectedTask.trangThai} />
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
                <form onSubmit={handleAddSubtask} className="space-y-3 md:space-y-5">
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Tên công việc nhỏ *</label>
                        <input
                            type="text"
                            required
                            value={subtaskFormData.name}
                            onChange={(e) => setSubtaskFormData({ ...subtaskFormData, name: e.target.value })}
                            className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Nhập tên công việc nhỏ"
                        />
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Mô tả</label>
                        <textarea
                            value={subtaskFormData.description}
                            onChange={(e) => setSubtaskFormData({ ...subtaskFormData, description: e.target.value })}
                            className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            placeholder="Mô tả công việc nhỏ"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Người thực hiện</label>
                        <select
                            value={subtaskFormData.assigneeId}
                            onChange={(e) => setSubtaskFormData({ ...subtaskFormData, assigneeId: e.target.value })}
                            className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                            <option value="">Không gán người (để trống)</option>
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
                            <div className="mt-2 text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                                <span>(Không tìm thấy thành viên nhóm phù hợp.)</span>
                                <button
                                    type="button"
                                    onClick={() => setShowAllAssigneesFallback(true)}
                                    className="underline text-primary"
                                >
                                    Hiển thị tất cả
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={subtaskFormData.startDate}
                                onChange={(e) => setSubtaskFormData({ ...subtaskFormData, startDate: e.target.value })}
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Ngày kết thúc</label>
                            <input
                                type="date"
                                value={subtaskFormData.endDate}
                                onChange={(e) => setSubtaskFormData({ ...subtaskFormData, endDate: e.target.value })}
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-4">
                        <button
                            type="button"
                            onClick={() => setIsAddSubtaskModalOpen(false)}
                            className="flex-1 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm bg-secondary text-foreground rounded-lg md:rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                        >
                            Thêm công việc nhỏ
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Subtask Modal */}
            <Modal isOpen={isEditSubtaskModalOpen} onClose={() => setIsEditSubtaskModalOpen(false)} title="Chỉnh sửa công việc nhỏ">
                <form onSubmit={handleUpdateSubtask} className="space-y-3 md:space-y-5">
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Tên công việc nhỏ *</label>
                        <input
                            type="text"
                            required
                            value={editSubtaskForm.name}
                            onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, name: e.target.value })}
                            className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Nhập tên công việc nhỏ"
                        />
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Mô tả</label>
                        <textarea
                            value={editSubtaskForm.description}
                            onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, description: e.target.value })}
                            className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            placeholder="Mô tả công việc nhỏ"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Người thực hiện *</label>
                        <select
                            required
                            value={editSubtaskForm.assigneeId}
                            onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, assigneeId: e.target.value })}
                            className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                            <option value="">Chọn người thực hiện</option>
                            {getGroupMembersForTask(selectedTask).map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={editSubtaskForm.startDate}
                                onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, startDate: e.target.value })}
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-semibold text-foreground mb-1 md:mb-2">Ngày kết thúc</label>
                            <input
                                type="date"
                                value={editSubtaskForm.endDate}
                                onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, endDate: e.target.value })}
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-background border border-border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-4">
                        <button
                            type="button"
                            onClick={() => setIsEditSubtaskModalOpen(false)}
                            className="flex-1 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm bg-secondary text-foreground rounded-lg md:rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAddGroupModalOpen} onClose={() => setIsAddGroupModalOpen(false)} title="Thêm nhóm vào dự án">
                <div className="space-y-3 md:space-y-5">
                    <div>
                        <label className="block text-sm md:text-base font-semibold text-foreground mb-2 md:mb-3">Chọn nhóm làm việc *</label>
                        <div className="mb-2 md:mb-3 flex items-center gap-2">
                            <Search className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground absolute ml-3" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 md:pl-10 pr-3 py-2 border border-border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                            />
                        </div>
                        {availableGroups.length === 0 ? (
                            <div className="text-center py-6 md:py-8">
                                <div className="mb-2 text-xs md:text-sm text-muted-foreground">Không có nhóm nào khả dụng.</div>
                                <Link href="/admin/groups" className="inline-block px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all">Tạo nhóm mới</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 max-h-72 overflow-y-auto">
                                {availableGroups.filter(group =>
                                    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (group.duan?.tenduan || '').toLowerCase().includes(searchTerm.toLowerCase())
                                ).map(group => {
                                    const joinedProjects = group.projectHistory ? group.projectHistory.length : 0;
                                    const overLimit = joinedProjects >= 2;
                                    return (
                                        <label key={group.id} className={`flex items-start gap-2 md:gap-3 p-2 md:p-4 border rounded-lg md:rounded-xl cursor-pointer transition-all text-xs md:text-sm ${selectedGroupId == group.id ? 'border-blue-500 bg-blue-50' : 'border-border bg-background hover:bg-secondary/40'} ${overLimit ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            title={overLimit ? 'Nhóm đã tham gia 2 dự án' : ''}>
                                            <input
                                                type="radio"
                                                name="select-group"
                                                value={group.id}
                                                checked={String(selectedGroupId) === String(group.id)}
                                                onChange={() => setSelectedGroupId(String(group.id))}
                                                className="accent-blue-600 w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5 md:mt-1"
                                                disabled={overLimit}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-foreground">{group.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {group.duan?.tenduan ? `Dự án: ${group.duan.tenduan}` : 'Chưa gán dự án'}
                                                    {' • '}{group.members?.length || 0} thành viên
                                                </div>
                                                {group.leader?.hoten && (
                                                    <div className="text-xs text-blue-700 mt-0.5 md:mt-1">Trưởng nhóm: {group.leader.hoten}</div>
                                                )}
                                                {overLimit && <div className="text-xs text-red-500 mt-0.5 md:mt-1">Đã tham gia 2 dự án</div>}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-4 justify-center">
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
                <form onSubmit={handleUploadSubmit} className="space-y-3 md:space-y-4 md:space-y-5">
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-2">File *</label>
                        <input type="file" onChange={handleFileChange} className="w-full px-3 md:px-4 py-2 md:py-3 border border-border rounded-lg md:rounded-xl text-xs md:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-foreground mb-2">Mô tả</label>
                        <textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} className="w-full px-3 md:px-4 py-2 md:py-3 border border-border rounded-lg md:rounded-xl text-xs md:text-sm min-h-24" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-4">
                        <button type="button" onClick={() => setIsUploadOpen(false)} className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-secondary text-foreground rounded-lg md:rounded-xl font-semibold hover:bg-secondary/80 transition-all">Hủy</button>
                        <button type="submit" className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all">Tải lên</button>
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
                    className="space-y-3 md:space-y-4 md:space-y-5"
                >
                    {/* Tên dự án + Trạng thái + Người quản lý */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                            <label className="text-xs md:text-sm font-medium text-foreground">Tên dự án *</label>
                            <input
                                type="text"
                                value={editForm.tenduan}
                                onChange={(e) => setEditForm({ ...editForm, tenduan: e.target.value })}
                                placeholder="Nhập tên dự án"
                                required
                                className="h-10 md:h-12 w-full rounded-lg md:rounded-xl bg-white/90 border border-white/30 px-3 md:px-4 text-xs md:text-sm text-gray-900 placeholder:text-gray-500 shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs md:text-sm font-medium text-foreground">Trạng thái</label>
                            <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="h-10 md:h-12 w-full rounded-lg md:rounded-xl bg-white/90 border border-white/30 px-3 md:px-4 text-xs md:text-sm text-gray-900 shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            >
                                <option value="chua_bat_dau">Chưa bắt đầu</option>
                                <option value="dang_chay">Đang chạy</option>
                                <option value="da_dong">Đã đóng</option>
                                <option value="da_hoan_thanh">Hoàn thành</option>
                            </select>
                        </div>
                    </div>

                    {/* Người quản lý */}
                    <div className="space-y-2">
                        <label className="text-xs md:text-sm font-medium text-foreground">Người quản lý</label>
                        <select
                            value={editForm.userId}
                            onChange={e => setEditForm({ ...editForm, userId: e.target.value })}
                            className="h-10 md:h-12 w-full rounded-lg md:rounded-xl bg-white/90 border border-white/30 px-3 md:px-4 text-xs md:text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                        >
                            <option value="">Chọn người quản lý</option>
                            {users.filter(user => user.role && (user.role.name === 'manager' || user.chucvu === 'Quản lý')).map(user => {
                                const isCurrent = String(user.id) === String(editForm.userId);
                                return (
                                    <option
                                        key={user.id}
                                        value={user.id}
                                        style={isCurrent ? { opacity: 0.6, fontStyle: 'italic' } : {}}
                                    >
                                        {user.hoten} ({user.manv}){isCurrent ? ' (Hiện tại)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Mô tả */}
                    <div className="space-y-2">
                        <label className="text-xs md:text-sm font-medium text-foreground">Mô tả</label>
                        <textarea
                            value={editForm.mota}
                            onChange={(e) => setEditForm({ ...editForm, mota: e.target.value })}
                            placeholder="Mô tả ngắn gọn về dự án"
                            className="min-h-24 md:min-h-28 w-full rounded-lg md:rounded-xl bg-white/90 border border-white/30 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                        />
                    </div>

                    {/* Ngày bắt đầu / kết thúc */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                            <label className="text-xs md:text-sm font-medium text-foreground">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={editForm.ngaybatdau}
                                onChange={(e) => setEditForm({ ...editForm, ngaybatdau: e.target.value })}
                                className="h-10 md:h-12 w-full rounded-lg md:rounded-xl bg-white/90 border border-white/30 px-3 md:px-4 text-xs md:text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs md:text-sm font-medium text-foreground">Ngày kết thúc</label>
                            <input
                                type="date"
                                value={editForm.ngayketthuc}
                                onChange={(e) => setEditForm({ ...editForm, ngayketthuc: e.target.value })}
                                className="h-10 md:h-12 w-full rounded-lg md:rounded-xl bg-white/90 border border-white/30 px-3 md:px-4 text-xs md:text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-4 justify-end">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="h-10 md:h-12 px-4 md:px-5 rounded-lg md:rounded-xl border border-border bg-background text-foreground text-xs md:text-sm hover:bg-muted transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="h-10 md:h-12 px-4 md:px-5 rounded-lg md:rounded-xl inline-flex items-center justify-center font-semibold text-xs md:text-sm text-white bg-gradient-to-r from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-red-700 hover:shadow-orange-500/40 transition-all duration-300"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    )
}
