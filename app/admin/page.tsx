"use client"

import { useState, useEffect } from "react"
import { Users, Shield, FolderKanban, TrendingUp, Activity, Clock } from "lucide-react"
import { getDashboardStats } from "@/axios/adminApi"

export default function AdminDashboard() {
    const [stats, setStats] = useState([
        {
            title: "Tổng người dùng",
            value: "0",
            change: "0%",
            icon: Users,
            color: "from-blue-500 to-indigo-600",
        },
        {
            title: "Admin",
            value: "0",
            change: "0%",
            icon: Shield,
            color: "from-purple-500 to-pink-600",
        },
        {
            title: "Manager",
            value: "0",
            change: "0%",
            icon: FolderKanban,
            color: "from-orange-500 to-red-600",
        },
        {
            title: "User",
            value: "0",
            change: "0%",
            icon: Activity,
            color: "from-green-500 to-emerald-600",
        },
    ])
    
    const [loading, setLoading] = useState(true)

    const recentActivities = [
        {
            user: "Nguyễn Văn A",
            action: "đã tạo dự án mới",
            project: "Hệ thống CRM",
            time: "5 phút trước",
        },
        {
            user: "Trần Thị B",
            action: "đã cập nhật vai trò",
            project: "Admin",
            time: "15 phút trước",
        },
        {
            user: "Lê Văn C",
            action: "đã hoàn thành task",
            project: "Website Bán hàng",
            time: "1 giờ trước",
        },
    ]

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        setLoading(true)
        try {
            const data = await getDashboardStats()
            
            setStats([
                {
                    title: "Tổng người dùng",
                    value: data.totalUsers.toString(),
                    change: "+12.5%",
                    icon: Users,
                    color: "from-blue-500 to-indigo-600",
                },
                {
                    title: "Admin",
                    value: data.adminCount.toString(),
                    change: "+8.2%",
                    icon: Shield,
                    color: "from-purple-500 to-pink-600",
                },
                {
                    title: "Manager",
                    value: data.managerCount.toString(),
                    change: "+2",
                    icon: FolderKanban,
                    color: "from-orange-500 to-red-600",
                },
                {
                    title: "User",
                    value: data.userCount.toString(),
                    change: "+23.1%",
                    icon: Activity,
                    color: "from-green-500 to-emerald-600",
                },
            ])
        } catch (error: any) {
            console.error('Load stats error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Chào mừng trở lại! 👋</h1>
                <p className="text-muted-foreground text-lg">Đây là tổng quan về hệ thống của bạn</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-secondary"></div>
                                <div className="w-16 h-4 bg-secondary rounded"></div>
                            </div>
                            <div>
                                <div className="w-24 h-3 bg-secondary rounded mb-2"></div>
                                <div className="w-16 h-8 bg-secondary rounded"></div>
                            </div>
                        </div>
                    ))
                ) : (
                    stats.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <div
                                key={index}
                                className="relative group overflow-hidden bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-sm"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md shadow-blue-500/20`}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
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
                    })
                )}
            </div>

            {/* Recent Activities */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-1">Hoạt động gần đây</h2>
                        <p className="text-sm text-muted-foreground">Theo dõi các hoạt động mới nhất trong hệ thống</p>
                    </div>
                    <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-medium transition-colors">
                        Xem tất cả
                    </button>
                </div>

                <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md shadow-blue-500/20">
                                {activity.user.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-foreground">
                                    <span className="font-semibold">{activity.user}</span>{" "}
                                    <span className="text-muted-foreground">{activity.action}</span>{" "}
                                    <span className="font-semibold text-primary">{activity.project}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <Clock size={12} />
                                    {activity.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
