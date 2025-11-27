import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { UserRoles } from "@/components/user-roles"
import { SystemStats } from "@/components/system-stats"
import { SupportDocumentation } from "@/components/support-documentation"
import { FinalCTA } from "@/components/final-cta"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <UserRoles />
        <SystemStats />
        <SupportDocumentation />
        <FinalCTA />
      </main>
      <div className="create-plan-wrapper" style={{ marginTop: '1rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/pages" style={{ background: '#4f46e5', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>Pages Editor</Link>
      </div>
      <Footer />
    </div>
  )
}
