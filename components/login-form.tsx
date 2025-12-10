"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginUser } from "@/axios/api"
import { getUsers } from "@/axios/adminApi"
import { clearAllAuthData, debugAuth } from "@/lib/authDebug"
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export function LoginForm() {
  const [manv, setManv] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setMessageType("")
    try {
      // Clear any existing auth data before login
      clearAllAuthData()
      
      const res = await loginUser({ manv, password })
      setMessage(res.message || "Đăng nhập thành công!")
      setMessageType("success")

      localStorage.setItem("accessToken", res.accessToken || res.token)
      localStorage.setItem("refreshToken", res.refreshToken || "")
      localStorage.setItem("manv", res.manv)
      localStorage.setItem("userId", res.userId)
      localStorage.setItem("hoten", res.hoten)
      localStorage.setItem("role", res.role)
      localStorage.setItem("lastLoginTime", Date.now().toString())

      // Set avatar from login response if available
      if (res.avatar) {
        localStorage.setItem("avatar", res.avatar)
      }

      // Don't fetch additional user info here - causes 403 for non-admin roles
      // Avatar will be loaded by each dashboard if needed with proper permissions

      // Delay to ensure localStorage is committed before redirect
      // This prevents race condition where components load before auth data is ready
      await new Promise(resolve => setTimeout(resolve, 200))

      // Redirect to role-based dashboard
      if (res.role === "admin") {
        router.push("/admin")
      }
      else if (res.role === "manager") {
        router.push("/manager")
      }
      else if (res.role === "teamleader") {
        // Teamleader has dedicated interface
        router.push("/teamlead")
      }
      else if (res.role === "employee") {
        router.push("/member")
      } else {
        router.push("/")
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || "Đăng nhập thất bại"
      setMessage(errorMessage)
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition duration-500" />
      
      {/* Main card */}
      <div className="relative backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-slate-900 dark:text-white text-3xl font-bold text-center">Chào mừng trở lại</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center text-sm mt-2">Đăng nhập để tiếp tục sử dụng hệ thống</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee ID Input */}
          <div className="space-y-2">
            <Label htmlFor="manv" className="text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Mã nhân viên
            </Label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" />
              </div>
              <Input
                id="manv"
                type="text"
                placeholder="Nhập mã nhân viên (VD: NV001)"
                value={manv}
                onChange={(e) => setManv(e.target.value)}
                className="pl-12 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Mật khẩu
            </Label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 cursor-pointer group/check">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-slate-600 dark:text-slate-400 group-hover/check:text-slate-900 dark:group-hover/check:text-white transition-colors">Ghi nhớ đăng nhập</span>
            </label>
            <Link 
              href="/forgot-password" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-12 rounded-xl font-semibold text-base shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 group/btn"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Đăng nhập
                <LogIn className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>

        {/* Message Alert */}
        {message && (
          <div
            className={`mt-5 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              messageType === "error"
                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            }`}
          >
            {messageType === "error" ? (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            )}
            <p
              className={`text-sm font-medium ${
                messageType === "error"
                  ? "text-red-800 dark:text-red-300"
                  : "text-green-800 dark:text-green-300"
              }`}
            >
              {message}
            </p>
          </div>
        )}

        {/* Sign up link
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Chưa có tài khoản?{" "}
            <Link 
              href="/signup" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div> */}

        {/* Quick login hint */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
            💡 <span className="font-medium">Mẹo:</span> Nhân viên mới vui lòng liên hệ quản trị viên để được cấp tài khoản
          </p>
        </div>
      </div>
    </div>
  )
}
