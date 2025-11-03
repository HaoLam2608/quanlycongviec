"use client"
import Link from "next/link"
import type React from "react"
import { useState } from "react"
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
import AuthGuard from "@/components/auth/AuthGuard"
import { useToastContext } from '@/components/providers/toast-provider'
import Image from "next/image"

const menuCategories = [
    {
        title: "Chính",
        items: [{ name: "Dashboard", href: "/admin", icon: Home }],
    },
    {
        title: "Quản lý người dùng",
        items: [
            { name: "Người dùng", href: "/admin/users", icon: Users },
            { name: "Phân quyền", href: "/admin/roles", icon: Shield },
        ],
    },
    {
        title: "Quản lý dự án",
        items: [
            { name: "Dự án", href: "/admin/projects", icon: FolderKanban },
            { name: "Nhóm", href: "/admin/groups", icon: Layers3 },
        ],
    },
    {
        title: "Báo cáo & Cài đặt",
        items: [
            { name: "Báo cáo", href: "/admin/reports", icon: BarChart3 },
            { name: "Cài đặt", href: "/admin/settings", icon: Settings },
        ],
    },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { showSuccess } = useToastContext()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const userInfo = {
        hoten: "John Doe",
        role: "admin",
        manv: "12345",
        refreshToken: "refreshTokenValue",
        token: "tokenValue",
    }

    const handleLogout = () => {
        // Xác nhận đăng xuất
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            // Xóa token và thông tin user từ localStorage
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("manv")
            localStorage.removeItem("hoten")
            localStorage.removeItem("role")

            // Hiển thị thông báo đăng xuất thành công
            showSuccess("Đăng xuất thành công!")

            // Chuyển về trang đăng nhập
            router.push("/")
        }
    }

    return (
        <AuthGuard>
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
                                <h2 className="text-lg font-semibold text-gray-900">Admin Portal</h2>
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
                                                    {item.name}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                ))}
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
                            <div className="flex items-center flex-shrink-0 px-4">
                                <h2 className="text-xl font-bold text-gray-900">Admin Portal</h2>
                            </div>
                            <nav className="mt-5 flex-1 px-2 space-y-2">
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
                                                        ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        } group flex items-center px-2 py-3 text-sm font-medium rounded-l-md transition-colors`}
                                                >
                                                    <Icon
                                                        className={`${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                                            } mr-3 flex-shrink-0 h-5 w-5`}
                                                    />
                                                    {item.name}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                ))}
                            </nav>
                        </div>

                        {/* User section */}
                        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700">{userInfo.hoten}</p>
                                    <p className="text-xs text-gray-500">Quản trị viên</p>
                                </div>
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
                            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                <Bell className="h-5 w-5" />
                            </button>

                            {/* Settings */}
                            <Link href="/admin/settings">
                                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                    <Settings className="h-5 w-5" />
                                </button>
                            </Link>

                            {/* User menu */}
                            <div className="relative flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="hidden lg:block">
                                    <p className="text-sm font-medium text-gray-700">{userInfo.hoten}</p>
                                    <p className="text-xs text-gray-500">Quản trị viên</p>
                                </div>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Page content */}
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="max-w-7xl mx-auto p-8">{children}</div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}
