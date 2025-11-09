"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Users, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getPublicStats } from "@/axios/api"

export function Hero() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalTasks: 0,
    activeProjects: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getPublicStats()
        setStats(data)
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
  <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-800 py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 backdrop-blur-sm px-4 py-2 text-sm">
            <span className="mr-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-blue-200">Hệ thống quản lý công việc nội bộ - Phiên bản 2.0</span>
          </div>

          <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6 text-balance">
            Nền tảng quản lý dự án & công việc nội bộ
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-blue-100 sm:text-xl leading-relaxed mb-10">
            Hệ thống tập trung quản lý toàn bộ dự án, phân công nhiệm vụ, theo dõi tiến độ và báo cáo hiệu suất. 
            Được thiết kế dành riêng cho quy trình làm việc của công ty.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-base px-8 shadow-lg shadow-blue-500/30" 
              asChild
            >
              <Link href="/login">
                Đăng nhập hệ thống
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Hướng dẫn sử dụng
            </Button>
          </div>

          <p className="mt-6 text-sm text-blue-300 flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Bảo mật cao
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Phân quyền chi tiết
            </span>
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Báo cáo realtime
            </span>
          </p>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {loading ? '...' : `${stats.activeProjects}+`}
              </div>
              <div className="text-sm text-blue-300">Dự án đang hoạt động</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {loading ? '...' : `${stats.totalTasks}+`}
              </div>
              <div className="text-sm text-blue-300">Tasks hoàn thành</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {loading ? '...' : `${stats.totalUsers}+`}
              </div>
              <div className="text-sm text-blue-300">Nhân viên sử dụng</div>
            </div>
          </div>

          {/* Dashboard preview removed as requested */}
        </div>
      </div>

      {/* Background decoration */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/8 rounded-full blur-3xl" />
  <div className="absolute bottom-6 right-6 w-[280px] h-[280px] bg-cyan-600/6 rounded-full blur-3xl" />
    </section>
  )
}
