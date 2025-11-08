"use client"

import { useEffect, useState } from "react"
import { getUsers } from '@/axios/adminApi'
import { fetchProjectsByManager, getTasksByProject } from '@/axios/api'
import { useToastContext } from '@/components/providers/toast-provider'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
    Calendar, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Mail,
    Phone,
    MapPin,
    Briefcase,
    User,
    Edit,
    FolderKanban,
    Target,
    TrendingUp,
    Camera,
    Users2
} from "lucide-react"
import api from '@/axios/config'
import { uploadAvatar, updateMyProfile } from '@/axios/api'
import { useRef } from 'react'

interface Project {
    id: number
    tenduan: string
    mota?: string
    ngaybatdau: string
    ngayketthuc: string
    status: string
    tasks?: Task[]
}

interface Task {
    id: number
    tentask: string
    trangThai: string
    mucDoUuTien?: string
}

export default function PMProfilePage() {
    const [isEditing, setIsEditing] = useState(false)
    const [pmData, setPmData] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)
    const { showError, showSuccess } = useToastContext()
    const [projects, setProjects] = useState<Project[]>([])
    const [stats, setStats] = useState({
        projectCount: 0,
        taskCount: 0,
        groupCount: 0,
        completedCount: 0
    })
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    })

    const makeFullUrl = (path?: string) => {
        if (!path) return undefined
        if (path.startsWith('http')) return path
        const base = api.defaults.baseURL || ''
        return `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`
    }

    useEffect(() => {
        const loadProfile = async () => {
            const manv = typeof window !== 'undefined' ? localStorage.getItem('manv') : null
            if (!manv) return
            setLoading(true)
            try {
                const res = await getUsers({ search: manv, limit: 1 })
                const users = res.users || res
                if (Array.isArray(users) && users.length > 0) {
                    const u = users[0]
                    const avatar = u.avatar || undefined
                    const fullAvatar = makeFullUrl(avatar)
                    setPmData({
                        id: u.id,
                        name: u.hoten,
                        email: u.email || '',
                        phone: u.sdt || '',
                        department: u.chucvu || '',
                        position: u.chucvu || '',
                        joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '',
                        avatar: avatar,
                        manv: u.manv
                    })
                    setAvatarUrl(fullAvatar ? `${fullAvatar}?t=${Date.now()}` : undefined)
                    setEditForm({
                        name: u.hoten || '',
                        email: u.email || '',
                        phone: u.sdt || '',
                        password: ''
                    })
                    
                    // Lưu vào localStorage
                    if (typeof window !== 'undefined') {
                        if (avatar) localStorage.setItem('avatar', avatar)
                        if (u.hoten) localStorage.setItem('hoten', u.hoten)
                        if (u.chucvu) localStorage.setItem('chucvu', u.chucvu)
                    }

                    // Fetch projects managed by this manager
                    let projectsList: Project[] = []
                    try {
                        const projRes = await fetchProjectsByManager(u.manv)
                        projectsList = (projRes.projects || projRes || []) as Project[]
                        
                        // Fetch tasks for each project
                        for (const proj of projectsList) {
                            try {
                                const taskRes = await getTasksByProject(proj.id)
                                proj.tasks = (taskRes.tasks || taskRes || []) as Task[]
                            } catch (e) {
                                proj.tasks = []
                            }
                        }
                        setProjects(projectsList)
                    } catch (e) {
                        // ignore
                    }
                    
                    // Calculate stats
                    const projectCount = projectsList.length
                    let taskCount = 0
                    let completedCount = 0
                    
                    projectsList.forEach(proj => {
                        if (proj.tasks) {
                            taskCount += proj.tasks.length
                            completedCount += proj.tasks.filter(
                                (t: Task) => t.trangThai === 'completed' || 
                                            t.trangThai === 'Hoàn thành' || 
                                            t.trangThai === 'hoan_thanh'
                            ).length
                        }
                    })

                    setStats({
                        projectCount,
                        taskCount,
                        groupCount: 0, // TODO: API for groups
                        completedCount
                    })

                } else {
                    showError('Không tìm thấy thông tin người dùng')
                }
            } catch (err: any) {
                console.error('Lỗi khi tải profile', err)
                showError(err?.message || 'Không thể tải profile')
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleChooseFile = () => {
        inputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const res = await uploadAvatar(file)
            const avatarPath = res.avatarUrl || res.data?.avatarUrl || ''
            const full = makeFullUrl(avatarPath)
            const fullWithTs = full ? `${full}?t=${Date.now()}` : full
            setAvatarUrl(fullWithTs)
            showSuccess('Upload avatar thành công')
            
            // Update pmData
            setPmData((prev: any) => ({ ...prev, avatar: avatarPath }))
            
            // Lưu avatar mới vào localStorage
            if (avatarPath) {
                localStorage.setItem('avatar', avatarPath)
            }
            
            // Reload page to update layout
            setTimeout(() => window.location.reload(), 500)
        } catch (err: any) {
            console.error('Upload avatar error', err)
            showError(err?.message || 'Không thể upload avatar')
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const handleSaveProfile = async () => {
        try {
            const payload: any = {}
            if (editForm.name) payload.hoten = editForm.name
            if (editForm.email) payload.email = editForm.email
            if (editForm.phone) payload.sdt = editForm.phone
            if (editForm.password) payload.password = editForm.password
            
            const res = await updateMyProfile(payload)
            const updated = res.user || res
            
            setPmData((prev: any) => ({
                ...prev,
                name: updated.hoten || editForm.name,
                email: updated.email || editForm.email,
                phone: updated.sdt || editForm.phone
            }))
            
            // Cập nhật localStorage để layout lấy tên mới
            if (editForm.name) {
                localStorage.setItem('hoten', editForm.name)
            }
            
            showSuccess('Cập nhật hồ sơ thành công')
            setIsEditing(false)
            setEditForm(prev => ({ ...prev, password: '' }))
            
            // Reload để cập nhật tên ở header
            setTimeout(() => window.location.reload(), 500)
        } catch (err: any) {
            console.error('Update profile error', err)
            showError(err?.message || 'Không thể cập nhật hồ sơ')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'da_hoan_thanh': return 'bg-green-100 text-green-800 border-green-200'
            case 'dang_chay': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'chua_bat_dau': return 'bg-gray-100 text-gray-800 border-gray-200'
            case 'da_dong': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'da_hoan_thanh': return 'Hoàn thành'
            case 'dang_chay': return 'Đang chạy'
            case 'chua_bat_dau': return 'Chưa bắt đầu'
            case 'da_dong': return 'Đã đóng'
            default: return status
        }
    }

    const calculateProjectProgress = (project: Project) => {
        if (!project.tasks || project.tasks.length === 0) return 0
        const completed = project.tasks.filter(
            t => t.trangThai === 'completed' || t.trangThai === 'Hoàn thành' || t.trangThai === 'hoan_thanh'
        ).length
        return Math.round((completed / project.tasks.length) * 100)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                        <User className="w-10 h-10 text-[#003D82]" />
                        Hồ sơ cá nhân
                    </h1>
                    <p className="text-slate-600 mt-2">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
                </div>

                {loading ? (
                    <div className="space-y-6">
                        {/* Profile Card Skeleton */}
                        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                            {/* Cover Skeleton */}
                            <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                            
                            <div className="px-8 pb-8">
                                {/* Avatar & Info Skeleton */}
                                <div className="flex items-end gap-4 -mt-16 mb-6">
                                    <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white animate-pulse"></div>
                                    <div className="flex-1 pb-2">
                                        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                                    </div>
                                    <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                                </div>

                                {/* Info Grid Skeleton */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                                            <div className="flex-1">
                                                <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                                                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                                            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : pmData ? (
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <Card className="overflow-hidden bg-white shadow-xl border-0">
                            {/* Cover Image */}
                            <div className="h-32 bg-gradient-to-r from-[#003D82] via-[#0052A3] to-[#0066C0]"></div>
                            
                            {/* Profile Content */}
                            <div className="px-8 pb-8">
                                {/* Avatar & Basic Info */}
                                <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
                                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                                        <div className="relative">
                                            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                                                <AvatarImage src={avatarUrl} alt={pmData.name} />
                                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-[#003D82] to-[#0066C0] text-white">
                                                    {pmData.name?.charAt(0)?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <button
                                                onClick={handleChooseFile}
                                                disabled={uploading}
                                                className="absolute bottom-0 right-0 p-2 bg-[#003D82] hover:bg-[#0052A3] text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
                                            >
                                                <Camera className="w-4 h-4" />
                                            </button>
                                            <input
                                                ref={inputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <h2 className="text-3xl font-bold text-slate-900">{pmData.name}</h2>
                                            <p className="text-lg text-[#003D82] font-medium">{pmData.position}</p>
                                            <p className="text-sm text-slate-500">Mã NV: {pmData.manv}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => setIsEditing(true)}
                                        className="bg-[#003D82] hover:bg-[#0052A3] text-white gap-2 mt-4 md:mt-0"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Chỉnh sửa
                                    </Button>
                                </div>

                                {/* Contact Information Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Thông tin liên hệ</h3>
                                        
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="p-2 bg-[#003D82]/10 rounded-lg">
                                                <Mail className="w-5 h-5 text-[#003D82]" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Email</p>
                                                <p className="text-sm font-medium text-slate-900">{pmData.email || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="p-2 bg-[#003D82]/10 rounded-lg">
                                                <Phone className="w-5 h-5 text-[#003D82]" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Điện thoại</p>
                                                <p className="text-sm font-medium text-slate-900">{pmData.phone || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Thông tin công việc</h3>
                                        
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="p-2 bg-[#003D82]/10 rounded-lg">
                                                <Briefcase className="w-5 h-5 text-[#003D82]" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Phòng ban</p>
                                                <p className="text-sm font-medium text-slate-900">{pmData.department || 'Quản lý dự án IT'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="p-2 bg-[#003D82]/10 rounded-lg">
                                                <Calendar className="w-5 h-5 text-[#003D82]" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Ngày tham gia</p>
                                                <p className="text-sm font-medium text-slate-900">{pmData.joinDate || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FolderKanban className="w-5 h-5 text-blue-600" />
                                            <p className="text-sm text-slate-600 font-medium">Dự án</p>
                                        </div>
                                        <p className="text-3xl font-bold text-blue-700">{stats.projectCount}</p>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-5 h-5 text-purple-600" />
                                            <p className="text-sm text-slate-600 font-medium">Nhiệm vụ</p>
                                        </div>
                                        <p className="text-3xl font-bold text-purple-700">{stats.taskCount}</p>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users2 className="w-5 h-5 text-orange-600" />
                                            <p className="text-sm text-slate-600 font-medium">Nhóm</p>
                                        </div>
                                        <p className="text-3xl font-bold text-orange-700">—</p>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            <p className="text-sm text-slate-600 font-medium">Hoàn thành</p>
                                        </div>
                                        <p className="text-3xl font-bold text-green-700">{stats.completedCount}</p>
                                    </Card>
                                </div>
                            </div>
                        </Card>

                        {/* Projects List */}
                        {projects.length > 0 && (
                            <Card className="p-6 bg-white shadow-lg border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                        <FolderKanban className="w-6 h-6 text-[#003D82]" />
                                        Dự án đang quản lý
                                    </h2>
                                    <Badge variant="outline" className="text-[#003D82] border-[#003D82]">
                                        {projects.length} dự án
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {projects.map((project) => {
                                        const progress = calculateProjectProgress(project)
                                        const taskCount = project.tasks?.length || 0
                                        const completedCount = project.tasks?.filter(
                                            t => t.trangThai === 'completed' || 
                                                 t.trangThai === 'Hoàn thành' || 
                                                 t.trangThai === 'hoan_thanh'
                                        ).length || 0

                                        return (
                                            <Card key={project.id} className="p-5 hover:shadow-md transition-shadow border-slate-200">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">
                                                        {project.tenduan}
                                                    </h3>
                                                    <Badge className={getStatusColor(project.status)}>
                                                        {getStatusText(project.status)}
                                                    </Badge>
                                                </div>
                                                
                                                {project.mota && (
                                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                                        {project.mota}
                                                    </p>
                                                )}

                                                <div className="mb-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm text-slate-600">Tiến độ</span>
                                                        <span className="text-sm font-semibold text-[#003D82]">
                                                            {progress}%
                                                        </span>
                                                    </div>
                                                    <Progress value={progress} className="h-2" />
                                                </div>

                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1 text-slate-600">
                                                        <Target className="w-4 h-4" />
                                                        <span>{taskCount} nhiệm vụ</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>{completedCount} hoàn thành</span>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(project.ngaybatdau).toLocaleDateString('vi-VN')}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(project.ngayketthuc).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </Card>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20 text-red-500">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg">Không có dữ liệu hồ sơ</p>
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Họ và tên</Label>
                                <Input
                                    id="name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Số điện thoại</Label>
                                <Input
                                    id="phone"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="0123456789"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Mật khẩu mới (để trống nếu không đổi)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleSaveProfile} className="bg-[#003D82] hover:bg-[#0052A3]">
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
