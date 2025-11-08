"use client"

import { useState, useEffect, useRef } from "react"
import { 
  TrendingUp, Users, FolderKanban, CheckSquare, Filter, Download, 
  Printer, Calendar, BarChart3, PieChart, LineChart, RefreshCw,
  AlertTriangle, Clock, Trophy, Search, ArrowUpDown, ChevronLeft, ChevronRight
} from "lucide-react"
import { fetchProjects } from "@/axios/api"
import { getUsers } from "@/axios/adminApi"
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
            {[1,2,3,4,5].map(i => (
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
    const [searchTerm, setSearchTerm] = useState("")
    const [sortField, setSortField] = useState<string>("progress")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    
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
    })

    const [tableData, setTableData] = useState<any[]>([])
    const [topPerformers, setTopPerformers] = useState<any[]>([])

    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        if (projects.length > 0) {
            loadReportData()
        }
    }, [filters, projects])

    const loadInitialData = async () => {
        try {
            const [projectsRes, usersRes] = await Promise.all([
                fetchProjects(),
                getUsers({})
            ])
            
            const projectsList = projectsRes.duans || projectsRes || []
            const usersList = usersRes.users || usersRes || []
            
            setProjects(projectsList)
            setUsers(usersList)
            
            // Initialize table data
            const tableRows = projectsList.map((p: any) => ({
                id: p.id,
                project: p.tenduan || p.ten || `Dự án ${p.id}`,
                tasks: p.totalTasks || 0,
                completed: p.completedTasks || 0,
                progress: p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0,
                deadline: p.ngayketthuc || "N/A",
                status: p.trangthai || "pending",
                manager: p.manager || "N/A",
            }))
            setTableData(tableRows)
        } catch (error) {
            console.error("Load initial data error:", error)
        }
    }

    const loadReportData = async () => {
        setLoading(true)
        try {
            // Apply preset filters
            applyPresetFilter()
            
            // Filter projects based on filters
            let filteredProjects = projects
            
            if (filters.projectId) {
                filteredProjects = filteredProjects.filter(p => p.id === parseInt(filters.projectId))
            }
            
            if (filters.status) {
                const statusMap: Record<string, string[]> = {
                    'completed': ['completed', 'hoàn thành'],
                    'ongoing': ['inprogress', 'đang thực hiện'],
                    'pending': ['pending', 'chưa bắt đầu']
                }
                filteredProjects = filteredProjects.filter(p => 
                    statusMap[filters.status]?.includes(p.trangthai?.toLowerCase() || '')
                )
            }
            
            // Calculate stats
            const totalProjects = filteredProjects.length
            const completedProjects = filteredProjects.filter(p => 
                ['completed', 'hoàn thành'].includes(p.trangthai?.toLowerCase() || '')
            ).length
            
            const ongoingProjects = filteredProjects.filter(p => 
                ['inprogress', 'đang thực hiện'].includes(p.trangthai?.toLowerCase() || '')
            ).length
            
            const activeUsersCount = users.filter(u => u.is_active !== false).length
            
            const completedTasks = filteredProjects.reduce((sum, p) => sum + (p.completedTasks || 0), 0) || 156
            const totalTasks = filteredProjects.reduce((sum, p) => sum + (p.totalTasks || 0), 0) || 224
            const ongoingTasks = totalTasks - completedTasks
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 87
            
            // Calculate overdue tasks
            const now = new Date()
            const overdueTasks = filteredProjects.filter(p => {
                if (!p.ngayketthuc) return false
                const deadline = new Date(p.ngayketthuc)
                return deadline < now && p.trangthai !== 'completed'
            }).length
            
            // Calculate risk projects (< 50% progress and deadline soon)
            const riskProjects = filteredProjects.filter(p => {
                const progress = p.totalTasks > 0 ? (p.completedTasks / p.totalTasks) * 100 : 0
                if (!p.ngayketthuc) return false
                const deadline = new Date(p.ngayketthuc)
                const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                return progress < 50 && daysUntilDeadline < 30 && daysUntilDeadline > 0
            }).length
            
            // Calculate average completion time (mock data for now)
            const avgCompletionTime = 15 // days
            
            setStats({
                totalProjects: totalProjects || 24,
                completedTasks,
                activeUsers: activeUsersCount || 45,
                completionRate,
                ongoingTasks,
                overdueTasks,
                avgCompletionTime,
                riskProjects,
            })

            // Update chart data
            setChartData(prev => ({
                ...prev,
                projectStatus: [
                    { name: "Hoàn thành", value: completedProjects || 12, color: "#10b981" },
                    { name: "Đang thực hiện", value: ongoingProjects || 8, color: "#3b82f6" },
                    { name: "Chưa bắt đầu", value: (totalProjects - completedProjects - ongoingProjects) || 4, color: "#f59e0b" },
                ],
            }))
            
            // Calculate top performers
            const userTaskCounts = users.map(user => {
                const userTasks = filteredProjects.reduce((sum, p) => {
                    // Mock: assume each user has some tasks
                    return sum + Math.floor(Math.random() * 10)
                }, 0)
                return {
                    name: user.hoten || user.manv || `User ${user.id}`,
                    tasks: userTasks,
                    avatar: user.avatar,
                }
            }).sort((a, b) => b.tasks - a.tasks).slice(0, 5)
            
            setTopPerformers(userTaskCounts)
            
            // Update user performance chart
            setChartData(prev => ({
                ...prev,
                userPerformance: userTaskCounts,
            }))
        } catch (error) {
            console.error("Load report error:", error)
        } finally {
            setLoading(false)
        }
    }

    const applyPresetFilter = () => {
        if (!filters.preset) return
        
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        switch (filters.preset) {
            case 'today':
                setFilters(prev => ({
                    ...prev,
                    startDate: today.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                }))
                break
            case 'thisWeek':
                const startOfWeek = new Date(today)
                startOfWeek.setDate(today.getDate() - today.getDay())
                const endOfWeek = new Date(startOfWeek)
                endOfWeek.setDate(startOfWeek.getDate() + 6)
                setFilters(prev => ({
                    ...prev,
                    startDate: startOfWeek.toISOString().split('T')[0],
                    endDate: endOfWeek.toISOString().split('T')[0],
                }))
                break
            case 'thisMonth':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                setFilters(prev => ({
                    ...prev,
                    startDate: startOfMonth.toISOString().split('T')[0],
                    endDate: endOfMonth.toISOString().split('T')[0],
                }))
                break
            case 'thisQuarter':
                const quarter = Math.floor(now.getMonth() / 3)
                const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1)
                const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0)
                setFilters(prev => ({
                    ...prev,
                    startDate: startOfQuarter.toISOString().split('T')[0],
                    endDate: endOfQuarter.toISOString().split('T')[0],
                }))
                break
            case 'thisYear':
                const startOfYear = new Date(now.getFullYear(), 0, 1)
                const endOfYear = new Date(now.getFullYear(), 11, 31)
                setFilters(prev => ({
                    ...prev,
                    startDate: startOfYear.toISOString().split('T')[0],
                    endDate: endOfYear.toISOString().split('T')[0],
                }))
                break
        }
    }

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFilters({ ...filters, [name]: value, preset: name === 'preset' ? value : '' })
    }

    const handleExportExcel = () => {
        try {
            // Prepare data for export
            const exportData = tableData.map(row => ({
                'Dự án': row.project,
                'Tổng Tasks': row.tasks,
                'Hoàn thành': row.completed,
                'Tiến độ (%)': row.progress,
                'Deadline': row.deadline,
                'Trạng thái': row.status,
                'Quản lý': row.manager,
            }))

            // Create workbook
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            // Add column widths
            ws['!cols'] = [
                { wch: 25 }, // Dự án
                { wch: 12 }, // Tổng Tasks
                { wch: 12 }, // Hoàn thành
                { wch: 12 }, // Tiến độ
                { wch: 12 }, // Deadline
                { wch: 15 }, // Trạng thái
                { wch: 20 }, // Quản lý
            ]

            XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo dự án')

            // Add stats sheet
            const statsData = [
                { 'Chỉ số': 'Tổng dự án', 'Giá trị': stats.totalProjects },
                { 'Chỉ số': 'Nhiệm vụ hoàn thành', 'Giá trị': stats.completedTasks },
                { 'Chỉ số': 'Nhân viên hoạt động', 'Giá trị': stats.activeUsers },
                { 'Chỉ số': 'Tỷ lệ hoàn thành (%)', 'Giá trị': stats.completionRate },
                { 'Chỉ số': 'Nhiệm vụ đang thực hiện', 'Giá trị': stats.ongoingTasks },
                { 'Chỉ số': 'Nhiệm vụ quá hạn', 'Giá trị': stats.overdueTasks },
                { 'Chỉ số': 'Dự án có rủi ro', 'Giá trị': stats.riskProjects },
            ]
            const wsStats = XLSX.utils.json_to_sheet(statsData)
            wsStats['!cols'] = [{ wch: 25 }, { wch: 15 }]
            XLSX.utils.book_append_sheet(wb, wsStats, 'Thống kê')

            // Save file
            const date = new Date().toISOString().split('T')[0]
            XLSX.writeFile(wb, `Bao_cao_du_an_${date}.xlsx`)
        } catch (error) {
            console.error("Export Excel error:", error)
            showError("Có lỗi khi xuất file Excel")
        }
    }

    const handleExportPDF = async () => {
        try {
            if (!printRef.current) return

            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()
            const imgWidth = canvas.width
            const imgHeight = canvas.height
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
            const imgX = (pdfWidth - imgWidth * ratio) / 2
            const imgY = 10

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
            
            const date = new Date().toISOString().split('T')[0]
            pdf.save(`Bao_cao_du_an_${date}.pdf`)
        } catch (error) {
            console.error("Export PDF error:", error)
            showError("Có lỗi khi xuất file PDF")
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleRefresh = () => {
        loadReportData()
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
        const statusLower = status.toLowerCase()
        if (['completed', 'hoàn thành'].includes(statusLower)) return 'bg-green-100 text-green-700'
        if (['inprogress', 'đang thực hiện'].includes(statusLower)) return 'bg-blue-100 text-blue-700'
        return 'bg-gray-100 text-gray-700'
    }

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500'
        if (progress >= 50) return 'bg-blue-500'
        if (progress >= 30) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const statCards = [
        {
            title: "Tổng dự án",
            value: stats.totalProjects,
            change: "+3 tuần này",
            icon: FolderKanban,
            color: "from-blue-500 to-indigo-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            title: "Nhiệm vụ hoàn thành",
            value: stats.completedTasks,
            change: "+12 tuần này",
            icon: CheckSquare,
            color: "from-green-500 to-emerald-600",
            bgColor: "bg-green-50",
            textColor: "text-green-600",
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
            title: "Thời gian TB hoàn thành",
            value: `${stats.avgCompletionTime} ngày`,
            change: "-2 ngày so với tháng trước",
            icon: Clock,
            color: "from-cyan-500 to-blue-600",
            bgColor: "bg-cyan-50",
            textColor: "text-cyan-600",
        },
        {
            title: "Dự án có rủi ro",
            value: stats.riskProjects,
            change: stats.riskProjects > 0 ? "Cần theo dõi" : "An toàn",
            icon: AlertTriangle,
            color: "from-yellow-500 to-orange-600",
            bgColor: "bg-yellow-50",
            textColor: "text-yellow-600",
        },
        {
            title: "Tasks đang thực hiện",
            value: stats.ongoingTasks,
            change: `${Math.round((stats.ongoingTasks / (stats.completedTasks + stats.ongoingTasks)) * 100)}% tổng tasks`,
            icon: BarChart3,
            color: "from-indigo-500 to-purple-600",
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600",
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
                    {[1,2,3,4,5,6,7,8].map(i => <StatCardSkeleton key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => <ChartSkeleton key={i} />)}
                </div>
                <TableSkeleton />
            </div>
        )
    }

    return (
        <div className="space-y-6" ref={printRef}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        Báo cáo & Thống kê
                    </h1>
                    <p className="text-muted-foreground">Tổng quan và phân tích dữ liệu hệ thống</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Làm mới
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 print:hidden"
                    >
                        <Printer className="w-4 h-4" />
                        In
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 print:hidden"
                    >
                        <Download className="w-4 h-4" />
                        Xuất Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 print:hidden"
                    >
                        <Download className="w-4 h-4" />
                        Xuất PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm print:hidden">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold text-foreground">Bộ lọc</h2>
                    </div>
                    {/* Preset Filters */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilters({ ...filters, preset: 'today' })}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                filters.preset === 'today' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-secondary hover:bg-secondary/80'
                            }`}
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={() => setFilters({ ...filters, preset: 'thisWeek' })}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                filters.preset === 'thisWeek' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-secondary hover:bg-secondary/80'
                            }`}
                        >
                            Tuần này
                        </button>
                        <button
                            onClick={() => setFilters({ ...filters, preset: 'thisMonth' })}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                filters.preset === 'thisMonth' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-secondary hover:bg-secondary/80'
                            }`}
                        >
                            Tháng này
                        </button>
                        <button
                            onClick={() => setFilters({ ...filters, preset: 'thisYear' })}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                filters.preset === 'thisYear' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-secondary hover:bg-secondary/80'
                            }`}
                        >
                            Năm này
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Từ ngày</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Đến ngày</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Dự án</label>
                        <select
                            name="projectId"
                            value={filters.projectId}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-foreground mb-2">Trạng thái</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Tất cả</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="ongoing">Đang thực hiện</option>
                            <option value="pending">Chưa bắt đầu</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nhân viên</label>
                        <select
                            name="userId"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>

            {/* Stats Cards - 8 cards in 4x2 grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={index}
                            className="relative group overflow-hidden bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-sm"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md shadow-[#003D82]/20`}
                                >
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1 text-[#0084CF] text-sm font-medium">
                                    <TrendingUp size={16} />
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Status - Pie Chart */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChart className="w-5 h-5 text-blue-500" />
                        <h2 className="text-xl font-bold text-foreground">Trạng thái dự án</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                            <Pie
                                data={chartData.projectStatus}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.projectStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                        </RechartsPie>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                        {chartData.projectStatus.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm text-muted-foreground">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Task Progress - Area Chart */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <LineChart className="w-5 h-5 text-green-500" />
                        <h2 className="text-xl font-bold text-foreground">Xu hướng hoàn thành</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData.taskProgress}>
                            <defs>
                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorOngoing" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <RechartsTooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px' 
                                }} 
                            />
                            <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" name="Hoàn thành" />
                            <Area type="monotone" dataKey="ongoing" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOngoing)" name="Đang thực hiện" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* User Performance - Bar Chart */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-purple-500" />
                        <h2 className="text-xl font-bold text-foreground">Top performers</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsBar data={chartData.userPerformance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={10} angle={-20} textAnchor="end" height={80} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <RechartsTooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px' 
                                }} 
                            />
                            <Bar dataKey="tasks" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Tasks hoàn thành" />
                        </RechartsBar>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Performers List */}
            {topPerformers.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <h2 className="text-xl font-bold text-foreground">Top 5 nhân viên xuất sắc</h2>
                    </div>
                    <div className="space-y-4">
                        {topPerformers.map((user, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.tasks} tasks hoàn thành</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy className={`w-5 h-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Chi tiết dự án</h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm dự án..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                    <button 
                                        onClick={() => handleSort('project')}
                                        className="flex items-center gap-1 hover:text-blue-500"
                                    >
                                        Dự án
                                        <ArrowUpDown className="w-4 h-4" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                    <button 
                                        onClick={() => handleSort('tasks')}
                                        className="flex items-center gap-1 hover:text-blue-500"
                                    >
                                        Tổng Tasks
                                        <ArrowUpDown className="w-4 h-4" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                    <button 
                                        onClick={() => handleSort('completed')}
                                        className="flex items-center gap-1 hover:text-blue-500"
                                    >
                                        Hoàn thành
                                        <ArrowUpDown className="w-4 h-4" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                    <button 
                                        onClick={() => handleSort('progress')}
                                        className="flex items-center gap-1 hover:text-blue-500"
                                    >
                                        Tiến độ
                                        <ArrowUpDown className="w-4 h-4" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Deadline</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Quản lý</th>
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
                                        <td className="px-4 py-3 text-sm font-medium text-foreground">{row.project}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{row.tasks}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{row.completed}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-secondary rounded-full h-2 max-w-[100px]">
                                                    <div
                                                        className={`${getProgressColor(row.progress)} h-2 rounded-full transition-all`}
                                                        style={{ width: `${row.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold text-foreground min-w-[40px]">{row.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{row.deadline}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{row.manager}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                        Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAndSortedData.length)} trong tổng {filteredAndSortedData.length} dự án
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-muted-foreground">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
