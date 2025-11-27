"use client"
import Link from "next/link"
import React, { useState, useEffect } from "react"
import api from '@/axios/config'
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { Home, Users, CheckSquare, ClipboardCheck, BarChart3, User, Settings, LogOut, Menu, X, ListTodo, FileText, Briefcase } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import AuthGuard from "@/components/auth/AuthGuard"
import { useToastContext } from "@/components/providers/toast-provider"
import NotificationBell from "@/components/NotificationBell"
import ApprovalCountBadge from "@/components/ApprovalCountBadge"
import { showConfirm } from '@/lib/notifications'
import { getMyProfile } from "@/axios/api"
import Image from "next/image"
import { GlobalChatProvider } from "@/components/chat/GlobalChatProvider"
import { FloatingAI } from "@/components/ai/FloatingAI"

const menuCategories = [
    {
        title: "Chính",
        items: [{ name: "Dashboard", href: "/teamlead", icon: Home }],
    },
    {
        title: "Quản lý chung",
        items: [
            { name: "Nhóm của tôi", href: "/teamlead/group", icon: Users },
            { name: "Dự án", href: "/teamlead/projects", icon: Briefcase },
        ],
    },
    {
        title: "Quản lý công việc",
        items: [
            { name: "Công việc lớn", href: "/teamlead/tasks", icon: ListTodo },
            { name: "Công việc nhỏ", href: "/teamlead/subtasks", icon: CheckSquare },
            { name: "Phê duyệt", href: "/teamlead/approvals", icon: ClipboardCheck },
        ],
    },
    {
        title: "Khác",
        items: [
            { name: "Tài liệu", href: "/teamlead/documents", icon: FileText },
            { name: "Báo cáo", href: "/teamlead/reports", icon: BarChart3 },
            { name: "Hồ sơ", href: "/teamlead/profile", icon: User },
        ],
    },
]

