"use client"
import Link from "next/link"

export default function GlobalError({ error, reset }: { error: Error; reset?: () => void }) {
  console.error(error)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-md rounded-md p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">500</h1>
        <h2 className="text-xl font-semibold mb-2">Lỗi máy chủ</h2>
        <p className="text-sm text-gray-600 mb-6">Có lỗi xảy ra trên server. Vui lòng thử lại sau.</p>
        <div className="space-x-3">
          <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded-md">Thử lại</button>
          <Link href="/" className="inline-block px-4 py-2 border rounded-md">Về trang chủ</Link>
        </div>
      </div>
    </div>
  )
}
