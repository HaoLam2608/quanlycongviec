import Image from "next/image"
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-14 w-auto rounded-md overflow-hidden bg-white/5 p-1 shadow-sm flex items-center justify-center">
                <Image src="/logo_ngang_huit.jpg" alt="HUIT" width={192} height={48} priority />
              </div>
              <span className="font-heading text-xl font-bold text-foreground">HUIT Task Manager</span>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              Nền tảng quản lý giao việc toàn diện giúp đội ngũ của bạn làm việc thông minh hơn và đạt được nhiều hơn.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-lg">Sản phẩm</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Tính năng
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Giá cả
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Tích hợp
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Nhật ký thay đổi
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-lg">Công ty</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Tuyển dụng
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-lg">Pháp lý</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Chính sách cookie
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-muted-foreground hover:text-primary transition-colors">
                  Bảo mật
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-base text-muted-foreground">© 2025 HUIT Task Manager. Tất cả quyền được bảo lưu.</p>

          {/* Social Media Icons */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
              <Facebook className="h-6 w-6" />
            </a>
            {/* <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-6 w-6" />
            </a> */}
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
              <Instagram className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
