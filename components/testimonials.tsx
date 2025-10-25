import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Nguyễn Văn A",
    role: "Giám đốc Dự án, Công ty ABC",
    image: "/professional-avatar.png",
    content:
      "HUIT Task Manager đã thay đổi hoàn toàn cách đội ngũ của chúng tôi làm việc. Năng suất tăng 40% kể từ khi chúng tôi chuyển sang. Các tính năng tự động hóa đã tiết kiệm cho chúng tôi hàng chục giờ mỗi tuần.",
    rating: 5,
  },
  {
    name: "Trần Thị B",
    role: "Quản lý Sản phẩm, Công ty XYZ",
    image: "/professional-avatar.png",
    content:
      "Đây là khoản đầu tư tốt nhất mà chúng tôi đã thực hiện năm nay. Các công cụ cộng tác rất trực quan, và báo cáo phân tích cung cấp cho chúng tôi những thông tin chúng tôi chưa bao giờ có được trước đây.",
    rating: 5,
  },
  {
    name: "Lê Văn C",
    role: "Giám đốc Vận hành, Công ty DEF",
    image: "/professional-avatar.png",
    content:
      "Chúng tôi đã thử nhiều nền tảng trước khi tìm thấy HUIT Task Manager. Sự khác biệt là rõ ràng. Đội ngũ của chúng tôi thực sự thích sử dụng nó, và kết quả nói lên tất cả.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Được yêu thích bởi các đội ngũ
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Đừng chỉ nghe lời chúng tôi nói. Đây là những gì khách hàng của chúng tôi nói.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border bg-card">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-card-foreground leading-relaxed mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-card-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
