import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Testimonials } from "@/components/testimonials"
import { Pricing } from "@/components/pricing"
import { FinalCTA } from "@/components/final-cta"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
