"use client"

import { useState, useEffect } from "react"
import { 
    Clock, CheckCircle2, XCircle, Eye, FileText, Calendar,
    User, MessageSquare, AlertTriangle, Filter, RefreshCw,
    CheckCheck, X, Search
} from "lucide-react"
import { approvalAPI } from "@/axios/approvalApi"
import { useToastContext } from "@/components/providers/toast-provider"

interface PendingTask {
    id: number
    tentask: string
    mota?: string
    trangThai: string
    ngayKetThuc?: string
    nguoiDuocGiao: {
        id: number
        hoten: string
        manv: string
    }
    nguoiGiao: {
        id: number
        hoten: string
        manv: string
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
    nguoiThucHien: {
        id: number
        hoten: string
        manv: string
    }
    task: {
        id: number
        tentask: string
        nguoiGiao: {
            id: number
            hoten: string
            manv: string
        }
    }
    createdAt: string
    updatedAt: string
}

export default function ApprovalsPage() {
    const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([])
    const [pendingSubtasks, setPendingSubtasks] = useState<PendingSubtask[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'tasks' | 'subtasks'>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [processingApproval, setProcessingApproval] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const { showSuccess, showError } = useToastContext()

    useEffect(() => {
        loadPendingApprovals()
    }, [filter])

    const loadPendingApprovals = async () => {
        setLoading(true)
        try {
            const data = await approvalAPI.getPendingApprovals(filter)
            setPendingTasks(data.data.tasks || [])
            setPendingSubtasks(data.data.subtasks || [])
        } catch (error: any) {
            showError(error.message || 'Không thể tải danh sách phê duyệt')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (item: any, type: 'task' | 'subtask', approved: boolean) => {
        setProcessingApproval(true)
        try {
            if (type === 'task') {
                await approvalAPI.approveTask(item.id, approved, approved ? '' : rejectReason)
            } else {
                await approvalAPI.approveSubtask(item.id, approved, approved ? '' : rejectReason)
            }
            
            showSuccess(approved ? 'Đã phê duyệt thành công' : 'Đã từ chối yêu cầu')
            setIsModalOpen(false)
            setSelectedItem(null)
            setRejectReason('')
            loadPendingApprovals()
        } catch (error: any) {
            showError(error.message || 'Lỗi khi xử lý phê duyệt')
        } finally {
            setProcessingApproval(false)
        }
    }

    const openApprovalModal = (item: any, type: 'task' | 'subtask') => {
        setSelectedItem({ ...item, type })
        setIsModalOpen(true)
        setRejectReason('')
    }

    // Lọc và tìm kiếm
    const filteredTasks = pendingTasks.filter(task => 
        task.tentask.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.nguoiDuocGiao.hoten.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredSubtasks = pendingSubtasks.filter(subtask => 
        subtask.tenSubtask.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subtask.nguoiThucHien.hoten.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subtask.task.tentask.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalCount = filteredTasks.length + filteredSubtasks.length

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    {/* Loading skeleton */}
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                                    <div className="flex-1">
                                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                                    </div>
                                </div>
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
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Phê duyệt hoàn thành công việc
                            </h1>
                            <p className="text-gray-600">
                                Quản lý các yêu cầu xác nhận hoàn thành từ nhân viên
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Tổng số chờ phê duyệt</p>
                                <p className="text-2xl font-bold text-orange-600">{totalCount}</p>
                            </div>
                            <button
                                onClick={loadPendingApprovals}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Làm mới
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm công việc..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                                    />
                                </div>
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="tasks">Chỉ công việc chính</option>
                                    <option value="subtasks">Chỉ công việc nhỏ</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Approvals List */}
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
                                {/* Tasks */}
                                {(filter === 'all' || filter === 'tasks') && filteredTasks.map(task => (
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
                                                </div>
                                                
                                                {task.mota && (
                                                    <p className="text-gray-600 mb-3 line-clamp-2">{task.mota}</p>
                                                )}
                                                
                                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        <span>Người thực hiện: {task.nguoiDuocGiao.hoten}</span>
                                                    </div>
                                                    {task.ngayKetThuc && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Deadline: {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Gửi yêu cầu: {formatDate(task.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 ml-4">
                                                <button
                                                    onClick={() => openApprovalModal(task, 'task')}
                                                    className="px-3 py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Chi tiết
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(task, 'task', true)}
                                                    disabled={processingApproval}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    <CheckCheck className="w-4 h-4" />
                                                    Phê duyệt
                                                </button>
                                                <button
                                                    onClick={() => openApprovalModal(task, 'task')}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Từ chối
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Subtasks */}
                                {(filter === 'all' || filter === 'subtasks') && filteredSubtasks.map(subtask => (
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
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-sm text-gray-500">Thuộc task:</span>
                                                    <span className="text-sm font-medium text-gray-700">{subtask.task.tentask}</span>
                                                </div>
                                                
                                                {subtask.mota && (
                                                    <p className="text-gray-600 mb-3 line-clamp-2">{subtask.mota}</p>
                                                )}
                                                
                                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        <span>Người thực hiện: {subtask.nguoiThucHien.hoten}</span>
                                                    </div>
                                                    {subtask.ngayKetThuc && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Deadline: {new Date(subtask.ngayKetThuc).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Gửi yêu cầu: {formatDate(subtask.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 ml-4">
                                                <button
                                                    onClick={() => openApprovalModal(subtask, 'subtask')}
                                                    className="px-3 py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Chi tiết
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(subtask, 'subtask', true)}
                                                    disabled={processingApproval}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    <CheckCheck className="w-4 h-4" />
                                                    Phê duyệt
                                                </button>
                                                <button
                                                    onClick={() => openApprovalModal(subtask, 'subtask')}
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

                {/* Approval Modal */}
                {isModalOpen && selectedItem && (
                    <div className="fixed inset-0 backdrop-blur-[0px] flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Chi tiết {selectedItem.type === 'task' ? 'công việc' : 'công việc nhỏ'}
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
                                        {selectedItem.type === 'task' ? selectedItem.tentask : selectedItem.tenSubtask}
                                    </h3>
                                    {selectedItem.mota && (
                                        <p className="text-gray-600">{selectedItem.mota}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Người thực hiện</label>
                                        <p className="mt-1 text-gray-900">
                                            {selectedItem.type === 'task' 
                                                ? selectedItem.nguoiDuocGiao.hoten 
                                                : selectedItem.nguoiThucHien.hoten
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                                        <span className="mt-1 inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                                            {selectedItem.trangThai}
                                        </span>
                                    </div>
                                </div>

                                {selectedItem.type === 'subtask' && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Thuộc task</label>
                                        <p className="mt-1 text-gray-900">{selectedItem.task.tentask}</p>
                                    </div>
                                )}

                                {/* Rejection reason input */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Lý do từ chối (tùy chọn)
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Nhập lý do nếu muốn từ chối yêu cầu..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                    />
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleApprove(selectedItem, selectedItem.type, true)}
                                        disabled={processingApproval}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                        {processingApproval ? 'Đang xử lý...' : 'Phê duyệt hoàn thành'}
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedItem, selectedItem.type, false)}
                                        disabled={processingApproval}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        {processingApproval ? 'Đang xử lý...' : 'Từ chối yêu cầu'}
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