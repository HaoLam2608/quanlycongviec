"use client"

import { TrendingUp, Users, FolderKanban, CheckSquare } from "lucide-react"

export default function ReportsPage() {
    const stats = [
        {
            title: "Tổng dự án",
            value: "24",
            change: "+3 tuần này",
            icon: FolderKanban,
            color: "from-[#003D82] to-[#0052A3]",
        },
        {
            title: "Nhiệm vụ hoàn thành",
            value: "156",
            change: "+12 tuần này",
            icon: CheckSquare,
            color: "from-[#0052A3] to-[#006BB8]",
        },
        {
            title: "Nhân viên hoạt động",
            value: "45",
            change: "+2 tuần này",
            icon: Users,
            color: "from-[#006BB8] to-[#0084CF]",
        },
        {
            title: "Tỷ lệ hoàn thành",
            value: "87%",
            change: "+5% tuần này",
            icon: TrendingUp,
            color: "from-[#0084CF] to-[#009DE6]",
        },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Báo cáo</h1>
                <p className="text-muted-foreground mt-1">Thống kê và báo cáo tổng quan hệ thống</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={index}
                            className="relative group overflow-hidden bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-sm"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md shadow-[#003D82]/20`}
                                >
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1 text-[#0084CF] text-sm font-medium">
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
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Status */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground mb-6">Trạng thái dự án</h2>
                    <div className="space-y-4">
                        {[
                            { label: "Hoàn thành", value: 8, color: "bg-green-500" },
                            { label: "Đang thực hiện", value: 12, color: "bg-blue-500" },
                            { label: "Chưa bắt đầu", value: 4, color: "bg-gray-400" },
                        ].map((item, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                                    <span className="text-sm font-bold text-[#003D82]">{item.value}</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className={`${item.color} h-2 rounded-full`}
                                        style={{ width: `${(item.value / 24) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Task Distribution */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground mb-6">Phân bố nhiệm vụ</h2>
                    <div className="space-y-4">
                        {[
                            { label: "Cao", value: 45, color: "bg-red-500" },
                            { label: "Trung bình", value: 78, color: "bg-yellow-500" },
                            { label: "Thấp", value: 33, color: "bg-green-500" },
                        ].map((item, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                                    <span className="text-sm font-bold text-[#003D82]">{item.value}</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className={`${item.color} h-2 rounded-full`}
                                        style={{ width: `${(item.value / 156) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
