import { Card, CardContent } from "@/components/ui/card"
import { Kanban, Clock, FileText, Shield, Users, BarChart3, FolderKanban, Layers } from "lucide-react"

const features = [
  {
    icon: Kanban,
    title: "Kanban Board",
    description:
      "Quản lý công việc trực quan với bảng Kanban. Kéo thả task giữa các trạng thái, theo dõi tiến độ realtime và cập nhật nhanh chóng.",
  },
  {
    icon: Clock,
    title: "Worklog Tracking",
    description:
      "Ghi nhận thời gian làm việc chi tiết cho từng task/subtask. Phân tích hiệu suất và tối ưu hóa phân bổ nhân sự.",
  },
  {
    icon: FolderKanban,
    title: "Quản lý Dự án",
    description:
      "Tạo và quản lý dự án với đầy đủ thông tin: mô tả, thời gian, tiến độ, team members. Theo dõi toàn bộ vòng đời dự án.",
  },
  {
    icon: Layers,
    title: "Tasks & Subtasks",
    description: "Phân chia công việc thành tasks và subtasks chi tiết. Gán người thực hiện, deadline, và theo dõi trạng thái từng phần.",
  },
  {
    icon: Shield,
    title: "Phân quyền chi tiết",
    description:
      "Hệ thống phân quyền 3 cấp: Admin, Manager, Employee. Kiểm soát chặt chẽ quyền truy cập và thao tác của từng role.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo & Thống kê",
    description:
      "Dashboard chi tiết với charts, graphs và metrics. Xuất báo cáo Excel/PDF theo dự án, team hoặc cá nhân.",
  },
  {
    icon: FileText,
    title: "Quản lý Tài liệu",
    description:
      "Upload và quản lý tài liệu dự án tập trung. Lưu trữ file đính kèm, phiên bản và lịch sử thay đổi.",
  },
  {
    icon: Users,
    title: "Quản lý Nhóm",
    description: "Tạo và quản lý nhóm làm việc. Phân chia dự án theo nhóm, theo dõi hiệu suất và cộng tác hiệu quả.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Tính năng toàn diện
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Hệ thống được thiết kế để đáp ứng mọi nhu cầu quản lý dự án và công việc nội bộ của công ty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
