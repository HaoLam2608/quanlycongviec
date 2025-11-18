"use client"
import { useState, useEffect } from "react"
import { Search, TrendingUp, Award, AlertCircle, BarChart3, Target, Clock, CheckCircle, User, Calendar } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'

interface MemberPerformance {
    userId: number
    hoten: string
    manv: string
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    totalHours: number
    averageCompletionTime: number
    qualityScore: number
    onTimeRate: number
    tasksByPriority: {
        high: number
        medium: number
        low: number
    }
    recentActivity: {
        date: string
        type: string
        description: string
    }[]
}

export default function TeamLeadPerformancePage() {
    const { showError } = useToastContext()
    const [members, setMembers] = useState<MemberPerformance[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState<string>("completionRate")
    const [selectedMember, setSelectedMember] = useState<MemberPerformance | null>(null)

    useEffect(() => {
        loadPerformance()
    }, [])

    const loadPerformance = async () => {
        setLoading(true)
        try {
            // API endpoint để lấy hiệu suất của các thành viên trong nhóm
            const res = await api.get('/members/performance')
            setMembers(res.data.members || res.data || [])
        } catch (error: any) {
            console.error('Load performance error:', error)
            showError(error.response?.data?.message || 'Lỗi tải dữ liệu hiệu suất')
        } finally {
            setLoading(false)
        }
    }

    const getCompletionRate = (member: MemberPerformance) => {
        if (member.totalTasks === 0) return 0
        return Math.round((member.completedTasks / member.totalTasks) * 100)
    }

    const getPerformanceLevel = (score: number) => {
        if (score >= 90) return { label: 'Xuất sắc', color: 'text-green-700 bg-green-100', icon: '🏆' }
        if (score >= 75) return { label: 'Tốt', color: 'text-blue-700 bg-blue-100', icon: '⭐' }
        if (score >= 60) return { label: 'Khá', color: 'text-yellow-700 bg-yellow-100', icon: '👍' }
        return { label: 'Cần cải thiện', color: 'text-red-700 bg-red-100', icon: '⚠️' }
    }

    const sortedMembers = [...members].sort((a, b) => {
        switch (sortBy) {
            case 'completionRate':
                return getCompletionRate(b) - getCompletionRate(a)
            case 'qualityScore':
                return b.qualityScore - a.qualityScore
            case 'totalHours':
                return b.totalHours - a.totalHours
            case 'onTimeRate':
                return b.onTimeRate - a.onTimeRate
            default:
                return 0
        }
    })

    const filteredMembers = sortedMembers.filter(member =>
        member.hoten.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.manv.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const teamAverage = {
        completionRate: Math.round(members.reduce((sum, m) => sum + getCompletionRate(m), 0) / (members.length || 1)),
        qualityScore: Math.round(members.reduce((sum, m) => sum + m.qualityScore, 0) / (members.length || 1)),
        totalHours: members.reduce((sum, m) => sum + m.totalHours, 0),
        onTimeRate: Math.round(members.reduce((sum, m) => sum + m.onTimeRate, 0) / (members.length || 1))
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Hiệu Suất Thành Viên</h1>
                <p className="text-gray-600 mt-1">Theo dõi và đánh giá năng suất làm việc của nhóm</p>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-8 h-8" />
                        <span className="text-sm opacity-90">Tỷ lệ hoàn thành</span>
                    </div>
                    <p className="text-3xl font-bold">{teamAverage.completionRate}%</p>
                    <p className="text-sm opacity-75 mt-1">Trung bình nhóm</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="w-8 h-8" />
                        <span className="text-sm opacity-90">Chất lượng</span>
                    </div>
                    <p className="text-3xl font-bold">{teamAverage.qualityScore}/100</p>
                    <p className="text-sm opacity-75 mt-1">Điểm trung bình</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-8 h-8" />
                        <span className="text-sm opacity-90">Tổng giờ làm</span>
                    </div>
                    <p className="text-3xl font-bold">{teamAverage.totalHours}h</p>
                    <p className="text-sm opacity-75 mt-1">Cả nhóm</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Target className="w-8 h-8" />
                        <span className="text-sm opacity-90">Đúng deadline</span>
                    </div>
                    <p className="text-3xl font-bold">{teamAverage.onTimeRate}%</p>
                    <p className="text-sm opacity-75 mt-1">Trung bình nhóm</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc mã nhân viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    >
                        <option value="completionRate">Sắp xếp: Tỷ lệ hoàn thành</option>
                        <option value="qualityScore">Sắp xếp: Điểm chất lượng</option>
                        <option value="totalHours">Sắp xếp: Tổng giờ làm</option>
                        <option value="onTimeRate">Sắp xếp: Đúng deadline</option>
                    </select>
                </div>
            </div>

            {/* Members List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredMembers.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">Không có dữ liệu thành viên</p>
                    </div>
                ) : (
                    filteredMembers.map(member => {
                        const completionRate = getCompletionRate(member)
                        const performanceLevel = getPerformanceLevel(member.qualityScore)
                        
                        return (
                            <div
                                key={member.userId}
                                onClick={() => setSelectedMember(member)}
                                className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                                            {member.hoten.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{member.hoten}</h3>
                                            <p className="text-sm text-gray-600">{member.manv}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${performanceLevel.color}`}>
                                        {performanceLevel.icon} {performanceLevel.label}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-600 mb-1">Hoàn thành</p>
                                        <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
                                        <p className="text-xs text-gray-600">{member.completedTasks}/{member.totalTasks} tasks</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-600 mb-1">Chất lượng</p>
                                        <p className="text-2xl font-bold text-green-600">{member.qualityScore}</p>
                                        <p className="text-xs text-gray-600">điểm</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-600 mb-1">Giờ làm</p>
                                        <p className="text-2xl font-bold text-purple-600">{member.totalHours}h</p>
                                        <p className="text-xs text-gray-600">tổng cộng</p>
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-600 mb-1">Đúng hạn</p>
                                        <p className="text-2xl font-bold text-orange-600">{member.onTimeRate}%</p>
                                        <p className="text-xs text-gray-600">deadline</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Ưu tiên cao: <span className="font-bold text-red-600">{member.tasksByPriority.high}</span></span>
                                        <span className="text-gray-600">Trung bình: <span className="font-bold text-yellow-600">{member.tasksByPriority.medium}</span></span>
                                        <span className="text-gray-600">Thấp: <span className="font-bold text-green-600">{member.tasksByPriority.low}</span></span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Member Detail Modal */}
            {selectedMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMember(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                    {selectedMember.hoten.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedMember.hoten}</h2>
                                    <p className="opacity-90">{selectedMember.manv}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Performance Metrics */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    Chỉ số hiệu suất
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Tỷ lệ hoàn thành</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-bold text-blue-600">{getCompletionRate(selectedMember)}%</p>
                                            <span className="text-sm text-gray-600">({selectedMember.completedTasks}/{selectedMember.totalTasks})</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Điểm chất lượng</p>
                                        <p className="text-3xl font-bold text-green-600">{selectedMember.qualityScore}/100</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Thời gian trung bình</p>
                                        <p className="text-3xl font-bold text-purple-600">{selectedMember.averageCompletionTime}h</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Đúng deadline</p>
                                        <p className="text-3xl font-bold text-orange-600">{selectedMember.onTimeRate}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Hoạt động gần đây
                                </h3>
                                <div className="space-y-2">
                                    {selectedMember.recentActivity && selectedMember.recentActivity.length > 0 ? (
                                        selectedMember.recentActivity.map((activity, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                                                    <p className="text-xs text-gray-600">{new Date(activity.date).toLocaleString('vi-VN')}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-600 text-center py-4">Chưa có hoạt động gần đây</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-all"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
