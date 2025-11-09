import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Video, MessageCircle, Mail, Phone, FileText, HelpCircle, Download } from "lucide-react"
import Link from "next/link"

const supportResources = [
  {
    icon: BookOpen,
    title: "Tài liệu hướng dẫn",
    description: "Hướng dẫn chi tiết cách sử dụng từng tính năng",
    action: "Xem tài liệu",
    href: "#",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Video,
    title: "Video tutorials",
    description: "Video hướng dẫn trực quan từng bước",
    action: "Xem video",
    href: "#",
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: FileText,
    title: "FAQs",
    description: "Câu hỏi thường gặp và giải đáp",
    action: "Xem FAQs",
    href: "#",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: Download,
    title: "Tài nguyên",
    description: "Template, checklist và tài liệu tham khảo",
    action: "Tải xuống",
    href: "#",
    color: "from-orange-500 to-red-600",
  },
]

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    value: "support@company.com",
    description: "Phản hồi trong 24 giờ",
  },
  {
    icon: Phone,
    title: "Hotline",
    value: "1900-xxxx",
    description: "Hỗ trợ trong giờ hành chính",
  },
  {
    icon: MessageCircle,
    title: "Chat nội bộ",
    value: "IT Support Channel",
    description: "Trả lời ngay lập tức",
  },
]

export function SupportDocumentation() {
  return (
    <section id="support" className="py-20 sm:py-32 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 mb-6 shadow-lg">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Hỗ trợ & Tài liệu
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Mọi thứ bạn cần để bắt đầu và sử dụng hệ thống hiệu quả.
          </p>
        </div>

        {/* Support Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {supportResources.map((resource, index) => {
            const Icon = resource.icon
            return (
              <Card
                key={index}
                className="border-border bg-card hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${resource.color} mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-card-foreground mb-2">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={resource.href}>{resource.action}</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Contact Methods */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-foreground mb-8">Liên hệ IT Support</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {contactMethods.map((method, index) => {
              const Icon = method.icon
              return (
                <Card key={index} className="border-border bg-card text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-card-foreground mb-1">{method.title}</h4>
                    <p className="text-sm font-medium text-primary mb-1">{method.value}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Mẹo sử dụng</h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Nhân viên mới: Xem video "Getting Started" để làm quen nhanh với hệ thống</li>
                  <li>• Manager: Tham khảo tài liệu "Project Management Best Practices"</li>
                  <li>• Admin: Kiểm tra changelog định kỳ để cập nhật tính năng mới</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
