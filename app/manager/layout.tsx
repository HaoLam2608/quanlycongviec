"use client"
import Link from "next/link"
import type React from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { Home, FolderKanban, CheckSquare, Users, BarChart3, Settings, LogOut } from "lucide-react"
import AuthGuard from "@/components/auth/AuthGuard"
import Image from "next/image"
import { useToastContext } from "@/components/providers/toast-provider"

const menuCategories = [
    {
        title: "Chính",
        items: [{ name: "Dashboard", href: "/manager", icon: Home }],
    },
    {
        title: "Quản lý",
        items: [
            { name: "Dự án", href: "/manager/projects", icon: FolderKanban },
            { name: "Nhiệm vụ", href: "/manager/tasks", icon: CheckSquare },
            { name: "Nhân sự", href: "/manager/groups", icon: Users },
        ],
    },
    {
        title: "Báo cáo",
        items: [
            { name: "Báo cáo tiến độ", href: "/manager/reports", icon: BarChart3 },
            { name: "Cài đặt", href: "/manager/settings", icon: Settings },
        ],
    },
]

export default function PMLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { showSuccess } = useToastContext()

    const userInfo = {
        hoten: "Jane Smith",
        role: "manager",
        manv: "54321",
        refreshToken: "refreshTokenValue",
        token: "tokenValue",
    }

    const handleLogout = () => {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("manv")
            localStorage.removeItem("hoten")
            localStorage.removeItem("role")

            showSuccess("Đăng xuất thành công!")
            router.push("/")
        }
    }

    return (
        <AuthGuard>
            <div className="flex flex-col min-h-screen bg-background">
                <header className="bg-white border-b border-[#E5E7EB] shadow-sm sticky top-0 z-50">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo - fills entire header height */}
                        <div className="h-full flex items-center">
                            <Image
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Huit-IWimrgiEFAgwC7TB8MBStRusseaQ9A.png"
                                alt="HUIT Logo"
                                width={200}
                                height={80}
                                className="h-full w-auto object-contain px-6"
                            />
                        </div>

                        {/* PM info and logout */}
                        <div className="flex items-center gap-6 px-8">
                            <Link href="/manager/profile">
                                <div className="flex items-center gap-3 cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003D82] to-[#0052A3] flex items-center justify-center text-white font-bold text-sm shadow-md">
                                        {userInfo.hoten.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-sm font-medium text-foreground">{userInfo.hoten}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {userInfo.role === "manager" ? "Quản lý dự án" : userInfo.role}
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-[#003D82] hover:bg-[#F0F4F8]"
                            >
                                <LogOut size={18} />
                                <span className="text-sm font-medium hidden sm:inline">Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1">
                    <aside className="w-72 bg-[#F8FAFC] border-r border-[#E5E7EB] flex flex-col sticky top-20 h-[calc(100vh-80px)] shadow-sm">
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {menuCategories.map((category) => (
                                <div key={category.title} className="space-y-1">
                                    {/* Category header */}
                                    <div className="w-full px-4 py-2 text-xs font-semibold text-[#003D82] uppercase tracking-wider">
                                        <span>{category.title}</span>
                                    </div>

                                    <div className="space-y-1">
                                        {category.items.map((item) => {
                                            const Icon = item.icon
                                            const isActive = pathname === item.href
                                            return (
                                                <Link key={item.href} href={item.href}>
                                                    <div
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${isActive
                                                            ? "bg-[#003D82] text-white shadow-md shadow-[#003D82]/20"
                                                            : "hover:bg-[#E5E7EB] text-muted-foreground hover:text-foreground"
                                                            }`}
                                                    >
                                                        <Icon
                                                            size={20}
                                                            className={`transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}
                                                        />
                                                        <span className="font-medium text-sm">{item.name}</span>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-7xl mx-auto p-8">{children}</div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}


