"use client"
import { useRouter } from "next/navigation"

export default function UnauthorizedPage() {
  const router = useRouter()

  const handleLogin = () => {
    // Xóa token cũ và chuyển đến login
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-md rounded-md p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">401</h1>
        <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập / Chưa đăng nhập</h2>
        <p className="text-sm text-gray-600 mb-6">Bạn cần đăng nhập để truy cập trang này hoặc phiên của bạn đã hết hạn.</p>
        <div className="space-x-3">
          <button 
            onClick={handleLogin}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </button>
          <button 
            onClick={() => router.push("/")}
            className="inline-block px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  )
}
