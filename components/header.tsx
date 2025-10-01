"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <span className="font-heading text-xl font-bold text-foreground">StreamLine</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Testimonials
            </a>
            <a href="#pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              About
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link href="/signup">Get Started</Link>
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
              className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#"
              className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>
            <div className="flex flex-col space-y-2 pt-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
