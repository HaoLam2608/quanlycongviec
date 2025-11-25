"use client"

import { useEffect, useState } from "react"
import {
    Calendar,
    CheckCheck,
    CheckCircle,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    History,
    RefreshCw,
    Search,
    Trash2,
    User,
    UserPlus,
    X
} from "lucide-react"
import { approvalAPI } from "@/axios/approvalApi"
import { notificationUserAPI, notificationAdminAPI } from "@/axios/notificationAPI"
import assignmentAPI from "@/axios/assignmentAPI"
import { useToastContext } from "@/components/providers/toast-provider"
import { getAllClaimRequests, approveClaimRequest, rejectClaimRequest } from "@/axios/api"

interface PendingTask {
    id: number
    tentask: string
    mota?: string
    trangThai: string
    ngayKetThuc?: string
    nguoiDuocGiao?: {
        id: number
        hoten: string
        manv: string
    }
    nguoiGiao?: {
        id: number
        hoten: string
        manv: string
    }
    duan?: {
        id: number
        tenduan: string
    }
    createdAt: string
    updatedAt: string
}

interface PendingSubtask {
    id: number
    tenSubtask: string
    mota?: string
    trangThai: string
    ngayKetThuc?: string
    nguoiThucHien?: {
        id: number
        hoten: string
        manv: string
    }
    task?: {
        id: number
        tentask: string
        nguoiGiao?: {
            id: number
            hoten: string
            manv: string
        }
        duan?: {
            id: number
            tenduan: string
        }
    }
    createdAt: string
    updatedAt: string
}

interface JoinRequest {
    id: string
    title: string
    content: string
    createdAt: string
    isRead: boolean
    meta: {
        requestToJoin: boolean
        taskId?: number
        subtaskId?: number
        requesterId: number
        requesterName?: string
        processed?: boolean
        processedAt?: string
        action?: "accepted" | "declined"
    }
}

interface ClaimRequest {
    id: number
    assignmentId?: number
    taskId: number | null
    subtaskId: number | null
    managerId: number
    assigneeId: number
    status: string
    reason?: string
    createdAt: string
    updatedAt: string
    task?: {
        id: number
        tentask: string
        mota?: string
        duanId: number
        nguoiGiaoId?: number
        duan?: {
            id: number
            tenduan: string
        }
        nguoiGiao?: {
            id: number
            hoten: string
            manv: string
        }
    }
    subtask?: {
        id: number
        tenSubtask: string
        mota?: string
        taskId: number
        task?: {
            id: number
            tentask: string
            duanId: number
            nguoiGiaoId?: number
            duan?: {
                id: number
                tenduan: string
            }
            nguoiGiao?: {
                id: number
                hoten: string
                manv: string
            }
        }
    }
    assignee?: {
        id: number
        hoten: string
        manv: string
        email?: string
    }
    manager?: {
        id: number
        hoten: string
        manv: string
    }
}

interface ApprovedItem {
    id: number
    ten?: string
    tenSubtask?: string
    tentask?: string
    trangThai?: string
    approvedAt?: string
    approvedBy?: number
    acceptedAt?: string
    acceptedBy?: number
    nguoiThucHien?: { id: number; hoten: string; manv: string }
    nguoiDuocGiao?: { id: number; hoten: string; manv: string }
    assignee?: { id: number; hoten: string; manv: string }
    approver?: { id: number; hoten: string; manv: string }
    task?: { id: number; tentask: string; duan?: { id: number; tenduan: string } }
    subtask?: {
        id: number
        tenSubtask: string
        task?: { id: number; tentask: string; duan?: { id: number; tenduan: string } }
    }
    duan?: { id: number; tenduan: string }
    type?: "task" | "subtask" | "assignment"
}

type ApprovalTab = "completion" | "join" | "history"

