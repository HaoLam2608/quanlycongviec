"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ForbiddenPage() {
  const router = useRouter()
  const [homeUrl, setHomeUrl] = useState("/")

  useEffect(() => {
    // Xác định trang home dựa trên role
    const role = localStorage.getItem("role")
    if (role === "admin") {
      setHomeUrl("/admin")
    } else if (role === "manager") {
      setHomeUrl("/manager")
    } else if (role === "employee" || role === "member") {
      setHomeUrl("/member")
    } else {
      setHomeUrl("/login")
    }
  }, [])

  const handleGoHome = () => {
    router.push(homeUrl)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-md rounded-md p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-yellow-600">403</h1>
        <h2 className="text-xl font-semibold mb-2">Bị từ chối</h2>
        <p className="text-sm text-gray-600 mb-6">Bạn không có quyền truy cập tài nguyên này.</p>
        <div className="space-x-3">
          <button 
            onClick={handleGoHome}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  )
}
