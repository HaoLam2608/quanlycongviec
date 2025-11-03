"use client"
import { useState, useEffect } from "react"
import {
    BarChart3,
    TrendingUp,
    Calendar,
    Download,
    Filter,
    Users,
    FolderOpen,
    CheckCircle,
    Clock,
    AlertTriangle,
    Target,
    Activity,
    PieChart,
    LineChart
} from "lucide-react"

interface ProjectReport {
    id: number
    name: string
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    delayedTasks: number
    progress: number
    team: number
    budget: number
    budgetUsed: number
    startDate: string
    endDate: string
    status: "Đúng tiến độ" | "Trễ tiến độ" | "Hoàn thành"
}

interface TeamMember {
    id: number
    name: string
    role: string
    avatar: string
    tasksCompleted: number
    tasksInProgress: number
    efficiency: number
    workload: number
}

export default function ManagerReportsPage() {
    const [loading, setLoading] = useState(true)
    const [reportType, setReportType] = useState<"overview" | "projects" | "team" | "performance">("overview")
    const [dateRange, setDateRange] = useState("thisMonth")
    const [projects, setProjects] = useState<ProjectReport[]>([])
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

    useEffect(() => {
        loadReportData()
    }, [reportType, dateRange])

    const loadReportData = async () => {
        try {
            // Mock data for projects
            const mockProjects: ProjectReport[] = [
                {
                    id: 1,
                    name: "Hệ thống quản lý",
                    totalTasks: 25,
                    completedTasks: 18,
                    inProgressTasks: 5,
                    delayedTasks: 2,
                    progress: 72,
                    team: 8,
                    budget: 500000000,
                    budgetUsed: 360000000,
                    startDate: "2025-08-01",
                    endDate: "2025-12-31",
                    status: "Đúng tiến độ"
                },
                {
                    id: 2,
                    name: "Mobile App",
                    totalTasks: 15,
                    completedTasks: 12,
                    inProgressTasks: 2,
                    delayedTasks: 1,
                    progress: 85,
                    team: 5,
                    budget: 300000000,
                    budgetUsed: 255000000,
                    startDate: "2025-06-01",
                    endDate: "2025-11-30",
                    status: "Đúng tiến độ"
                },
                {
                    id: 3,
                    name: "Website Redesign",
                    totalTasks: 20,
                    completedTasks: 20,
                    inProgressTasks: 0,
                    delayedTasks: 0,
                    progress: 100,
                    team: 6,
                    budget: 200000000,
                    budgetUsed: 185000000,
                    startDate: "2025-05-01",
                    endDate: "2025-10-15",
                    status: "Hoàn thành"
                }
            ]

            // Mock data for team members
            const mockTeamMembers: TeamMember[] = [
                {
                    id: 1,
                    name: "Nguyễn Văn A",
                    role: "Frontend Developer",
                    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
                    tasksCompleted: 12,
                    tasksInProgress: 3,
                    efficiency: 95,
                    workload: 85
                },
                {
                    id: 2,
                    name: "Trần Thị B",
                    role: "Backend Developer",
                    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b100?w=40&h=40&fit=crop&crop=face",
                    tasksCompleted: 15,
                    tasksInProgress: 2,
                    efficiency: 92,
                    workload: 75
                },
                {
                    id: 3,
                    name: "Lê Văn C",
                    role: "UI/UX Designer",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
                    tasksCompleted: 8,
                    tasksInProgress: 4,
                    efficiency: 88,
                    workload: 90
                },
                {
                    id: 4,
                    name: "Phạm Thị D",
                    role: "QA Tester",
                    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
                    tasksCompleted: 10,
                    tasksInProgress: 2,
                    efficiency: 90,
                    workload: 70
                }
            ]

            setProjects(mockProjects)
            setTeamMembers(mockTeamMembers)
        } catch (error) {
            console.error("Error loading report data:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Hoàn thành": return "bg-green-100 text-green-800"
            case "Đúng tiến độ": return "bg-blue-100 text-blue-800"
            case "Trễ tiến độ": return "bg-red-100 text-red-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const totalStats = {
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.status === "Hoàn thành").length,
        onTimeProjects: projects.filter(p => p.status === "Đúng tiến độ").length,
        delayedProjects: projects.filter(p => p.status === "Trễ tiến độ").length,
        totalTasks: projects.reduce((sum, p) => sum + p.totalTasks, 0),
        completedTasks: projects.reduce((sum, p) => sum + p.completedTasks, 0),
        totalTeamMembers: teamMembers.length,
        avgEfficiency: Math.round(teamMembers.reduce((sum, m) => sum + m.efficiency, 0) / teamMembers.length)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải báo cáo...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo cáo tiến độ</h1>
                <p className="text-gray-600">Theo dõi và phân tích hiệu suất dự án và team</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setReportType("overview")}
                            className={`px-4 py-2 rounded-lg transition-colors ${reportType === "overview"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Tổng quan
                        </button>
                        <button
                            onClick={() => setReportType("projects")}
                            className={`px-4 py-2 rounded-lg transition-colors ${reportType === "projects"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Dự án
                        </button>
                        <button
                            onClick={() => setReportType("team")}
                            className={`px-4 py-2 rounded-lg transition-colors ${reportType === "team"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Nhân sự
                        </button>
                        <button
                            onClick={() => setReportType("performance")}
                            className={`px-4 py-2 rounded-lg transition-colors ${reportType === "performance"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Hiệu suất
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="thisWeek">Tuần này</option>
                            <option value="thisMonth">Tháng này</option>
                            <option value="thisQuarter">Quý này</option>
                            <option value="thisYear">Năm này</option>
                        </select>

                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Xuất báo cáo
                        </button>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            {reportType === "overview" && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Tổng dự án</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalStats.totalProjects}</p>
                                    <p className="text-sm text-green-600 mt-1">+2 từ tháng trước</p>
                                </div>
                                <FolderOpen className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                                    <p className="text-2xl font-bold text-green-600">{totalStats.completedTasks}</p>
                                    <p className="text-sm text-gray-500 mt-1">/{totalStats.totalTasks} nhiệm vụ</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Thành viên</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalStats.totalTeamMembers}</p>
                                    <p className="text-sm text-blue-600 mt-1">Hiệu suất {totalStats.avgEfficiency}%</p>
                                </div>
                                <Users className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Tiến độ chung</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {Math.round((totalStats.completedTasks / totalStats.totalTasks) * 100)}%
                                    </p>
                                    <p className="text-sm text-green-600 mt-1">+5% từ tuần trước</p>
                                </div>
                                <Target className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-blue-600" />
                                Phân bổ trạng thái dự án
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                                        <span>Hoàn thành</span>
                                    </div>
                                    <span className="font-semibold">{totalStats.completedProjects}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                                        <span>Đúng tiến độ</span>
                                    </div>
                                    <span className="font-semibold">{totalStats.onTimeProjects}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                                        <span>Trễ tiến độ</span>
                                    </div>
                                    <span className="font-semibold">{totalStats.delayedProjects}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <LineChart className="w-5 h-5 text-green-600" />
                                Xu hướng hiệu suất
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span>Tuần 1</span>
                                    <div className="flex items-center">
                                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: "60%" }}></div>
                                        </div>
                                        <span className="text-sm">60%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tuần 2</span>
                                    <div className="flex items-center">
                                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: "75%" }}></div>
                                        </div>
                                        <span className="text-sm">75%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tuần 3</span>
                                    <div className="flex items-center">
                                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                                        </div>
                                        <span className="text-sm">85%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tuần 4</span>
                                    <div className="flex items-center">
                                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                            <div className="bg-green-600 h-2 rounded-full" style={{ width: "92%" }}></div>
                                        </div>
                                        <span className="text-sm">92%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Projects Report */}
            {reportType === "projects" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Báo cáo dự án</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dự án
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tiến độ
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nhiệm vụ
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Team
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngân sách
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {projects.map((project) => (
                                    <tr key={project.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{project.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(project.startDate).toLocaleDateString('vi-VN')} - {new Date(project.endDate).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-gray-600 min-w-0">{project.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="text-green-600 font-medium">{project.completedTasks} hoàn thành</div>
                                                <div className="text-gray-500">{project.totalTasks} tổng cộng</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <Users className="w-4 h-4 text-gray-400 mr-1" />
                                                <span className="text-sm text-gray-900">{project.team} người</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {(project.budgetUsed / 1000000).toFixed(0)}M / {(project.budget / 1000000).toFixed(0)}M
                                                </div>
                                                <div className="text-gray-500">
                                                    {Math.round((project.budgetUsed / project.budget) * 100)}% đã sử dụng
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Team Report */}
            {reportType === "team" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Báo cáo nhân sự</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thành viên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nhiệm vụ hoàn thành
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đang thực hiện
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hiệu suất
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tải công việc
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {teamMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <img
                                                    src={member.avatar}
                                                    alt={member.name}
                                                    className="w-10 h-10 rounded-full mr-3"
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900">{member.name}</div>
                                                    <div className="text-sm text-gray-500">{member.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                <span className="text-sm font-medium">{member.tasksCompleted}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 text-blue-500 mr-2" />
                                                <span className="text-sm font-medium">{member.tasksInProgress}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-20">
                                                    <div
                                                        className={`h-2 rounded-full ${member.efficiency >= 90 ? 'bg-green-500' :
                                                                member.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${member.efficiency}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium">{member.efficiency}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-20">
                                                    <div
                                                        className={`h-2 rounded-full ${member.workload >= 90 ? 'bg-red-500' :
                                                                member.workload >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${member.workload}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium">{member.workload}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Performance Report */}
            {reportType === "performance" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiệu suất theo thời gian</h3>
                        <div className="space-y-4">
                            {["Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11"].map((month, index) => {
                                const performance = [75, 82, 88, 92][index]
                                return (
                                    <div key={month} className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{month}</span>
                                        <div className="flex items-center">
                                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${performance}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium w-12">{performance}%</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chỉ số KPI</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Đúng deadline</span>
                                <span className="text-lg font-bold text-green-600">95%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Chất lượng công việc</span>
                                <span className="text-lg font-bold text-blue-600">4.8/5</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Hài lòng khách hàng</span>
                                <span className="text-lg font-bold text-purple-600">4.9/5</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">ROI dự án</span>
                                <span className="text-lg font-bold text-orange-600">125%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}