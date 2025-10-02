"use client"
import Link from "next/link"
import type React from "react"

import { usePathname } from "next/navigation"
import { Home, Users, Shield, FolderKanban, Sparkles } from "lucide-react"

const menuItems = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Người dùng", href: "/admin/users", icon: Users },
    { name: "Phân quyền", href: "/admin/roles", icon: Shield },
    { name: "Dự án", href: "/admin/projects", icon: FolderKanban },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
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

            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">{children}</div>
            </main>
        </div>
    )
}
