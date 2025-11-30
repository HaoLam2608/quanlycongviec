"use client"
import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { usePathname, useRouter } from "next/navigation"
import { authAPI, getMyProfile } from "@/axios/api"
import api from '@/axios/config'
import NotificationBell from "@/components/NotificationBell"
import { useToastContext } from "@/components/providers/toast-provider"
import { showConfirm } from '@/lib/notifications'
import {
    LayoutDashboard,
    CheckSquare,
    FolderOpen,
    Clock,
    User,
    Settings,
    Menu,
    X,
    Bell,
    LogOut,
    ChevronRight
} from "lucide-react"

interface MemberLayoutProps {
    children: React.ReactNode
}

const navigation = [
    { name: "Trang chủ", href: "/member/dashboard", icon: LayoutDashboard },
    { name: "Công việc của tôi", href: "/member/tasks", icon: CheckSquare },
    { name: "Dự án của tôi", href: "/member/projects", icon: FolderOpen },
    { name: "Thời gian làm việc", href: "/member/timesheet", icon: Clock },
    { name: "Hồ sơ", href: "/member/profile", icon: User },
]
const API_URL = "https://taskhadflow-api.nibies.space"

export default function MemberLayout({ children }: MemberLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const lastAvatarUrl = useRef<string | null>(null)
    const pathname = usePathname()
    const { showSuccess } = useToastContext()
    const router = useRouter()

    useEffect(() => {
        const loadUserInfo = async () => {
            const token = localStorage.getItem('accessToken')
            const userId = localStorage.getItem('userId')
            const hotenLS = localStorage.getItem('hoten')
            const manvLS = localStorage.getItem('manv')
            const roleLS = localStorage.getItem('role')

            if (token) {
                try {
                    const user = await getMyProfile()
                    let avatar = user.avatarUrl || user.avatar || `/users/${user.id}/avatar`

                    if (avatar && !avatar.startsWith('http') && !avatar.startsWith('data:')) {
                        try {
                            // Add cache buster to force fresh fetch
                            const avatarUrl = avatar + '?t=' + Date.now();
                            const res = await api.get(avatarUrl, { responseType: 'blob' })
                            const blob = res.data
                            const objectUrl = URL.createObjectURL(blob)
                            if (lastAvatarUrl.current) {
                                try { URL.revokeObjectURL(lastAvatarUrl.current) } catch (e) { }
                            }
                            avatar = objectUrl
                            lastAvatarUrl.current = objectUrl
                        } catch (err) {
                            const base = API_URL
                            avatar = `${base.replace(/\/$/, '')}${avatar.startsWith('/') ? '' : '/'}${avatar}`
                        }
                    }

                    setCurrentUser({
                        id: user.id,
                        hoten: user.hoten || hotenLS || user.name || '',
                        manv: user.manv || manvLS || '',
                        role: user.role?.name || roleLS || '',
                        avatar
                    })

                    return
                } catch (err) {
                    console.warn('getMyProfile failed, falling back to localStorage', err)
                }
            }

            const hoten = hotenLS
            const manv = manvLS
            const role = roleLS
            const avatarLS = localStorage.getItem('avatar')

            if (token && userId && hoten) {
                setCurrentUser({ id: parseInt(userId), hoten, manv, role, avatar: avatarLS })
            }
        }

        loadUserInfo()

        // Listen for avatar update events
        const handleAvatarUpdate = () => {
            loadUserInfo()
        }
        window.addEventListener('avatarUpdated', handleAvatarUpdate)

        return () => {
            window.removeEventListener('avatarUpdated', handleAvatarUpdate)
        }
    }, [])

    useEffect(() => {
        return () => {
            if (lastAvatarUrl.current) {
                try { URL.revokeObjectURL(lastAvatarUrl.current) } catch (e) { }
                lastAvatarUrl.current = null
            }
        }
    }, [])

    const updatedNavigation = navigation.map(item => ({ ...item, current: pathname === item.href }))

    const handleLogout = async () => {
        const confirmed = await showConfirm('Bạn có chắc muốn đăng xuất?')
        if (!confirmed) return
        setIsLoggingOut(true)
        try { await authAPI.logout() } catch (e) { console.warn(e) }

        localStorage.removeItem('accessToken')
        localStorage.removeItem('accesstoken')
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userId')
        localStorage.removeItem('hoten')
        localStorage.removeItem('manv')
        localStorage.removeItem('role')
        localStorage.removeItem('avatar')
        sessionStorage.clear()

        showSuccess('Đăng xuất thành công!')
        router.push('/')
    }

    return (
        <div className="h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />

                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white hover:bg-white/20 transition-colors"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>

                    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                        <div className="flex-shrink-0 flex items-center px-4 mb-6">
                            <Image
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Huit-IWimrgiEFAgwC7TB8MBStRusseaQ9A.png"
                                alt="HUIT Logo"
                                width={120}
                                height={40}
                                className="h-8 w-auto object-contain"
                            />
                        </div>
                        <div className="flex-shrink-0 flex items-center px-4 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Member Portal</h2>
                            </div>
                        </div>
                        <nav className="mt-5 px-3 space-y-1">
                            {updatedNavigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${item.current
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                        : 'text-slate-700 hover:bg-white hover:shadow-md hover:text-blue-600'
                                        } group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon
                                        className={`${item.current ? 'text-white' : 'text-slate-500 group-hover:text-blue-500'
                                            } mr-4 flex-shrink-0 h-6 w-6 transition-transform group-hover:scale-110`}
                                    />
                                    {item.name}
                                </Link>
                            ))}

                            {/* Logout for mobile */}
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full text-left text-slate-700 hover:bg-red-50 hover:text-red-600 group flex items-center px-4 py-3 text-base font-medium rounded-xl disabled:opacity-50 transition-all duration-200"
                            >
                                <LogOut className={`text-slate-500 group-hover:text-red-500 mr-4 flex-shrink-0 h-6 w-6 transition-transform group-hover:scale-110 ${isLoggingOut ? 'animate-spin' : ''}`} />
                                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 border-r border-blue-100 shadow-sm">
                    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center flex-shrink-0 px-4 mb-8">
                            <Image
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Huit-IWimrgiEFAgwC7TB8MBStRusseaQ9A.png"
                                alt="HUIT Logo"
                                width={150}
                                height={50}
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <div className="flex items-center flex-shrink-0 px-4 mb-6">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Trang nhân viên</h2>
                            </div>
                        </div>
                        <nav className="mt-5 flex-1 px-3 space-y-1">
                            {updatedNavigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl
                                        transition-all duration-200 ease-in-out
                                        ${item.current
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                                            : 'text-slate-700 hover:bg-white hover:shadow-md hover:scale-102 hover:text-blue-600'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`h-5 w-5 transition-transform duration-200 ${item.current ? 'text-white' : 'text-slate-500 group-hover:text-blue-500 group-hover:scale-110'}`} />
                                        <span>{item.name}</span>
                                    </div>
                                    {item.current && <ChevronRight className="h-4 w-4 text-white/70" />}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="md:pl-64 flex flex-col flex-1">
                {/* Top navigation */}
                <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white/80 backdrop-blur-xl border-b border-blue-100 shadow-sm">
                    <button
                        className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                {/* Desktop header */}
                <div className="hidden md:flex sticky top-0 z-10 flex-shrink-0 h-16 bg-white/80 backdrop-blur-xl border-b border-blue-100 items-center justify-between px-6 shadow-sm">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">

                            <span className="text-sm font-medium text-slate-600">Hệ thống quản lý công việc</span>
                        </div>
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center gap-4">
                        <NotificationBell userRole="member" />

                        {/* (search removed) */}

                        {/* Settings */}
                        <Link href="/member/profile">
                            <button className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105">
                                <Settings className="h-5 w-5" />
                            </button>
                        </Link>

                        {/* User info - inline, less prominent */}
                        <div className="flex items-center gap-2">
                            <Link href="/member/profile" className="flex items-center gap-2 group cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    {currentUser?.avatar ? (
                                        <Avatar className="w-9 h-9 ring-2 ring-blue-500/20 group-hover:ring-blue-500">
                                            <AvatarImage src={currentUser.avatar} alt={currentUser?.hoten || 'Member'} />
                                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                                {(currentUser?.hoten || 'M').substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-blue-500/20 group-hover:ring-blue-500">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600">{currentUser?.hoten || 'Member User'}</span>
                                </div>
                            </Link>
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="ml-2 px-2 py-1 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200 disabled:opacity-50"
                                title="Đăng xuất"
                            >
                                <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 relative overflow-y-auto focus:outline-none">
                    {children}
                </main>
            </div>
        </div>
    )
}