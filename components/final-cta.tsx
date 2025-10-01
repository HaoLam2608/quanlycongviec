import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-5xl mb-6 text-balance">
            Ready to transform your workflow?
          </h2>
          <p className="text-lg text-primary-foreground/90 leading-relaxed mb-10">
            Join thousands of teams already using StreamLine to work smarter and achieve more. Start your free trial
            today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-8" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
            >
              Schedule a Demo
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/80">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-foreground/10 rounded-full blur-3xl" />
    </section>
  )
}
