import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm">
            <span className="mr-2 h-2 w-2 rounded-full bg-chart-1 animate-pulse" />
            <span className="text-muted-foreground">Now available for teams of all sizes</span>
          </div>

          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl mb-6 text-balance">
            Streamline Your Workflow, Amplify Your Results
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed mb-10">
            The all-in-one platform that helps teams collaborate seamlessly, automate repetitive tasks, and achieve more
            in less time. Join thousands of companies already transforming their productivity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 bg-transparent">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>

          {/* Hero Image */}
          <div className="mt-16 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <img src="/modern-analytics-dashboard.png" alt="StreamLine Dashboard" className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
    </section>
  )
}
