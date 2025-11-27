"use client"
import { useState, useEffect } from "react"
import {
    BarChart3,
    TrendingUp,
    Users,
    CheckSquare,
    Clock,
    RefreshCw,
    PieChart as PieChartIcon,
    BarChart2,
    LineChart,
    Target,
    Award,
    FileSpreadsheet
} from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'
import dynamic from "next/dynamic"
import * as XLSX from "xlsx"

// Lightweight inline chart components (fallbacks to show data reliably)
function MemberBars({ data }: { data: any[] }) {
    if (!data || !data.length) return <div className="text-center text-gray-500">Chưa có dữ liệu thành viên</div>
    return (
        <div className="h-72 overflow-y-auto">
            <div className="space-y-3 py-2">
                {data.map(member => (
                    <div key={member.memberId} className="flex items-center gap-3">
                        <div className="w-40 text-sm text-gray-700 truncate">{member.memberName}</div>
                        <div className="flex-1">
                            <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                                <div className="h-4 bg-gradient-to-r from-green-400 to-green-600" style={{ width: `${member.productivity}%` }} />
                            </div>
                        </div>
                        <div className="w-12 text-right text-sm font-semibold text-gray-800">{member.productivity}%</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Sparkline({ values }: { values: number[] }) {
    if (!values || values.length === 0) return <div className="text-center text-gray-500">Chưa có dữ liệu xu hướng</div>
    const w = 400
    const h = 140
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const points = values.map((v, i) => {
        const x = (i / (values.length - 1 || 1)) * w
        const y = h - ((v - min) / (max - min || 1)) * h
        return `${x},${y}`
    }).join(' ')

    return (
        <div className="flex items-center justify-center">
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
                <polyline points={points} fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    )
}

function Donut({ values, colors, labels }: { values: number[]; colors: string[]; labels?: string[] }) {
    const total = values.reduce((a, b) => a + b, 0) || 1
    let start = 0
    const segments = values.map((v, i) => {
        const perc = (v / total) * 100
        const seg = { start, end: start + perc, color: colors[i] || '#ccc', label: labels?.[i] }
        start += perc
        return seg
    })

    const gradient = segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')
    return (
        <div className="flex items-center justify-center">
            <div className="relative w-40 h-40 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-full shadow-inner flex items-center justify-center">
                        <div className="text-sm text-gray-700 font-semibold">{Math.round((values[2] || 0) / total * 100)}%</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

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
        overdue: number
        productivity: number
    }>
    overdueCount: number
    averageDuration: number
    weeklyTrend: Array<{ week: string; completed: number; inProgress: number; pending: number }>
}

export default function TeamLeadReportsPage() {
    const { showError } = useToastContext()
    const [loading, setLoading] = useState(true)
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [timeRange, setTimeRange] = useState<'all' | '7' | '30' | '90'>('all')
    const [selectedMember, setSelectedMember] = useState<number | 'all'>('all')
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        loadReportData()
    }, [timeRange])

    const loadReportData = async () => {
        setLoading(true)
        try {
            const groupRes = await api.get('/groups/my-group')
            const group = groupRes.data.group || groupRes.data

            const subtasksRes = await api.get('/tasks/subtasks/group-subtasks')
            let subtasks = subtasksRes.data.subtasks || subtasksRes.data || []

            // Debug logs to help trace why charts may be empty
            console.debug('[Reports] group:', group)
            console.debug('[Reports] initial subtasks count:', Array.isArray(subtasks) ? subtasks.length : 0)

            // Fallback: if no subtasks returned, try fetching tasks of the group and then their subtasks
            // This covers cases where backend exposes group subtasks via another endpoint
            if ((!subtasks || subtasks.length === 0)) {
                try {
                    const tasksRes = await api.get('/tasks/group/tasks')
                    const tasks = tasksRes.data.tasks || tasksRes.data || []
                    console.debug('[Reports] fallback fetched tasks count:', Array.isArray(tasks) ? tasks.length : 0)

                    const allSubtasks: any[] = []
                    for (const t of tasks) {
                        try {
                            const sRes = await api.get(`/tasks/${t.id}/subtasks`)
                            const sList = sRes.data || []
                            if (Array.isArray(sList) && sList.length) allSubtasks.push(...sList)
                        } catch (err) {
                            // ignore per-task failures
                        }
                    }

                    if (allSubtasks.length) {
                        subtasks = allSubtasks
                        console.debug('[Reports] fallback aggregated subtasks count:', subtasks.length)
                    }
                } catch (err) {
                    console.debug('[Reports] fallback tasks fetch failed', err)
                }
            }

            const now = new Date()
            const filterByRange = (dateStr?: string) => {
                if (timeRange === 'all' || !dateStr) return true
                const date = new Date(dateStr)
                if (isNaN(date.getTime())) return false
                const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
                if (timeRange === '7') return diff <= 7
                if (timeRange === '30') return diff <= 30
                if (timeRange === '90') return diff <= 90
                return true
            }

            const filteredSubtasks = subtasks.filter((s: any) => filterByRange(s.createdAt || s.ngayBatDau || s.updatedAt))

            const totalSubtasks = filteredSubtasks.length
            const completedSubtasks = filteredSubtasks.filter((s: any) => s.trangThai === 'Hoàn thành').length
            const inProgressSubtasks = filteredSubtasks.filter((s: any) => s.trangThai === 'Đang chạy').length
            const pendingSubtasks = filteredSubtasks.filter((s: any) => s.trangThai === 'Chưa bắt đầu').length
            const completionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0

            const overdueSubtasks = filteredSubtasks.filter((s: any) => {
                if (!s.ngayKetThuc) return false
                const due = new Date(s.ngayKetThuc)
                if (isNaN(due.getTime())) return false
                if (s.trangThai === 'Hoàn thành' && s.ngayHoanThanh) {
                    return new Date(s.ngayHoanThanh) > due
                }
                return due < now && s.trangThai !== 'Hoàn thành'
            })

            const weeklyBuckets = new Map<string, { completed: number; inProgress: number; pending: number }>()
            filteredSubtasks.forEach((subtask: any) => {
                const date = subtask.updatedAt || subtask.ngayKetThuc || subtask.ngayBatDau || subtask.createdAt
                if (!date) return
                const dt = new Date(date)
                if (isNaN(dt.getTime())) return
                const week = `${dt.getFullYear()}-W${String(Math.ceil(((dt.getDate() + new Date(dt.getFullYear(), dt.getMonth(), 1).getDay()) / 7))).padStart(2, '0')}`
                if (!weeklyBuckets.has(week)) {
                    weeklyBuckets.set(week, { completed: 0, inProgress: 0, pending: 0 })
                }
                const bucket = weeklyBuckets.get(week)!
                if (subtask.trangThai === 'Hoàn thành') bucket.completed++
                else if (subtask.trangThai === 'Đang chạy') bucket.inProgress++
                else bucket.pending++
            })

            const averageDuration = (() => {
                const durations: number[] = []
                filteredSubtasks.forEach((subtask: any) => {
                    if (!subtask.ngayBatDau || !subtask.ngayKetThuc) return
                    const start = new Date(subtask.ngayBatDau)
                    const end = new Date(subtask.ngayKetThuc)
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) return
                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                    if (duration >= 0) durations.push(duration)
                })
                if (!durations.length) return 0
                return Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
            })()

            const memberStatsMap = new Map()
            filteredSubtasks.forEach((subtask: any) => {
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
                        pending: 0,
                        overdue: 0,
                        productivity: 0
                    })
                }

                const stats = memberStatsMap.get(memberId)
                stats.totalSubtasks++
                if (subtask.trangThai === 'Hoàn thành') stats.completed++
                else if (subtask.trangThai === 'Đang chạy') stats.inProgress++
                else if (subtask.trangThai === 'Chưa bắt đầu') stats.pending++

                const isOverdue = overdueSubtasks.some((item: any) => item.id === subtask.id)
                if (isOverdue) stats.overdue++
            })

            memberStatsMap.forEach((stats: any) => {
                stats.productivity = stats.totalSubtasks ? Math.round((stats.completed / stats.totalSubtasks) * 100) : 0
            })

            setReportData({
                groupName: group.name || 'Nhóm của tôi',
                totalMembers: group.members?.length || 0,
                totalSubtasks,
                completedSubtasks,
                inProgressSubtasks,
                pendingSubtasks,
                completionRate,
                overdueCount: overdueSubtasks.length,
                averageDuration,
                weeklyTrend: Array.from(weeklyBuckets.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([week, value]) => ({ week, ...value })),
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
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={timeRange}
                            onChange={e => setTimeRange(e.target.value as typeof timeRange)}
                            className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200 text-sm"
                        >
                            <option value="all">Tất cả thời gian</option>
                            <option value="7">7 ngày gần nhất</option>
                            <option value="30">30 ngày gần nhất</option>
                            <option value="90">90 ngày gần nhất</option>
                        </select>
                        <select
                            value={selectedMember === 'all' ? 'all' : String(selectedMember)}
                            onChange={e => setSelectedMember(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200 text-sm"
                        >
                            <option value="all">Tất cả thành viên</option>
                            {reportData.memberStats.map(member => (
                                <option key={member.memberId} value={member.memberId}>{member.memberName}</option>
                            ))}
                        </select>
                        <button
                            onClick={loadReportData}
                            disabled={loading}
                            className="px-4 py-2.5 rounded-xl bg-white border border-green-200 text-green-600 font-medium text-sm flex items-center gap-2 hover:bg-green-50 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span>Làm mới</span>
                        </button>
                        <button
                            onClick={() => handleExport(reportData, setIsExporting, showError)}
                            disabled={isExporting}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm flex items-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                        >
                            <FileSpreadsheet size={16} />
                            {isExporting ? 'Đang xuất...' : 'Xuất báo cáo'}
                        </button>
                    </div>
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Công việc trễ hạn</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.overdueCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Thời gian thực hiện TB</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.averageDuration} ngày</p>
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-blue-500" /> Tỷ lệ hoàn thành theo thành viên</h2>
                        <span className="text-sm text-gray-500">% hoàn thành</span>
                    </div>
                    <div className="h-72">
                        <MemberBars data={reportData.memberStats} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><LineChart className="w-5 h-5 text-green-500" /> Xu hướng công việc theo tuần</h2>
                        <span className="text-sm text-gray-500">Cập nhật gần nhất</span>
                    </div>
                    <div className="h-72">
                        <Sparkline values={reportData.weeklyTrend.map(w => w.completed)} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-purple-500" /> Phân bổ trạng thái</h2>
                    </div>
                    <div className="h-72 flex items-center justify-center">
                        <Donut
                            values={[reportData.pendingSubtasks, reportData.inProgressSubtasks, reportData.completedSubtasks]}
                            colors={["#9ca3af", "#3b82f6", "#22c55e"]}
                            labels={["Chưa bắt đầu", "Đang chạy", "Hoàn thành"]}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Top 5 hiệu suất</h2>
                        <span className="text-sm text-gray-500">Theo % hoàn thành</span>
                    </div>
                    <div className="space-y-4">
                        {reportData.memberStats.slice(0, 5).map((member, idx) => (
                            <div key={member.memberId} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-gray-900">{member.memberName}</p>
                                        <span className="text-sm font-semibold text-green-600">{member.productivity}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                                        <div className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600" style={{ width: `${member.productivity}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Member Performance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Hiệu suất thành viên</h2>
                    {selectedMember !== 'all' && (
                        <button
                            onClick={() => setSelectedMember('all')}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Xem tất cả
                        </button>
                    )}
                </div>
                {reportData.memberStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Chưa có dữ liệu thành viên</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reportData.memberStats
                            .filter(member => selectedMember === 'all' || member.memberId === selectedMember)
                            .map(member => {
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
                                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
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
                                        <div className="p-2 bg-rose-100 rounded-lg">
                                            <p className="font-semibold text-rose-900">{member.overdue}</p>
                                            <p className="text-rose-700">Trễ hạn</p>
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

function handleExport(report: ReportData | null, setIsExporting: (value: boolean) => void, showError: (msg: string) => void) {
    if (!report) return
    try {
        setIsExporting(true)
        exportReport(report)
    } catch (error) {
        console.error('Export report error:', error)
        showError('Không thể xuất báo cáo')
    } finally {
        setIsExporting(false)
    }
}

function exportReport(report: ReportData) {
    if (!report) return

    const now = new Date()
    const date = now.toLocaleDateString('vi-VN').replace(//g, '')
    const time = now.toLocaleTimeString('vi-VN').replace(/:/g, '-')

    const overviewSheet = XLSX.utils.aoa_to_sheet([
        ['Tên nhóm', report.groupName],
        ['Tổng thành viên', report.totalMembers],
        ['Tổng công việc', report.totalSubtasks],
        ['Hoàn thành', report.completedSubtasks],
        ['Đang chạy', report.inProgressSubtasks],
        ['Chưa bắt đầu', report.pendingSubtasks],
        ['Trễ hạn', report.overdueCount],
        ['Tỷ lệ hoàn thành (%)', report.completionRate],
        ['Thời gian trung bình (ngày)', report.averageDuration]
    ])

    const memberSheet = XLSX.utils.json_to_sheet(report.memberStats.map(member => ({
        'Thành viên': member.memberName,
        'Tổng công việc': member.totalSubtasks,
        'Hoàn thành': member.completed,
        'Đang chạy': member.inProgress,
        'Chưa bắt đầu': member.pending,
        'Trễ hạn': member.overdue,
        'Hiệu suất (%)': member.productivity
    })))

    const trendSheet = XLSX.utils.json_to_sheet(report.weeklyTrend.map(item => ({
        'Tuần': item.week,
        'Hoàn thành': item.completed,
        'Đang chạy': item.inProgress,
        'Chưa bắt đầu': item.pending
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Tong quan')
    XLSX.utils.book_append_sheet(workbook, memberSheet, 'Thanh vien')
    XLSX.utils.book_append_sheet(workbook, trendSheet, 'Xu huong')
    XLSX.writeFile(workbook, `Bao_cao_nhom_${date}_${time}.xlsx`)
}
