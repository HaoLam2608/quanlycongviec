import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm">
            <span className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Giải pháp quản lý giao việc toàn diện cho đội ngũ</span>
          </div>

          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl mb-6 text-balance">
            Quản lý giao việc hiệu quả, nâng cao năng suất đội ngũ
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed mb-10">
            Nền tảng quản lý giao việc toàn diện giúp đội ngũ của bạn cộng tác liền mạch, theo dõi tiến độ dự án, và
            hoàn thành công việc đúng hạn. Được tin tưởng bởi hàng trăm công ty tại Việt Nam.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8" asChild>
              <Link href="/signup">
                Dùng thử miễn phí
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 bg-transparent">
              <Play className="mr-2 h-5 w-5" />
              Xem demo
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Không cần thẻ tín dụng • Dùng thử 14 ngày • Hủy bất cứ lúc nào
          </p>

          {/* Hero Image */}
          <div className="mt-16 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <img src="/task-management-dashboard.png" alt="HUIT Task Manager Dashboard" className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
    </section>
  )
}
