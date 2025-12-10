"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, User, Calendar, MessageSquare, CheckSquare, UserPlus, History, Trash2 } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'
import { showConfirm } from '@/lib/notifications'
import { notificationUserAPI } from '@/axios/notificationAPI'
import { approvalAPI } from '@/axios/approvalApi'
import assignmentAPI from '@/axios/assignmentAPI'

interface PendingSubtask {
    id: number
    ten: string
    tenSubtask?: string
    trangThai: string
    ngayKetThuc?: string
    ngayBatDau?: string
    nguoiThucHien?: { id: number; hoten: string; manv: string }
    task?: { id: number; tentask: string }
    moTa?: string
    ghiChu?: string
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
        action?: 'accepted' | 'declined'
    }
}

interface ApprovedItem {
    id: number
    ten?: string
    tenSubtask?: string
    tentask?: string
    trangThai?: string
    approvedAt?: string
    acceptedAt?: string
    approvedBy?: number
    acceptedBy?: number
    assigneeId?: number
    nguoiThucHien?: { id: number; hoten: string; manv: string }
    nguoiDuocGiao?: { id: number; hoten: string; manv: string }
    assignee?: { id: number; hoten: string; manv: string }
    approver?: { id: number; hoten: string; manv: string }
    task?: { id: number; tentask: string; duan?: { id: number; tenduan: string } }
    subtask?: { id: number; tenSubtask: string; task?: { id: number; tentask: string; duan?: { id: number; tenduan: string } } }
    duan?: { id: number; tenduan: string }
    type?: 'task' | 'subtask' | 'assignment'
}

