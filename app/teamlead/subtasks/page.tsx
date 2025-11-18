"use client"
import { useState, useEffect } from "react"
import { Search, Filter, CheckSquare, Clock, AlertCircle, RefreshCw, Eye, Edit, User, Calendar } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'

interface Subtask {
    id: number
    ten: string
    trangThai: string
    ngayKetThuc?: string
    ngayBatDau?: string
    nguoiThucHien?: { id: number; hoten: string; manv: string }
    task?: { id: number; tentask: string; duan?: { id: number; tenduan: string } }
}

export default function TeamLeadSubtasksPage() {
    const { showError, showSuccess } = useToastContext()
    const [subtasks, setSubtasks] = useState<Subtask[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    useEffect(() => {
        loadSubtasks()
    }, [])

    const loadSubtasks = async () => {
        setLoading(true)
        try {
            const res = await api.get('/tasks/subtasks/group-subtasks')
            setSubtasks(res.data.subtasks || res.data || [])
        } catch (error: any) {
            console.error('Load subtasks error:', error)
            showError(error.response?.data?.message || 'Lỗi tải danh sách công việc con')
        } finally {
            setLoading(false)
        }
    }

    const filteredSubtasks = subtasks.filter(subtask => {
        const matchesSearch = (subtask.ten?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (subtask.task?.tentask?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || subtask.trangThai === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hoàn thành': return 'bg-green-100 text-green-800 border-green-200'
            case 'Đang chạy': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'Chưa bắt đầu': return 'bg-gray-100 text-gray-800 border-gray-200'
            case 'Đang chờ duyệt': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Chưa có'
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const groupedByStatus = {
        'Chưa bắt đầu': filteredSubtasks.filter(s => s.trangThai === 'Chưa bắt đầu'),
        'Đang chạy': filteredSubtasks.filter(s => s.trangThai === 'Đang chạy'),
        'Đang chờ duyệt': filteredSubtasks.filter(s => s.trangThai === 'Đang chờ duyệt'),
        'Hoàn thành': filteredSubtasks.filter(s => s.trangThai === 'Hoàn thành'),
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <CheckSquare className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Công việc con</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả công việc con của nhóm</p>
                        </div>
                    </div>
                    <button
                        onClick={loadSubtasks}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium text-sm flex items-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm công việc..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang chạy">Đang chạy</option>
                        <option value="Đang chờ duyệt">Đang chờ duyệt</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">Tổng số: <span className="text-purple-600 font-bold">{filteredSubtasks.length}</span> công việc</span>
                </div>
            </div>

            {/* Kanban View */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-96 bg-gray-200 rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(groupedByStatus).map(([status, items]) => (
                        <div key={status} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                <h3 className="font-bold text-gray-900">{status}</h3>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                    {items.length}
                                </span>
                            </div>
                            <div className="space-y-3 overflow-y-auto flex-1">
                                {items.map(subtask => (
                                    <div key={subtask.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200">
                                        <div className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold border mb-2 ${getStatusColor(subtask.trangThai)}`}>
                                            {subtask.trangThai}
                                        </div>
                                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{subtask.ten}</h4>
                                        <div className="space-y-2 text-xs text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <CheckSquare className="w-4 h-4 text-purple-600" />
                                                <span className="truncate">{subtask.task?.tentask || 'N/A'}</span>
                                            </div>
                                            {subtask.nguoiThucHien && (
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                    <span className="truncate">{subtask.nguoiThucHien.hoten}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-amber-600" />
                                                <span>{formatDate(subtask.ngayKetThuc)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-sm">Không có công việc</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