export default function AdminApprovalsPage() {
    const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([])
    const [pendingSubtasks, setPendingSubtasks] = useState<PendingSubtask[]>([])
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
    const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([])
    const [approvedHistory, setApprovedHistory] = useState<ApprovedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [filter, setFilter] = useState<"all" | "tasks" | "subtasks">("all")
    const [historyFilter, setHistoryFilter] = useState<"all" | "completion" | "assignment">("all")
    const [activeTab, setActiveTab] = useState<ApprovalTab>("completion")
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [processingApproval, setProcessingApproval] = useState(false)
    const [processingRequestId, setProcessingRequestId] = useState<string | number | null>(null)
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const { showSuccess, showError } = useToastContext()

    useEffect(() => {
        loadPendingApprovals()
        loadJoinRequests()
        loadClaimRequests()
    }, [filter])

    useEffect(() => {
        if (activeTab === "history") {
            loadApprovedHistory()
        }
    }, [activeTab])

    const loadPendingApprovals = async () => {
        setLoading(true)
        try {
            const response = await approvalAPI.getPendingApprovals(filter)
            const payload = response?.data ?? response ?? {}
            const tasks = Array.isArray(payload.tasks) ? payload.tasks : []
            const subtasks = Array.isArray(payload.subtasks) ? payload.subtasks : []
            setPendingTasks(tasks)
            setPendingSubtasks(subtasks)
        } catch (error: any) {
            console.error("Load pending approvals error:", error)
            showError(error?.message || "Không thể tải danh sách phê duyệt")
            setPendingTasks([])
            setPendingSubtasks([])
        } finally {
            setLoading(false)
        }
    }

    const loadJoinRequests = async () => {
        try {
            console.log('🔄 Loading join requests...')
            const res = await assignmentAPI.getMyJoinRequests()
            console.log('📦 Join requests response:', res)
            const raw = Array.isArray(res.data) ? res.data : (res.data?.data || res.data || [])
            console.log('📋 Raw data:', raw)
            const requests = (raw || [])
                .map((n: any) => ({
                    id: String(n.id),
                    title: n.title,
                    content: n.content,
                    createdAt: n.createdAt,
                    isRead: n.isRead || (n.userNotification && n.userNotification.isRead) || false,
                    meta: n.userMeta || n.meta || (n.userNotification && n.userNotification.meta)
                })) as JoinRequest[]
            console.log('✅ Formatted requests:', requests.length)
            setJoinRequests(requests)
        } catch (error: any) {
            console.error("❌ Load join requests error:", error)
            console.error("Error details:", error?.response?.data || error?.message)
            setJoinRequests([])
        }
    }

    const loadClaimRequests = async () => {
        try {
            const data = await getAllClaimRequests()
            setClaimRequests(Array.isArray(data) ? data : [])
        } catch (error: any) {
            console.error("Load claim requests error:", error)
            setClaimRequests([])
        }
    }

    const loadApprovedHistory = async () => {
        setLoadingHistory(true)
        try {
            const res = await approvalAPI.getApprovedHistory(150)
            const payload = res?.data ?? res ?? {}
            const tasks = Array.isArray(payload.tasks) ? payload.tasks : []
            const subtasks = Array.isArray(payload.subtasks) ? payload.subtasks : []
            const assignments = Array.isArray(payload.assignments) ? payload.assignments : []

            const all: ApprovedItem[] = [
                ...tasks.map((t: any) => ({ ...t, type: "task" as const })),
                ...subtasks.map((s: any) => ({ ...s, type: "subtask" as const })),
                ...assignments.map((a: any) => ({ ...a, type: "assignment" as const }))
            ].sort((a, b) => {
                const dateA = new Date(a.approvedAt || a.acceptedAt || 0).getTime()
                const dateB = new Date(b.approvedAt || b.acceptedAt || 0).getTime()
                return dateB - dateA
            })

            setApprovedHistory(all)
        } catch (error: any) {
            console.error("Load approved history error:", error)
            showError(error?.message || "Lỗi tải lịch sử phê duyệt")
            setApprovedHistory([])
        } finally {
            setLoadingHistory(false)
        }
    }

    const handleApprove = async (item: any, type: "task" | "subtask", approved: boolean) => {
        setProcessingApproval(true)
        try {
            if (type === "task") {
                await approvalAPI.approveTask(item.id, approved, approved ? "" : rejectReason)
            } else {
                await approvalAPI.approveSubtask(item.id, approved, approved ? "" : rejectReason)
            }

            showSuccess(approved ? "Đã phê duyệt thành công" : "Đã từ chối yêu cầu")
            setIsModalOpen(false)
            setSelectedItem(null)
            setRejectReason("")
            await loadPendingApprovals()
            if (activeTab === "history") {
                loadApprovedHistory()
            }
        } catch (error: any) {
            console.error("Handle approve error:", error)
            showError(error?.message || "Lỗi khi xử lý phê duyệt")
        } finally {
            setProcessingApproval(false)
        }
    }

    const handleAcceptRequest = async (request: JoinRequest) => {
        setProcessingRequestId(request.id)
        try {
            await notificationUserAPI.acceptRequest({
                taskId: request.meta.taskId,
                subtaskId: request.meta.subtaskId,
                requesterId: request.meta.requesterId
            })
            showSuccess("Đã chấp nhận yêu cầu nhận việc")
            loadJoinRequests()
        } catch (error: any) {
            console.error("Accept request error:", error)
            showError(error?.response?.data?.message || "Lỗi khi chấp nhận yêu cầu")
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleDeclineRequest = async (request: JoinRequest) => {
        const reason = prompt("Lý do từ chối (không bắt buộc)") || ""
        setProcessingRequestId(request.id)
        try {
            await notificationUserAPI.declineRequest({
                taskId: request.meta.taskId,
                subtaskId: request.meta.subtaskId,
                requesterId: request.meta.requesterId,
                reason
            })
            showSuccess("Đã từ chối yêu cầu nhận việc")
            loadJoinRequests()
        } catch (error: any) {
            console.error("Decline request error:", error)
            showError(error?.response?.data?.message || "Lỗi khi từ chối yêu cầu")
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleDeleteRequest = async (requestId: string) => {
        setProcessingRequestId(requestId)
        try {
            await notificationUserAPI.deleteNotification(requestId)
            showSuccess("Đã xóa thông báo")
            loadJoinRequests()
        } catch (error: any) {
            console.error("Delete request error:", error)
            showError(error?.response?.data?.message || "Lỗi khi xóa thông báo")
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleApproveClaim = async (request: ClaimRequest) => {
        setProcessingRequestId(request.id)
        try {
            await approveClaimRequest(request.id)
            showSuccess("Đã phê duyệt yêu cầu nhận công việc")
            loadClaimRequests()
        } catch (error: any) {
            console.error("Approve claim error:", error)
            showError(error.message || "Lỗi khi phê duyệt yêu cầu")
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleRejectClaim = async (request: ClaimRequest, reason: string = "") => {
        setProcessingRequestId(request.id)
        try {
            await rejectClaimRequest(request.id, reason)
            showSuccess("Đã từ chối yêu cầu nhận công việc")
            loadClaimRequests()
        } catch (error: any) {
            console.error("Reject claim error:", error)
            showError(error.message || "Lỗi khi từ chối yêu cầu")
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleDeleteHistory = async (item: ApprovedItem) => {
        const itemId = `${item.type}-${item.id}`
        setDeletingHistoryId(itemId)
        try {
            await approvalAPI.deleteHistory({
                type: item.type || "task",
                id: item.id
            })
            showSuccess("Đã xóa lịch sử phê duyệt")
            loadApprovedHistory()
        } catch (error: any) {
            console.error("Delete history error:", error)
            showError(error?.response?.data?.message || "Lỗi khi xóa lịch sử")
        } finally {
            setDeletingHistoryId(null)
        }
    }

    const openApprovalModal = (item: any, type: "task" | "subtask") => {
        setSelectedItem({ ...item, type })
        setIsModalOpen(true)
        setRejectReason("")
    }

    const searchValue = searchTerm.trim().toLowerCase()
    const includesKeyword = (value?: string) => {
        if (!searchValue) return true
        return value ? value.toLowerCase().includes(searchValue) : false
    }

    const filteredTasks = pendingTasks.filter(task => {
        if (!searchValue) return true
        return (
            includesKeyword(task.tentask) ||
            includesKeyword(task.nguoiDuocGiao?.hoten) ||
            includesKeyword(task.nguoiGiao?.hoten) ||
            includesKeyword(task.duan?.tenduan)
        )
    })

    const filteredSubtasks = pendingSubtasks.filter(subtask => {
        if (!searchValue) return true
        return (
            includesKeyword(subtask.tenSubtask) ||
            includesKeyword(subtask.nguoiThucHien?.hoten) ||
            includesKeyword(subtask.task?.tentask) ||
            includesKeyword(subtask.task?.nguoiGiao?.hoten) ||
            includesKeyword(subtask.task?.duan?.tenduan)
        )
    })

    const totalCount = filteredTasks.length + filteredSubtasks.length

    const filteredHistory = approvedHistory.filter(item => {
        if (historyFilter === "all") return true
        if (historyFilter === "completion") return item.type === "task" || item.type === "subtask"
        if (historyFilter === "assignment") return item.type === "assignment"
        return true
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const modalManager = selectedItem
        ? selectedItem.type === "task"
            ? selectedItem.nguoiGiao
            : selectedItem.task?.nguoiGiao
        : undefined
    const modalProject = selectedItem
        ? selectedItem.type === "task"
            ? selectedItem.duan?.tenduan
            : selectedItem.task?.duan?.tenduan
        : undefined

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Điều phối phê duyệt
                            </h1>
                            <p className="text-gray-600">
                                {activeTab === "completion"
                                    ? "Theo dõi và xử lý các yêu cầu hoàn thành công việc trên toàn hệ thống"
                                    : activeTab === "join"
                                        ? "Giám sát các yêu cầu nhận việc từ nhân viên ở mọi dự án"
                                        : "Xem lại lịch sử phê duyệt, tiếp nhận công việc toàn công ty"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">
                                    {activeTab === "completion" ? "Tổng số chờ phê duyệt" : "Tổng số yêu cầu"}
                                </p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {activeTab === "completion" ? totalCount : (joinRequests.length + claimRequests.length)}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    loadPendingApprovals()
                                    loadJoinRequests()
                                    loadClaimRequests()
                                    if (activeTab === "history") {
                                        loadApprovedHistory()
                                    }
                                }}
                                disabled={loading || loadingHistory}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${(loading || loadingHistory) ? "animate-spin" : ""}`} />
                                Làm mới
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200 mb-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab("completion")}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all ${activeTab === "completion"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCheck size={18} />
                                    <span>Phê duyệt hoàn thành</span>
                                    {totalCount > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "completion" ? "bg-white/20" : "bg-blue-100 text-blue-800"
                                                }`}
                                        >
                                            {totalCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("join")}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all ${activeTab === "join"
                                    ? "bg-green-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <UserPlus size={18} />
                                    <span>Yêu cầu nhận việc</span>
                                    {(joinRequests.length + claimRequests.length) > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "join" ? "bg-white/20" : "bg-green-100 text-green-800"
                                                }`}
                                        >
                                            {joinRequests.length + claimRequests.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all ${activeTab === "history"
                                    ? "bg-purple-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <History size={18} />
                                    <span>Lịch sử phê duyệt</span>
                                    {approvedHistory.length > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "history" ? "bg-white/20" : "bg-purple-100 text-purple-800"
                                                }`}
                                        >
                                            {approvedHistory.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>

                    {activeTab === "completion" && (
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm công việc, nhân sự, dự án..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                                    />
                                </div>
                                <select
                                    value={filter}
                                    onChange={e => setFilter(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="tasks">Chỉ công việc chính</option>
                                    <option value="subtasks">Chỉ công việc nhỏ</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === "completion" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Danh sách chờ phê duyệt ({totalCount})
                            </h2>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {totalCount === 0 ? (
                                <div className="p-12 text-center">
                                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Không có yêu cầu phê duyệt
                                    </h3>
                                    <p className="text-gray-500">
                                        Tất cả công việc đã được xử lý hoặc chưa có yêu cầu mới.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {(filter === "all" || filter === "tasks") && filteredTasks.map(task => (
                                        <div key={`task-${task.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {task.tentask}
                                                        </h3>
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                            Công việc chính
                                                        </span>
                                                        {task.duan?.tenduan && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                                                {task.duan.tenduan}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {task.mota && (
                                                        <p className="text-gray-600 mb-3 line-clamp-3">{task.mota}</p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-4 h-4" />
                                                            <span>Người thực hiện: {task.nguoiDuocGiao?.hoten || "Chưa phân công"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-4 h-4 text-blue-500" />
                                                            <span>Người giao: {task.nguoiGiao?.hoten || "Không rõ"}</span>
                                                        </div>
                                                        {task.ngayKetThuc && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>Deadline: {new Date(task.ngayKetThuc).toLocaleDateString("vi-VN")}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            <span>Yêu cầu lúc: {formatDate(task.updatedAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 ml-4">
                                                    <button
                                                        onClick={() => openApprovalModal(task, "task")}
                                                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Chi tiết
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(task, "task", true)}
                                                        disabled={processingApproval}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <CheckCheck className="w-4 h-4" />
                                                        Phê duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => openApprovalModal(task, "task")}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Từ chối
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(filter === "all" || filter === "subtasks") && filteredSubtasks.map(subtask => (
                                        <div key={`subtask-${subtask.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {subtask.tenSubtask}
                                                        </h3>
                                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                                            Công việc nhỏ
                                                        </span>
                                                        {subtask.task?.duan?.tenduan && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                                                {subtask.task.duan.tenduan}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                                                        <span>Thuộc task:</span>
                                                        <span className="font-medium text-gray-800">{subtask.task?.tentask || "Không rõ"}</span>
                                                    </div>
                                                    {subtask.mota && (
                                                        <p className="text-gray-600 mb-3 line-clamp-3">{subtask.mota}</p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-4 h-4" />
                                                            <span>Người thực hiện: {subtask.nguoiThucHien?.hoten || "Chưa phân công"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-4 h-4 text-blue-500" />
                                                            <span>Người giao: {subtask.task?.nguoiGiao?.hoten || "Không rõ"}</span>
                                                        </div>
                                                        {subtask.ngayKetThuc && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>Deadline: {new Date(subtask.ngayKetThuc).toLocaleDateString("vi-VN")}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            <span>Yêu cầu lúc: {formatDate(subtask.updatedAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 ml-4">
                                                    <button
                                                        onClick={() => openApprovalModal(subtask, "subtask")}
                                                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Chi tiết
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(subtask, "subtask", true)}
                                                        disabled={processingApproval}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <CheckCheck className="w-4 h-4" />
                                                        Phê duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => openApprovalModal(subtask, "subtask")}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Từ chối
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "join" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Yêu cầu nhận công việc ({joinRequests.length + claimRequests.length})
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Bao gồm yêu cầu nhận task và yêu cầu tham gia nhóm</p>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {(joinRequests.length + claimRequests.length) === 0 ? (
                                <div className="p-12 text-center">
                                    <UserPlus className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Không có yêu cầu nhận việc
                                    </h3>
                                    <p className="text-gray-500">Chưa có nhân viên nào yêu cầu nhận công việc.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Claim Requests (Task Assignment Requests) */}
                                    {claimRequests.filter(r => r.status === 'pending').map(request => {
                                        const isSubtask = !!request.subtaskId;
                                        const itemName = isSubtask ? request.subtask?.tenSubtask : request.task?.tentask;
                                        const itemDesc = isSubtask ? request.subtask?.mota : request.task?.mota;
                                        const projectName = isSubtask
                                            ? request.subtask?.task?.duan?.tenduan
                                            : request.task?.duan?.tenduan;
                                        const taskCreator = isSubtask
                                            ? request.subtask?.task?.nguoiGiao
                                            : request.task?.nguoiGiao;
                                        const parentTaskName = isSubtask ? request.subtask?.task?.tentask : undefined;

                                        return (
                                            <div key={`claim-${request.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className={`w-2 h-2 rounded-full ${isSubtask ? 'bg-orange-500' : 'bg-indigo-500'}`}></div>
                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                {itemName || 'Chưa đặt tên'}
                                                            </h3>
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${isSubtask
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : 'bg-indigo-100 text-indigo-800'
                                                                }`}>
                                                                Yêu cầu nhận {isSubtask ? 'subtask' : 'task'}
                                                            </span>
                                                            {projectName && (
                                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                                                    {projectName}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {isSubtask && parentTaskName && (
                                                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                                                <span>Thuộc task:</span>
                                                                <span className="font-medium text-gray-800">{parentTaskName}</span>
                                                            </div>
                                                        )}

                                                        {itemDesc && (
                                                            <p className="text-gray-600 mb-3 line-clamp-2">{itemDesc}</p>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                            {request.assignee && (
                                                                <div className="flex items-center gap-1">
                                                                    <User className="w-4 h-4" />
                                                                    <span>Người yêu cầu: {request.assignee.hoten} ({request.assignee.manv})</span>
                                                                </div>
                                                            )}
                                                            {request.manager && (
                                                                <div className="flex items-center gap-1">
                                                                    <User className="w-4 h-4 text-blue-500" />
                                                                    <span>Manager: {request.manager.hoten} ({request.manager.manv})</span>
                                                                </div>
                                                            )}
                                                            {taskCreator && (
                                                                <div className="flex items-center gap-1">
                                                                    <User className="w-4 h-4 text-green-500" />
                                                                    <span>Người tạo: {taskCreator.hoten}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                <span>Yêu cầu: {new Date(request.createdAt).toLocaleString("vi-VN")}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 ml-4">
                                                        <button
                                                            onClick={() => handleApproveClaim(request)}
                                                            disabled={processingRequestId === request.id}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                                                        >
                                                            <CheckCheck className="w-4 h-4" />
                                                            Phê duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt("Lý do từ chối (không bắt buộc):") || ""
                                                                handleRejectClaim(request, reason)
                                                            }}
                                                            disabled={processingRequestId === request.id}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Join Requests (Group Membership Requests) */}
                                    {joinRequests.map(request => {
                                        const isProcessed = request.meta?.processed === true
                                        const action = request.meta?.action
                                        const targetLabel = request.meta?.taskId
                                            ? `Task #${request.meta.taskId}`
                                            : request.meta?.subtaskId
                                                ? `Subtask #${request.meta.subtaskId}`
                                                : "Không xác định"

                                        return (
                                            <div
                                                key={`join-${request.id}-${request.meta?.requesterId}`}
                                                className={`p-6 transition-colors ${isProcessed ? "bg-gray-50 opacity-70" : "hover:bg-gray-50"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div
                                                                className={`w-2 h-2 rounded-full ${isProcessed
                                                                    ? action === "accepted"
                                                                        ? "bg-green-500"
                                                                        : "bg-red-500"
                                                                    : "bg-blue-500"
                                                                    }`}
                                                            ></div>
                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                {request.title}
                                                            </h3>
                                                            {isProcessed ? (
                                                                <span
                                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${action === "accepted"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800"
                                                                        }`}
                                                                >
                                                                    {action === "accepted" ? "✓ Đã chấp nhận" : "✕ Đã từ chối"}
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                                    Yêu cầu tham gia
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-600 mb-3">{request.content}</p>
                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                <User className="w-4 h-4" />
                                                                <span>
                                                                    Nhân viên: {request.meta?.requesterName || `#${request.meta.requesterId}`}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="w-4 h-4" />
                                                                <span>Công việc: {targetLabel}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                <span>Yêu cầu lúc: {new Date(request.createdAt).toLocaleString("vi-VN")}</span>
                                                            </div>
                                                            {isProcessed && request.meta?.processedAt && (
                                                                <div className="flex items-center gap-1">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    <span>Xử lý lúc: {new Date(request.meta.processedAt).toLocaleString("vi-VN")}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 ml-4">
                                                        {isProcessed ? (
                                                            <button
                                                                onClick={() => handleDeleteRequest(request.id)}
                                                                disabled={processingRequestId === request.id}
                                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Xóa
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAcceptRequest(request)}
                                                                    disabled={processingRequestId === request.id}
                                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    <CheckCheck className="w-4 h-4" />
                                                                    Chấp nhận
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeclineRequest(request)}
                                                                    disabled={processingRequestId === request.id}
                                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                    Từ chối
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Lịch sử phê duyệt ({filteredHistory.length})
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setHistoryFilter("all")}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${historyFilter === "all"
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        Tất cả
                                    </button>
                                    <button
                                        onClick={() => setHistoryFilter("completion")}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${historyFilter === "completion"
                                            ? "bg-green-600 text-white shadow-sm"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        Phê duyệt hoàn thành
                                    </button>
                                    <button
                                        onClick={() => setHistoryFilter("assignment")}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${historyFilter === "assignment"
                                            ? "bg-purple-600 text-white shadow-sm"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        Yêu cầu nhận việc
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {loadingHistory ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse"></div>
                                    ))}
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg font-medium">
                                        {historyFilter === "all"
                                            ? "Chưa có lịch sử phê duyệt"
                                            : historyFilter === "completion"
                                                ? "Chưa có lịch sử phê duyệt hoàn thành"
                                                : "Chưa có lịch sử yêu cầu nhận việc"
                                        }
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        {historyFilter === "all"
                                            ? "Các công việc đã được phê duyệt sẽ hiển thị ở đây"
                                            : historyFilter === "completion"
                                                ? "Các công việc đã được phê duyệt hoàn thành sẽ hiển thị ở đây"
                                                : "Các yêu cầu nhận việc đã được chấp nhận sẽ hiển thị ở đây"
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredHistory.map(item => {
                                        const isAssignment = item.type === "assignment"
                                        const itemName = isAssignment
                                            ? item.subtask?.tenSubtask || item.task?.tentask || item.ten || "Chưa đặt tên"
                                            : item.type === "task"
                                                ? item.ten || item.tentask || "Chưa đặt tên"
                                                : item.tenSubtask || item.ten || "Chưa đặt tên"
                                        const assignee = item.assignee || item.nguoiDuocGiao || item.nguoiThucHien
                                        const projectName = isAssignment
                                            ? item.subtask?.task?.duan?.tenduan || item.task?.duan?.tenduan
                                            : item.type === "task"
                                                ? item.duan?.tenduan
                                                : item.task?.duan?.tenduan
                                        const parentTaskName = isAssignment
                                            ? item.subtask?.task?.tentask
                                            : item.type === "subtask"
                                                ? item.task?.tentask
                                                : undefined
                                        const approvalDateRaw = item.approvedAt || item.acceptedAt
                                        const approvalDateObj = approvalDateRaw ? new Date(approvalDateRaw) : null
                                        const isValidDate = approvalDateObj && !isNaN(approvalDateObj.getTime())
                                        const approvalDate = isValidDate
                                            ? approvalDateObj!.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                                            : "Chưa có"
                                        const approvalTime = isValidDate
                                            ? approvalDateObj!.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                                            : ""

                                        return (
                                            <div
                                                key={`${item.type}-${item.id}`}
                                                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-6">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isAssignment
                                                                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                                                    : "bg-gradient-to-br from-green-500 to-green-600"
                                                                    }`}
                                                            >
                                                                <CheckCircle className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <h3 className="text-lg font-semibold text-gray-900">{itemName}</h3>
                                                                    <span
                                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${isAssignment
                                                                            ? "bg-blue-100 text-blue-700"
                                                                            : "bg-green-100 text-green-700"
                                                                            }`}
                                                                    >
                                                                        {isAssignment ? "✓ Đã chấp nhận" : "✓ Đã phê duyệt"}
                                                                    </span>
                                                                    <span
                                                                        className={`px-2 py-1 rounded-md text-xs font-medium ${isAssignment
                                                                            ? "bg-purple-100 text-purple-700"
                                                                            : "bg-blue-50 text-blue-700"
                                                                            }`}
                                                                    >
                                                                        {isAssignment
                                                                            ? "Yêu cầu nhận việc"
                                                                            : item.type === "task"
                                                                                ? "Công việc"
                                                                                : "Công việc nhỏ"}
                                                                    </span>
                                                                </div>
                                                                {projectName && (
                                                                    <p className="text-sm text-gray-500">Dự án: {projectName}</p>
                                                                )}
                                                                {parentTaskName && (
                                                                    <p className="text-sm text-gray-500">Thuộc: {parentTaskName}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteHistory(item)}
                                                                disabled={deletingHistoryId === `${item.type}-${item.id}`}
                                                                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all disabled:opacity-50 flex-shrink-0"
                                                                title="Xóa lịch sử"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            {assignee && (
                                                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                                    <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs text-gray-500">
                                                                            {isAssignment ? "Người được phân công" : "Người thực hiện"}
                                                                        </p>
                                                                        <p className="text-sm font-semibold text-gray-900 truncate">{assignee.hoten}</p>
                                                                        <p className="text-xs text-gray-500">{assignee.manv}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {item.approver && (
                                                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs text-gray-500">
                                                                            {isAssignment ? "Người chấp nhận" : "Người phê duyệt"}
                                                                        </p>
                                                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.approver.hoten}</p>
                                                                        <p className="text-xs text-gray-500">{item.approver.manv}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                                                <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-500">
                                                                        {isAssignment ? "Thời gian chấp nhận" : "Thời gian phê duyệt"}
                                                                    </p>
                                                                    <p className="text-sm font-semibold text-gray-900">{approvalDate}</p>
                                                                    {approvalTime && <p className="text-xs text-gray-500">{approvalTime}</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isModalOpen && selectedItem && (
                    <div className="fixed inset-0 backdrop-blur-[0px] flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Chi tiết {selectedItem.type === "task" ? "công việc" : "công việc nhỏ"}
                                    </h2>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {selectedItem.type === "task" ? selectedItem.tentask : selectedItem.tenSubtask}
                                    </h3>
                                    {selectedItem.mota && <p className="text-gray-600">{selectedItem.mota}</p>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Người thực hiện</label>
                                        <p className="mt-1 text-gray-900">
                                            {selectedItem.type === "task"
                                                ? selectedItem.nguoiDuocGiao?.hoten || "Chưa phân công"
                                                : selectedItem.nguoiThucHien?.hoten || "Chưa phân công"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                                        <span className="mt-1 inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                                            {selectedItem.trangThai}
                                        </span>
                                    </div>
                                    {modalManager && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Người giao</label>
                                            <p className="mt-1 text-gray-900">{modalManager.hoten}</p>
                                        </div>
                                    )}
                                    {modalProject && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Thuộc dự án</label>
                                            <p className="mt-1 text-gray-900">{modalProject}</p>
                                        </div>
                                    )}
                                </div>
                                {selectedItem.type === "subtask" && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Thuộc task</label>
                                        <p className="mt-1 text-gray-900">{selectedItem.task?.tentask}</p>
                                    </div>
                                )}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Lý do từ chối (tùy chọn)
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Nhập lý do nếu muốn từ chối yêu cầu..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleApprove(selectedItem, selectedItem.type, true)}
                                        disabled={processingApproval}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                        {processingApproval ? "Đang xử lý..." : "Phê duyệt hoàn thành"}
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedItem, selectedItem.type, false)}
                                        disabled={processingApproval}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        {processingApproval ? "Đang xử lý..." : "Từ chối yêu cầu"}
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