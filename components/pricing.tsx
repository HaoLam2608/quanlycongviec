import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Cơ bản",
    price: "Miễn phí",
    description: "Hoàn hảo cho các đội nhỏ bắt đầu",
    features: ["Tối đa 5 thành viên", "Giao việc cơ bản", "1GB lưu trữ", "Hỗ trợ email", "Ứng dụng di động"],
    cta: "Bắt đầu miễn phí",
    popular: false,
    href: "/signup",
  },
  {
    name: "Chuyên nghiệp",
    price: "99.000đ",
    description: "Cho các đội phát triển cần nhiều tính năng",
    features: [
      "Tối đa 50 thành viên",
      "Giao việc nâng cao",
      "100GB lưu trữ",
      "Hỗ trợ ưu tiên",
      "Báo cáo nâng cao",
      "Tích hợp tùy chỉnh",
    ],
    cta: "Dùng thử miễn phí",
    popular: true,
    href: "/signup",
  },
  {
    name: "Doanh nghiệp",
    price: "Tùy chỉnh",
    description: "Cho các tổ chức lớn có nhu cầu cụ thể",
    features: [
      "Thành viên không giới hạn",
      "Quy trình tùy chỉnh",
      "Lưu trữ không giới hạn",
      "Hỗ trợ 24/7 chuyên dụng",
      "Bảo mật nâng cao",
      "Hợp đồng tùy chỉnh",
      "Hỗ trợ onboarding",
    ],
    cta: "Liên hệ bán hàng",
    popular: false,
    href: "#",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Giá cả đơn giản, minh bạch
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Chọn gói phù hợp với đội ngũ của bạn. Tất cả các gói đều bao gồm dùng thử 14 ngày miễn phí.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`border-border bg-card relative ${plan.popular ? "ring-2 ring-primary shadow-xl scale-105" : ""
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                    Phổ biến nhất
                  </span>
                </div>
              )}
              <CardHeader className="p-8 pb-6">
                <h3 className="font-heading text-2xl font-bold text-card-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-4xl font-bold text-card-foreground">{plan.price}</span>
                  {plan.price !== "Tùy chỉnh" && plan.price !== "Miễn phí" && (
                    <span className="text-muted-foreground">/tháng</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-card-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-8 pb-8">
                <Button
                  className={`w-full ${plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    }`}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Tất cả các gói đều bao gồm dùng thử 14 ngày miễn phí. Không cần thẻ tín dụng.
        </p>
      </div>
    </section>
  )
}
