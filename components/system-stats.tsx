"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, CheckCircle2, Users, FolderKanban, Clock, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { getPublicStats } from "@/axios/api"

export function SystemStats() {
  const [data, setData] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalTasks: 0,
    activeProjects: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getPublicStats()
        setData(statsData)
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const stats = [
    {
      icon: FolderKanban,
      label: "Dự án hoạt động",
      value: loading ? "..." : `${data.activeProjects}+`,
      description: "Dự án đang được quản lý",
      color: "from-blue-500 to-cyan-600",
      trend: "Realtime",
    },
    {
      icon: CheckCircle2,
      label: "Tổng dự án",
      value: loading ? "..." : `${data.totalProjects}+`,
      description: "Tổng số dự án trong hệ thống",
      color: "from-green-500 to-emerald-600",
      trend: "Cập nhật liên tục",
    },
    {
      icon: Users,
      label: "Người dùng",
      value: loading ? "..." : `${data.totalUsers}+`,
      description: "Nhân viên trong hệ thống",
      color: "from-purple-500 to-pink-600",
      trend: "Active users",
    },
    {
      icon: Clock,
      label: "Tasks",
      value: loading ? "..." : `${data.totalTasks}+`,
      description: "Tổng công việc được tạo",
      color: "from-orange-500 to-red-600",
      trend: "Toàn hệ thống",
    },
    {
      icon: TrendingUp,
      label: "Tỷ lệ hoàn thành",
      value: "87%",
      description: "Tasks đúng deadline",
      color: "from-teal-500 to-cyan-600",
      trend: "Ước tính",
    },
    {
      icon: Activity,
      label: "Uptime",
      value: "99.9%",
      description: "Độ ổn định hệ thống",
      color: "from-indigo-500 to-blue-600",
      trend: "24/7 available",
    },
  ]

  return (
    <section id="stats" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Thống kê hệ thống
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Số liệu realtime về hiệu suất và sử dụng hệ thống quản lý nội bộ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card
                key={index}
                className="border-border bg-card hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                      {stat.trend}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-card-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-muted/30 rounded-xl border border-border">
            <div className="text-2xl font-bold text-foreground mb-2">3 năm</div>
            <div className="text-sm text-muted-foreground">Thời gian vận hành</div>
          </div>
          <div className="text-center p-6 bg-muted/30 rounded-xl border border-border">
            <div className="text-2xl font-bold text-foreground mb-2">15+</div>
            <div className="text-sm text-muted-foreground">Phòng ban sử dụng</div>
          </div>
          <div className="text-center p-6 bg-muted/30 rounded-xl border border-border">
            <div className="text-2xl font-bold text-foreground mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Hỗ trợ IT nội bộ</div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Số liệu được cập nhật vào: <span className="font-semibold">{new Date().toLocaleDateString('vi-VN')}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
