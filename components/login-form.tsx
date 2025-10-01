"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"   // 👈 import router
import { loginUser } from "@/axios/api"

export function LoginForm() {
  const [manv, setManv] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()   // 👈 khởi tạo router

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const res = await loginUser({ manv, password })
      setMessage(res.message || "Đăng nhập thành công!")

      // Lưu token + thông tin user
      localStorage.setItem("token", res.token)
      localStorage.setItem("manv", res.manv)
      localStorage.setItem("hoten", res.hoten)

      // 👉 Redirect sang trang LandingPage
      router.push("/")
    } catch (err: any) {
      setMessage(err.message || "Đăng nhập thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-white text-3xl font-bold">Đăng nhập</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="manv" className="text-white text-sm">
            Mã nhân viên
          </Label>
          <Input
            id="manv"
            type="text"
            placeholder="NV001"
            value={manv}
            onChange={(e) => setManv(e.target.value)}
            className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white text-sm">
            Mật khẩu
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-[#e91e63] to-[#bd0c47] text-white hover:from-[#d81b60] hover:to-[#a80b3f] h-12 rounded-lg font-medium text-base shadow-lg"
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </Button>
      </form>

      {message && <p className="mt-4 text-center text-white">{message}</p>}

      <p className="mt-6 text-center text-sm text-white/80">
        Chưa có tài khoản?{" "}
        <Link href="/signup" className="text-white font-medium hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  )
}
