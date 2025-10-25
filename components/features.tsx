import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Users, BarChart3, Clock } from "lucide-react"

const features = [
  {
    icon: CheckCircle2,
    title: "Giao việc thông minh",
    description:
      "Giao việc cho đội ngũ một cách dễ dàng, theo dõi tiến độ thực tế, và đảm bảo mọi công việc được hoàn thành đúng hạn.",
  },
  {
    icon: Users,
    title: "Cộng tác nhóm",
    description:
      "Làm việc cùng nhau trong thời gian thực. Chia sẻ tệp, bình luận, và giữ mọi người trên cùng một trang.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo chi tiết",
    description:
      "Nhận thông tin chi tiết về hiệu suất đội ngũ với báo cáo toàn diện. Đưa ra quyết định dựa trên dữ liệu.",
  },
  {
    icon: Clock,
    title: "Quản lý thời gian",
    description: "Theo dõi thời gian dự án, quản lý deadline, và tối ưu hóa quy trình làm việc của đội ngũ.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Tính năng mạnh mẽ cho đội ngũ
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Tất cả những gì bạn cần để quản lý giao việc hiệu quả và nâng cao năng suất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-border bg-card hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-card-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
