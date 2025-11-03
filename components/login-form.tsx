"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginUser } from "@/axios/api"

export function LoginForm() {
  const [manv, setManv] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const res = await loginUser({ manv, password })
      setMessage(res.message || "Đăng nhập thành công!")

      localStorage.setItem("accesstoken", res.accessToken || res.token)
      localStorage.setItem("refreshToken", res.refreshToken || "")
      localStorage.setItem("manv", res.manv)
      localStorage.setItem("userId", res.userId)
      localStorage.setItem("hoten", res.hoten)
      localStorage.setItem("role", res.role)

      if (res.role === "admin") {
        router.push("/admin")
      }
      else if (res.role === "manager") {
        router.push("/manager")
      }
      else if (res.role === "employee") {
        router.push("/member")
      } else {
        router.push("/")
      }
    } catch (err: any) {
      setMessage(err.message || "Đăng nhập thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
      <div className="mb-8">
        <h2 className="text-white text-4xl font-bold text-center">Đăng nhập</h2>
        <p className="text-white/70 text-center text-sm mt-2">Hệ thống quản lý HUIT</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="manv" className="text-white text-sm font-medium">
            Mã nhân viên
          </Label>
          <Input
            id="manv"
            type="text"
            placeholder="NV001"
            value={manv}
            onChange={(e) => setManv(e.target.value)}
            className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white text-sm font-medium">
            Mật khẩu
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-[#003D82] to-[#005BA8] text-white hover:from-[#002D5F] hover:to-[#004A85] h-12 rounded-lg font-medium text-base shadow-lg transition-all duration-200"
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </Button>
      </form>

      {message && (
        <p
          className={`mt-4 text-center text-sm font-medium ${message.includes("thất bại") ? "text-red-300" : "text-green-300"}`}
        >
          {message}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-white/80">
        Chưa có tài khoản?{" "}
        <Link href="/signup" className="text-white font-medium hover:text-blue-200 transition-colors">
          Đăng ký
        </Link>
      </p>
    </div>
  )
}
