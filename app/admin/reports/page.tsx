"use client"

import { useState, useEffect, useRef } from "react"
import {
    TrendingUp, Users, FolderKanban, CheckSquare, Filter, Download,
    Calendar, BarChart3, PieChart, LineChart, RefreshCw,
    AlertTriangle, Clock, Trophy, Search, ArrowUpDown, ChevronLeft, ChevronRight,
    FileText, UserCheck, Briefcase
} from "lucide-react"
import { fetchProjects, getMyTasks, getTasksByProject, getWorklogs, fetchDocuments } from "@/axios/api"
import { getUsers, groupAPI } from "@/axios/adminApi"
import {
    PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart as RechartsLine, Line, Area, AreaChart
} from "recharts"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { showError } from '@/lib/notifications'

// Loading Skeleton Component
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

const TableSkeleton = () => (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-6 w-40 bg-secondary rounded mb-6"></div>
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-secondary rounded"></div>
            ))}
        </div>
    </div>
)

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
            <BarChart3 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Không có dữ liệu</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    </div>
)

export default function ReportsPage() {
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [worklogs, setWorklogs] = useState<any[]>([])
    const [documents, setDocuments] = useState<any[]>([])
    const [groups, setGroups] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [sortField, setSortField] = useState<string>("progress")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [filterApplied, setFilterApplied] = useState(false)

    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        projectId: "",
        status: "",
        userId: "",
        preset: "",
    })

    const [stats, setStats] = useState({
        totalProjects: 0,
        completedTasks: 0,
        activeUsers: 0,
        completionRate: 0,
        ongoingTasks: 0,
        overdueTasks: 0,
        // Project-level stats
        completedProjects: 0,
        pendingProjects: 0,
        ongoingProjects: 0,
        // Worklog stats
        totalHoursLogged: 0,
        avgHoursPerUser: 0,
        // Document stats
        totalDocuments: 0,
        documentsPerProject: 0,
        // Group stats
        totalGroups: 0,
        activeGroups: 0,
        // keep avg/risk in state if needed elsewhere, but not shown
        avgCompletionTime: 0,
        riskProjects: 0,
    })

    const [chartData, setChartData] = useState({
        projectStatus: [
            { name: "Hoàn thành", value: 12, color: "#10b981" },
            { name: "Đang thực hiện", value: 8, color: "#3b82f6" },
            { name: "Chưa bắt đầu", value: 4, color: "#f59e0b" },
        ],
        taskProgress: [
            { month: "T1", completed: 20, ongoing: 15, total: 35 },
            { month: "T2", completed: 25, ongoing: 18, total: 43 },
            { month: "T3", completed: 30, ongoing: 20, total: 50 },
            { month: "T4", completed: 28, ongoing: 22, total: 50 },
            { month: "T5", completed: 35, ongoing: 25, total: 60 },
            { month: "T6", completed: 40, ongoing: 20, total: 60 },
        ],
        userPerformance: [
            { name: "User 1", tasks: 45 },
            { name: "User 2", tasks: 38 },
            { name: "User 3", tasks: 52 },
            { name: "User 4", tasks: 30 },
            { name: "User 5", tasks: 42 },
        ],
        worklogHours: [] as { name: string; hours: number }[],
        // per-project status breakdown for stacked chart
        projectByStatus: [] as { project: string; completed: number; ongoing: number; pending: number }[],
        overdueTrend: [] as { month: string; overdue: number }[],
    })

    const [tableData, setTableData] = useState<any[]>([])
    const [topPerformers, setTopPerformers] = useState<any[]>([])
    const [taskCounts, setTaskCounts] = useState({ total: 0, completed: 0, ongoing: 0, pending: 0 })
    const [subtaskCounts, setSubtaskCounts] = useState({ total: 0, completed: 0, ongoing: 0, pending: 0 })

    const printRef = useRef<HTMLDivElement>(null)
    const [exportingPdf, setExportingPdf] = useState(false)

    // Helpers to normalize task/subtask field names between backend schemas
    const getTaskProjectId = (t: any) => {
        return (t?.duanId ?? t?.duanid ?? t?.duan ?? t?.duanID ?? t?.duanId)?.toString()
    }

    const getTaskUserId = (t: any) => {
        return (t?.nguoiDuocGiaoId ?? t?.nguoiThucHienId ?? t?.nguoiDuocGiaoID ?? t?.nguoiThucHienID ?? t?.userid ?? t?.userId ?? t?.nguoiDuocGiao)?.toString()
    }

    const getTaskStatus = (t: any) => {
        const status = (t?.trangThai ?? t?.trangthai ?? t?.status ?? "").toString()
        return status
    }

    const getTaskDeadline = (t: any) => {
        return t?.ngayKetThuc ?? t?.ngayketthuc ?? t?.deadline ?? t?.dueDate ?? null
    }

    const getTaskStart = (t: any) => {
        return t?.ngayBatDau ?? t?.ngaybatdau ?? t?.startDate ?? null
    }

    const getTaskCompletedAt = (t: any) => {
        return t?.ngayHoanThanh ?? t?.ngayhoanthanh ?? t?.completedAt ?? null
    }

    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        if (projects.length > 0 && users.length > 0 && tasks.length > 0 && filterApplied) {
            loadReportData()
        }
    }, [filterApplied])

    useEffect(() => {
        if (projects.length > 0 && users.length > 0 && tasks.length > 0) {
            setFilterApplied(true)
        }
    }, [projects, users, tasks])

    const computeReportData = (
        projectsList: any[],
        usersList: any[],
        tasksList: any[],
        worklogsList: any[] = [],
        documentsList: any[] = [],
        groupsList: any[] = [],
        filtersToUse = filters
    ) => {
        // This mirrors the logic in loadReportData but works with provided arrays
        // so callers can compute reports immediately after fetching data.
        try {
            // Filter projects based on filters
            let filteredProjects = projectsList

            if (filtersToUse.projectId) {
                filteredProjects = filteredProjects.filter((p: any) => p.id === parseInt(filtersToUse.projectId))
            }

            if (filtersToUse.status) {
                const statusMap: Record<string, string[]> = {
                    // Map UI filter values to DB ENUM values
                    'completed': ['da_hoan_thanh', 'da_dong'],
                    'ongoing': ['dang_chay'],
                    'pending': ['chua_bat_dau']
                }
                filteredProjects = filteredProjects.filter((p: any) => {
                    const projStatus = (p.status || '').toString().toLowerCase()
                    return statusMap[filtersToUse.status]?.includes(projStatus)
                })
            }

            if (filtersToUse.startDate) {
                filteredProjects = filteredProjects.filter((p: any) => {
                    if (!p.ngaybatdau) return true
                    return new Date(p.ngaybatdau) >= new Date(filtersToUse.startDate)
                })
            }

            if (filtersToUse.endDate) {
                filteredProjects = filteredProjects.filter((p: any) => {
                    if (!p.ngayketthuc) return true
                    return new Date(p.ngayketthuc) <= new Date(filtersToUse.endDate)
                })
            }

            if (filtersToUse.userId) {
                filteredProjects = filteredProjects.filter((p: any) => String(p.userId) === String(filtersToUse.userId))
            }

            // Filter tasks based on filtered projects
            const filteredTasks = tasksList.filter((t: any) => {
                const taskProjectId = getTaskProjectId(t)
                if (filtersToUse.projectId && String(taskProjectId) !== String(filtersToUse.projectId)) return false
                return filteredProjects.some((p: any) => String(p.id) === String(taskProjectId))
            })

            // Calculate stats from real data
            const totalProjects = filteredProjects.length
            const completedProjects = filteredProjects.filter((p: any) => {
                const s = (p.status || '').toString().toLowerCase()
                return s === 'da_hoan_thanh' || s === 'completed'
            }).length

            const ongoingProjects = filteredProjects.filter((p: any) => {
                const s = (p.status || '').toString().toLowerCase()
                return s === 'dang_chay' || s === 'inprogress'
            }).length

            const pendingProjects = filteredProjects.filter((p: any) => {
                const s = (p.status || '').toString().toLowerCase()
                return s === 'chua_bat_dau' || s === 'pending'
            }).length

            const activeUsersCount = usersList.length

            const totalTasks = filteredTasks.length
            const completedTasks = filteredTasks.filter((t: any) => {
                const s = getTaskStatus(t)
                return s === 'Hoàn thành'
            }).length
            const pendingTasks = filteredTasks.filter((t: any) => {
                const s = getTaskStatus(t)
                return s === 'Chưa bắt đầu'
            }).length
            const ongoingTasks = filteredTasks.filter((t: any) => {
                const s = getTaskStatus(t)
                return s === 'Đang chạy'
            }).length

            // set taskCounts
            setTaskCounts({ total: totalTasks, completed: completedTasks, ongoing: ongoingTasks, pending: pendingTasks })

            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            // Calculate overdue tasks
            const now = new Date()
            const overdueTasks = filteredTasks.filter((t: any) => {
                const dl = getTaskDeadline(t)
                if (!dl) return false
                const deadline = new Date(dl)
                const s = getTaskStatus(t)
                return deadline < now && s !== 'Hoàn thành'
            }).length

            // Calculate risk projects (< 50% progress and deadline within 7 days)
            const riskProjects = filteredProjects.filter((p: any) => {
                const projectTasks = tasksList.filter((t: any) => String(getTaskProjectId(t)) === String(p.id))
                const completed = projectTasks.filter((t: any) => {
                    const s = getTaskStatus(t)
                    return s === 'Hoàn thành'
                }).length
                const progress = projectTasks.length > 0 ? (completed / projectTasks.length) * 100 : 0
                if (!p.ngayketthuc) return false
                const deadline = new Date(p.ngayketthuc)
                const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                return progress < 50 && daysUntilDeadline <= 7 && daysUntilDeadline > 0
            }).length

            // Calculate average completion time (mock for now, can be improved with real data)
            const avgCompletionTime = 15

            // Calculate worklog statistics
            const totalHoursLogged = worklogsList.reduce((sum: number, w: any) => sum + (parseFloat(w.hours) || 0), 0)
            const avgHoursPerUser = usersList.length > 0 ? Math.round(totalHoursLogged / usersList.length) : 0

            // Calculate document statistics
            const totalDocuments = documentsList.length
            const documentsPerProject = filteredProjects.length > 0 ? Math.round(totalDocuments / filteredProjects.length) : 0

            // Calculate group statistics - ensure groupsList is an array
            let groupsArray: any[] = [];
            if (Array.isArray(groupsList)) {
                groupsArray = groupsList;
            } else if (groupsList && Array.isArray((groupsList as any).data?.groups)) {
                groupsArray = (groupsList as any).data.groups;
            }
            const totalGroups = groupsArray.length;
            const activeGroups = groupsArray.filter((g: any) => g.status === 'active').length;

            console.log('🟢 groupsList:', groupsList);
            console.log('🟢 totalGroups:', totalGroups);

            setStats({
                totalProjects,
                completedTasks,
                activeUsers: activeUsersCount,
                completionRate,
                ongoingTasks,
                overdueTasks,
                // project-level
                completedProjects,
                pendingProjects,
                ongoingProjects,
                // worklog stats
                totalHoursLogged: Math.round(totalHoursLogged),
                avgHoursPerUser,
                // document stats
                totalDocuments,
                documentsPerProject,
                // group stats
                totalGroups,
                activeGroups,
                // keep legacy values
                avgCompletionTime,
                riskProjects,
            })

            // Update chart data
            setChartData((prev: any) => ({
                ...prev,
                projectStatus: [
                    { name: "Hoàn thành", value: completedProjects, color: "#10b981" },
                    { name: "Đang thực hiện", value: ongoingProjects, color: "#3b82f6" },
                    { name: "Chưa bắt đầu", value: pendingProjects, color: "#f59e0b" },
                ],
            }))

            // Build per-project status breakdown (for stacked bar chart)
            const projectStatusByProject = filteredProjects.map((p: any) => {
                const projectTasks = tasksList.filter((t: any) => String(getTaskProjectId(t)) === String(p.id))
                const completed = projectTasks.filter((t: any) => getTaskStatus(t) === 'Hoàn thành').length
                const ongoing = projectTasks.filter((t: any) => getTaskStatus(t) === 'Đang chạy').length
                const pending = projectTasks.filter((t: any) => getTaskStatus(t) === 'Chưa bắt đầu').length
                return {
                    project: p.tenduan || p.ten || `Dự án ${p.id}`,
                    completed,
                    ongoing,
                    pending,
                }
            })

            setChartData((prev: any) => ({ ...prev, projectByStatus: projectStatusByProject }))

            // Overdue trend - last 6 months
            const months: { monthKey: string; label: string }[] = []
            const monthNames = new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric' })
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                months.push({ monthKey: `${d.getFullYear()}-${d.getMonth() + 1}`, label: monthNames.format(d) })
            }

            const overdueTrend = months.map(m => {
                const [y, mnum] = m.monthKey.split('-').map(Number)
                const count = filteredTasks.filter((t: any) => {
                    const dl = getTaskDeadline(t)
                    if (!dl) return false
                    const d = new Date(dl)
                    return d.getFullYear() === y && (d.getMonth() + 1) === mnum && d < now && getTaskStatus(t) !== 'Hoàn thành'
                }).length
                return { month: m.label, overdue: count }
            })

            // Build taskProgress per month (completed, ongoing, overdue)
            const taskProgress = months.map(m => {
                const [y, mnum] = m.monthKey.split('-').map(Number)
                const periodStart = new Date(y, mnum - 1, 1)
                const periodEnd = new Date(y, mnum, 0, 23, 59, 59, 999)

                const completedCount = filteredTasks.filter((t: any) => {
                    const ca = getTaskCompletedAt(t)
                    if (!ca) return false
                    const d = new Date(ca)
                    return d.getFullYear() === y && (d.getMonth() + 1) === mnum
                }).length

                const ongoingCount = filteredTasks.filter((t: any) => {
                    const sd = getTaskStart(t)
                    const ca = getTaskCompletedAt(t)
                    // task is considered ongoing in this period if it started on or before periodEnd
                    // and either not completed yet or completed after periodEnd
                    if (!sd) return false
                    const sdDate = new Date(sd)
                    const completedDate = ca ? new Date(ca) : null
                    return sdDate <= periodEnd && (!completedDate || completedDate > periodEnd)
                }).length

                const overdueCount = filteredTasks.filter((t: any) => {
                    const dl = getTaskDeadline(t)
                    if (!dl) return 0
                    const d = new Date(dl)
                    // overdue in this month if deadline is in this month and task not completed by deadline
                    const ca = getTaskCompletedAt(t)
                    const completedDate = ca ? new Date(ca) : null
                    return d.getFullYear() === y && (d.getMonth() + 1) === mnum && (!completedDate || completedDate > d)
                }).length

                return {
                    month: m.label,
                    completed: completedCount,
                    ongoing: ongoingCount,
                    overdue: overdueCount,
                }
            })

            setChartData((prev: any) => ({ ...prev, overdueTrend, taskProgress }))

            // Calculate top performers based on real task data
            const userTaskCounts = usersList.map((user: any) => {
                const userCompletedTasks = filteredTasks.filter((t: any) => {
                    const tuid = getTaskUserId(t)
                    const s = getTaskStatus(t)
                    return String(tuid) === String(user.id) && s === 'Hoàn thành'
                }).length
                return {
                    name: user.hoten || user.manv || `User ${user.id}`,
                    tasks: userCompletedTasks,
                    avatar: user.avatar,
                }
            }).sort((a: any, b: any) => b.tasks - a.tasks).slice(0, 5)

            setTopPerformers(userTaskCounts)

            // Calculate worklog hours by user for chart
            const userWorklogHours = usersList.map((user: any) => {
                const userLogs = worklogsList.filter((w: any) => String(w.userId) === String(user.id))
                const totalHours = userLogs.reduce((sum: number, w: any) => sum + (parseFloat(w.hours) || 0), 0)
                return {
                    name: (user.hoten || user.manv || `User ${user.id}`).substring(0, 15),
                    hours: Math.round(totalHours * 10) / 10,
                }
            }).filter((u: any) => u.hours > 0)
                .sort((a: any, b: any) => b.hours - a.hours)
                .slice(0, 10)

            // Update user performance chart
            setChartData((prev: any) => ({
                ...prev,
                userPerformance: userTaskCounts,
                worklogHours: userWorklogHours,
            }))

            // Subtask aggregation: check if tasks have nested subtasks
            let allSubtasks: any[] = []
            if (tasksList.some((t: any) => Array.isArray(t.subtasks) && t.subtasks.length > 0)) {
                allSubtasks = tasksList.flatMap((t: any) => t.subtasks || [])
            } else {
                // no nested subtasks available in tasksList; leave allSubtasks empty (could fetch from API if exists)
            }

            if (allSubtasks.length > 0) {
                const totalSub = allSubtasks.length
                const completedSub = allSubtasks.filter((st: any) => {
                    const s = getTaskStatus(st)
                    return s === 'Hoàn thành'
                }).length
                const pendingSub = allSubtasks.filter((st: any) => {
                    const s = getTaskStatus(st)
                    return s === 'Chưa bắt đầu'
                }).length
                const ongoingSub = allSubtasks.filter((st: any) => {
                    const s = getTaskStatus(st)
                    return s === 'Đang chạy'
                }).length
                setSubtaskCounts({ total: totalSub, completed: completedSub, ongoing: ongoingSub, pending: pendingSub })
            } else {
                setSubtaskCounts({ total: 0, completed: 0, ongoing: 0, pending: 0 })
            }

            // Update table data with filtered projects
            const tableRows = filteredProjects.map((p: any) => {
                const projectTasks = tasksList.filter((t: any) => String(getTaskProjectId(t)) === String(p.id))
                const completed = projectTasks.filter((t: any) => {
                    const s = getTaskStatus(t)
                    return s === 'Hoàn thành'
                }).length
                // Resolve manager name: prefer populated relation, else lookup by userId
                let managerName = 'N/A'
                if (p.nguoiDamNhan && (p.nguoiDamNhan.hoten || p.nguoiDamNhan.manv)) {
                    managerName = p.nguoiDamNhan.hoten || p.nguoiDamNhan.manv
                } else if (p.userId) {
                    const mgr = usersList.find((u: any) => String(u.id) === String(p.userId))
                    if (mgr) managerName = mgr.hoten || mgr.manv || `User ${mgr.id}`
                } else if (p.manager) {
                    managerName = p.manager
                }

                return {
                    id: p.id,
                    project: p.tenduan || p.ten || `Dự án ${p.id}`,
                    tasks: projectTasks.length,
                    completed,
                    progress: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0,
                    deadline: p.ngayketthuc ? new Date(p.ngayketthuc).toLocaleDateString('vi-VN') : "N/A",
                    status: p.status || "chua_bat_dau",
                    manager: managerName,
                }
            })
            setTableData(tableRows)
        } catch (error) {
            console.error("Compute report error:", error)
        }
    }

    const loadInitialData = async () => {
        try {
            // First fetch projects and users
            const [projectsRes, usersRes, groupsRes, documentsRes] = await Promise.all([
                fetchProjects(),
                // Request a large limit to ensure we have all users for lookups (used to display manager names)
                getUsers({ page: 1, limit: 1000 }),
                groupAPI.getGroups({}).catch((err) => {
                    console.error('❌ Error fetching groups:', err)
                    return { groups: [] }
                }),
                fetchDocuments().catch((err) => {
                    console.error('❌ Error fetching documents:', err)
                    return { documents: [] }
                }),
            ])

            const projectsList = projectsRes.duans || projectsRes || []
            const usersList = usersRes.users || usersRes || []
            const groupsList = (groupsRes as any).groups || groupsRes || []
            const documentsList = (documentsRes as any).documents || documentsRes || []

            setProjects(projectsList)
            setUsers(usersList)
            setGroups(groupsList)
            setDocuments(documentsList)

            // Fetch tasks for each project (admin report needs all tasks)
            let tasksList: any[] = []
            try {
                const tasksPerProject = await Promise.all(
                    projectsList.map((p: any) => getTasksByProject(p.id).catch((e: any) => {
                        console.warn('Failed to load tasks for project', p.id, e)
                        return []
                    }))
                )
                // Each response may be { tasks: [...] } or an array
                tasksList = tasksPerProject.flatMap((r: any) => r.tasks || r || [])
            } catch (err) {
                console.error('Error fetching tasks per project:', err)
            }

            setTasks(tasksList)

            // Fetch all worklogs - skip for now since API requires taskId/subtaskId
            let worklogsList: any[] = []
            // Backend API requires taskId or subtaskId, so we can't fetch all worklogs at once
            // We would need to fetch worklogs per task or create a new backend endpoint
            setWorklogs(worklogsList)

            // Initialize table data (basic)
            const tableRowsInit = projectsList.map((p: any) => {
                const projectTasks = tasksList.filter((t: any) => String(getTaskProjectId(t)) === String(p.id))
                const completed = projectTasks.filter((t: any) => {
                    const s = getTaskStatus(t)
                    return s === 'Hoàn thành'
                }).length

                let managerName = 'N/A'
                if (p.nguoiDamNhan && (p.nguoiDamNhan.hoten || p.nguoiDamNhan.manv)) {
                    managerName = p.nguoiDamNhan.hoten || p.nguoiDamNhan.manv
                } else if (p.userId) {
                    const mgr = usersList.find((u: any) => String(u.id) === String(p.userId))
                    if (mgr) managerName = mgr.hoten || mgr.manv || `User ${mgr.id}`
                } else if (p.manager) {
                    managerName = p.manager
                }

                return {
                    id: p.id,
                    project: p.tenduan || p.ten || `Dự án ${p.id}`,
                    tasks: projectTasks.length,
                    completed,
                    progress: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0,
                    deadline: p.ngayketthuc ? new Date(p.ngayketthuc).toLocaleDateString('vi-VN') : "N/A",
                    status: p.status || "chua_bat_dau",
                    manager: managerName,
                }
            })
            setTableData(tableRowsInit)

            // Compute report immediately using fetched data so the page shows values without requiring user to press "Lọc"
            computeReportData(projectsList, usersList, tasksList, worklogsList, documentsList, groupsList)
            setFilterApplied(true)
        } catch (error) {
            console.error("Load initial data error:", error)
        }
    }

    const loadReportData = async () => {
        setLoading(true)
        try {
            // Use computeReportData helper with current state arrays and filters
            computeReportData(projects, users, tasks, worklogs, documents, groups, filters)
        } catch (error) {
            console.error("Load report error:", error)
        } finally {
            setLoading(false)
        }
    }

    const applyPresetFilter = (preset: string) => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        let startDate = ""
        let endDate = ""

        switch (preset) {
            case 'thisMonth':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                startDate = startOfMonth.toISOString().split('T')[0]
                endDate = endOfMonth.toISOString().split('T')[0]
                break
            case 'thisQuarter':
                // Determine current quarter
                const month = now.getMonth()
                const quarterStartMonth = Math.floor(month / 3) * 3
                const startOfQuarter = new Date(now.getFullYear(), quarterStartMonth, 1)
                const endOfQuarter = new Date(now.getFullYear(), quarterStartMonth + 3, 0)
                startDate = startOfQuarter.toISOString().split('T')[0]
                endDate = endOfQuarter.toISOString().split('T')[0]
                break
            case 'thisYear':
                const startOfYear = new Date(now.getFullYear(), 0, 1)
                const endOfYear = new Date(now.getFullYear(), 11, 31)
                startDate = startOfYear.toISOString().split('T')[0]
                endDate = endOfYear.toISOString().split('T')[0]
                break
        }

        setFilters(prev => ({
            ...prev,
            startDate,
            endDate,
            preset
        }))
        setFilterApplied(true)
    }

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFilters(prev => ({ ...prev, [name]: value, preset: '' }))
    }

    const handleSubmitFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        // Run report using the current filters immediately
        setFilterApplied(true)
        computeReportData(projects, users, tasks, worklogs, documents, groups, filters)
    }

    const handleResetFilter = () => {
        const emptyFilters = {
            startDate: "",
            endDate: "",
            projectId: "",
            status: "",
            userId: "",
            preset: "",
        }
        setFilters(emptyFilters)
        // Recompute report with cleared filters
        setFilterApplied(true)
        computeReportData(projects, users, tasks, worklogs, documents, groups, emptyFilters)
    }

    const handleExportExcel = () => {
        try {
            // Prepare main project data with more details
            const exportData = tableData.map(row => ({
                'STT': tableData.indexOf(row) + 1,
                'Tên dự án': row.project,
                'Quản lý': row.manager,
                'Tổng công việc': row.tasks,
                'Đã hoàn thành': row.completed,
                'Tiến độ (%)': row.progress,
                'Ngày hết hạn': row.deadline,
                'Trạng thái': getStatusLabel(row.status),
                'Công việc còn lại': row.tasks - row.completed,
                'Mức độ rủi ro': row.progress < 30 ? 'Cao' : row.progress < 70 ? 'Trung bình' : 'Thấp'
            }))

            // Create workbook
            const wb = XLSX.utils.book_new()

            // Main report sheet with enhanced formatting
            const ws = XLSX.utils.json_to_sheet(exportData)

            // Add column widths
            ws['!cols'] = [
                { wch: 5 },  // STT
                { wch: 30 }, // Tên dự án
                { wch: 20 }, // Quản lý
                { wch: 12 }, // Tổng công việc
                { wch: 12 }, // Đã hoàn thành
                { wch: 10 }, // Tiến độ
                { wch: 15 }, // Ngày hết hạn
                { wch: 15 }, // Trạng thái
                { wch: 12 }, // Còn lại
                { wch: 15 }, // Rủi ro
            ]

            // Add title and metadata
            XLSX.utils.sheet_add_aoa(ws, [
                ['BÁO CÁO TỔNG QUAN DỰ ÁN'],
                [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
                [`Thời gian: ${new Date().toLocaleTimeString('vi-VN')}`],
                [''], // Empty row
            ], { origin: 'A1' })

            // Shift data down to accommodate header
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
            range.s.r += 4
            ws['!ref'] = XLSX.utils.encode_range(range)

            XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo dự án')

            // Enhanced stats sheet
            const currentDate = new Date()
            const statsData = [
                { 'Loại': 'THỐNG KÊ DỰ ÁN', 'Chỉ số': '', 'Giá trị': '', 'Ghi chú': '' },
                { 'Loại': 'Dự án', 'Chỉ số': 'Tổng số dự án', 'Giá trị': stats.totalProjects, 'Ghi chú': 'Tất cả dự án trong hệ thống' },
                { 'Loại': 'Dự án', 'Chỉ số': 'Dự án hoàn thành', 'Giá trị': stats.completedProjects, 'Ghi chú': `${((stats.completedProjects / stats.totalProjects) * 100).toFixed(1)}% tổng số dự án` },
                { 'Loại': 'Dự án', 'Chỉ số': 'Dự án đang thực hiện', 'Giá trị': stats.ongoingProjects, 'Ghi chú': `${((stats.ongoingProjects / stats.totalProjects) * 100).toFixed(1)}% tổng số dự án` },
                { 'Loại': 'Dự án', 'Chỉ số': 'Dự án chưa bắt đầu', 'Giá trị': stats.pendingProjects, 'Ghi chú': `${((stats.pendingProjects / stats.totalProjects) * 100).toFixed(1)}% tổng số dự án` },
                { 'Loại': '', 'Chỉ số': '', 'Giá trị': '', 'Ghi chú': '' },
                { 'Loại': 'THỐNG KÊ CÔNG VIỆC', 'Chỉ số': '', 'Giá trị': '', 'Ghi chú': '' },
                { 'Loại': 'Tasks', 'Chỉ số': 'Tổng công việc (Tasks)', 'Giá trị': taskCounts.total, 'Ghi chú': 'Tất cả công việc chính' },
                { 'Loại': 'Tasks', 'Chỉ số': 'Công việc hoàn thành', 'Giá trị': taskCounts.completed, 'Ghi chú': `${((taskCounts.completed / taskCounts.total) * 100).toFixed(1)}% tổng tasks` },
                { 'Loại': 'Tasks', 'Chỉ số': 'Công việc đang thực hiện', 'Giá trị': taskCounts.ongoing, 'Ghi chú': `${((taskCounts.ongoing / taskCounts.total) * 100).toFixed(1)}% tổng tasks` },
                { 'Loại': 'Tasks', 'Chỉ số': 'Công việc chưa bắt đầu', 'Giá trị': taskCounts.pending, 'Ghi chú': `${((taskCounts.pending / taskCounts.total) * 100).toFixed(1)}% tổng tasks` },
                { 'Loại': 'Tasks', 'Chỉ số': 'Công việc quá hạn', 'Giá trị': stats.overdueTasks, 'Ghi chú': `${((stats.overdueTasks / taskCounts.total) * 100).toFixed(1)}% tổng tasks` },
                { 'Loại': '', 'Chỉ số': '', 'Giá trị': '', 'Ghi chú': '' },
                { 'Loại': 'THỐNG KÊ SUBTASKS', 'Chỉ số': '', 'Giá trị': '', 'Ghi chú': '' },
                { 'Loại': 'Subtasks', 'Chỉ số': 'Tổng công việc phụ', 'Giá trị': subtaskCounts.total, 'Ghi chú': 'Tất cả công việc phụ' },
                { 'Loại': 'Subtasks', 'Chỉ số': 'Subtask hoàn thành', 'Giá trị': subtaskCounts.completed, 'Ghi chú': subtaskCounts.total > 0 ? `${((subtaskCounts.completed / subtaskCounts.total) * 100).toFixed(1)}% tổng subtasks` : 'N/A' },
                { 'Loại': 'Subtasks', 'Chỉ số': 'Subtask đang thực hiện', 'Giá trị': subtaskCounts.ongoing, 'Ghi chú': subtaskCounts.total > 0 ? `${((subtaskCounts.ongoing / subtaskCounts.total) * 100).toFixed(1)}% tổng subtasks` : 'N/A' },
                { 'Loại': 'Subtasks', 'Chỉ số': 'Subtask chưa bắt đầu', 'Giá trị': subtaskCounts.pending, 'Ghi chú': subtaskCounts.total > 0 ? `${((subtaskCounts.pending / subtaskCounts.total) * 100).toFixed(1)}% tổng subtasks` : 'N/A' },
                { 'Loại': '', 'Chỉ số': '', 'Giá trị': '', 'Ghi chú': '' },
                { 'Loại': 'THỐNG KÊ NHÂN SỰ', 'Chỉ số': '', 'Giá trị': '', 'Ghi chú': '' },
                { 'Loại': 'Nhân sự', 'Chỉ số': 'Nhân viên tham gia', 'Giá trị': stats.activeUsers, 'Ghi chú': 'Số lượng nhân viên trong hệ thống' },
                { 'Loại': 'Nhân sự', 'Chỉ số': 'Tổng giờ làm việc', 'Giá trị': `${stats.totalHoursLogged}h`, 'Ghi chú': 'Tổng thời gian đã ghi nhận' },
                { 'Loại': 'Nhân sự', 'Chỉ số': 'Trung bình giờ/người', 'Giá trị': `${stats.avgHoursPerUser}h`, 'Ghi chú': 'Thời gian trung bình mỗi nhân viên' },
                { 'Loại': '', 'Chỉ số': '', 'Giá trị': '', 'Ghi chú': '' },
                { 'Loại': 'THỐNG KÊ KHÁC', 'Chỉ số': '', 'Giá trị': '', 'Ghi chú': '' },
                { 'Loại': 'Tài liệu', 'Chỉ số': 'Tổng tài liệu', 'Giá trị': stats.totalDocuments, 'Ghi chú': 'Số lượng tài liệu trong hệ thống' },
                { 'Loại': 'Tài liệu', 'Chỉ số': 'Trung bình tài liệu/dự án', 'Giá trị': stats.documentsPerProject, 'Ghi chú': 'Số tài liệu trung bình mỗi dự án' },
                { 'Loại': 'Nhóm', 'Chỉ số': 'Tổng nhóm làm việc', 'Giá trị': stats.totalGroups, 'Ghi chú': 'Số lượng nhóm trong hệ thống' },
                { 'Loại': 'Nhóm', 'Chỉ số': 'Nhóm đang hoạt động', 'Giá trị': stats.activeGroups, 'Ghi chú': `${stats.totalGroups > 0 ? ((stats.activeGroups / stats.totalGroups) * 100).toFixed(1) : 0}% tổng số nhóm` },
            ]

            const wsStats = XLSX.utils.json_to_sheet(statsData)
            wsStats['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 35 }]
            XLSX.utils.book_append_sheet(wb, wsStats, 'Thống kê chi tiết')

            // Add top performers sheet
            if (topPerformers.length > 0) {
                const performersData = topPerformers.map((performer, index) => ({
                    'Hạng': index + 1,
                    'Tên nhân viên': performer.name,
                    'Số công việc hoàn thành': performer.tasks,
                    'Đánh giá': index === 0 ? 'Xuất sắc nhất' : index < 3 ? 'Xuất sắc' : 'Tốt'
                }))
                const wsPerformers = XLSX.utils.json_to_sheet(performersData)
                wsPerformers['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 20 }, { wch: 15 }]
                XLSX.utils.book_append_sheet(wb, wsPerformers, 'Top nhân viên')
            }

            // Save file with enhanced name
            const date = new Date().toISOString().split('T')[0]
            const time = new Date().toTimeString().slice(0, 5).replace(':', '')
            XLSX.writeFile(wb, `Bao_cao_tong_quan_${date}_${time}.xlsx`)
        } catch (error) {
            console.error("Export Excel error:", error)
            showError("Có lỗi khi xuất file Excel")
        }
    }

    const handleExportPDF = async () => {
        if (!printRef.current) return
        setExportingPdf(true)

        try {
            // Helper to convert Vietnamese to ASCII for PDF compatibility
            const toSafeText = (text: string): string => {
                if (!text) return ''
                return text
                    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
                    .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
                    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
                    .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
                    .replace(/[ìíịỉĩ]/g, 'i')
                    .replace(/[ÌÍỊỈĨ]/g, 'I')
                    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
                    .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
                    .replace(/[ùúụủũưừứựửữ]/g, 'u')
                    .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
                    .replace(/[ỳýỵỷỹ]/g, 'y')
                    .replace(/[ỲÝỴỶỸ]/g, 'Y')
                    .replace(/[đ]/g, 'd')
                    .replace(/[Đ]/g, 'D')
                    .replace(/[^\w\s.-]/g, '')
                    .trim()
            }

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 15
            let yPos = margin

            // Helper to add new page if needed
            const checkPageBreak = (requiredSpace: number) => {
                if (yPos + requiredSpace > pageHeight - margin) {
                    pdf.addPage()
                    yPos = margin
                    return true
                }
                return false
            }

            // HEADER
            pdf.setFillColor(40, 86, 255)
            pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F')

            pdf.setFontSize(20)
            pdf.setTextColor(255, 255, 255)
            pdf.text('BAO CAO TONG QUAN DU AN', margin + 5, yPos + 10)

            pdf.setFontSize(9)
            const currentDate = new Date()
            const dateStr = `Ngay xuat: ${currentDate.toLocaleDateString('vi-VN')}`
            const timeStr = `${currentDate.toLocaleTimeString('vi-VN')}`
            pdf.text(dateStr, margin + 5, yPos + 18)
            pdf.text(timeStr, pageWidth - margin - pdf.getTextWidth(timeStr) - 5, yPos + 18)

            yPos += 35

            // SUMMARY BOX
            checkPageBreak(40)
            pdf.setFillColor(248, 249, 250)
            pdf.setDrawColor(220, 220, 220)
            pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 2, 2, 'FD')

            pdf.setFontSize(12)
            pdf.setTextColor(30, 30, 30)
            pdf.text('TONG QUAN HE THONG', margin + 5, yPos + 8)

            pdf.setFontSize(9)
            pdf.setTextColor(70, 70, 70)
            const col1 = margin + 5
            const col2 = margin + (pageWidth - 2 * margin) / 2

            pdf.text(`Du an: ${stats.totalProjects} (${stats.completedProjects} hoan thanh)`, col1, yPos + 16)
            pdf.text(`Nhan vien: ${stats.activeUsers} (${stats.totalHoursLogged}h)`, col2, yPos + 16)
            pdf.text(`Tasks: ${taskCounts.total} (${taskCounts.completed} hoan thanh)`, col1, yPos + 22)
            pdf.text(`Ty le: ${stats.completionRate}%`, col2, yPos + 22)
            pdf.text(`Qua han: ${stats.overdueTasks}`, col1, yPos + 28)
            pdf.text(`Tai lieu: ${stats.totalDocuments} | Nhom: ${stats.totalGroups}`, col2, yPos + 28)

            yPos += 45

            // PROJECT TABLE
            checkPageBreak(30)
            pdf.setFontSize(14)
            pdf.setTextColor(30, 30, 30)
            pdf.text('CHI TIET DU AN', margin, yPos)
            yPos += 8

            // Table header
            const rowHeight = 7
            const colWidths = [12, 55, 35, 20, 20, 28]
            const colX = [margin]
            for (let i = 1; i < colWidths.length; i++) {
                colX[i] = colX[i - 1] + colWidths[i - 1]
            }

            pdf.setFillColor(40, 86, 255)
            pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F')

            pdf.setFontSize(9)
            pdf.setTextColor(255, 255, 255)
            pdf.text('STT', colX[0] + 2, yPos + 5)
            pdf.text('TEN DU AN', colX[1] + 2, yPos + 5)
            pdf.text('QUAN LY', colX[2] + 2, yPos + 5)
            pdf.text('TIEN DO', colX[3] + 2, yPos + 5)
            pdf.text('TASKS', colX[4] + 2, yPos + 5)
            pdf.text('TRANG THAI', colX[5] + 2, yPos + 5)
            yPos += rowHeight

            // Table rows
            pdf.setFontSize(8)
            pdf.setTextColor(50, 50, 50)

            const statusMap: { [key: string]: string } = {
                'da_hoan_thanh': 'Hoan thanh',
                'dang_chay': 'Dang chay',
                'chua_bat_dau': 'Chua BD',
                'da_dong': 'Da dong'
            }

            tableData.slice(0, 30).forEach((row, index) => {
                checkPageBreak(rowHeight + 5)

                // Alternating background
                if (index % 2 === 0) {
                    pdf.setFillColor(250, 250, 250)
                    pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F')
                }

                const projectName = toSafeText(row.project).substring(0, 28)
                const managerName = toSafeText(row.manager).substring(0, 16)
                const status = statusMap[row.status] || toSafeText(row.status).substring(0, 12)

                pdf.setTextColor(50, 50, 50)
                pdf.text((index + 1).toString(), colX[0] + 2, yPos + 5)
                pdf.text(projectName, colX[1] + 2, yPos + 5)
                pdf.text(managerName, colX[2] + 2, yPos + 5)

                // Color-coded progress
                const progressColor = row.progress >= 80 ? [34, 197, 94] :
                    row.progress >= 50 ? [59, 130, 246] :
                        row.progress >= 30 ? [251, 191, 36] : [239, 68, 68]
                pdf.setTextColor(progressColor[0], progressColor[1], progressColor[2])
                pdf.text(`${row.progress}%`, colX[3] + 2, yPos + 5)

                pdf.setTextColor(50, 50, 50)
                pdf.text(`${row.completed}/${row.tasks}`, colX[4] + 2, yPos + 5)
                pdf.text(status, colX[5] + 2, yPos + 5)

                yPos += rowHeight
            })

            // TOP PERFORMERS
            if (topPerformers.length > 0) {
                yPos += 10
                checkPageBreak(40)

                pdf.setFontSize(12)
                pdf.setTextColor(30, 30, 30)
                pdf.text('TOP NHAN VIEN XUAT SAC', margin, yPos + 2)
                yPos += 10

                // Top performers header
                pdf.setFillColor(255, 243, 205)
                pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F')

                pdf.setFontSize(9)
                pdf.setTextColor(40, 40, 40)
                pdf.text('HANG', margin + 5, yPos + 5)
                pdf.text('TEN NHAN VIEN', margin + 25, yPos + 5)
                pdf.text('TASKS', margin + 100, yPos + 5)
                pdf.text('DANH GIA', margin + 130, yPos + 5)
                yPos += rowHeight

                pdf.setFontSize(8)
                pdf.setTextColor(60, 60, 60)

                topPerformers.slice(0, 10).forEach((performer, index) => {
                    checkPageBreak(6)
                    const cleanName = toSafeText(performer.name).substring(0, 28)
                    const rating = index === 0 ? 'Xuat sac nhat' : index < 3 ? 'Xuat sac' : 'Tot'

                    pdf.setTextColor(60, 60, 60)
                    pdf.text(`${index + 1}`, margin + 5, yPos + 4)
                    pdf.text(cleanName, margin + 25, yPos + 4)
                    pdf.text(performer.tasks.toString(), margin + 100, yPos + 4)
                    pdf.text(rating, margin + 130, yPos + 4)
                    yPos += 5
                })
            }

            // FOOTER on all pages
            const pageCount = (pdf as any).internal.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i)
                pdf.setFillColor(248, 249, 250)
                pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F')

                pdf.setFontSize(8)
                pdf.setTextColor(120, 120, 120)
                pdf.text('He thong quan ly cong viec', margin, pageHeight - 6)

                const pageText = `Trang ${i}/${pageCount}`
                pdf.text(pageText, pageWidth - margin - pdf.getTextWidth(pageText), pageHeight - 6)
            }

            // Save PDF
            const date = new Date().toISOString().split('T')[0]
            const time = new Date().toTimeString().slice(0, 5).replace(':', '')
            pdf.save(`Bao_cao_tong_quan_${date}_${time}.pdf`)

        } catch (error) {

            console.error("Export PDF error:", error)
            showError("Có lỗi khi xuất file PDF")

        }
    }

    const handleRefresh = async () => {
        setLoading(true)
        try {
            await loadInitialData()
        } catch (err) {
            console.error('Refresh error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("desc")
        }
    }

    // Sorting and filtering for table
    const filteredAndSortedData = tableData
        .filter(row =>
            row.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.manager.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const aVal = a[sortField as keyof typeof a]
            const bVal = b[sortField as keyof typeof b]

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === "asc" ? aVal - bVal : bVal - aVal
            }

            const aStr = String(aVal).toLowerCase()
            const bStr = String(bVal).toLowerCase()
            return sortDirection === "asc"
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr)
        })

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredAndSortedData.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

    const getStatusColor = (status: string) => {
        const statusLower = (status || '').toString().toLowerCase()
        // Project status từ DB: chua_bat_dau, dang_chay, da_hoan_thanh, da_dong
        if (statusLower === 'da_hoan_thanh' || statusLower === 'da_dong') return 'bg-green-100 text-green-700'
        if (statusLower === 'dang_chay') return 'bg-blue-100 text-blue-700'
        if (statusLower === 'chua_bat_dau') return 'bg-gray-100 text-gray-700'
        return 'bg-gray-100 text-gray-700'
    }

    const getStatusLabel = (status: string) => {
        const statusLower = (status || '').toString().toLowerCase()
        if (statusLower === 'da_hoan_thanh') return 'Hoàn thành'
        if (statusLower === 'da_dong') return 'Đã đóng'
        if (statusLower === 'dang_chay') return 'Đang chạy'
        if (statusLower === 'chua_bat_dau') return 'Chưa bắt đầu'
        return status
    }

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500'
        if (progress >= 50) return 'bg-blue-500'
        if (progress >= 30) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const statCards = [
        {
            icon: FolderKanban,
            title: "Tổng dự án",
            variant: 'large',
            main: stats.totalProjects,
            breakdown: (
                <div className="text-sm text-muted-foreground">
                    <div>Hoàn thành: <b>{stats.completedProjects}</b></div>
                    <div>Chưa bắt đầu: <b>{stats.pendingProjects}</b></div>
                    <div>Đang thực hiện: <b>{stats.ongoingProjects}</b></div>
                </div>
            ),
            change: `+${stats.completedProjects + stats.pendingProjects + stats.ongoingProjects} tuần này`,
            color: "from-blue-500 to-cyan-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            title: "Công việc (Tasks)",
            variant: 'large',
            icon: CheckSquare,
            main: taskCounts.total,
            breakdown: (
                <div className="text-sm">
                    <div>Hoàn thành: <span className="font-semibold">{taskCounts.completed}</span></div>
                    <div>Đang chạy: <span className="font-semibold">{taskCounts.ongoing}</span></div>
                    <div>Chưa bắt đầu: <span className="font-semibold">{taskCounts.pending}</span></div>
                </div>
            ),
            change: "Tổng: " + taskCounts.total,
            color: "from-emerald-500 to-green-600",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-600",
        },
        {
            title: "Subtasks",
            variant: 'large',
            icon: CheckSquare,
            main: subtaskCounts.total,
            breakdown: (
                <div className="text-sm">
                    <div>Hoàn thành: <span className="font-semibold">{subtaskCounts.completed}</span></div>
                    <div>Đang chạy: <span className="font-semibold">{subtaskCounts.ongoing}</span></div>
                    <div>Chưa bắt đầu: <span className="font-semibold">{subtaskCounts.pending}</span></div>
                </div>
            ),
            change: "Tổng: " + subtaskCounts.total,
            color: "from-cyan-500 to-blue-600",
            bgColor: "bg-cyan-50",
            textColor: "text-cyan-600",
        },
        {
            title: "Nhân viên hoạt động",
            value: stats.activeUsers,
            change: "+2 tuần này",
            icon: Users,
            color: "from-purple-500 to-pink-600",
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
        },
        {
            title: "Tỷ lệ hoàn thành",
            value: `${stats.completionRate}%`,
            change: "+5% tuần này",
            icon: TrendingUp,
            color: "from-orange-500 to-red-600",
            bgColor: "bg-orange-50",
            textColor: "text-orange-600",
        },
        {
            title: "Tasks quá hạn",
            value: stats.overdueTasks,
            change: stats.overdueTasks > 0 ? "Cần xử lý" : "Tốt",
            icon: AlertTriangle,
            color: "from-red-500 to-pink-600",
            bgColor: "bg-red-50",
            textColor: "text-red-600",
        },
        {
            title: "Tổng giờ làm việc",
            value: `${stats.totalHoursLogged}h`,
            change: `Trung bình: ${stats.avgHoursPerUser}h/người`,
            icon: Clock,
            color: "from-teal-500 to-cyan-600",
            bgColor: "bg-teal-50",
            textColor: "text-teal-600",
        },
        {
            title: "Tài liệu",
            value: stats.totalDocuments,
            change: `TB: ${stats.documentsPerProject} tài liệu/dự án`,
            icon: FileText,
            color: "from-yellow-500 to-orange-600",
            bgColor: "bg-yellow-50",
            textColor: "text-yellow-600",
        },
        {
            title: "Nhóm làm việc",
            value: stats.totalGroups,
            change: `${stats.activeGroups} nhóm đang hoạt động`,
            icon: Briefcase,
            color: "from-violet-500 to-purple-600",
            bgColor: "bg-violet-50",
            textColor: "text-violet-600",
        },
    ]

    // Show loading skeleton
    if (loading && projects.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-10 w-64 bg-secondary rounded animate-pulse"></div>
                    <div className="flex gap-3">
                        <div className="h-10 w-24 bg-secondary rounded animate-pulse"></div>
                        <div className="h-10 w-32 bg-secondary rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <StatCardSkeleton key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <ChartSkeleton key={i} />)}
                </div>
                <TableSkeleton />
            </div>
        )
    }

    return (
        <div className="space-y-6" ref={printRef}>
            {/* Add print-specific styles */}
            <style jsx global>{`
                @media print {
                    * {
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:text-black {
                        color: #000 !important;
                    }
                    .print\\:bg-white {
                        background-color: #fff !important;
                    }
                    .print\\:border-gray {
                        border-color: #e5e7eb !important;
                    }
                }
            `}</style>

            {/* Debug panel removed */}
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-2 md:gap-3 print:text-black">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 print:bg-blue-600">
                            <BarChart3 className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-white" />
                        </div>
                        Báo cáo & Thống kê
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground print:text-gray-600">Tổng quan và phân tích dữ liệu hệ thống</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 md:py-2 border border-border rounded-lg hover:bg-secondary transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm md:text-base"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 md:py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 print:hidden text-sm md:text-base"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Xuất Excel</span>
                        <span className="sm:hidden">Excel</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={exportingPdf}
                        className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 md:py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 print:hidden disabled:opacity-50 text-sm md:text-base"
                    >
                        {exportingPdf ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">Đang xuất...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Xuất PDF</span>
                                <span className="sm:hidden">PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm print:hidden">
                <form onSubmit={handleSubmitFilter}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                            <h2 className="text-base md:text-lg font-semibold text-foreground">Bộ lọc</h2>
                        </div>
                        {/* Preset Filters */}
                        <div className="flex flex-wrap gap-1 md:gap-2">
                            <button
                                type="button"
                                onClick={() => applyPresetFilter('thisMonth')}
                                className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm transition-colors ${filters.preset === 'thisMonth'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-secondary hover:bg-secondary/80'
                                    }`}
                            >
                                Tháng này
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPresetFilter('thisQuarter')}
                                className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm transition-colors ${filters.preset === 'thisQuarter'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-secondary hover:bg-secondary/80'
                                    }`}
                            >
                                Quý này
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPresetFilter('thisYear')}
                                className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm transition-colors ${filters.preset === 'thisYear'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-secondary hover:bg-secondary/80'
                                    }`}
                            >
                                Năm này
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-foreground mb-1.5 md:mb-2">Từ ngày</label>
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-foreground mb-1.5 md:mb-2">Đến ngày</label>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-foreground mb-1.5 md:mb-2">Dự án</label>
                            <select
                                name="projectId"
                                value={filters.projectId}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">Tất cả</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.tenduan || project.ten || `Dự án ${project.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-foreground mb-1.5 md:mb-2">Trạng thái</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">Tất cả</option>
                                <option value="completed">Hoàn thành</option>
                                <option value="ongoing">Đang thực hiện</option>
                                <option value="pending">Chưa bắt đầu</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-foreground mb-1.5 md:mb-2">Nhân viên</label>
                            <select
                                name="userId"
                                value={filters.userId}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">Tất cả</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.hoten || user.manv || `User ${user.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-4 md:mt-6">
                        <button
                            type="submit"
                            className="flex-1 sm:flex-none px-4 py-2.5 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-sm md:text-base"
                        >
                            Lọc
                        </button>
                        <button
                            type="button"
                            onClick={handleResetFilter}
                            className="flex-1 sm:flex-none px-4 py-2.5 md:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm md:text-base"
                        >
                            Hủy lọc
                        </button>
                    </div>
                </form>
            </div>

            {/* Stats Cards - 8 cards in 4x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                {statCards.map((stat: any, index: number) => {
                    const Icon = stat.icon
                    // Large variant: render a wider, two-column style card
                    if (stat.variant === 'large') {
                        return (
                            <div
                                key={index}
                                className="relative group overflow-hidden bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-sm lg:col-span-2"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                                    <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                                        <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                                    </div>
                                    <div className="flex items-center gap-1 text-[#0084CF] text-xs md:text-sm font-medium">
                                        <TrendingUp size={14} className="md:w-4 md:h-4" />
                                        {stat.change}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 md:gap-3">
                                    <div>
                                        <p className="text-muted-foreground text-xs md:text-sm mb-1">{stat.title}</p>
                                        <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground">{stat.main ?? stat.value}</div>
                                    </div>
                                    <div className="text-xs md:text-sm">{stat.breakdown ?? stat.value}</div>
                                </div>
                            </div>
                        )
                    }

                    // Default small card
                    return (
                        <div
                            key={index}
                            className="relative group overflow-hidden bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-sm"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
                                <div
                                    className={`w-11 h-11 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md shadow-[#003D82]/20 flex-shrink-0`}
                                >
                                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1 text-[#0084CF] text-xs md:text-sm font-medium">
                                    <TrendingUp size={14} className="md:w-4 md:h-4" />
                                    {stat.change}
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs md:text-sm mb-1">{stat.title}</p>
                                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value ?? stat.main}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                {/* Project Status - Pie Chart */}
                <div className="bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                        <PieChart className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                        <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">Trạng thái dự án</h2>
                    </div>
                    {(!chartData.projectStatus || chartData.projectStatus.reduce((s: any, i: any) => s + (i.value || 0), 0) === 0) ? (
                        <EmptyState message="Không có dự án trong phạm vi lọc này" />
                    ) : (
                        <ResponsiveContainer width="100%" height={220} className="text-xs md:text-sm">
                            <RechartsPie>
                                <Pie
                                    data={chartData.projectStatus}
                                    cx="50%"
                                    cy="50%"
                                    label={false}
                                    labelLine={false}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.projectStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: any) => [value, 'Số dự án']} />
                            </RechartsPie>
                        </ResponsiveContainer>
                    )}
                    <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2">
                        {chartData.projectStatus.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs md:text-sm text-muted-foreground">{item.name}</span>
                                </div>
                                <span className="text-xs md:text-sm font-semibold text-foreground">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Task Progress - Area Chart */}
                <div className="bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                        <LineChart className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                        <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">Xu hướng hoàn thành</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={220} className="text-xs md:text-sm">
                        <AreaChart data={chartData.taskProgress}>
                            <defs>
                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOngoing" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={11} className="text-xs md:text-sm" />
                            <YAxis stroke="#6b7280" fontSize={11} className="text-xs md:text-sm" />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" name="Hoàn thành" />
                            <Area type="monotone" dataKey="ongoing" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOngoing)" name="Đang thực hiện" />
                            <Area type="monotone" dataKey="overdue" stroke="#ef4444" fillOpacity={0.6} fill="url(#colorOverdue)" name="Quá hạn" />
                            <Legend verticalAlign="top" align="right" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* User Performance - Bar Chart */}
                <div className="bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                        <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                        <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">Top performers</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={220} className="text-xs md:text-sm">
                        <RechartsBar data={chartData.userPerformance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={9} angle={-20} textAnchor="end" height={70} />
                            <YAxis stroke="#6b7280" fontSize={11} />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="tasks" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Tasks hoàn thành" />
                        </RechartsBar>
                    </ResponsiveContainer>
                </div>

                {/* Stacked chart: status breakdown per project */}
                <div className="bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm md:col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                        <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                        <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">Trạng thái theo dự án</h2>
                    </div>
                    {(!chartData.projectByStatus || chartData.projectByStatus.length === 0) ? (
                        <EmptyState message="Không có dự án hoặc không có tasks để hiển thị phân tích theo dự án." />
                    ) : (
                        <ResponsiveContainer width="100%" height={320} className="text-xs md:text-sm">
                            <RechartsBar data={chartData.projectByStatus} margin={{ top: 10, right: 20, left: 0, bottom: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="project" stroke="#6b7280" fontSize={10} angle={-30} textAnchor="end" interval={0} height={90} />
                                <YAxis stroke="#6b7280" fontSize={11} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                                />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ width: 160 }} />
                                <Bar dataKey="completed" stackId="a" fill="#10b981" name="Hoàn thành" />
                                <Bar dataKey="ongoing" stackId="a" fill="#3b82f6" name="Đang thực hiện" />
                                <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Chưa bắt đầu" />
                            </RechartsBar>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Worklog Hours - Bar Chart */}
                {chartData.worklogHours && chartData.worklogHours.length > 0 && (
                    <div className="bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4 md:mb-6">
                            <Clock className="w-4 h-4 md:w-5 md:h-5 text-teal-500" />
                            <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">Giờ làm việc theo nhân viên</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={220} className="text-xs md:text-sm">
                            <RechartsBar data={chartData.worklogHours}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={9} angle={-20} textAnchor="end" height={70} />
                                <YAxis stroke="#6b7280" fontSize={11} />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="hours" fill="#14b8a6" radius={[8, 8, 0, 0]} name="Giờ làm việc" />
                            </RechartsBar>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Top Performers List */}
            {topPerformers.length > 0 && (
                <div className="bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                        <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">Top 5 nhân viên xuất sắc</h2>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                        {topPerformers.map((user, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors gap-2 sm:gap-4">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm md:text-lg flex-shrink-0">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm md:text-base">{user.name}</p>
                                        <p className="text-xs md:text-sm text-muted-foreground">{user.tasks} tasks hoàn thành</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy className={`w-4 h-4 md:w-5 md:h-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-card border border-border rounded-lg md:rounded-2xl p-4 md:p-6 shadow-sm overflow-x-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                    <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">Chi tiết dự án</h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-3 md:pr-4 py-2 border border-border rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto -mx-4 md:-mx-6">
                    <table className="w-full">
                        <thead className="bg-secondary">
                            <tr>
                                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-foreground">
                                    <button
                                        onClick={() => handleSort('project')}
                                        className="flex items-center gap-1 hover:text-blue-500"
                                    >
                                        Dự án
                                        <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                </th>
                                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-foreground">
                                    <button
                                        onClick={() => handleSort('tasks')}
                                        className="flex items-center gap-1 hover:text-blue-500"
                                    >
                                        Tổng Tasks
                                        <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                </th>
                                <th className="hidden sm:table-cell px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-foreground">
                                    <button
                                        onClick={() => handleSort('completed')}
                                        className="flex items-center gap-1 hover:text-blue-500"
                                    >
                                        Hoàn thành
                                        <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                </th>
                                <th className="hidden lg:table-cell px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-foreground">
                                    <button
                                        onClick={() => handleSort('progress')}
                                        className="flex items-center gap-1 hover:text-blue-500"
                                    >
                                        Tiến độ
                                        <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                </th>
                                <th className="hidden md:table-cell px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-foreground">Deadline</th>
                                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-foreground">Trạng thái</th>
                                <th className="hidden lg:table-cell px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-foreground">Quản lý</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <EmptyState message="Không tìm thấy dự án nào. Thử điều chỉnh bộ lọc hoặc tìm kiếm của bạn." />
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((row, index) => (
                                    <tr key={row.id} className={`border-b border-border hover:bg-secondary/50 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-secondary/20'}`}>
                                        <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium text-foreground">{row.project}</td>
                                        <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-muted-foreground">{row.tasks}</td>
                                        <td className="hidden sm:table-cell px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-muted-foreground">{row.completed}</td>
                                        <td className="hidden lg:table-cell px-3 md:px-4 py-2 md:py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-secondary rounded-full h-2 max-w-[80px]">
                                                    <div
                                                        className={`${getProgressColor(row.progress)} h-2 rounded-full transition-all`}
                                                        style={{ width: `${row.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs md:text-sm font-semibold text-foreground min-w-[35px]">{row.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-muted-foreground">{row.deadline}</td>
                                        <td className="px-3 md:px-4 py-2 md:py-3">
                                            <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                                                {getStatusLabel(row.status)}
                                            </span>
                                        </td>
                                        <td className="hidden lg:table-cell px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-muted-foreground">{row.manager}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mt-4 md:mt-6">
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAndSortedData.length)} trong tổng {filteredAndSortedData.length} dự án
                    </p>
                    <div className="flex items-center gap-2 justify-center sm:justify-end">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-1 md:p-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs md:text-sm text-muted-foreground px-2">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 md:p-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
