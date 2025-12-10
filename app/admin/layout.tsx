"use client"
import Link from "next/link"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import {
    Home,
    Users,
    Shield,
    FolderKanban,
    LogOut,
    Layers3,
    Building2,
    CheckSquare,
    BarChart3,
    Settings,
    Bell,
    Menu,
    X,
    User
} from "lucide-react"
import { FloatingAI } from "@/components/ai/FloatingAI"
import AuthGuard from "@/components/auth/AuthGuard"
import { useToastContext } from '@/components/providers/toast-provider'
import NotificationBell from "@/components/NotificationBell"
import ApprovalCountBadge from "@/components/ApprovalCountBadge"
import { GlobalChatProvider } from "@/components/chat/GlobalChatProvider"
import QuickSettings from "@/components/QuickSettings"
import { useI18n } from "@/lib/i18n/I18nContext"

import { showConfirm } from '@/lib/notifications'
import Image from "next/image"
const base_url = "https://taskhadflow-api.nibies.space"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { showSuccess } = useToastContext()
    const { t } = useI18n()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userInfo, setUserInfo] = useState({
        hoten: "",
        role: "",
        manv: "",
        chucvu: "",
        refreshToken: "",
        token: "",
        avatar: "",
    });

    const isClient = typeof window !== 'undefined'

    React.useEffect(() => {
        const loadUserInfo = () => {
            if (typeof window !== "undefined") {
                let avatar = localStorage.getItem("avatar") || ""
                // Nếu avatar là /users/... và chưa có cache-buster thì thêm
                if (avatar && avatar.startsWith('/users/') && !avatar.includes('t=')) {
                    avatar = `${avatar}${avatar.includes('?') ? '&' : '?'}t=${Date.now()}`
                }
                setUserInfo({
                    hoten: localStorage.getItem("hoten") || "",
                    role: localStorage.getItem("role") || "",
                    chucvu: localStorage.getItem("chucvu") || "",
                    manv: localStorage.getItem("manv") || "",
                    refreshToken: localStorage.getItem("refreshToken") || "",
                    token: localStorage.getItem("token") || "",
                    avatar,
                });
            }
        };

        loadUserInfo();

        // Lắng nghe sự kiện cập nhật avatar
        window.addEventListener('avatarUpdated', loadUserInfo);
        return () => window.removeEventListener('avatarUpdated', loadUserInfo);
    }, []);

    const handleLogout = async () => {
        // Xác nhận đăng xuất
        const confirmed = await showConfirm("Bạn có chắc chắn muốn đăng xuất?")
        if (confirmed) {
            setIsLoggingOut(true)
            try {
                localStorage.removeItem("accessToken")
                localStorage.removeItem("token")
                localStorage.removeItem("refreshToken")
                localStorage.removeItem("manv")
                localStorage.removeItem("userId")
                localStorage.removeItem("hoten")
                localStorage.removeItem("role")
                localStorage.removeItem("avatar")

                showSuccess("Đăng xuất thành công!")
                setSidebarOpen(false)
                router.push("/")
            } finally {
                setIsLoggingOut(false)
            }
        }
    }

    // Menu categories with i18n
    const menuCategories = [
        {
            title: t('menu.main'),
            items: [{ name: t('menu.home'), href: "/admin", icon: Home }],
        },
        {
            title: t('menu.userManagement'),
            items: [
                { name: t('menu.users'), href: "/admin/users", icon: Users },
                { name: t('menu.roles'), href: "/admin/roles", icon: Shield },
            ],
        },
        {
            title: t('menu.projectManagement'),
            items: [
                { name: t('menu.projects'), href: "/admin/projects", icon: FolderKanban },
                { name: t('menu.groups'), href: "/admin/groups", icon: Layers3 },
                { name: t('menu.approvals'), href: "/admin/approvals", icon: CheckSquare },
            ],
        },
        {
            title: t('menu.system'),
            items: [
                { name: t('menu.notifications'), href: "/admin/notifications", icon: Bell },
                { name: t('menu.reports'), href: "/admin/reports", icon: BarChart3 },
                { name: t('menu.settings'), href: "/admin/settings", icon: Settings },
            ],
        },
    ]

    return (
        <AuthGuard>
            <GlobalChatProvider>
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
                                <div className="flex-shrink-0 flex items-center px-4">
                                    <h2 className="text-lg font-semibold text-gray-900">{t('menu.adminPanel')}</h2>
                                </div>
                                <nav className="mt-5 px-2 space-y-2">
                                    {menuCategories.map((category) => (
                                        <div key={category.title} className="space-y-1">
                                            <div className="px-4 py-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                                {category.title}
                                            </div>
                                            {category.items.map((item) => {
                                                const Icon = item.icon
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
                                                        <Icon
                                                            className={`${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                                                } mr-4 flex-shrink-0 h-6 w-6`}
                                                        />
                                                        <span className="flex-1">{item.name}</span>
                                                        {item.name === t('menu.approvals') && <ApprovalCountBadge />}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </nav>
                                {/* Logout for mobile */}
                                <div className="mt-6 px-2">
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-700 group flex items-center px-2 py-2 text-base font-medium rounded-md disabled:opacity-50"
                                    >
                                        <LogOut className={`text-gray-400 group-hover:text-red-500 mr-4 flex-shrink-0 h-6 w-6 ${isLoggingOut ? 'animate-spin' : ''}`} />
                                        {isLoggingOut ? t('loggingOut') : t('logout')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop sidebar */}
                    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
                                <div className="flex items-center flex-shrink-0 px-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('menu.adminPanel')}</h2>
                                </div>
                                <nav className="mt-5 flex-1 px-2 space-y-2">
                                    {menuCategories.map((category) => (
                                        <div key={category.title} className="space-y-1">
                                            <div className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                                {category.title}
                                            </div>
                                            {category.items.map((item) => {
                                                const Icon = item.icon
                                                const isActive = pathname === item.href
                                                return (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        className={`${isActive
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-r-2 border-blue-500'
                                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                                            } group flex items-center px-2 py-3 text-sm font-medium rounded-l-md transition-colors`}
                                                    >
                                                        <Icon
                                                            className={`${isActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                                                                } mr-3 flex-shrink-0 h-5 w-5`}
                                                        />
                                                        <span className="flex-1">{item.name}</span>
                                                        {item.name === t('menu.approvals') && <ApprovalCountBadge />}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </nav>
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
                        <div className="hidden md:flex sticky top-0 z-10 flex-shrink-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 items-center justify-between px-6">
                            <div className="flex-1" />

                            {/* Header actions */}
                            <div className="flex items-center space-x-4">
                                {/* Quick Settings (Theme + Language) */}
                                <QuickSettings />

                                {/* Notifications */}
                                <NotificationBell userRole="admin" />

                                {/* Settings */}
                                <Link href="/admin/settings">
                                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <Settings className="h-5 w-5" />
                                    </button>
                                </Link>
                                {/* User section */}
                                <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                                    <div className="flex items-center">
                                        <Link href="/admin/settings" className="flex items-center group">
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-400 transition">
                                                {userInfo.avatar && userInfo.avatar.startsWith('/users/') ? (
                                                    <img src={`${base_url}${userInfo.avatar}`} alt="avatar" className="w-full h-full object-cover" />
                                                ) : userInfo.avatar ? (
                                                    <img src={userInfo.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-2xl text-white">?</span>
                                                )}
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:underline cursor-pointer">{userInfo.hoten}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin')}</p>
                                            </div>
                                        </Link>
                                        <button onClick={handleLogout} disabled={isLoggingOut} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50" title="Đăng xuất">
                                            <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Page content */}
                        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900">
                            <div className="max-w-7xl mx-auto p-8">{children}</div>
                        </main>
                    </div>

                    {/* Floating AI Assistant */}
                    <FloatingAI />
                </div>
            </GlobalChatProvider>
        </AuthGuard>
    )
}
