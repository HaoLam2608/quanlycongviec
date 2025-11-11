"use client"

import { useState, useEffect } from "react"
import { 
    FolderKanban, CheckSquare, Users, TrendingUp, Activity, Clock, 
    AlertTriangle, Target, ArrowUp, ArrowDown, RefreshCw, ChevronRight,
    CheckCircle2, Timer, Flame
} from "lucide-react"
import { fetchProjects, getTasksByProject, fetchProjectsByManager } from "@/axios/api"

// Loading Skeleton Components
const StatCardSkeleton = () => (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary"></div>
            <div className="h-4 w-20 bg-secondary rounded"></div>
        </div>
        <div>
            <div className="h-3 w-24 bg-secondary rounded mb-2"></div>
            <div className="h-8 w-16 bg-secondary rounded"></div>
        </div>
    </div>
)

const ChartSkeleton = () => (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-secondary rounded mb-6"></div>
        <div className="h-64 bg-secondary rounded"></div>
    </div>
)

export default function PMDashboard() {
    const [stats, setStats] = useState([
        {
            title: "Dự án đang quản lý",
            value: "0",
            change: "0%",
            icon: FolderKanban,
            color: "from-[#003D82] to-[#0052A3]",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            title: "Nhiệm vụ hoạt động",
            value: "0",
            change: "0%",
            icon: CheckSquare,
            color: "from-[#0052A3] to-[#006BB8]",
            bgColor: "bg-cyan-50",
            textColor: "text-cyan-600",
        },
        {
            title: "Thành viên nhóm",
            value: "0",
            change: "0%",
            icon: Users,
            color: "from-[#006BB8] to-[#0084CF]",
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600",
        },
        {
            title: "Tiến độ trung bình",
            value: "0%",
            change: "0%",
            icon: Activity,
            color: "from-[#0084CF] to-[#009DE6]",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-600",
        },
    ])

    const [loading, setLoading] = useState(true)
    const [recentActivities, setRecentActivities] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [chartData, setChartData] = useState({
        taskStatus: [
            { name: "Hoàn thành", value: 0, color: "#10b981" },
            { name: "Đang thực hiện", value: 0, color: "#3b82f6" },
            { name: "Chưa bắt đầu", value: 0, color: "#f59e0b" },
            { name: "Quá hạn", value: 0, color: "#ef4444" },
        ],
        projectProgress: [] as { name: string; progress: number; tasks: number }[],
        weeklyTasks: [] as { day: string; completed: number; created: number }[],
    })
    const [overdueTasks, setOverdueTasks] = useState(0)
    const [completionRate, setCompletionRate] = useState(0)
    const [urgentTasks, setUrgentTasks] = useState<any[]>([])

    useEffect(() => {
        // Add small delay to ensure token is properly set after login
        const timer = setTimeout(() => {
            loadStats()
            loadProjectsAndTasks()
        }, 500)
        
        return () => clearTimeout(timer)
    }, [])

    const loadStats = async () => {
        // Stats will be calculated from projects and tasks data
        // No longer calling admin API endpoint
        setLoading(true)
        try {
            // Set some mock recent activities or fetch from a manager-specific endpoint if available
            setRecentActivities([
                { user: "Hệ thống", action: "đã cập nhật dashboard", project: "", time: "vừa xong" }
            ])
        } catch (error: any) {
            console.error("Load stats error:", error)
        } finally {
            setLoading(false)
        }
    }
    
    const updateStatsFromData = (projectsList: any[], tasksList: any[]) => {
        // Calculate real stats from projects and tasks
        const projectCount = projectsList.length
        
        const activeTasksCount = tasksList.filter((t: any) => {
            const status = (t.trangThai || '').toString()
            return status === 'Đang chạy' || status === 'Chưa bắt đầu'
        }).length
        
        // Get unique team members from tasks
        const uniqueUserIds = new Set<string>()
        tasksList.forEach((t: any) => {
            const userId = t.nguoiDuocGiaoId || t.nguoiThucHienId || t.userId
            if (userId) uniqueUserIds.add(String(userId))
        })
        const teamMembersCount = uniqueUserIds.size
        
        // Calculate average progress from projects
        let totalProgress = 0
        projectsList.forEach((p: any) => {
            const projectTasks = tasksList.filter((t: any) => String(t.duanId || t.duanid) === String(p.id))
            if (projectTasks.length > 0) {
                const completed = projectTasks.filter((t: any) => {
                    const status = (t.trangThai || '').toString()
                    return status === 'Hoàn thành'
                }).length
                const progress = Math.round((completed / projectTasks.length) * 100)
                totalProgress += progress
            }
        })
        const progressAverage = projectsList.length > 0 ? Math.round(totalProgress / projectsList.length) : 0
        
        console.log('📊 Calculated Stats:', { projectCount, activeTasksCount, teamMembersCount, progressAverage })

        setStats([
            {
                title: "Dự án đang quản lý",
                value: String(projectCount),
                change: "+12%",
                icon: FolderKanban,
                color: "from-[#003D82] to-[#0052A3]",
                bgColor: "bg-blue-50",
                textColor: "text-blue-600",
            },
            {
                title: "Nhiệm vụ hoạt động",
                value: String(activeTasksCount),
                change: "+8%",
                icon: CheckSquare,
                color: "from-[#0052A3] to-[#006BB8]",
                bgColor: "bg-cyan-50",
                textColor: "text-cyan-600",
            },
            {
                title: "Thành viên nhóm",
                value: String(teamMembersCount),
                change: "+5%",
                icon: Users,
                color: "from-[#006BB8] to-[#0084CF]",
                bgColor: "bg-indigo-50",
                textColor: "text-indigo-600",
            },
            {
                title: "Tiến độ trung bình",
                value: String(progressAverage) + "%",
                change: "+15%",
                icon: Activity,
                color: "from-[#0084CF] to-[#009DE6]",
                bgColor: "bg-emerald-50",
                textColor: "text-emerald-600",
            },
        ])
    }

    const loadProjectsAndTasks = async () => {
        try {
            // Get current user info from localStorage
            const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
            const manv = typeof window !== 'undefined' ? localStorage.getItem('manv') : null
            const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
            
            // Verify we have manager/admin role
            if (!role || !['manager', 'admin'].includes(role)) {
                console.error('❌ Invalid role for manager dashboard:', role)
                return
            }
            
            // Fetch projects managed by current user
            let projectsRes
            if (userId) {
                console.log('📡 Fetching projects for manager ID:', userId)
                projectsRes = await fetchProjectsByManager(userId)
                console.log('✅ Projects by manager response:', projectsRes)
            } else {
                // Fallback to all projects if userId not found
                console.log('📡 Fallback: fetching all projects')
                projectsRes = await fetchProjects()
            }
            
            const projectsList = projectsRes.duans || projectsRes || []
            console.log('✅ Projects loaded for manager:', projectsList.length, projectsList)
            setProjects(projectsList)

            // Fetch tasks for all projects
            let allTasks: any[] = []
            for (const project of projectsList) {
                try {
                    const tasksRes = await getTasksByProject(project.id)
                    const projectTasks = tasksRes.tasks || tasksRes || []
                    allTasks = [...allTasks, ...projectTasks.map((t: any) => ({ ...t, projectName: project.tenduan }))]
                } catch (err) {
                    console.warn('Failed to load tasks for project', project.id)
                }
            }
            console.log('✅ Tasks loaded:', allTasks.length, allTasks)
            setTasks(allTasks)

            // Calculate task status distribution
            const completed = allTasks.filter((t: any) => {
                const status = (t.trangThai || '').toString()
                return status === 'Hoàn thành'
            }).length

            const ongoing = allTasks.filter((t: any) => {
                const status = (t.trangThai || '').toString()
                return status === 'Đang chạy'
            }).length

            const pending = allTasks.filter((t: any) => {
                const status = (t.trangThai || '').toString()
                return status === 'Chưa bắt đầu'
            }).length

            const now = new Date()
            const overdue = allTasks.filter((t: any) => {
                const deadline = t.ngayKetThuc || t.deadline
                if (!deadline) return false
                const dl = new Date(deadline)
                const status = (t.trangThai || '').toString()
                return dl < now && status !== 'Hoàn thành'
            }).length

            setOverdueTasks(overdue)
            setCompletionRate(allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0)

            console.log('📊 Task distribution:', { completed, ongoing, pending, overdue })
            
            setChartData(prev => ({
                ...prev,
                taskStatus: [
                    { name: "Hoàn thành", value: completed, color: "#10b981" },
                    { name: "Đang thực hiện", value: ongoing, color: "#3b82f6" },
                    { name: "Chưa bắt đầu", value: pending, color: "#f59e0b" },
                    { name: "Quá hạn", value: overdue, color: "#ef4444" },
                ],
            }))

            // Calculate project progress
            const projectProgress = projectsList.map((p: any) => {
                const projectTasks = allTasks.filter((t: any) => String(t.duanId || t.duanid) === String(p.id))
                const completedTasks = projectTasks.filter((t: any) => {
                    const status = (t.trangThai || '').toString()
                    return status === 'Hoàn thành'
                }).length
                const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
                return {
                    name: (p.tenduan || p.ten || `Dự án ${p.id}`).substring(0, 20),
                    progress,
                    tasks: projectTasks.length,
                }
            }).sort((a: any, b: any) => b.progress - a.progress).slice(0, 6)

            setChartData(prev => ({ ...prev, projectProgress }))

            // Calculate weekly tasks (last 7 days)
            const weeklyData: { day: string; completed: number; created: number }[] = []
            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dayStr = date.toISOString().split('T')[0]
                
                const completedCount = allTasks.filter((t: any) => {
                    const completedAt = t.ngayHoanThanh || t.completedAt
                    if (!completedAt) return false
                    return completedAt.split('T')[0] === dayStr
                }).length

                const createdCount = allTasks.filter((t: any) => {
                    const createdAt = t.createdAt
                    if (!createdAt) return false
                    return createdAt.split('T')[0] === dayStr
                }).length

                weeklyData.push({
                    day: dayNames[date.getDay()],
                    completed: completedCount,
                    created: createdCount,
                })
            }

            setChartData(prev => ({ ...prev, weeklyTasks: weeklyData }))

            // Find urgent tasks (deadline within 3 days and not completed)
            const threeDaysLater = new Date()
            threeDaysLater.setDate(threeDaysLater.getDate() + 3)
            
            const urgent = allTasks.filter((t: any) => {
                const deadline = t.ngayKetThuc || t.deadline
                if (!deadline) return false
                const dl = new Date(deadline)
                const status = (t.trangThai || '').toString()
                return dl <= threeDaysLater && dl >= now && status !== 'Hoàn thành'
            }).sort((a: any, b: any) => {
                const dlA = new Date(a.ngayKetThuc || a.deadline)
                const dlB = new Date(b.ngayKetThuc || b.deadline)
                return dlA.getTime() - dlB.getTime()
            }).slice(0, 5)

            setUrgentTasks(urgent)
            
            // Update stats cards with real data
            updateStatsFromData(projectsList, allTasks)

        } catch (error) {
            console.error('Load projects and tasks error:', error)
        }
    }

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
        const intervals: [number, string][] = [
            [31536000, "năm"],
            [2592000, "tháng"],
            [86400, "ngày"],
            [3600, "giờ"],
            [60, "phút"],
            [1, "giây"],
        ]

        for (const [sec, label] of intervals) {
            const count = Math.floor(seconds / sec)
            if (count > 0) return `${count} ${label} trước`
        }
        return "vừa xong"
    }

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
                        Dashboard Quản lý 📊
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Tổng quan dự án và nhiệm vụ của bạn
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => { loadStats(); loadProjectsAndTasks() }}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-medium transition-colors"
                    >
                        <RefreshCw size={16} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading
                    ? Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)
                    : stats.map((stat, index) => {
                        const Icon = stat.icon
                        const isPositive = stat.change.startsWith('+')
                        return (
                            <div
                                key={index}
                                className="relative group overflow-hidden bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-sm"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -mr-16 -mt-16" 
                                     style={{ background: `linear-gradient(135deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})` }} 
                                />
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                                </div>
                            </div>
                        )
                    })}
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                            Cần xử lý
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Tasks quá hạn</p>
                    <p className="text-3xl font-bold text-red-600">{overdueTasks}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Hiệu suất
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Tỷ lệ hoàn thành</p>
                    <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                            Khẩn cấp
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Tasks cần xử lý gấp</p>
                    <p className="text-3xl font-bold text-orange-600">{urgentTasks.length}</p>
                </div>
            </div>

            {/* Projects & Tasks Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Projects List */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Dự án của tôi</h3>
                            <p className="text-sm text-muted-foreground">Các dự án đang quản lý</p>
                        </div>
                        <FolderKanban className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {projects.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Chưa có dự án nào</p>
                            </div>
                        ) : (
                            projects.slice(0, 8).map((project: any, index: number) => {
                                const projectTasks = tasks.filter((t: any) => String(t.duanId || t.duanid) === String(project.id))
                                const completedTasks = projectTasks.filter((t: any) => {
                                    const status = (t.trangThai || '').toString()
                                    return status === 'Hoàn thành'
                                }).length
                                const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
                                
                                const getProgressColor = (prog: number) => {
                                    if (prog >= 80) return 'bg-green-500'
                                    if (prog >= 50) return 'bg-blue-500'
                                    if (prog >= 30) return 'bg-yellow-500'
                                    return 'bg-red-500'
                                }
                                
                                return (
                                    <div 
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-[#003D82] hover:bg-secondary/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-[#003D82]">
                                                {project.tenduan || project.ten || 'Không có tên'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {completedTasks}/{projectTasks.length} tasks hoàn thành
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-foreground">{progress}%</p>
                                                <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden mt-1">
                                                    <div 
                                                        className={`h-full ${getProgressColor(progress)} transition-all`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Urgent Tasks */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Tasks khẩn cấp</h3>
                            <p className="text-sm text-muted-foreground">Cần hoàn thành trong 3 ngày</p>
                        </div>
                        <Timer className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {urgentTasks.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                                <p className="text-sm">Không có tasks khẩn cấp</p>
                                <p className="text-xs mt-1">Tất cả đều trong tầm kiểm soát! 🎉</p>
                            </div>
                        ) : (
                            urgentTasks.map((task: any, index: number) => {
                                const deadline = new Date(task.ngayKetThuc || task.deadline)
                                const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                return (
                                    <div 
                                        key={index}
                                        className="flex items-start gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer group"
                                    >
                                        <Flame className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-orange-600">
                                                {task.tieude || task.tenCongViec || 'Không có tiêu đề'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate mt-1">
                                                {task.projectName || 'N/A'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                                    ⏰ Còn {daysLeft} ngày
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-1">Hoạt động gần đây</h2>
                        <p className="text-sm text-muted-foreground">Theo dõi các hoạt động mới nhất trong dự án</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-medium transition-colors">
                        Xem tất cả
                        <ChevronRight size={16} />
                    </button>
                </div>

                <div className="space-y-3">
                    {recentActivities.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Chưa có hoạt động nào</p>
                        </div>
                    ) : (
                        recentActivities.map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors group border border-transparent hover:border-border"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003D82] to-[#0052A3] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                                    {activity.user.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground text-sm">
                                        <span className="font-semibold">{activity.user}</span>{" "}
                                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                                        <span className="font-semibold text-[#003D82]">{activity.project}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <Clock size={12} />
                                        {activity.time}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
