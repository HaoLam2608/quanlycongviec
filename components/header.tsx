"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              {/* Desktop horizontal logo */}
              <div className="hidden sm:block rounded-md overflow-hidden bg-white/5 p-1">
                <Image src="/logo_ngang_huit.jpg" alt="HUIT" width={200} height={48} priority />
              </div>
              {/* Mobile square logo */}
              <div className="sm:hidden rounded-md overflow-hidden bg-white/5 p-1">
                <Image src="/logo_cty.jpg" alt="HUIT" width={56} height={56} priority />
              </div>
              <span className="font-heading text-xl font-bold text-foreground">HUIT Task Manager</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Tính năng
            </a>
            <a
              href="#roles"
              className="text-base font-medium text-foreground hover:text-primary transition-colors"
            >
              Vai trò
            </a>
            <a href="#stats" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Thống kê
            </a>
            <a href="#support" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Hỗ trợ
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/20 text-base" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <a
              href="#features"
              className="block text-base font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tính năng
            </a>
            <a
              href="#roles"
              className="block text-base font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Vai trò
            </a>
            <a
              href="#stats"
              className="block text-base font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Thống kê
            </a>
            <a
              href="#support"
              className="block text-base font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hỗ trợ
            </a>
            <div className="flex flex-col space-y-2 pt-4">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
