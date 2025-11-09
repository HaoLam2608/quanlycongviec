import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Shield, Users, User, Check } from "lucide-react"

const roles = [
  {
    name: "Admin",
    icon: Shield,
    description: "Quản trị viên hệ thống",
    color: "from-red-500 to-pink-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    features: [
      "Quản lý toàn bộ người dùng",
      "Phân quyền và vai trò",
      "Quản lý tất cả dự án",
      "Cấu hình hệ thống",
      "Xem báo cáo tổng quan",
      "Quản lý nhóm làm việc",
      "Backup và restore dữ liệu",
    ],
  },
  {
    name: "Manager",
    icon: Users,
    description: "Quản lý dự án",
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    popular: true,
    features: [
      "Quản lý dự án được giao",
      "Tạo và phân công tasks",
      "Theo dõi tiến độ team",
      "Quản lý worklog nhân viên",
      "Xuất báo cáo dự án",
      "Quản lý tài liệu dự án",
      "Dashboard thống kê",
    ],
  },
  {
    name: "Employee",
    icon: User,
    description: "Nhân viên",
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    features: [
      "Xem tasks được giao",
      "Cập nhật trạng thái công việc",
      "Ghi nhận worklog",
      "Tạo subtasks",
      "Xem dự án tham gia",
      "Upload tài liệu",
      "Xem lịch sử làm việc",
    ],
  },
]

export function UserRoles() {
  return (
    <section id="roles" className="py-20 sm:py-32 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Vai trò & Quyền hạn
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Hệ thống phân quyền rõ ràng giúp quản lý và bảo mật dữ liệu hiệu quả.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {roles.map((role, index) => {
            const Icon = role.icon
            return (
              <Card
                key={index}
                className={`border-border bg-card relative hover:shadow-xl transition-all duration-300 ${
                  role.popular ? "ring-2 ring-blue-500 scale-105" : ""
                }`}
              >
                {role.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-1 text-sm font-semibold text-white shadow-lg">
                      Phổ biến nhất
                    </span>
                  </div>
                )}
                <CardHeader className="p-8 pb-6">
                  <div
                    className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${role.color} shadow-lg`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-card-foreground mb-2">{role.name}</h3>
                  <p className="text-muted-foreground text-sm">{role.description}</p>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <ul className="space-y-3">
                    {role.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-card-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">Lưu ý:</span> Nhân viên mới vui lòng liên hệ phòng IT để được cấp tài khoản và phân quyền phù hợp.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
