"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { registerUser } from "@/axios/api"  // import hàm gọi backend

export function SignupForm() {
  const [form, setForm] = useState({
    manv: "",
    password: "",
    hoten: "",
    chucvu: "",
    sdt: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const res = await registerUser(form)
      setMessage(res.message || "Đăng ký thành công!")
    } catch (err: any) {
      setMessage(err.message || "Đăng ký thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-white text-3xl font-bold">Đăng ký tài khoản</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="manv" className="text-white text-sm">
            Mã nhân viên
          </Label>
          <Input
            id="manv"
            name="manv"
            type="text"
            placeholder="NV001"
            value={form.manv}
            onChange={handleChange}
            required
            className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white text-sm">
            Mật khẩu
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={form.password}
            onChange={handleChange}
            required
            className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hoten" className="text-white text-sm">
            Họ và tên
          </Label>
          <Input
            id="hoten"
            name="hoten"
            type="text"
            placeholder="Nguyễn Văn A"
            value={form.hoten}
            onChange={handleChange}
            className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chucvu" className="text-white text-sm">
            Chức vụ
          </Label>
          <Input
            id="chucvu"
            name="chucvu"
            type="text"
            placeholder="Nhân viên / Admin"
            value={form.chucvu}
            onChange={handleChange}
            className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sdt" className="text-white text-sm">
            Số điện thoại
          </Label>
          <Input
            id="sdt"
            name="sdt"
            type="text"
            placeholder="0901234567"
            value={form.sdt}
            onChange={handleChange}
            className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-[#e91e63] to-[#bd0c47] text-white hover:from-[#d81b60] hover:to-[#a80b3f] h-12 rounded-lg font-medium text-base shadow-lg"
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </Button>
      </form>

      {message && <p className="mt-4 text-center text-white">{message}</p>}

      <p className="mt-6 text-center text-sm text-white/80">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-white font-medium hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
