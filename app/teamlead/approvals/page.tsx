"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, User, Calendar, MessageSquare, CheckSquare } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'
import { showConfirm } from '@/lib/notifications'

interface PendingSubtask {
    id: number
    ten: string
    trangThai: string
    ngayKetThuc?: string
    ngayBatDau?: string
    nguoiThucHien?: { id: number; hoten: string; manv: string }
    task?: { id: number; tentask: string }
    moTa?: string
    ghiChu?: string
}

export default function TeamLeadApprovalsPage() {
    const { showError, showSuccess } = useToastContext()
    const [pendingSubtasks, setPendingSubtasks] = useState<PendingSubtask[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<number | null>(null)

    useEffect(() => {
        loadPendingApprovals()
    }, [])

    const loadPendingApprovals = async () => {
        setLoading(true)
        try {
            const res = await api.get('/approvals/pending')
            const subtasks = res.data.subtasks || res.data || []
            // Ensure it's an array
            setPendingSubtasks(Array.isArray(subtasks) ? subtasks : [])
        } catch (error: any) {
            console.error('Load approvals error:', error)
            showError(error.response?.data?.message || 'Lỗi tải danh sách phê duyệt')
            setPendingSubtasks([]) // Set empty array on error
        } finally {
            setLoading(false)
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

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Chưa có'
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Phê duyệt công việc</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {pendingSubtasks.length} công việc đang chờ phê duyệt
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={loadPendingApprovals}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium text-sm flex items-center gap-2 hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Chờ duyệt</p>
                            <p className="text-2xl font-bold text-gray-900">{pendingSubtasks.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Cần xử lý nhanh</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {pendingSubtasks.filter(s => {
                                    if (!s.ngayKetThuc) return false
                                    const daysLeft = Math.ceil((new Date(s.ngayKetThuc).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                    return daysLeft <= 2
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Quá hạn</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {pendingSubtasks.filter(s => {
                                    if (!s.ngayKetThuc) return false
                                    return new Date(s.ngayKetThuc) < new Date()
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

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
                                className={`bg-white rounded-2xl shadow-lg border-2 p-6 transition-all ${isOverdue ? 'border-red-300 bg-red-50/50' :
                                        isUrgent ? 'border-yellow-300 bg-yellow-50/50' :
                                            'border-gray-100 hover:border-amber-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                                                <CheckSquare className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{subtask.ten}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Công việc chính: <span className="font-semibold">{subtask.task?.tentask || 'N/A'}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleApprove(subtask.id, true)}
                                            disabled={processingId === subtask.id}
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-sm hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <CheckCircle size={18} />
                                            <span>Phê duyệt</span>
                                        </button>
                                        <button
                                            onClick={() => handleApprove(subtask.id, false)}
                                            disabled={processingId === subtask.id}
                                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-sm hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <XCircle size={18} />
                                            <span>Từ chối</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
