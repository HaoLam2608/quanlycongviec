"use client"

import { LoginForm } from "@/components/login-form"
import Link from "next/link"
import Image from "next/image"
import { Shield, Zap, Building2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getPublicStats } from "@/axios/api"

export default function LoginPage() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalTasks: 0,
    activeProjects: 0,
    completionRate: 0,
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
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e40af15_1px,transparent_1px),linear-gradient(to_bottom,#1e40af15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 bg-blue-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-6xl relative z-10 grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding & Info */}
        <div className="hidden lg:block space-y-8 px-8">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center space-x-3 group">
              <div className="h-14 w-auto rounded-md overflow-hidden bg-white/5 p-1 shadow-lg flex items-center justify-center group-hover:shadow-blue-500/50 transition-shadow">
                <Image src="/logo_ngang_huit.jpg" alt="HUIT" width={160} height={40} priority />
              </div>
              <span className="font-bold text-3xl text-white">HUIT Task Manager</span>
            </Link>
            <h1 className="text-5xl font-bold text-white leading-tight">
              Hệ thống quản lý<br />công việc thông minh
            </h1>
            <p className="text-blue-200 text-lg">
              Nền tảng quản lý dự án và công việc hiện đại, giúp tối ưu hóa hiệu suất làm việc của đội nhóm
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3 text-white/90">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Tốc độ cao</h3>
                <p className="text-sm text-blue-200">Xử lý nhanh chóng, giao diện mượt mà</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-white/90">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Bảo mật cao</h3>
                <p className="text-sm text-blue-200">Mã hóa dữ liệu, phân quyền chi tiết</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-white/90">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Dễ quản lý</h3>
                <p className="text-sm text-blue-200">Giao diện trực quan, dễ sử dụng</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {loading ? '...' : stats.totalProjects}
              </div>
              <div className="text-sm text-blue-300">Dự án</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {loading ? '...' : stats.totalUsers}
              </div>
              <div className="text-sm text-blue-300">Người dùng</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {loading ? '...' : `${stats.completionRate}%`}
              </div>
              <div className="text-sm text-blue-300">Hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <div className="h-12 w-12 rounded-md overflow-hidden bg-white/5 p-1 shadow-sm flex items-center justify-center">
                <Image src="/logo_cty.jpg" alt="HUIT" width={48} height={48} priority />
              </div>
              <span className="font-bold text-2xl text-white">HUIT Task Manager</span>
            </Link>
            <p className="text-blue-200 text-sm mt-2">Hệ thống quản lý công việc</p>
          </div>
          
          <LoginForm />
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(100px); opacity: 0; }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-float {
          animation: float 20s linear infinite;
        }
      `}</style>
    </div>
  )
}
