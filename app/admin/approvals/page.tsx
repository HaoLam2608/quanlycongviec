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
    assignmentId?: number
    author?: {
        id: number
        hoten: string
        manv: string
    }
    meta: {
        requestToJoin: boolean
        taskId?: number
        subtaskId?: number
        requesterId: number
        requesterName?: string
        taskCreatorId?: number
        taskCreatorName?: string
        taskCreatorManv?: string
        processed?: boolean
        processedAt?: string
        action?: "accepted" | "declined"
        assignmentId?: number  // For claim requests that also create notifications
        projectId?: number
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

type ApprovalTab = "completion" | "requests" | "history"

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
    const [requestFilter, setRequestFilter] = useState<string>("Tất cả yêu cầu")
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [processingApproval, setProcessingApproval] = useState(false)
    const [processingRequestId, setProcessingRequestId] = useState<string | number | null>(null)
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const { showSuccess, showError } = useToastContext()

    // Pagination state for history
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1)
    const [historyTotalPages, setHistoryTotalPages] = useState(1)
    const [historyTotalItems, setHistoryTotalItems] = useState(0)
    const [historyItemsPerPage] = useState(10)

    useEffect(() => {
        loadPendingApprovals()
        loadJoinRequests()
        loadClaimRequests()
    }, [filter])

    useEffect(() => {
        if (activeTab === "history") {
            loadApprovedHistory()
        }
    }, [activeTab, historyCurrentPage])

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
                    meta: n.userMeta || n.meta || (n.userNotification && n.userNotification.meta),
                    author: n.author
                        || (n.notification && n.notification.author)
                        || (() => {
                            const meta = n.userMeta || n.meta || (n.userNotification && n.userNotification.meta)
                            if (meta?.taskCreatorName || meta?.taskCreatorManv) {
                                return {
                                    id: meta.taskCreatorId,
                                    hoten: meta.taskCreatorName || meta.taskCreatorManv,
                                    manv: meta.taskCreatorManv || ''
                                }
                            }
                            return undefined
                        })()
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
            const res = await approvalAPI.getApprovedHistory(historyItemsPerPage, historyCurrentPage)
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

            // Update pagination info from response
            if (res.pagination) {
                setHistoryTotalPages(res.pagination.totalPages)
                setHistoryTotalItems(res.pagination.total)
            }
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

    const handleApproveJoin = (request: JoinRequest) => handleAcceptRequest(request)

    const handleRejectJoin = (request: JoinRequest) => handleDeclineRequest(request)

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
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-4 md:mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Điều phối phê duyệt
                            </h1>
                            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                                {activeTab === "completion"
                                    ? "Theo dõi và xử lý các yêu cầu hoàn thành công việc trên toàn hệ thống"
                                    : activeTab === "requests"
                                        ? "Giám sát các yêu cầu nhận việc từ nhân viên ở mọi dự án"
                                        : "Xem lại lịch sử phê duyệt, tiếp nhận công việc toàn công ty"}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                            <div className="w-full sm:w-auto border border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm">
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                    {activeTab === "completion" ? "Tổng số chờ phê duyệt" : "Tổng số yêu cầu"}
                                </p>
                                <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {activeTab === "completion" ? totalCount : (joinRequests.filter(r => !r.meta?.assignmentId).length + claimRequests.filter(r => r.status === 'pending').length)}
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
                                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${(loading || loadingHistory) ? "animate-spin" : ""}`} />
                                Làm mới
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={() => setActiveTab("completion")}
                                className={`w-full sm:flex-1 px-4 py-3 rounded-lg font-medium text-xs md:text-sm transition-all ${activeTab === "completion"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCheck size={18} />
                                    <span>Phê duyệt hoàn thành</span>
                                    {totalCount > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "completion" ? "bg-white/20" : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                                                }`}
                                        >
                                            {totalCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("requests")}
                                className={`w-full sm:flex-1 px-4 py-3 rounded-lg font-medium text-xs md:text-sm transition-all ${activeTab === "requests"
                                    ? "bg-green-600 text-white shadow-md"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <UserPlus size={18} />
                                    <span>Yêu cầu nhận việc</span>
                                    {(joinRequests.filter(r => !r.meta?.assignmentId).length + claimRequests.filter(r => r.status === 'pending').length) > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "requests" ? "bg-white/20" : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                                }`}
                                        >
                                            {joinRequests.filter(r => !r.meta?.assignmentId).length + claimRequests.filter(r => r.status === 'pending').length}
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`w-full sm:flex-1 px-4 py-3 rounded-lg font-medium text-xs md:text-sm transition-all ${activeTab === "history"
                                    ? "bg-purple-600 text-white shadow-md"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <History size={18} />
                                    <span>Lịch sử phê duyệt</span>
                                    {approvedHistory.length > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "history" ? "bg-white/20" : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                                <div className="relative flex-1 md:max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm công việc, nhân sự, dự án..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
                                    />
                                </div>
                                <select
                                    value={filter}
                                    onChange={e => setFilter(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full md:w-auto"
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Danh sách chờ phê duyệt ({totalCount})
                            </h2>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {totalCount === 0 ? (
                                <div className="p-12 text-center">
                                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Không có yêu cầu phê duyệt
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Tất cả công việc đã được xử lý hoặc chưa có yêu cầu mới.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {(filter === "all" || filter === "tasks") && filteredTasks.map(task => (
                                        <div key={`task-${task.id}`} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white break-words">
                                                            {task.tentask}
                                                        </h3>
                                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full whitespace-nowrap">
                                                            Công việc chính
                                                        </span>
                                                        {task.duan?.tenduan && (
                                                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full">
                                                                {task.duan.tenduan}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {task.mota && (
                                                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{task.mota}</p>
                                                    )}
                                                    <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
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
                                                <div className="flex w-full sm:w-auto flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 md:gap-3 md:ml-4">
                                                    <button
                                                        onClick={() => openApprovalModal(task, "task")}
                                                        className="w-full sm:flex-1 md:w-full px-3 py-2 text-xs md:text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-1 whitespace-nowrap"
                                                    >
                                                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span className="hidden sm:inline">Chi tiết</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(task, "task", true)}
                                                        disabled={processingApproval}
                                                        className="w-full sm:flex-1 md:w-full px-3 md:px-4 py-2 text-xs md:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
                                                    >
                                                        <CheckCheck className="w-3 h-3 md:w-4 md:h-4" />
                                                        Phê duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => openApprovalModal(task, "task")}
                                                        className="w-full sm:flex-1 md:w-full px-3 md:px-4 py-2 text-xs md:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1 whitespace-nowrap"
                                                    >
                                                        <X className="w-3 h-3 md:w-4 md:h-4" />
                                                        Từ chối
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(filter === "all" || filter === "subtasks") && filteredSubtasks.map(subtask => (
                                        <div key={`subtask-${subtask.id}`} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white break-words">
                                                            {subtask.tenSubtask}
                                                        </h3>
                                                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-full">
                                                            Công việc nhỏ
                                                        </span>
                                                        {subtask.task?.duan?.tenduan && (
                                                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full">
                                                                {subtask.task.duan.tenduan}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                                                        <span>Thuộc task:</span>
                                                        <span className="font-medium text-gray-800 dark:text-gray-200">{subtask.task?.tentask || "Không rõ"}</span>
                                                    </div>
                                                    {subtask.mota && (
                                                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{subtask.mota}</p>
                                                    )}
                                                    <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
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
                                                <div className="flex w-full sm:w-auto flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 md:gap-3 md:ml-4">
                                                    <button
                                                        onClick={() => openApprovalModal(subtask, "subtask")}
                                                        className="w-full sm:flex-1 md:w-full px-3 py-2 text-xs md:text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-1 whitespace-nowrap"
                                                    >
                                                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span className="hidden sm:inline">Chi tiết</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(subtask, "subtask", true)}
                                                        disabled={processingApproval}
                                                        className="w-full sm:flex-1 md:w-full px-3 md:px-4 py-2 text-xs md:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
                                                    >
                                                        <CheckCheck className="w-3 h-3 md:w-4 md:h-4" />
                                                        Phê duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => openApprovalModal(subtask, "subtask")}
                                                        className="w-full sm:flex-1 md:w-full px-3 md:px-4 py-2 text-xs md:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1 whitespace-nowrap"
                                                    >
                                                        <X className="w-3 h-3 md:w-4 md:h-4" />
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

                {activeTab === "requests" && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                                <div>
                                    <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                                        Yêu cầu nhận công việc ({(() => {
                                            const claimCount = requestFilter === "Tất cả yêu cầu" || requestFilter === "Yêu cầu nhận việc"
                                                ? claimRequests.filter(r => r.status === 'pending').length
                                                : 0;
                                            // Filter out joinRequests that have assignmentId to avoid duplicates
                                            const joinCount = requestFilter === "Tất cả yêu cầu" || requestFilter === "Yêu cầu chung"
                                                ? joinRequests.filter(r => !r.meta.processed && !r.meta.assignmentId).length
                                                : 0;
                                            return claimCount + joinCount;
                                        })()})
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bao gồm yêu cầu nhận task và yêu cầu tham gia nhóm</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={requestFilter}
                                        onChange={(e) => setRequestFilter(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="Tất cả yêu cầu">Tất cả yêu cầu</option>
                                        <option value="Yêu cầu nhận việc">Yêu cầu nhận việc</option>
                                        <option value="Yêu cầu chung">Yêu cầu chung</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {(joinRequests.length + claimRequests.length) === 0 ? (
                                <div className="p-12 text-center">
                                    <UserPlus className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Không có yêu cầu nhận việc
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400">Chưa có nhân viên nào yêu cầu nhận công việc.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Filter requests based on requestFilter */}
                                    {(() => {
                                        const filteredClaimRequests = requestFilter === "Tất cả yêu cầu" || requestFilter === "Yêu cầu nhận việc"
                                            ? claimRequests.filter(r => r.status === 'pending')
                                            : [];
                                        // Filter out joinRequests that have assignmentId (these are claim requests, already shown above)
                                        const filteredJoinRequests = requestFilter === "Tất cả yêu cầu" || requestFilter === "Yêu cầu chung"
                                            ? joinRequests.filter(r => !r.meta.processed && !r.meta.assignmentId)
                                            : [];

                                        return (
                                            <>
                                                {/* Claim Requests (Task Assignment Requests) */}
                                                {filteredClaimRequests.map(request => {
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
                                                        <div key={`claim-${request.id}`} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                                                        <div className={`w-2 h-2 rounded-full ${isSubtask ? 'bg-orange-500' : 'bg-indigo-500'}`}></div>
                                                                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white break-words">
                                                                            {itemName || 'Chưa đặt tên'}
                                                                        </h3>
                                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${isSubtask
                                                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                                                            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'
                                                                            }`}>
                                                                            Yêu cầu nhận {isSubtask ? 'subtask' : 'task'}
                                                                        </span>
                                                                        {projectName && (
                                                                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full">
                                                                                {projectName}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {isSubtask && parentTaskName && (
                                                                        <div className="flex items-center gap-2 mb-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                                                                            <span>Thuộc task:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-gray-200">{parentTaskName}</span>
                                                                        </div>
                                                                    )}

                                                                    {itemDesc && (
                                                                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{itemDesc}</p>
                                                                    )}

                                                                    <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                                                        {request.assignee && (
                                                                            <div className="flex items-center gap-1">
                                                                                <User className="w-3 h-3 md:w-4 md:h-4" />
                                                                                <span>👤 Người yêu cầu: <span className="font-medium text-blue-600 dark:text-blue-400">{request.assignee.hoten} ({request.assignee.manv})</span></span>
                                                                            </div>
                                                                        )}
                                                                        {taskCreator && (
                                                                            <div className="flex items-center gap-1">
                                                                                <UserPlus className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                                                                                <span>🎯 Người giao việc: <span className="font-medium text-green-600 dark:text-green-400">{taskCreator.hoten} ({taskCreator.manv})</span></span>
                                                                            </div>
                                                                        )}
                                                                        {request.manager && request.manager.id !== taskCreator?.id && (
                                                                            <div className="flex items-center gap-1">
                                                                                <User className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
                                                                                <span>👔 Manager: <span className="font-medium text-purple-600 dark:text-purple-400">{request.manager.hoten} ({request.manager.manv})</span></span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                                                            <span>Yêu cầu: {new Date(request.createdAt).toLocaleString("vi-VN")}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-row md:flex-col lg:flex-row items-stretch md:items-center gap-2 md:gap-3 md:ml-4 w-full md:w-auto">
                                                                    <button
                                                                        onClick={() => handleApproveClaim(request)}
                                                                        disabled={processingRequestId === request.id}
                                                                        className="flex-1 md:flex-none px-3 md:px-4 py-2 text-xs md:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
                                                                    >
                                                                        <CheckCheck className="w-3 h-3 md:w-4 md:h-4" />
                                                                        Phê duyệt
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const reason = prompt("Lý do từ chối (không bắt buộc):") || ""
                                                                            handleRejectClaim(request, reason)
                                                                        }}
                                                                        disabled={processingRequestId === request.id}
                                                                        className="flex-1 md:flex-none px-3 md:px-4 py-2 text-xs md:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
                                                                    >
                                                                        <X className="w-3 h-3 md:w-4 md:h-4" />
                                                                        Từ chối
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Join Requests (Group Membership Requests) */}
                                                {filteredJoinRequests.map(request => {
                                                    const isProcessed = request.meta?.processed === true
                                                    const action = request.meta?.action
                                                    const targetLabel = request.meta?.taskId
                                                        ? `Task #${request.meta.taskId}`
                                                        : request.meta?.subtaskId
                                                            ? `Subtask #${request.meta.subtaskId}`
                                                            : request.meta?.projectId
                                                                ? `Dự án #${request.meta.projectId}`
                                                                : "Yêu cầu chung"
                                                    const authorName = request.author?.hoten || request.author?.manv
                                                    const authorManv = request.author?.manv

                                                    return (
                                                        <div key={`join-${request.id}`} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white break-words">
                                                                            {request.title || "Yêu cầu tham gia công việc"}
                                                                        </h3>
                                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                                                                            {targetLabel}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-line">
                                                                        {request.content}
                                                                    </p>
                                                                    <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                                                       
                                                                        {request.author && (
                                                                            <div className="flex items-center gap-1">
                                                                                <UserPlus className="w-3 h-3 md:w-4 md:h-4" />
                                                                                <span>Người giao việc: <span className="font-medium text-green-600 dark:text-green-400">{authorManv ? `${authorName} (${authorManv})` : (authorName || "Chưa xác định")}</span></span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                                                            <span>Gửi lúc: {new Date(request.createdAt).toLocaleString("vi-VN")}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-row md:flex-col lg:flex-row items-stretch md:items-center gap-2 md:gap-3 md:ml-4 w-full md:w-auto">
                                                                    {isProcessed ? (
                                                                        <div className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium text-center ${action === "accepted" ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                                                                            {action === "accepted" ? "Đã chấp nhận" : "Đã từ chối"}
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleApproveJoin(request)}
                                                                                className="flex-1 md:flex-none px-3 md:px-4 py-2 text-xs md:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 whitespace-nowrap"
                                                                            >
                                                                                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                                                                                Phê duyệt
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleRejectJoin(request)}
                                                                                className="flex-1 md:flex-none px-3 md:px-4 py-2 text-xs md:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1 whitespace-nowrap"
                                                                            >
                                                                                <X className="w-3 h-3 md:w-4 md:h-4" />
                                                                                Từ chối
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )
                                    })()}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Lịch sử phê duyệt ({filteredHistory.length})
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setHistoryFilter("all")}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${historyFilter === "all"
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            }`}
                                    >
                                        Tất cả
                                    </button>
                                    <button
                                        onClick={() => setHistoryFilter("completion")}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${historyFilter === "completion"
                                            ? "bg-green-600 text-white shadow-sm"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            }`}
                                    >
                                        Phê duyệt hoàn thành
                                    </button>
                                    <button
                                        onClick={() => setHistoryFilter("assignment")}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${historyFilter === "assignment"
                                            ? "bg-purple-600 text-white shadow-sm"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                                        <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                                    ))}
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                                        {historyFilter === "all"
                                            ? "Chưa có lịch sử phê duyệt"
                                            : historyFilter === "completion"
                                                ? "Chưa có lịch sử phê duyệt hoàn thành"
                                                : "Chưa có lịch sử yêu cầu nhận việc"
                                        }
                                    </p>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
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
                                                className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md dark:hover:shadow-lg transition-all bg-white dark:bg-gray-800/50"
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
                                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{itemName}</h3>
                                                                    <span
                                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${isAssignment
                                                                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                                                            }`}
                                                                    >
                                                                        {isAssignment ? "✓ Đã chấp nhận" : "✓ Đã phê duyệt"}
                                                                    </span>
                                                                    <span
                                                                        className={`px-2 py-1 rounded-md text-xs font-medium ${isAssignment
                                                                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                                                            : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
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
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Dự án: {projectName}</p>
                                                                )}
                                                                {parentTaskName && (
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Thuộc: {parentTaskName}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteHistory(item)}
                                                                disabled={deletingHistoryId === `${item.type}-${item.id}`}
                                                                className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all disabled:opacity-50 flex-shrink-0"
                                                                title="Xóa lịch sử"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            {assignee && (
                                                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {isAssignment ? "Người được phân công" : "Người thực hiện"}
                                                                        </p>
                                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{assignee.hoten}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{assignee.manv}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {item.approver && (
                                                                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {isAssignment ? "Người chấp nhận" : "Người phê duyệt"}
                                                                        </p>
                                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.approver.hoten}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.approver.manv}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {isAssignment ? "Thời gian chấp nhận" : "Thời gian phê duyệt"}
                                                                    </p>
                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{approvalDate}</p>
                                                                    {approvalTime && <p className="text-xs text-gray-500 dark:text-gray-400">{approvalTime}</p>}
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

                            {/* History Pagination */}
                            {!loadingHistory && historyTotalPages > 1 && (
                                <div className="mt-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Hiển thị <span className="font-semibold text-gray-900 dark:text-white">{approvedHistory.length}</span> / <span className="font-semibold text-gray-900 dark:text-white">{historyTotalItems}</span> mục
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={historyCurrentPage === 1}
                                                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                            >
                                                Trước
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => {
                                                    let pageNum;
                                                    if (historyTotalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (historyCurrentPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (historyCurrentPage >= historyTotalPages - 2) {
                                                        pageNum = historyTotalPages - 4 + i;
                                                    } else {
                                                        pageNum = historyCurrentPage - 2 + i;
                                                    }

                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setHistoryCurrentPage(pageNum)}
                                                            className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${historyCurrentPage === pageNum
                                                                ? 'bg-blue-600 text-white shadow-md'
                                                                : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => setHistoryCurrentPage(prev => Math.min(historyTotalPages, prev + 1))}
                                                disabled={historyCurrentPage === historyTotalPages}
                                                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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

                {isModalOpen && selectedItem && (
                    <div className="fixed inset-0 backdrop-blur-[0px] flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Chi tiết {selectedItem.type === "task" ? "công việc" : "công việc nhỏ"}
                                    </h2>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        {selectedItem.type === "task" ? selectedItem.tentask : selectedItem.tenSubtask}
                                    </h3>
                                    {selectedItem.mota && <p className="text-gray-600 dark:text-gray-400">{selectedItem.mota}</p>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Người thực hiện</label>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {selectedItem.type === "task"
                                                ? selectedItem.nguoiDuocGiao?.hoten || "Chưa phân công"
                                                : selectedItem.nguoiThucHien?.hoten || "Chưa phân công"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</label>
                                        <span className="mt-1 inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-sm font-medium rounded-full">
                                            {selectedItem.trangThai}
                                        </span>
                                    </div>
                                    {modalManager && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Người giao</label>
                                            <p className="mt-1 text-gray-900 dark:text-white">{modalManager.hoten}</p>
                                        </div>
                                    )}
                                    {modalProject && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thuộc dự án</label>
                                            <p className="mt-1 text-gray-900 dark:text-white">{modalProject}</p>
                                        </div>
                                    )}
                                </div>
                                {selectedItem.type === "subtask" && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thuộc task</label>
                                        <p className="mt-1 text-gray-900 dark:text-white">{selectedItem.task?.tentask}</p>
                                    </div>
                                )}
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Lý do từ chối (tùy chọn)
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Nhập lý do nếu muốn từ chối yêu cầu..."
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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