export default function TeamLeadApprovalsPage() {
    const { showError, showSuccess } = useToastContext()
    const [pendingSubtasks, setPendingSubtasks] = useState<PendingSubtask[]>([])
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
    const [approvedHistory, setApprovedHistory] = useState<ApprovedItem[]>([])
    const [historyFilter, setHistoryFilter] = useState<'all' | 'completion' | 'assignment'>('all')
    const [loading, setLoading] = useState(true)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null)
    const [infoMessage, setInfoMessage] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'completion' | 'join' | 'history'>('completion')

    useEffect(() => {
        loadPendingApprovals()
        loadJoinRequests()
    }, [])

    const loadPendingApprovals = async () => {
        setLoading(true)
        try {
            const res = await api.get('/approvals/pending')
            const dataWrapper = res.data?.data ?? res.data ?? {}
            const rawSubtasks = Array.isArray(dataWrapper.subtasks) ? dataWrapper.subtasks : []

            const normalizedSubtasks: PendingSubtask[] = rawSubtasks.map((item: any) => ({
                ...item,
                ten: item.ten || item.tenSubtask || item.tensubtask || 'Chưa đặt tên',
                trangThai: item.trangThai || item.status || 'Không rõ',
                task: item.task ? {
                    ...item.task,
                    tentask: item.task.tentask || item.task.tenTask || item.task.name || 'Chưa đặt tên'
                } : undefined
            }))

            setPendingSubtasks(normalizedSubtasks)
            setInfoMessage(res.data?.message || null)
        } catch (error: any) {
            console.error('Load approvals error:', error)
            showError(error.response?.data?.message || 'Lỗi tải danh sách phê duyệt')
            setPendingSubtasks([]) // Set empty array on error
            setInfoMessage(null)
        } finally {
            setLoading(false)
        }
    }

    const loadJoinRequests = async () => {
        try {
            const res = await assignmentAPI.getMyJoinRequests()
            const raw = Array.isArray(res.data) ? res.data : (res.data?.data || res.data || [])
            const requests = (raw || []).map((n: any) => ({
                id: String(n.id),
                title: n.title,
                content: n.content,
                createdAt: n.createdAt,
                isRead: n.isRead || (n.userNotification && n.userNotification.isRead) || false,
                meta: n.userMeta || n.meta || (n.userNotification && n.userNotification.meta)
            }))
            setJoinRequests(requests)
        } catch (error: any) {
            console.error('Load join requests error:', error)
            setJoinRequests([])
        }
    }

    const loadApprovedHistory = async () => {
        setLoadingHistory(true)
        try {
            const res = await approvalAPI.getApprovedHistory(100)
            const dataWrapper = res.data ?? res ?? {}
            const tasks = Array.isArray(dataWrapper.tasks) ? dataWrapper.tasks : []
            const subtasks = Array.isArray(dataWrapper.subtasks) ? dataWrapper.subtasks : []
            const assignments = Array.isArray(dataWrapper.assignments) ? dataWrapper.assignments : []

            const allItems: ApprovedItem[] = [
                ...tasks.map((t: any) => ({ ...t, type: 'task' as const })),
                ...subtasks.map((s: any) => ({ ...s, type: 'subtask' as const })),
                ...assignments.map((a: any) => ({ ...a, type: 'assignment' as const }))
            ].sort((a, b) => {
                const dateA = new Date(a.approvedAt || a.acceptedAt || 0).getTime()
                const dateB = new Date(b.approvedAt || b.acceptedAt || 0).getTime()
                return dateB - dateA
            })

            setApprovedHistory(allItems)
        } catch (error: any) {
            console.error('Load approved history error:', error)
            showError(error.message || 'Lỗi tải lịch sử phê duyệt')
            setApprovedHistory([])
        } finally {
            setLoadingHistory(false)
        }
    }

    const handleApprove = async (subtaskId: number, approved: boolean) => {
        const action = approved ? 'duyệt' : 'từ chối'
        const confirmed = await showConfirm(`Bạn có chắc chắn muốn ${action} công việc này?`)
        if (!confirmed) return

        setProcessingId(subtaskId)
        try {
            await api.post(`/approvals/subtasks/${subtaskId}/approve`, { approved })
            showSuccess(`${approved ? 'Phê duyệt' : 'Từ chối'} thành công!`)
            loadPendingApprovals()
        } catch (error: any) {
            console.error('Approval error:', error)
            showError(error.response?.data?.message || `Lỗi ${action} công việc`)
        } finally {
            setProcessingId(null)
        }
    }

    const handleAcceptRequest = async (request: JoinRequest) => {
        const confirmed = await showConfirm('Bạn có chắc chắn muốn chấp nhận yêu cầu này?')
        if (!confirmed) return

        setProcessingRequestId(request.id)
        try {
            await notificationUserAPI.acceptRequest({
                taskId: request.meta.taskId,
                subtaskId: request.meta.subtaskId,
                requesterId: request.meta.requesterId
            })
            showSuccess('Đã chấp nhận yêu cầu nhận việc')
            loadJoinRequests()
        } catch (error: any) {
            console.error('Accept request error:', error)
            showError(error.response?.data?.message || 'Lỗi khi chấp nhận yêu cầu')
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleDeclineRequest = async (request: JoinRequest) => {
        const reason = prompt('Lý do từ chối (không bắt buộc)') || ''
        const confirmed = await showConfirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')
        if (!confirmed) return

        setProcessingRequestId(request.id)
        try {
            await notificationUserAPI.declineRequest({
                taskId: request.meta.taskId,
                subtaskId: request.meta.subtaskId,
                requesterId: request.meta.requesterId,
                reason
            })
            showSuccess('Đã từ chối yêu cầu nhận việc')
            loadJoinRequests()
        } catch (error: any) {
            console.error('Decline request error:', error)
            showError(error.response?.data?.message || 'Lỗi khi từ chối yêu cầu')
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleDeleteRequest = async (requestId: string) => {
        const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa thông báo này?')
        if (!confirmed) return

        setProcessingRequestId(requestId)
        try {
            await notificationUserAPI.deleteNotification(requestId)
            showSuccess('Đã xóa thông báo')
            loadJoinRequests()
        } catch (error: any) {
            console.error('Delete request error:', error)
            showError(error.response?.data?.message || 'Lỗi khi xóa thông báo')
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleDeleteHistory = async (item: ApprovedItem) => {
        const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa lịch sử này?')
        if (!confirmed) return

        const itemId = `${item.type}-${item.id}`
        setDeletingHistoryId(itemId)
        try {
            await approvalAPI.deleteHistory({
                type: item.type || 'task',
                id: item.id
            })
            showSuccess('Đã xóa lịch sử phê duyệt')
            loadApprovedHistory()
        } catch (error: any) {
            console.error('Delete history error:', error)
            showError(error.response?.data?.message || 'Lỗi khi xóa lịch sử')
        } finally {
            setDeletingHistoryId(null)
        }
    }

    const filteredHistory = approvedHistory.filter(item => {
        if (historyFilter === 'all') return true
        if (historyFilter === 'completion') {
            return item.type === 'task' || item.type === 'subtask'
        }
        if (historyFilter === 'assignment') {
            return item.type === 'assignment'
        }
        return true
    })

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Chưa có'
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    if (loading) {
        return (
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-2xl"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Phê duyệt công việc</h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                {activeTab === 'completion'
                                    ? `${pendingSubtasks.length} công việc đang chờ phê duyệt hoàn thành`
                                    : `${joinRequests.length} yêu cầu nhận việc đang chờ`
                                }
                            </p>
                            {infoMessage && (
                                <p className="text-xs text-blue-600 mt-1">{infoMessage}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            loadPendingApprovals()
                            loadJoinRequests()
                            if (activeTab === 'history') {
                                loadApprovedHistory()
                            }
                        }}
                        disabled={loading || loadingHistory}
                        className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={(loading || loadingHistory) ? 'animate-spin' : ''} />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={() => setActiveTab('completion')}
                        className={`flex-1 px-3 sm:px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${activeTab === 'completion'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                            <CheckSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="text-center">Phê duyệt hoàn thành</span>
                            {pendingSubtasks.length > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'completion' ? 'bg-white/20' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {pendingSubtasks.length}
                                </span>
                            )}
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('join')}
                        className={`flex-1 px-3 sm:px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${activeTab === 'join'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                            <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="text-center">Yêu cầu nhận việc</span>
                            {joinRequests.length > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'join' ? 'bg-white/20' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {joinRequests.length}
                                </span>
                            )}
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('history')
                            if (approvedHistory.length === 0) {
                                loadApprovedHistory()
                            }
                        }}
                        className={`flex-1 px-3 sm:px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${activeTab === 'history'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                            <History size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="text-center">Lịch sử phê duyệt</span>
                            {approvedHistory.length > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'history' ? 'bg-white/20' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {approvedHistory.length}
                                </span>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600">Chờ duyệt</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{pendingSubtasks.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600">Cần xử lý nhanh</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {pendingSubtasks.filter(s => {
                                    if (!s.ngayKetThuc) return false
                                    const daysLeft = Math.ceil((new Date(s.ngayKetThuc).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                    return daysLeft <= 2
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600">Quá hạn</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {pendingSubtasks.filter(s => {
                                    if (!s.ngayKetThuc) return false
                                    return new Date(s.ngayKetThuc) < new Date()
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'completion' && (
                <>
                    {/* Pending Approvals List */}
                    {pendingSubtasks.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
                            <div className="text-center">
                                <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Không có công việc chờ duyệt</h3>
                                <p className="text-gray-600">Tất cả công việc đã được xử lý</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingSubtasks.map(subtask => {
                                const daysLeft = subtask.ngayKetThuc
                                    ? Math.ceil((new Date(subtask.ngayKetThuc).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                    : null
                                const isOverdue = daysLeft !== null && daysLeft < 0
                                const isUrgent = daysLeft !== null && daysLeft <= 2 && daysLeft >= 0

                                return (
                                    <div
                                        key={subtask.id}
                                        className={`bg-white rounded-2xl shadow-lg border-2 p-4 sm:p-6 transition-all ${isOverdue ? 'border-red-300 bg-red-50/50' :
                                            isUrgent ? 'border-yellow-300 bg-yellow-50/50' :
                                                'border-gray-100 hover:border-blue-200'
                                            }`}
                                    >
                                        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                                                {/* Header */}
                                                <div className="flex items-start gap-2 sm:gap-3">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                                        <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{subtask.ten}</h3>
                                                        <p className="text-xs sm:text-sm text-gray-600">
                                                            Công việc chính: <span className="font-semibold">{subtask.task?.tentask || 'N/A'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Info Grid */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Người thực hiện</p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {subtask.nguoiThucHien?.hoten || 'Chưa gán'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                        <Calendar className="w-5 h-5 text-purple-600" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Hạn hoàn thành</p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {formatDate(subtask.ngayKetThuc)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {subtask.moTa && (
                                                    <div className="p-4 bg-blue-50 rounded-xl">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <MessageSquare className="w-4 h-4 text-blue-600" />
                                                            <p className="text-xs font-semibold text-blue-900">Mô tả</p>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{subtask.moTa}</p>
                                                    </div>
                                                )}

                                                {/* Status Badge */}
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-semibold border border-yellow-200">
                                                        {subtask.trangThai}
                                                    </span>
                                                    {isOverdue && (
                                                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-semibold border border-red-200 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Quá hạn {Math.abs(daysLeft!)} ngày
                                                        </span>
                                                    )}
                                                    {isUrgent && (
                                                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-semibold border border-orange-200 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Còn {daysLeft} ngày
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
                                                <button
                                                    onClick={() => handleApprove(subtask.id, true)}
                                                    disabled={processingId === subtask.id}
                                                    className="flex-1 lg:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-xs sm:text-sm hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                                                >
                                                    <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                    <span>Phê duyệt</span>
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(subtask.id, false)}
                                                    disabled={processingId === subtask.id}
                                                    className="flex-1 lg:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-xs sm:text-sm hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                                                >
                                                    <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                    <span>Từ chối</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Join Requests Tab */}
            {activeTab === 'join' && (
                <>
                    {joinRequests.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
                            <div className="text-center">
                                <UserPlus className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Không có yêu cầu nhận việc</h3>
                                <p className="text-gray-600">Chưa có nhân viên nào yêu cầu nhận công việc</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {joinRequests.map(request => {
                                return (
                                    <div
                                        key={request.id}
                                        className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-200 p-4 sm:p-6 transition-all"
                                    >
                                        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                                        <UserPlus className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-lg font-bold text-gray-900">{request.title}</h3>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{request.content}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <Calendar className="w-5 h-5 text-purple-600" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Thời gian yêu cầu</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {new Date(request.createdAt).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
                                                <button
                                                    onClick={() => handleAcceptRequest(request)}
                                                    disabled={processingRequestId === request.id}
                                                    className="flex-1 lg:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-xs sm:text-sm hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                                                >
                                                    <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                    <span>Chấp nhận</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeclineRequest(request)}
                                                    disabled={processingRequestId === request.id}
                                                    className="flex-1 lg:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-xs sm:text-sm hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                                                >
                                                    <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                    <span>Từ chối</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="space-y-4 sm:space-y-6">
                    {/* Filter Header */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                                Lịch sử phê duyệt ({filteredHistory.length})
                            </h2>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setHistoryFilter('all')}
                                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${historyFilter === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setHistoryFilter('completion')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${historyFilter === 'completion'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Hoàn thành
                                </button>
                                <button
                                    onClick={() => setHistoryFilter('assignment')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${historyFilter === 'assignment'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Nhận việc
                                </button>
                            </div>
                        </div>
                    </div>

                    {loadingHistory ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">Chưa có lịch sử phê duyệt</p>
                            <p className="text-gray-400 text-sm mt-2">Các công việc đã được phê duyệt sẽ hiển thị ở đây</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredHistory.map((item) => {
                                const itemName = item.type === 'task'
                                    ? (item.ten || item.tentask || 'Chưa đặt tên')
                                    : item.type === 'subtask'
                                        ? (item.tenSubtask || item.ten || 'Chưa đặt tên')
                                        : item.subtask
                                            ? item.subtask.tenSubtask
                                            : item.task
                                                ? item.task.tentask
                                                : 'Chưa đặt tên'

                                const assignee = item.assignee || item.nguoiDuocGiao || item.nguoiThucHien

                                const projectName = item.type === 'task'
                                    ? item.duan?.tenduan
                                    : item.type === 'subtask'
                                        ? item.task?.duan?.tenduan
                                        : item.subtask
                                            ? item.subtask.task?.duan?.tenduan
                                            : item.task?.duan?.tenduan

                                const parentTaskName = item.type === 'subtask'
                                    ? item.task?.tentask
                                    : item.subtask
                                        ? item.subtask.task?.tentask
                                        : null

                                const approvalDate = item.approvedAt || item.acceptedAt || ''
                                const isAssignment = item.type === 'assignment'

                                return (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-all"
                                    >
                                        <div className="flex flex-col lg:flex-row items-start justify-between gap-4 sm:gap-6">
                                            <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isAssignment
                                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                            : 'bg-gradient-to-br from-green-500 to-green-600'
                                                        }`}>
                                                        <CheckCircle className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-lg font-bold text-gray-900">{itemName}</h3>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isAssignment
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-green-100 text-green-700'
                                                                }`}>
                                                                {isAssignment ? '✓ Đã chấp nhận' : '✓ Đã phê duyệt'}
                                                            </span>
                                                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
                                                                {item.type === 'task' ? 'Công việc' : item.type === 'subtask' ? 'Công việc nhỏ' : 'Yêu cầu nhận việc'}
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

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {assignee && (
                                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                                            <User className="w-5 h-5 text-blue-600" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">{isAssignment ? 'Người được phân công' : 'Người thực hiện'}</p>
                                                                <p className="text-sm font-semibold text-gray-900">{assignee.hoten}</p>
                                                                <p className="text-xs text-gray-500">{assignee.manv}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {item.approver && (
                                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">{isAssignment ? 'Người chấp nhận' : 'Người phê duyệt'}</p>
                                                                <p className="text-sm font-semibold text-gray-900">{item.approver.hoten}</p>
                                                                <p className="text-xs text-gray-500">{item.approver.manv}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                                        <Calendar className="w-5 h-5 text-purple-600" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">{isAssignment ? 'Thời gian chấp nhận' : 'Thời gian phê duyệt'}</p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {new Date(approvalDate).toLocaleDateString('vi-VN', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric'
                                                                })}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(approvalDate).toLocaleTimeString('vi-VN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
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
            )}
        </div>
    )
}
