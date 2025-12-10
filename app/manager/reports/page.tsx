"use client"
import { useState, useEffect, useMemo } from "react"
import {
    BarChart3,
    TrendingUp,
    Calendar,
    Download,
    Users,
    FolderOpen,
    CheckCircle,
    Clock,
    AlertTriangle,
    Target,
    Activity,
    PieChart,
    LineChart,
    XCircle,
    PlayCircle,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    Briefcase,
    Filter,
    Search,
    RefreshCw,
    FileSpreadsheet,
    TrendingDown,
    Award,
    Zap,
    Info,
    ChevronRight,
    MoreVertical,
    Eye,
    Star,
    Percent,
    FileDown
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToastContext } from "@/components/providers/toast-provider"
import { fetchProjectsByManager, getTasksByProject } from "@/axios/api"
import { getUsers } from "@/axios/adminApi"
import {
    PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart as RechartsLine, Line, AreaChart, Area, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from "recharts"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fontCache: { regular?: string; bold?: string } = {}

const fetchFontAsBase64 = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Không thể tải font từ ${url}`)
    }

    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const chunkSize = 0x8000
    let binary = ''

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
        binary += String.fromCharCode(...chunk)
    }

    return btoa(binary)
}

const ensurePdfFonts = async () => {
    if (!fontCache.regular) {
        fontCache.regular = await fetchFontAsBase64('/fonts/DejaVuSans.ttf')
    }

    if (!fontCache.bold) {
        fontCache.bold = await fetchFontAsBase64('/fonts/DejaVuSans-Bold.ttf')
    }

    return fontCache as { regular: string; bold: string }
}

interface Project {
    id: number
    tenduan: string
    mota?: string
    ngayBatDau?: string
    ngayKetThuc?: string
    trangThai?: string
    trangthai?: string
    status?: string
    projectStatus?: string
    trangThaiDuAn?: string
    [key: string]: unknown
}

interface Task {
    id: number
    tentask: string
    trangThai: string
    mucDoUuTien?: string
    nguoiDuocGiaoId: number
    duanId: number
    ngayBatDau?: string
    ngayKetThuc?: string
    nguoiDuocGiao?: {
        id: number
        hoten: string
        email?: string
        avatar?: string
    }
}

interface UserType {
    id: number
    hoten: string
    email?: string
    manv: string
    avatar?: string
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

export default function ManagerReportsPage() {
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [reportType, setReportType] = useState<"overview" | "projects" | "team" | "analytics">("overview")
    const [dateRange, setDateRange] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [projectFilter, setProjectFilter] = useState<number | "all">("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [projects, setProjects] = useState<Project[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [users, setUsers] = useState<UserType[]>([])
    const { showError } = useToastContext()

    // Helper function to create full URL for images
    const makeFullUrl = (path?: string) => {
        if (!path) return undefined
        if (path.startsWith('http://') || path.startsWith('https://')) return path
        return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
    }

    useEffect(() => {
        loadReportData()
    }, [dateRange])

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadReportData()
        setRefreshing(false)
    }

    const loadReportData = async () => {
        try {
            setLoading(true)
            const userId = localStorage.getItem('userId')
            const manv = localStorage.getItem('manv')

            if (!userId && !manv) {
                showError('Không tìm thấy thông tin người dùng')
                return
            }

            // Load projects
            const managerId = userId || manv || ''
            const projRes = await fetchProjectsByManager(managerId)
            const projectsList = (projRes.duans || projRes.projects || projRes || []) as Project[]
            console.log('📦 Projects loaded:', projectsList.length)

            // Filter projects by date range
            const filteredProjects = filterByDateRange(projectsList)
            setProjects(filteredProjects)

            // Load all tasks from all projects
            let allTasks: Task[] = []
            for (const proj of filteredProjects) {
                try {
                    const taskRes = await getTasksByProject(proj.id)
                    const projectTasks = (taskRes.tasks || taskRes || []) as Task[]
                    allTasks = [...allTasks, ...projectTasks]
                } catch (e) {
                    // ignore
                }
            }
            console.log('📋 Tasks loaded:', allTasks.length)
            setTasks(allTasks)

            // Load users
            const usersRes = await getUsers({})
            const usersList = (usersRes.users || usersRes || []) as UserType[]
            setUsers(usersList)

        } catch (err: any) {
            console.error('Load report data error', err)
            showError(err?.message || 'Không thể tải dữ liệu báo cáo')
        } finally {
            setLoading(false)
        }
    }

    const filterByDateRange = (data: Project[]) => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        switch (dateRange) {
            case 'thisWeek':
                const weekStart = new Date(today)
                weekStart.setDate(today.getDate() - today.getDay())
                return data.filter(item => {
                    const itemDate = item.ngayBatDau ? new Date(item.ngayBatDau) : null
                    return itemDate && itemDate >= weekStart
                })

            case 'thisMonth':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                return data.filter(item => {
                    const itemDate = item.ngayBatDau ? new Date(item.ngayBatDau) : null
                    return itemDate && itemDate >= monthStart
                })

            case 'thisQuarter':
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3
                const quarterStart = new Date(now.getFullYear(), quarterMonth, 1)
                return data.filter(item => {
                    const itemDate = item.ngayBatDau ? new Date(item.ngayBatDau) : null
                    return itemDate && itemDate >= quarterStart
                })

            case 'thisYear':
                const yearStart = new Date(now.getFullYear(), 0, 1)
                return data.filter(item => {
                    const itemDate = item.ngayBatDau ? new Date(item.ngayBatDau) : null
                    return itemDate && itemDate >= yearStart
                })

            case 'all':
            default:
                return data
        }
    }

    const handleExportExcel = () => {
        try {
            // Create workbook
            const wb = XLSX.utils.book_new()

            // Sheet 1: Tổng quan
            const overviewData = [
                ['BÁO CÁO TỔNG QUAN DỰ ÁN'],
                [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
                [`Thời gian: ${new Date().toLocaleTimeString('vi-VN')}`],
                [''],
                ['THỐNG KÊ TỔNG HỢP'],
                ['Chỉ số', 'Giá trị'],
                ['Tổng dự án', totalStats.totalProjects],
                ['Dự án hoàn thành', totalStats.completedProjects],
                ['Dự án đang thực hiện', totalStats.inProgressProjects],
                ['Dự án trễ tiến độ', totalStats.delayedProjects],
                [''],
                ['Tổng nhiệm vụ', totalStats.totalTasks],
                ['Nhiệm vụ hoàn thành', totalStats.completedTasks],
                ['Nhiệm vụ đang thực hiện', totalStats.inProgressTasks],
                ['Nhiệm vụ chưa bắt đầu', totalStats.pendingTasks],
                [''],
                ['Tổng nhân sự', totalStats.totalTeamMembers],
                ['Hiệu suất trung bình', `${totalStats.avgEfficiency}%`],
                ['Tỷ lệ hoàn thành', `${completionRate}%`],
            ]
            const wsOverview = XLSX.utils.aoa_to_sheet(overviewData)
            wsOverview['!cols'] = [{ wch: 30 }, { wch: 20 }]
            XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan')

            // Sheet 2: Chi tiết dự án
            const projectData = projectsWithStats.map((p, index) => ({
                'STT': index + 1,
                'Tên dự án': p.tenduan,
                'Mô tả': p.mota || '',
                'Tiến độ (%)': p.progress,
                'Tổng nhiệm vụ': p.totalTasks,
                'Hoàn thành': p.completedTasks,
                'Đang thực hiện': p.inProgressTasks,
                'Chưa bắt đầu': p.pendingTasks,
                'Ngày bắt đầu': p.ngayBatDau ? new Date(p.ngayBatDau).toLocaleDateString('vi-VN') : '',
                'Ngày kết thúc': p.ngayKetThuc ? new Date(p.ngayKetThuc).toLocaleDateString('vi-VN') : '',
                'Trạng thái': p.status,
            }))
            const wsProjects = XLSX.utils.json_to_sheet(projectData)
            wsProjects['!cols'] = [
                { wch: 5 }, { wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 12 },
                { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
            ]
            XLSX.utils.book_append_sheet(wb, wsProjects, 'Chi tiết dự án')

            // Sheet 3: Hiệu suất nhân sự
            const teamData = usersWithStats.map((u, index) => ({
                'STT': index + 1,
                'Họ tên': u.hoten,
                'Mã NV': u.manv,
                'Email': u.email || '',
                'Tổng nhiệm vụ': u.totalTasks,
                'Hoàn thành': u.completedTasks,
                'Đang thực hiện': u.inProgressTasks,
                'Hiệu suất (%)': u.efficiency,
                'Khối lượng công việc': u.workload,
            }))
            const wsTeam = XLSX.utils.json_to_sheet(teamData)
            wsTeam['!cols'] = [
                { wch: 5 }, { wch: 25 }, { wch: 12 }, { wch: 25 },
                { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 18 }
            ]
            XLSX.utils.book_append_sheet(wb, wsTeam, 'Hiệu suất nhân sự')

            // Save file
            const date = new Date().toISOString().split('T')[0]
            const time = new Date().toTimeString().slice(0, 5).replace(':', '')
            XLSX.writeFile(wb, `Bao_cao_quan_ly_${date}_${time}.xlsx`)

            showError('Xuất file Excel thành công!')
        } catch (error) {
            console.error('Export Excel error:', error)
            showError('Có lỗi khi xuất file Excel')
        }
    }

    const handleExportPDF = async () => {
        try {
            const doc = new jsPDF('p', 'mm', 'a4')
            const { regular, bold } = await ensurePdfFonts()

            doc.addFileToVFS('DejaVuSans.ttf', regular)
            doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal')
            doc.addFileToVFS('DejaVuSans-Bold.ttf', bold)
            doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold')
            
            let yPos = 20
            
            // Title
            doc.setFont('DejaVuSans', 'bold')
            doc.setFontSize(18)
            doc.text('BÁO CÁO TỔNG QUAN DỰ ÁN', 105, yPos, { align: 'center' })
            yPos += 10
            
            // Date and time
            doc.setFont('DejaVuSans', 'normal')
            doc.setFontSize(10)
            doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 105, yPos, { align: 'center' })
            yPos += 5
            doc.text(`Thời gian: ${new Date().toLocaleTimeString('vi-VN')}`, 105, yPos, { align: 'center' })
            yPos += 15
            
            // Overview Statistics
            doc.setFont('DejaVuSans', 'bold')
            doc.setFontSize(14)
            doc.text('THỐNG KÊ TỔNG HỢP', 14, yPos)
            yPos += 10
            
            // Stats table
            const statsData = [
                ['Tổng dự án', totalStats.totalProjects.toString()],
                ['Dự án hoàn thành', totalStats.completedProjects.toString()],
                ['Dự án đang thực hiện', totalStats.inProgressProjects.toString()],
                ['Dự án chưa bắt đầu', totalStats.notStartedProjects.toString()],
                ['Dự án trễ tiến độ', totalStats.delayedProjects.toString()],
                ['', ''],
                ['Tổng nhiệm vụ', totalStats.totalTasks.toString()],
                ['Nhiệm vụ hoàn thành', totalStats.completedTasks.toString()],
                ['Nhiệm vụ đang thực hiện', totalStats.inProgressTasks.toString()],
                ['Nhiệm vụ chưa bắt đầu', totalStats.pendingTasks.toString()],
                ['', ''],
                ['Tổng nhân sự', totalStats.totalTeamMembers.toString()],
                ['Hiệu suất trung bình', `${totalStats.avgEfficiency}%`],
                ['Tỷ lệ hoàn thành', `${completionRate}%`],
            ]
            
            doc.setFont('DejaVuSans', 'normal')
            autoTable(doc, {
                startY: yPos,
                head: [['Chỉ số', 'Giá trị']],
                body: statsData,
                theme: 'grid',
                headStyles: { 
                    fillColor: [0, 61, 130], 
                    fontSize: 10, 
                    fontStyle: 'bold',
                    font: 'DejaVuSans'
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 3,
                    font: 'DejaVuSans'
                },
                columnStyles: {
                    0: { cellWidth: 100 },
                    1: { cellWidth: 80, halign: 'right' }
                }
            })
            
            // Project Details
            doc.addPage()
            yPos = 20
            doc.setFont('DejaVuSans', 'bold')
            doc.setFontSize(14)
            doc.text('CHI TIẾT DỰ ÁN', 14, yPos)
            yPos += 10
            
            const projectTableData = projectsWithStats.map((p, index) => [
                (index + 1).toString(),
                p.tenduan.substring(0, 25) + (p.tenduan.length > 25 ? '...' : ''),
                `${p.progress}%`,
                p.totalTasks.toString(),
                p.completedTasks.toString(),
                p.inProgressTasks.toString(),
                p.pendingTasks.toString(),
                p.status
            ])
            
            doc.setFont('DejaVuSans', 'normal')
            autoTable(doc, {
                startY: yPos,
                head: [['STT', 'Tên dự án', 'Tiến độ', 'Tổng', 'Hoàn thành', 'Đang TH', 'Chưa BĐ', 'Trạng thái']],
                body: projectTableData,
                theme: 'grid',
                headStyles: { 
                    fillColor: [0, 61, 130], 
                    fontSize: 9, 
                    fontStyle: 'bold',
                    font: 'DejaVuSans'
                },
                styles: { 
                    fontSize: 8, 
                    cellPadding: 2,
                    font: 'DejaVuSans'
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 50 },
                    2: { cellWidth: 18, halign: 'center' },
                    3: { cellWidth: 15, halign: 'center' },
                    4: { cellWidth: 20, halign: 'center' },
                    5: { cellWidth: 18, halign: 'center' },
                    6: { cellWidth: 18, halign: 'center' },
                    7: { cellWidth: 30 }
                }
            })
            
            // Team Performance
            doc.addPage()
            yPos = 20
            doc.setFont('DejaVuSans', 'bold')
            doc.setFontSize(14)
            doc.text('HIỆU SUẤT NHÂN SỰ', 14, yPos)
            yPos += 10
            
            const teamTableData = usersWithStats.map((u, index) => [
                (index + 1).toString(),
                u.hoten.substring(0, 20) + (u.hoten.length > 20 ? '...' : ''),
                u.manv,
                u.totalTasks.toString(),
                u.completedTasks.toString(),
                u.inProgressTasks.toString(),
                `${u.efficiency}%`,
                u.workload.toString()
            ])
            
            doc.setFont('DejaVuSans', 'normal')
            autoTable(doc, {
                startY: yPos,
                head: [['STT', 'Họ tên', 'Mã NV', 'Tổng', 'Hoàn thành', 'Đang TH', 'Hiệu suất', 'Khối lượng']],
                body: teamTableData,
                theme: 'grid',
                headStyles: { 
                    fillColor: [0, 61, 130], 
                    fontSize: 9, 
                    fontStyle: 'bold',
                    font: 'DejaVuSans'
                },
                styles: { 
                    fontSize: 8, 
                    cellPadding: 2,
                    font: 'DejaVuSans'
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 15, halign: 'center' },
                    4: { cellWidth: 20, halign: 'center' },
                    5: { cellWidth: 18, halign: 'center' },
                    6: { cellWidth: 20, halign: 'center' },
                    7: { cellWidth: 20, halign: 'center' }
                }
            })
            
            // Save PDF
            const date = new Date().toISOString().split('T')[0]
            const time = new Date().toTimeString().slice(0, 5).replace(':', '')
            doc.save(`Bao_cao_quan_ly_${date}_${time}.pdf`)
            
            showError('Xuất file PDF thành công!')
        } catch (error) {
            console.error('Export PDF error:', error)
            showError('Có lỗi khi xuất file PDF')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'hoan_thanh':
            case 'completed':
            case 'hoàn thành': return 'bg-green-100 text-green-800 border-green-200'
            case 'dang_thuc_hien':
            case 'in_progress':
            case 'đang thực hiện':
            case 'đang chạy':
            case 'dang_chay': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'chua_bat_dau':
            case 'not_started':
            case 'chưa bắt đầu': return 'bg-gray-100 text-gray-800 border-gray-200'
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
    }

    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'hoan_thanh':
            case 'completed': return 'Hoàn thành'
            case 'dang_thuc_hien':
            case 'in_progress':
            case 'đang chạy':
            case 'dang_chay': return 'Đang thực hiện'
            case 'chua_bat_dau':
            case 'not_started': return 'Chưa bắt đầu'
            default: return status || 'Chưa xác định'
        }
    }

    const statusLabelMap = {
        completed: 'Hoàn thành',
        in_progress: 'Đang thực hiện',
        not_started: 'Chưa bắt đầu',
        delayed: 'Trễ tiến độ'
    } as const

    type ProjectStatusCode = keyof typeof statusLabelMap

    // Calculate project statistics
    const projectsWithStats = projects.map(project => {
        const projectTasks = tasks.filter(t => t.duanId === project.id)
        const completedTasks = projectTasks.filter(t =>
            ['hoan_thanh', 'completed', 'hoàn thành'].includes(t.trangThai?.toLowerCase())
        ).length
        const inProgressTasks = projectTasks.filter(t =>
            ['dang_thuc_hien', 'in_progress', 'đang thực hiện', 'đang chạy'].includes(t.trangThai?.toLowerCase())
        ).length
        const pendingTasks = projectTasks.filter(t =>
            ['chua_bat_dau', 'not_started', 'chưa bắt đầu'].includes(t.trangThai?.toLowerCase())
        ).length
        const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0

        // Check if project is delayed
        const endDate = project.ngayKetThuc ? new Date(project.ngayKetThuc) : null
        const now = new Date()
        const isDelayed = endDate && endDate < now && progress < 100

        const rawStatus = (project.trangThai ?? project.trangthai ?? project.status ?? project.projectStatus ?? project.trangThaiDuAn ?? '').toString().toLowerCase().trim()

        const isMatched = (values: string[]) => values.some(value => rawStatus === value || rawStatus.replace(/[_\s]/g, '') === value.replace(/[_\s]/g, ''))

        let statusCode: ProjectStatusCode = 'not_started'

        if (rawStatus) {
            if (isMatched(['hoanthanh', 'completed', 'dahoanthanh', 'done'])) {
                statusCode = 'completed'
            } else if (isMatched(['dangthuchien', 'inprogress', 'dangchay', 'running'])) {
                statusCode = 'in_progress'
            } else if (isMatched(['chuabatdau', 'notstarted'])) {
                statusCode = 'not_started'
            } else if (isMatched(['tretiendo', 'delayed', 'trehan'])) {
                statusCode = 'delayed'
            }
        }

        if (!rawStatus) {
            if (progress === 100) {
                statusCode = 'completed'
            } else if (isDelayed) {
                statusCode = 'delayed'
            } else if (projectTasks.length === 0) {
                statusCode = 'not_started'
            } else if (inProgressTasks > 0 || completedTasks > 0) {
                statusCode = 'in_progress'
            }
        }

        return {
            ...project,
            totalTasks: projectTasks.length,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            progress,
            statusCode,
            status: statusLabelMap[statusCode]
        }
    })

    // Calculate user statistics
    const usersWithStats = users.map(user => {
        const userTasks = tasks.filter(t => t.nguoiDuocGiaoId === user.id)
        const completedTasks = userTasks.filter(t =>
            ['hoan_thanh', 'completed', 'hoàn thành'].includes(t.trangThai?.toLowerCase())
        ).length
        const inProgressTasks = userTasks.filter(t =>
            ['dang_thuc_hien', 'in_progress', 'đang thực hiện'].includes(t.trangThai?.toLowerCase())
        ).length
        const efficiency = userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0
        const workload = userTasks.length

        return {
            ...user,
            totalTasks: userTasks.length,
            completedTasks,
            inProgressTasks,
            efficiency,
            workload
        }
    }).filter(u => u.totalTasks > 0) // Only show users with tasks

    const totalStats = {
        totalProjects: projects.length,
        completedProjects: projectsWithStats.filter(p => p.statusCode === 'completed').length,
        inProgressProjects: projectsWithStats.filter(p => p.statusCode === 'in_progress').length,
        notStartedProjects: projectsWithStats.filter(p => p.statusCode === 'not_started').length,
        delayedProjects: projectsWithStats.filter(p => p.statusCode === 'delayed').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => ['hoan_thanh', 'completed', 'hoàn thành'].includes(t.trangThai?.toLowerCase())).length,
        inProgressTasks: tasks.filter(t => ['dang_thuc_hien', 'in_progress', 'đang thực hiện'].includes(t.trangThai?.toLowerCase())).length,
        pendingTasks: tasks.filter(t => ['chua_bat_dau', 'not_started', 'chưa bắt đầu'].includes(t.trangThai?.toLowerCase())).length,
        totalTeamMembers: usersWithStats.length,
        avgEfficiency: usersWithStats.length > 0 ? Math.round(usersWithStats.reduce((sum, m) => sum + m.efficiency, 0) / usersWithStats.length) : 0
    }

    const completionRate = totalStats.totalTasks > 0
        ? Math.round((totalStats.completedTasks / totalStats.totalTasks) * 100)
        : 0

    // Filtered data based on search and filters
    const filteredProjects = useMemo(() => {
        return projectsWithStats.filter(p => {
            const matchesSearch = p.tenduan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.mota?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === "all" || p.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [projectsWithStats, searchQuery, statusFilter])

    const filteredUsers = useMemo(() => {
        return usersWithStats.filter(u => {
            const matchesSearch = u.hoten.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.manv.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesProject = projectFilter === "all" || 
                tasks.some(t => t.nguoiDuocGiaoId === u.id && t.duanId === projectFilter)
            return matchesSearch && matchesProject
        })
    }, [usersWithStats, searchQuery, projectFilter, tasks])

    // Priority distribution
    const priorityData = useMemo(() => {
        const high = tasks.filter(t => t.mucDoUuTien?.toLowerCase() === 'cao').length
        const medium = tasks.filter(t => t.mucDoUuTien?.toLowerCase() === 'trung_binh').length
        const low = tasks.filter(t => t.mucDoUuTien?.toLowerCase() === 'thap').length
        return [
            { name: 'Cao', value: high, color: '#ef4444' },
            { name: 'Trung bình', value: medium, color: '#f59e0b' },
            { name: 'Thấp', value: low, color: '#10b981' }
        ].filter(item => item.value > 0)
    }, [tasks])

    // Performance trends (last 7 days simulation)
    const performanceTrends = useMemo(() => {
        const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
        return days.map((day, index) => ({
            name: day,
            completed: Math.floor(Math.random() * 20) + 5,
            inProgress: Math.floor(Math.random() * 15) + 3,
            new: Math.floor(Math.random() * 10) + 2
        }))
    }, [])

    // Top performers
    const topPerformers = useMemo(() => {
        return [...usersWithStats]
            .sort((a, b) => b.efficiency - a.efficiency)
            .slice(0, 5)
    }, [usersWithStats])

    // Projects at risk
    const projectsAtRisk = useMemo(() => {
        return projectsWithStats.filter(p => {
            const endDate = p.ngayKetThuc ? new Date(p.ngayKetThuc) : null
            const now = new Date()
            const daysUntilDeadline = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999
            return daysUntilDeadline < 7 && p.progress < 90
        })
    }, [projectsWithStats])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-3 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-9 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
                    </div>

                    {/* Filters Skeleton */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                </div>
                                <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                                <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
                                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Enhanced Header with Actions */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#003D82] to-blue-600 bg-clip-text text-transparent mb-2 flex items-center gap-2 sm:gap-3">
                                <div className="bg-gradient-to-br from-[#003D82] to-blue-600 p-2 rounded-xl">
                                    <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                Dashboard Báo cáo
                            </h1>
                            <p className="text-sm sm:text-base text-slate-600 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Phân tích hiệu suất dự án, nhiệm vụ và nhân sự theo thời gian thực
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                variant="outline"
                                className="gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Làm mới
                            </Button>
                            <Button
                                onClick={handleExportExcel}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </Button>
                            <Button
                                onClick={handleExportPDF}
                                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 gap-2"
                            >
                                <FileDown className="w-4 h-4" />
                                PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Enhanced Filters */}
                <Card className="p-4 sm:p-6 mb-6 sm:mb-8 bg-white/90 backdrop-blur-sm shadow-xl border-slate-200">
                    <div className="space-y-4">
                        {/* Report Type Tabs */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => setReportType("overview")}
                                variant={reportType === "overview" ? "default" : "outline"}
                                className={`gap-2 ${reportType === "overview" 
                                    ? "bg-gradient-to-r from-[#003D82] to-blue-600 hover:from-[#0052A3] hover:to-blue-700" 
                                    : "hover:bg-slate-100"}`}
                            >
                                <Activity className="w-4 h-4" />
                                Tổng quan
                            </Button>
                            <Button
                                onClick={() => setReportType("projects")}
                                variant={reportType === "projects" ? "default" : "outline"}
                                className={`gap-2 ${reportType === "projects" 
                                    ? "bg-gradient-to-r from-[#003D82] to-blue-600 hover:from-[#0052A3] hover:to-blue-700" 
                                    : "hover:bg-slate-100"}`}
                            >
                                <FolderOpen className="w-4 h-4" />
                                Dự án
                            </Button>
                            <Button
                                onClick={() => setReportType("analytics")}
                                variant={reportType === "analytics" ? "default" : "outline"}
                                className={`gap-2 ${reportType === "analytics" 
                                    ? "bg-gradient-to-r from-[#003D82] to-blue-600 hover:from-[#0052A3] hover:to-blue-700" 
                                    : "hover:bg-slate-100"}`}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Phân tích
                            </Button>
                        </div>

                        {/* Search and Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Tìm kiếm dự án, nhân sự..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="thisWeek">Tuần này</SelectItem>
                                    <SelectItem value="thisMonth">Tháng này</SelectItem>
                                    <SelectItem value="thisQuarter">Quý này</SelectItem>
                                    <SelectItem value="thisYear">Năm này</SelectItem>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                </SelectContent>
                            </Select>

                            {reportType === "projects" && (
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                                        <SelectItem value="Đang thực hiện">Đang thực hiện</SelectItem>
                                        <SelectItem value="Trễ tiến độ">Trễ tiến độ</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Overview Stats */}
                {reportType === "overview" && (
                    <>
                        {/* Enhanced Main Stats Cards with Animations */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                            {/* 1. Total Projects Card */}
                            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-blue-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="p-6 relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                            <FolderOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            Tất cả
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-2">Tổng dự án</p>
                                        <p className="text-4xl font-bold text-blue-700 mb-2">{totalStats.totalProjects}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1 text-green-600 font-medium">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>{totalStats.completedProjects} hoàn thành</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <XCircle className="w-3 h-3" />
                                                <span>{totalStats.notStartedProjects} chưa làm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* 2. Completed Projects Card */}
                            <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 border-green-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="p-6 relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                            <CheckCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <Badge className="bg-green-100 text-green-700 border-green-300">
                                            <Zap className="w-3 h-3 mr-1" />
                                            {totalStats.totalProjects > 0 ? Math.round((totalStats.completedProjects / totalStats.totalProjects) * 100) : 0}%
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-2">Dự án hoàn thành</p>
                                        <p className="text-4xl font-bold text-green-700 mb-2">{totalStats.completedProjects}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="text-slate-600">
                                                <span className="font-medium">Tổng: {totalStats.totalProjects}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600 font-bold">
                                                <Target className="w-3 h-3" />
                                                <span>{totalStats.totalProjects > 0 ? Math.round((totalStats.completedProjects / totalStats.totalProjects) * 100) : 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* 3. Not Started Projects Card */}
                            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-100 to-slate-50 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="p-6 relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl shadow-lg">
                                            <XCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <Badge className="bg-slate-100 text-slate-700 border-slate-300">
                                            <PlayCircle className="w-3 h-3 mr-1" />
                                            Chưa làm
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-2">Dự án chưa bắt đầu</p>
                                        <p className="text-4xl font-bold text-slate-700 mb-2">{totalStats.notStartedProjects}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="text-slate-600">
                                                <span className="font-medium">Tổng: {totalStats.totalProjects}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-600 font-bold">
                                                <Percent className="w-3 h-3" />
                                                <span>{totalStats.totalProjects > 0 ? Math.round((totalStats.notStartedProjects / totalStats.totalProjects) * 100) : 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* 4. In Progress Projects Card */}
                            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-amber-50 border-orange-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="p-6 relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                                            <Activity className="w-3 h-3 mr-1" />
                                            Đang chạy
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-2">Dự án đang chạy</p>
                                        <p className="text-4xl font-bold text-orange-700 mb-2">{totalStats.inProgressProjects}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="text-slate-600">
                                                <span className="font-medium">Tổng: {totalStats.totalProjects}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-orange-600 font-bold">
                                                <Percent className="w-3 h-3" />
                                                <span>{totalStats.totalProjects > 0 ? Math.round((totalStats.inProgressProjects / totalStats.totalProjects) * 100) : 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Alert Section - Projects at Risk */}
                        {projectsAtRisk.length > 0 && (
                            <Card className="p-4 sm:p-6 mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-red-900 mb-2">
                                            Cảnh báo: {projectsAtRisk.length} dự án cần chú ý
                                        </h3>
                                        <p className="text-sm text-red-700 mb-3">
                                            Các dự án sau đây sắp đến hạn và có tiến độ chậm
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {projectsAtRisk.slice(0, 3).map(p => (
                                                <div key={p.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-red-200">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 truncate">{p.tenduan}</p>
                                                        <p className="text-xs text-slate-600">Tiến độ: {p.progress}%</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                            {/* Project Status Pie Chart */}
                            <Card className="p-4 sm:p-6 bg-white shadow-lg border-slate-200">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-[#003D82]" />
                                    Phân bổ trạng thái dự án
                                </h3>
                                <div className="flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPie>
                                            <Pie
                                                data={[
                                                    { name: 'Hoàn thành', value: totalStats.completedProjects, color: '#10b981' },
                                                    { name: 'Đang thực hiện', value: totalStats.inProgressProjects, color: '#3b82f6' },
                                                    { name: 'Chưa bắt đầu', value: totalStats.notStartedProjects, color: '#6b7280' },
                                                    { name: 'Trễ tiến độ', value: totalStats.delayedProjects, color: '#ef4444' }
                                                ].filter(item => item.value > 0)}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                                label={false}
                                            >
                                                {[
                                                    { name: 'Hoàn thành', value: totalStats.completedProjects, color: '#10b981' },
                                                    { name: 'Đang thực hiện', value: totalStats.inProgressProjects, color: '#3b82f6' },
                                                    { name: 'Chưa bắt đầu', value: totalStats.notStartedProjects, color: '#6b7280' },
                                                    { name: 'Trễ tiến độ', value: totalStats.delayedProjects, color: '#ef4444' }
                                                ].filter(item => item.value > 0).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                formatter={(value: any, name: any) => [value, name]}
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px'
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={60}
                                                wrapperStyle={{ paddingTop: '10px' }}
                                                formatter={(value: string, entry: any) => {
                                                    const item = [
                                                        { name: 'Hoàn thành', value: totalStats.completedProjects },
                                                        { name: 'Đang thực hiện', value: totalStats.inProgressProjects },
                                                        { name: 'Chưa bắt đầu', value: totalStats.notStartedProjects },
                                                        { name: 'Trễ tiến độ', value: totalStats.delayedProjects }
                                                    ].find(i => i.name === value)
                                                    return `${value}: ${item?.value || 0}`
                                                }}
                                            />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Task Status Bar Chart */}
                            <Card className="p-4 sm:p-6 bg-white shadow-lg border-slate-200">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#003D82]" />
                                    Phân bổ công việc
                                </h3>
                                <ResponsiveContainer width="100%" height={240}>
                                    <RechartsBar data={[
                                        { name: 'Hoàn thành', value: totalStats.completedTasks, color: '#10b981' },
                                        { name: 'Đang thực hiện', value: totalStats.inProgressTasks, color: '#3b82f6' },
                                        { name: 'Chưa bắt đầu', value: totalStats.pendingTasks, color: '#6b7280' }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="name" fontSize={12} />
                                        <YAxis fontSize={12} />
                                        <RechartsTooltip />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                                            {[
                                                { name: 'Hoàn thành', value: totalStats.completedTasks, color: '#10b981' },
                                                { name: 'Đang thực hiện', value: totalStats.inProgressTasks, color: '#3b82f6' },
                                                { name: 'Chưa bắt đầu', value: totalStats.pendingTasks, color: '#6b7280' }
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </RechartsBar>
                                </ResponsiveContainer>
                            </Card>
                        </div>

                        {/* Additional Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                            {/* Project Progress Chart */}
                            <Card className="p-4 sm:p-6 bg-white shadow-lg border-slate-200">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                                    <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-[#003D82]" />
                                    Tiến độ dự án
                                </h3>
                                <div className="overflow-x-auto">
                                    <div style={{ minWidth: `${Math.max(600, projectsWithStats.length * 80)}px` }}>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <RechartsBar data={projectsWithStats.map(p => ({
                                                name: p.tenduan.substring(0, 15) + (p.tenduan.length > 15 ? '...' : ''),
                                                fullName: p.tenduan,
                                                progress: p.progress
                                            }))}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} />
                                                <YAxis fontSize={12} domain={[0, 100]} />
                                                <RechartsTooltip 
                                                    formatter={(value: any) => [`${value}%`, 'Tiến độ']}
                                                    labelFormatter={(label: any, payload: any) => payload[0]?.payload?.fullName || label}
                                                />
                                                <Bar dataKey="progress" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                                                    {projectsWithStats.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.progress === 100 ? '#10b981' : entry.progress >= 70 ? '#3b82f6' : entry.progress >= 40 ? '#f59e0b' : '#ef4444'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </RechartsBar>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>

                            {/* Team Performance Radar Chart */}
                            <Card className="p-4 sm:p-6 bg-white shadow-lg border-slate-200">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#003D82]" />
                                    Hiệu suất nhân sự (Top 5)
                                </h3>
                                <ResponsiveContainer width="100%" height={240}>
                                    <RadarChart data={usersWithStats.slice(0, 5).map(u => ({
                                        name: u.hoten.substring(0, 10),
                                        efficiency: u.efficiency,
                                        workload: Math.min((u.workload / Math.max(...usersWithStats.map(x => x.workload))) * 100, 100)
                                    }))}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis dataKey="name" fontSize={12} />
                                        <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} />
                                        <Radar name="Hiệu suất" dataKey="efficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                        <Radar name="Khối lượng" dataKey="workload" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                        <Legend />
                                        <RechartsTooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </Card>
                        </div>

                        {/* Weekly Trend Chart */}
                        <Card className="p-4 sm:p-6 bg-white shadow-lg border-slate-200 mb-6 sm:mb-8">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#003D82]" />
                                Xu hướng nhiệm vụ theo dự án
                            </h3>
                            <div className="overflow-x-auto">
                                <div style={{ minWidth: `${Math.max(800, projectsWithStats.length * 100)}px` }}>
                                    <ResponsiveContainer width="100%" height={240}>
                                        <AreaChart data={projectsWithStats.map(p => ({
                                            name: p.tenduan.substring(0, 12) + (p.tenduan.length > 12 ? '...' : ''),
                                            fullName: p.tenduan,
                                            completed: p.completedTasks,
                                            inProgress: p.inProgressTasks,
                                            pending: p.pendingTasks
                                        }))}>
                                            <defs>
                                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                                </linearGradient>
                                                <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                </linearGradient>
                                                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} />
                                            <YAxis fontSize={12} />
                                            <RechartsTooltip 
                                                labelFormatter={(label: any, payload: any) => payload[0]?.payload?.fullName || label}
                                            />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="completed"
                                                stroke="#10b981"
                                                fillOpacity={1}
                                                fill="url(#colorCompleted)"
                                                name="Hoàn thành"
                                                stackId="1"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="inProgress"
                                                stroke="#3b82f6"
                                                fillOpacity={1}
                                                fill="url(#colorInProgress)"
                                                name="Đang thực hiện"
                                                stackId="1"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="pending"
                                                stroke="#6b7280"
                                                fillOpacity={1}
                                                fill="url(#colorPending)"
                                                name="Chưa bắt đầu"
                                                stackId="1"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </Card>
                    </>
                )}

                {/* Projects Report */}
                {reportType === "projects" && (
                    <>
                        {/* Project Stats Overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-500 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Hoàn thành</p>
                                        <p className="text-2xl font-bold text-green-700">{totalStats.completedProjects}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-500 rounded-lg">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Đang thực hiện</p>
                                        <p className="text-2xl font-bold text-blue-700">{totalStats.inProgressProjects}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-red-500 rounded-lg">
                                        <AlertTriangle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Trễ tiến độ</p>
                                        <p className="text-2xl font-bold text-red-700">{totalStats.delayedProjects}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Card className="bg-white shadow-xl border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                        <FolderOpen className="w-6 h-6 text-[#003D82]" />
                                        Chi tiết dự án
                                        <Badge className="ml-2">{filteredProjects.length} dự án</Badge>
                                    </h2>
                                </div>
                            </div>
                            
                            {/* Project Cards View */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {filteredProjects.length === 0 ? (
                                        <div className="col-span-2 text-center py-12">
                                            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500">Không tìm thấy dự án nào</p>
                                        </div>
                                    ) : (
                                        filteredProjects.map((project) => (
                                            <Card key={project.id} className="p-5 hover:shadow-xl transition-all duration-300 border-2 border-slate-100 hover:border-blue-200">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-slate-900 text-lg mb-1">{project.tenduan}</h3>
                                                        {project.mota && (
                                                            <p className="text-sm text-slate-600 line-clamp-2">{project.mota}</p>
                                                        )}
                                                    </div>
                                                    <Badge className={getStatusColor(project.status)} variant="outline">
                                                        {project.status}
                                                    </Badge>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-slate-700">Tiến độ</span>
                                                        <span className="text-lg font-bold text-[#003D82]">{project.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                                        <div
                                                            className={`h-3 rounded-full transition-all duration-500 ${
                                                                project.progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                                                project.progress >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 
                                                                'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                            }`}
                                                            style={{ width: `${project.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Task Stats */}
                                                <div className="grid grid-cols-3 gap-3 mb-4">
                                                    <div className="text-center p-2 bg-green-50 rounded-lg">
                                                        <CheckCircle className="w-4 h-4 text-green-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-green-700">{project.completedTasks}</p>
                                                        <p className="text-xs text-slate-600">Hoàn thành</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                                                        <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-blue-700">{project.inProgressTasks}</p>
                                                        <p className="text-xs text-slate-600">Đang làm</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <PlayCircle className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-gray-700">{project.pendingTasks}</p>
                                                        <p className="text-xs text-slate-600">Chưa làm</p>
                                                    </div>
                                                </div>

                                                {/* Timeline */}
                                                {(project.ngayBatDau || project.ngayKetThuc) && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 pt-3 border-t border-slate-100">
                                                        <Calendar className="w-4 h-4" />
                                                        <div className="flex items-center gap-2">
                                                            {project.ngayBatDau && (
                                                                <span>{new Date(project.ngayBatDau).toLocaleDateString('vi-VN')}</span>
                                                            )}
                                                            {project.ngayBatDau && project.ngayKetThuc && (
                                                                <ChevronRight className="w-3 h-3" />
                                                            )}
                                                            {project.ngayKetThuc && (
                                                                <span>{new Date(project.ngayKetThuc).toLocaleDateString('vi-VN')}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>
                    </>
                )}

                {/* Analytics Report - NEW */}
                {reportType === "analytics" && (
                    <>
                        {/* Performance Trends */}
                        <Card className="p-6 bg-white shadow-xl border-slate-200 mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#003D82]" />
                                Xu hướng tuần này
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={performanceTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Bar dataKey="completed" fill="#10b981" name="Hoàn thành" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="inProgress" fill="#3b82f6" name="Đang làm" radius={[8, 8, 0, 0]} />
                                    <Line type="monotone" dataKey="new" stroke="#f59e0b" strokeWidth={2} name="Nhiệm vụ mới" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Top Performers */}
                        <Card className="p-6 bg-white shadow-xl border-slate-200 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-[#003D82]" />
                                    Top 5 Nhân viên xuất sắc
                                </h3>
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                                    <Star className="w-3 h-3 mr-1 fill-white" />
                                    Xuất sắc
                                </Badge>
                            </div>
                            <div className="space-y-3">
                                {topPerformers.map((member, index) => (
                                    <div key={member.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                            index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                                            'bg-gradient-to-br from-blue-400 to-blue-500'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                            {member.avatar ? (
                                                <img src={makeFullUrl(member.avatar)} alt={member.hoten} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-blue-700 font-semibold text-lg">
                                                    {member.hoten.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">{member.hoten}</p>
                                            <p className="text-sm text-slate-600">{member.manv}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-slate-900">{member.completedTasks}/{member.totalTasks}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            member.efficiency >= 80 ? 'bg-green-500' :
                                                            member.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${member.efficiency}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-bold text-[#003D82]">{member.efficiency}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Project Comparison */}
                        <Card className="p-6 bg-white shadow-xl border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-[#003D82]" />
                                So sánh hiệu suất dự án
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsBar data={projectsWithStats.slice(0, 8)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis 
                                        dataKey="tenduan" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        height={120} 
                                        fontSize={11}
                                        tickFormatter={(value) => value.substring(0, 15) + (value.length > 15 ? '...' : '')}
                                    />
                                    <YAxis fontSize={12} />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Bar dataKey="completedTasks" fill="#10b981" name="Hoàn thành" stackId="a" />
                                    <Bar dataKey="inProgressTasks" fill="#3b82f6" name="Đang làm" stackId="a" />
                                    <Bar dataKey="pendingTasks" fill="#6b7280" name="Chưa bắt đầu" stackId="a" />
                                </RechartsBar>
                            </ResponsiveContainer>
                        </Card>
                    </>
                )}

                {/* Team Report */}
                {reportType === "team" && (
                    <>
                        {/* Team Stats Overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500 rounded-lg">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600">Tổng nhân sự</p>
                                        <p className="text-xl font-bold text-purple-700">{filteredUsers.length}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600">Hiệu suất TB</p>
                                        <p className="text-xl font-bold text-green-700">{totalStats.avgEfficiency}%</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600">NV hoàn thành</p>
                                        <p className="text-xl font-bold text-blue-700">{totalStats.completedTasks}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500 rounded-lg">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600">Đang làm</p>
                                        <p className="text-xl font-bold text-orange-700">{totalStats.inProgressTasks}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Card className="bg-white shadow-xl border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                        <Users className="w-6 h-6 text-[#003D82]" />
                                        Hiệu suất nhân sự
                                        <Badge className="ml-2">{filteredUsers.length} thành viên</Badge>
                                    </h2>
                                </div>
                            </div>

                            {/* Team Members Cards */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredUsers.length === 0 ? (
                                        <div className="col-span-3 text-center py-12">
                                            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500">Không tìm thấy nhân sự nào</p>
                                        </div>
                                    ) : (
                                        filteredUsers.map((member) => (
                                            <Card key={member.id} className="p-5 hover:shadow-xl transition-all duration-300 border-2 border-slate-100 hover:border-purple-200">
                                                {/* Member Header */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden ring-4 ring-blue-100">
                                                            {member.avatar ? (
                                                                <img
                                                                    src={makeFullUrl(member.avatar)}
                                                                    alt={member.hoten}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-white font-bold text-xl">
                                                                    {member.hoten.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {member.efficiency >= 80 && (
                                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                                                <Star className="w-3 h-3 text-white fill-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-slate-900 truncate">{member.hoten}</h3>
                                                        <p className="text-sm text-slate-600">{member.manv}</p>
                                                    </div>
                                                </div>

                                                {/* Efficiency Circle */}
                                                <div className="flex items-center justify-center mb-4">
                                                    <div className="relative w-24 h-24">
                                                        <svg className="transform -rotate-90 w-24 h-24">
                                                            <circle
                                                                cx="48"
                                                                cy="48"
                                                                r="40"
                                                                stroke="#e5e7eb"
                                                                strokeWidth="8"
                                                                fill="none"
                                                            />
                                                            <circle
                                                                cx="48"
                                                                cy="48"
                                                                r="40"
                                                                stroke={
                                                                    member.efficiency >= 80 ? '#10b981' :
                                                                    member.efficiency >= 60 ? '#3b82f6' :
                                                                    member.efficiency >= 40 ? '#f59e0b' : '#ef4444'
                                                                }
                                                                strokeWidth="8"
                                                                fill="none"
                                                                strokeDasharray={`${2 * Math.PI * 40}`}
                                                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - member.efficiency / 100)}`}
                                                                className="transition-all duration-1000"
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-slate-900">{member.efficiency}%</p>
                                                                <p className="text-xs text-slate-600">Hiệu suất</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Task Stats */}
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                            <span className="text-sm text-slate-700">Hoàn thành</span>
                                                        </div>
                                                        <span className="font-bold text-green-700">{member.completedTasks}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm text-slate-700">Đang làm</span>
                                                        </div>
                                                        <span className="font-bold text-blue-700">{member.inProgressTasks}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <Activity className="w-4 h-4 text-purple-600" />
                                                            <span className="text-sm text-slate-700">Tổng nhiệm vụ</span>
                                                        </div>
                                                        <span className="font-bold text-purple-700">{member.totalTasks}</span>
                                                    </div>
                                                </div>

                                                {/* Performance Badge */}
                                                <div className="pt-3 border-t border-slate-100">
                                                    <Badge 
                                                        className={`w-full justify-center ${
                                                            member.efficiency >= 80 ? 'bg-green-100 text-green-700 border-green-300' :
                                                            member.efficiency >= 60 ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                                            member.efficiency >= 40 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                            'bg-red-100 text-red-700 border-red-300'
                                                        }`}
                                                        variant="outline"
                                                    >
                                                        {member.efficiency >= 80 ? '🏆 Xuất sắc' :
                                                         member.efficiency >= 60 ? '👍 Tốt' :
                                                         member.efficiency >= 40 ? '⚠️ Trung bình' :
                                                         '📉 Cần cải thiện'}
                                                    </Badge>
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
}