export default function TeamLeadLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { showSuccess } = useToastContext()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Load user info from localStorage and API
    useEffect(() => {
        const loadUserInfo = async () => {
            const token = localStorage.getItem('accessToken')
            const userId = localStorage.getItem('userId')
            const hotenLS = localStorage.getItem('hoten')
            const manvLS = localStorage.getItem('manv')
            const roleLS = localStorage.getItem('role')

            // Try to fetch fresh profile from API
            if (token) {
                try {
                    const user = await getMyProfile()

                    let avatar = user.avatarUrl || user.avatar || `/users/${user.id}/avatar`

                    if (avatar && !avatar.startsWith('http') && !avatar.startsWith('data:')) {
                        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                        avatar = `${base.replace(/\/$/, '')}${avatar.startsWith('/') ? '' : '/'}${avatar}`
                    }

                    setCurrentUser({
                        id: user.id,
                        hoten: user.hoten || hotenLS || user.name || '',
                        manv: user.manv || manvLS || '',
                        role: user.role?.name || roleLS || '',
                        chucvu: user.chucvu || 'Trưởng nhóm',
                        avatar
                    })

                    return
                } catch (err) {
                    console.warn('getMyProfile failed, falling back to localStorage', err)
                }
            }

            // Fallback to localStorage
            const hoten = hotenLS
            const manv = manvLS
            const role = roleLS
            const avatarLS = localStorage.getItem('avatar')

            if (token && userId && hoten) {
                setCurrentUser({
                    id: parseInt(userId),
                    hoten,
                    manv,
                    role,
                    chucvu: 'Trưởng nhóm',
                    avatar: avatarLS
                })
            }
        }

        loadUserInfo()
    }, [])

    const handleLogout = async () => {
        const confirmed = await showConfirm("Bạn có chắc muốn đăng xuất?")
        if (confirmed) {
            setIsLoggingOut(true)

            // Clear all authentication data
            localStorage.removeItem("accessToken")
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("manv")
            localStorage.removeItem("userId")
            localStorage.removeItem("hoten")
            localStorage.removeItem("role")
            localStorage.removeItem("avatar")
            sessionStorage.clear()

            showSuccess("Đăng xuất thành công!")
            router.push("/")
        }
    }

    return (
        <AuthGuard>
            <GlobalChatProvider>
                <FloatingAI />
                <div className="h-screen flex bg-gray-100">
                    {/* Mobile sidebar */}
                    <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />

                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                            <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <button
                                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <X className="h-6 w-6 text-white" />
                                </button>
                            </div>

                            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                                <div className="flex-shrink-0 flex items-center px-4 mb-4">
                                    <Image
                                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Huit-IWimrgiEFAgwC7TB8MBStRusseaQ9A.png"
                                        alt="HUIT Logo"
                                        width={120}
                                        height={40}
                                        className="h-8 w-auto object-contain"
                                    />
                                </div>
                                <div className="flex-shrink-0 flex items-center px-4 mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Team Lead Portal</h2>
                                </div>
                                <nav className="mt-5 px-2 space-y-4">
                                    {menuCategories.map((category) => (
                                        <div key={category.title}>
                                            <h3 className="px-3 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                                                {category.title}
                                            </h3>
                                            <div className="space-y-1">
                                                {category.items.map((item) => {
                                                    const isActive = pathname === item.href
                                                    return (
                                                        <Link
                                                            key={item.name}
                                                            href={item.href}
                                                            className={`${isActive
                                                                ? 'bg-blue-100 text-blue-900'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                                                            onClick={() => setSidebarOpen(false)}
                                                        >
                                                            <item.icon
                                                                className={`${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                                                    } mr-4 flex-shrink-0 h-6 w-6`}
                                                            />
                                                            {item.name}
                                                            {item.name === "Phê duyệt" && (
                                                                <ApprovalCountBadge className="ml-auto" />
                                                            )}
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Logout for mobile */}
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-700 group flex items-center px-2 py-2 text-base font-medium rounded-md disabled:opacity-50"
                                    >
                                        <LogOut className={`text-gray-400 group-hover:text-red-500 mr-4 flex-shrink-0 h-6 w-6 ${isLoggingOut ? 'animate-spin' : ''}`} />
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>

                    {/* Desktop sidebar */}
                    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
                            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                                <div className="flex items-center flex-shrink-0 px-4 mb-4">
                                    <Image
                                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Huit-IWimrgiEFAgwC7TB8MBStRusseaQ9A.png"
                                        alt="HUIT Logo"
                                        width={150}
                                        height={50}
                                        className="h-10 w-auto object-contain"
                                    />
                                </div>
                                <div className="flex items-center flex-shrink-0 px-4 mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Team Lead Portal</h2>
                                </div>
                                <nav className="mt-5 flex-1 px-2 space-y-4">
                                    {menuCategories.map((category) => (
                                        <div key={category.title}>
                                            <h3 className="px-3 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                                                {category.title}
                                            </h3>
                                            <div className="space-y-1">
                                                {category.items.map((item) => {
                                                    const isActive = pathname === item.href
                                                    return (
                                                        <Link
                                                            key={item.name}
                                                            href={item.href}
                                                            className={`${isActive
                                                                ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                } group flex items-center px-2 py-3 text-sm font-medium rounded-l-md transition-colors`}
                                                        >
                                                            <item.icon
                                                                className={`${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                                                    } mr-3 flex-shrink-0 h-5 w-5`}
                                                            />
                                                            {item.name}
                                                            {item.name === "Phê duyệt" && (
                                                                <ApprovalCountBadge className="ml-auto" />
                                                            )}
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </nav>
                            </div>

                            {/* User section */}
                            <div className="flex-shrink-0 border-t border-gray-200">
                                <div className="flex items-center p-4">
                                    <div>
                                        {currentUser?.avatar ? (
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={currentUser.avatar} alt={currentUser?.hoten || 'Team Lead'} />
                                                <AvatarFallback className="text-xs">
                                                    {(currentUser?.hoten || 'T').substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-gray-700">
                                            {currentUser?.hoten || 'Team Leader'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {currentUser?.manv || 'Trưởng nhóm'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                        title="Đăng xuất"
                                    >
                                        <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="md:pl-64 flex flex-col flex-1">
                        {/* Top navigation */}
                        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-gray-200">
                            <button
                                className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Desktop header */}
                        <div className="hidden md:flex sticky top-0 z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200 items-center justify-between px-6">
                            <div className="flex-1" />

                            {/* Header actions */}
                            <div className="flex items-center space-x-4">
                                {/* Notifications */}
                                <NotificationBell userRole="teamleader" />

                                {/* Settings */}
                                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                    <Settings className="h-5 w-5" />
                                </button>

                            </div>
                        </div>

                        {/* Page content */}
                        <main className="flex-1 relative overflow-y-auto focus:outline-none">
                            {children}
                        </main>
                    </div>
                </div>
            </GlobalChatProvider>
        </AuthGuard>
    )
}
