"use client"
import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Users, CheckSquare, Clock, Calendar, RefreshCw } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'

interface ReportData {
    groupName: string
    totalMembers: number
    totalSubtasks: number
    completedSubtasks: number
    inProgressSubtasks: number
    pendingSubtasks: number
    completionRate: number
    memberStats: Array<{
        memberId: number
        memberName: string
        totalSubtasks: number
        completed: number
        inProgress: number
        pending: number
    }>
}

export default function TeamLeadReportsPage() {
    const { showError } = useToastContext()
    const [loading, setLoading] = useState(true)
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [timeRange, setTimeRange] = useState('all')

    useEffect(() => {
        loadReportData()
    }, [timeRange])

    const loadReportData = async () => {
        setLoading(true)
        try {
            // Load group info
            const groupRes = await api.get('/groups/my-group')
            const group = groupRes.data.group || groupRes.data

            // Load subtasks
            const subtasksRes = await api.get('/tasks/subtasks/group-subtasks')
            const subtasks = subtasksRes.data.subtasks || subtasksRes.data || []

            // Calculate stats
            const totalSubtasks = subtasks.length
            const completedSubtasks = subtasks.filter((s: any) => s.trangThai === 'Hoàn thành').length
            const inProgressSubtasks = subtasks.filter((s: any) => s.trangThai === 'Đang chạy').length
            const pendingSubtasks = subtasks.filter((s: any) => s.trangThai === 'Chưa bắt đầu').length
            const completionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0

            // Member stats
            const memberStatsMap = new Map()
            subtasks.forEach((subtask: any) => {
                const memberId = subtask.nguoiThucHien?.id
                const memberName = subtask.nguoiThucHien?.hoten || 'Chưa gán'
                
                if (!memberId) return

                if (!memberStatsMap.has(memberId)) {
                    memberStatsMap.set(memberId, {
                        memberId,
                        memberName,
                        totalSubtasks: 0,
                        completed: 0,
                        inProgress: 0,
                        pending: 0
                    })
                }

                const stats = memberStatsMap.get(memberId)
                stats.totalSubtasks++
                if (subtask.trangThai === 'Hoàn thành') stats.completed++
                else if (subtask.trangThai === 'Đang chạy') stats.inProgress++
                else if (subtask.trangThai === 'Chưa bắt đầu') stats.pending++
            })

            setReportData({
                groupName: group.name || 'Nhóm của tôi',
                totalMembers: group.members?.length || 0,
                totalSubtasks,
                completedSubtasks,
                inProgressSubtasks,
                pendingSubtasks,
                completionRate,
                memberStats: Array.from(memberStatsMap.values()).sort((a, b) => b.totalSubtasks - a.totalSubtasks)
            })

        } catch (error: any) {
            console.error('Load report error:', error)
            showError(error.response?.data?.message || 'Lỗi tải báo cáo')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-2xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (!reportData) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
                    <div className="text-center">
                        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Không có dữ liệu</h3>
                        <p className="text-gray-600">Chưa có dữ liệu báo cáo</p>
                    </div>
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <BarChart3 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Báo cáo tiến độ</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{reportData.groupName}</p>
                        </div>
                    </div>
                    <button
                        onClick={loadReportData}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium text-sm flex items-center gap-2 hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Thành viên</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.totalMembers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <CheckSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tổng công việc</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.totalSubtasks}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Đã hoàn thành</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.completedSubtasks}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.completionRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Phân bổ trạng thái</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Chưa bắt đầu</span>
                            <span className="text-lg font-bold text-gray-900">{reportData.pendingSubtasks}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-gray-500 h-2 rounded-full transition-all"
                                style={{ width: `${reportData.totalSubtasks > 0 ? (reportData.pendingSubtasks / reportData.totalSubtasks) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-700">Đang thực hiện</span>
                            <span className="text-lg font-bold text-blue-900">{reportData.inProgressSubtasks}</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${reportData.totalSubtasks > 0 ? (reportData.inProgressSubtasks / reportData.totalSubtasks) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-700">Hoàn thành</span>
                            <span className="text-lg font-bold text-green-900">{reportData.completedSubtasks}</span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${reportData.totalSubtasks > 0 ? (reportData.completedSubtasks / reportData.totalSubtasks) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Member Performance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Hiệu suất thành viên</h2>
                {reportData.memberStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Chưa có dữ liệu thành viên</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reportData.memberStats.map(member => {
                            const completionRate = member.totalSubtasks > 0 
                                ? Math.round((member.completed / member.totalSubtasks) * 100) 
                                : 0

                            return (
                                <div key={member.memberId} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                {member.memberName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{member.memberName}</h3>
                                                <p className="text-xs text-gray-600">
                                                    {member.totalSubtasks} công việc • {completionRate}% hoàn thành
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-600">{member.completed}</p>
                                            <p className="text-xs text-gray-600">Hoàn thành</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <p className="font-semibold text-gray-900">{member.pending}</p>
                                            <p className="text-gray-600">Chờ làm</p>
                                        </div>
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <p className="font-semibold text-blue-900">{member.inProgress}</p>
                                            <p className="text-blue-700">Đang làm</p>
                                        </div>
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <p className="font-semibold text-green-900">{member.completed}</p>
                                            <p className="text-green-700">Hoàn thành</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
