"use client"
import { useEffect, useState } from 'react'
import { Users, CheckSquare, ClipboardCheck, TrendingUp, Clock, Award, AlertCircle, ChevronRight, Calendar } from 'lucide-react'
import api from '@/axios/config'
import Link from 'next/link'
import { useToastContext } from '@/components/providers/toast-provider'

interface DashboardStats {
    totalMembers: number
    totalSubtasks: number
    pendingSubtasks: number
    completedSubtasks: number
    inProgressSubtasks: number
    pendingApprovals: number
    completionRate: number
    groupName: string
    groupDescription: string
}

interface RecentSubtask {
    id: number
    ten: string
    trangThai: string
    ngayHetHan: string
    assignee?: { hoten: string }
}

export default function TeamLeadDashboard() {
    const { showError } = useToastContext()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        totalMembers: 0,
        totalSubtasks: 0,
        pendingSubtasks: 0,
        completedSubtasks: 0,
        inProgressSubtasks: 0,
        pendingApprovals: 0,
        completionRate: 0,
        groupName: '',
        groupDescription: ''
    })
    const [recentSubtasks, setRecentSubtasks] = useState<RecentSubtask[]>([])

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            // Lấy thông tin nhóm của teamlead
            const groupRes = await api.get('/groups/my-group')
            const group = groupRes.data.group || groupRes.data

            // Lấy subtasks của nhóm
            const subtasksRes = await api.get('/tasks/subtasks/group-subtasks')
            const subtasks = subtasksRes.data.subtasks || subtasksRes.data || []

            // Lấy pending approvals
            const approvalsRes = await api.get('/approvals/pending')
            const pendingApprovals = approvalsRes.data.subtasks?.length || 0

            // Tính toán stats
            const totalSubtasks = subtasks.length
            const completedSubtasks = subtasks.filter((s: any) => s.trangThai === 'Hoàn thành').length
            const inProgressSubtasks = subtasks.filter((s: any) => s.trangThai === 'Đang chạy').length
            const pendingSubtasks = subtasks.filter((s: any) => s.trangThai === 'Chưa bắt đầu').length
            const completionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0

            setStats({
                totalMembers: group.members?.length || 0,
                totalSubtasks,
                pendingSubtasks,
                completedSubtasks,
                inProgressSubtasks,
                pendingApprovals,
                completionRate,
                groupName: group.name || 'Nhóm của tôi',
                groupDescription: group.description || ''
            })

            // Lấy 5 subtasks gần nhất
            setRecentSubtasks(subtasks.slice(0, 5))

        } catch (error: any) {
            console.error('Load dashboard error:', error)
            showError(error.response?.data?.message || 'Lỗi tải dữ liệu dashboard')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hoàn thành': return 'bg-green-100 text-green-800 border-green-200'
            case 'Đang chạy': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'Chưa bắt đầu': return 'bg-gray-100 text-gray-800 border-gray-200'
            case 'Đang chờ duyệt': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Chưa có'
        const date = new Date(dateStr)
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Chào mừng, Team Leader!</h1>
                <p className="text-purple-100">Tổng quan nhóm: <span className="font-semibold">{stats.groupName}</span></p>
                {stats.groupDescription && (
                    <p className="text-sm text-purple-200 mt-1">{stats.groupDescription}</p>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Members */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Thành viên</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalMembers}</h3>
                        <p className="text-sm text-gray-600">Tổng số thành viên</p>
                    </div>
                </div>

                {/* Total Subtasks */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <CheckSquare className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Công việc</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalSubtasks}</h3>
                        <p className="text-sm text-gray-600">Tổng công việc con</p>
                    </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                            <ClipboardCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Chờ duyệt</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-gray-900">{stats.pendingApprovals}</h3>
                        <p className="text-sm text-gray-600">Cần phê duyệt</p>
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Tiến độ</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-gray-900">{stats.completionRate}%</h3>
                        <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
                    </div>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Chưa bắt đầu</h3>
                            <p className="text-sm text-gray-600">{stats.pendingSubtasks} công việc</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                            className="bg-gray-500 h-2 rounded-full transition-all"
                            style={{ width: `${stats.totalSubtasks > 0 ? (stats.pendingSubtasks / stats.totalSubtasks) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Đang thực hiện</h3>
                            <p className="text-sm text-gray-600">{stats.inProgressSubtasks} công việc</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${stats.totalSubtasks > 0 ? (stats.inProgressSubtasks / stats.totalSubtasks) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Award className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Hoàn thành</h3>
                            <p className="text-sm text-gray-600">{stats.completedSubtasks} công việc</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${stats.totalSubtasks > 0 ? (stats.completedSubtasks / stats.totalSubtasks) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Recent Subtasks & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Subtasks */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Công việc gần đây</h3>
                        <Link 
                            href="/teamlead/subtasks"
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                            Xem tất cả
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                    {recentSubtasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Chưa có công việc nào</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentSubtasks.map(subtask => (
                                <div key={subtask.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                                    <div className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(subtask.trangThai)}`}>
                                        {subtask.trangThai}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{subtask.ten}</p>
                                        <p className="text-xs text-gray-600">
                                            {subtask.assignee?.hoten || 'Chưa gán'} • {formatDate(subtask.ngayHetHan)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
                    <div className="space-y-3">
                        <Link
                            href="/teamlead/group"
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-blue-700">Nhóm của tôi</p>
                                <p className="text-xs text-gray-600">Quản lý thành viên</p>
                            </div>
                            <ChevronRight className="text-gray-400 group-hover:text-blue-600" size={20} />
                        </Link>

                        <Link
                            href="/teamlead/subtasks"
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                                <CheckSquare className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-purple-700">Công việc con</p>
                                <p className="text-xs text-gray-600">Quản lý subtasks</p>
                            </div>
                            <ChevronRight className="text-gray-400 group-hover:text-purple-600" size={20} />
                        </Link>

                        <Link
                            href="/teamlead/approvals"
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center relative">
                                <ClipboardCheck className="w-5 h-5 text-white" />
                                {stats.pendingApprovals > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {stats.pendingApprovals}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-amber-700">Phê duyệt</p>
                                <p className="text-xs text-gray-600">
                                    {stats.pendingApprovals} cần duyệt
                                </p>
                            </div>
                            <ChevronRight className="text-gray-400 group-hover:text-amber-600" size={20} />
                        </Link>

                        <Link
                            href="/teamlead/reports"
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-green-700">Báo cáo</p>
                                <p className="text-xs text-gray-600">Xem tiến độ</p>
                            </div>
                            <ChevronRight className="text-gray-400 group-hover:text-green-600" size={20} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
