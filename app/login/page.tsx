import { LoginForm } from "@/components/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Pink/Magenta blob - top right */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-[#e91e63] to-[#bd0c47] rounded-full opacity-30 blur-3xl animate-pulse" />

        {/* Cyan blob - bottom left */}
        <div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-[#00bcd4] to-[#059be5] rounded-full opacity-25 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        {/* Lime green blob - left middle */}
        <div
          className="absolute top-1/4 -left-20 w-80 h-80 bg-gradient-to-br from-[#cddc39] to-[#8bc34a] rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Blue blob - top left */}
        <div
          className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-[#2196f3] to-[#1976d2] rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />

        {/* Cyan accent - bottom right */}
        <div
          className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-tl from-[#00bcd4] to-[#00acc1] rounded-full opacity-25 blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#cddc39] to-[#8bc34a]" />
            <span className="font-heading text-2xl font-bold text-white">StreamLine</span>
          </Link>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
