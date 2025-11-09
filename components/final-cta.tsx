import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-5xl mb-6 text-balance">
            Bắt đầu sử dụng hệ thống ngay hôm nay
          </h2>
          <p className="text-lg text-blue-100 leading-relaxed mb-10">
            Đăng nhập để truy cập hệ thống quản lý dự án và công việc nội bộ. 
            Nếu bạn là nhân viên mới, vui lòng liên hệ phòng IT để được cấp tài khoản.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 text-base px-8 shadow-xl" asChild>
              <Link href="/login">
                Đăng nhập hệ thống
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 border-white/30 text-white hover:bg-white/10 bg-transparent backdrop-blur-sm"
              asChild
            >
              <Link href="#support">Liên hệ IT Support</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-blue-200 flex items-center justify-center gap-4 flex-wrap">
            <span>🔒 Bảo mật cao</span>
            <span>•</span>
            <span>⚡ Hiệu suất tối ưu</span>
            <span>•</span>
            <span>🛠️ Hỗ trợ 24/7</span>
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
    </section>
  )
}
