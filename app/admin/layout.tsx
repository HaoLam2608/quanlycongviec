"use client"
import Link from "next/link"
import type React from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { Home, Users, Shield, FolderKanban, Sparkles, LogOut, Layers3 } from "lucide-react"
import AuthGuard from "@/components/auth/AuthGuard"

const menuItems = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Người dùng", href: "/admin/users", icon: Users },
    { name: "Phân quyền", href: "/admin/roles", icon: Shield },
    { name: "Dự án", href: "/admin/projects", icon: FolderKanban },
    { name: "Nhóm", href: "/admin/groups", icon: Layers3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    // Lấy thông tin user từ localStorage
    const getUserInfo = () => {
        if (typeof window !== 'undefined') {
            return {
                hoten: localStorage.getItem('hoten') || 'Admin User',
                manv: localStorage.getItem('manv') || 'ADMIN001',
                role: localStorage.getItem('role') || 'admin'
            }
        }
        return { hoten: 'Admin User', manv: 'ADMIN001', role: 'admin' }
    }

    const userInfo = getUserInfo()

    const handleLogout = () => {
        // Xác nhận đăng xuất
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            // Xóa token và thông tin user từ localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('manv')
            localStorage.removeItem('hoten')
            localStorage.removeItem('role')
            
            // Hiển thị thông báo đăng xuất thành công
            alert('Đăng xuất thành công!')
            
            // Chuyển về trang đăng nhập
            router.push('/')
        }
    }

    return (
        <AuthGuard>
            <div className="flex min-h-screen bg-background">
                {/* Sidebar */}
                <aside className="w-72 bg-card border-r border-border flex flex-col sticky top-0 h-screen shadow-sm">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
                            <p className="text-xs text-muted-foreground">Quản trị hệ thống</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <Icon
                                        size={20}
                                        className={`transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}
                                    />
                                    <span className="font-medium">{item.name}</span>
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-secondary/30">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-green-500/20">
                            {userInfo.hoten.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {userInfo.hoten}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {userInfo.manv} • {userInfo.role === 'admin' ? 'Quản trị viên' : userInfo.role}
                            </p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group w-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                        <LogOut
                            size={20}
                            className="transition-transform duration-200 group-hover:scale-110"
                        />
                        <span className="font-medium">Đăng xuất</span>
                    </button>
                </div>

            </aside>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto p-8">{children}</div>
                </main>
            </div>
        </AuthGuard>
    )
}
