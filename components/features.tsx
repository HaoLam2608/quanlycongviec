import { Card, CardContent } from "@/components/ui/card"
import { Zap, Users, BarChart3, Shield } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Automation",
    description:
      "Automate repetitive tasks and workflows with our intelligent automation engine. Save hours every week and focus on what matters most.",
  },
  {
    icon: Users,
    title: "Seamless Collaboration",
    description:
      "Work together in real-time with your team. Share files, communicate instantly, and keep everyone on the same page effortlessly.",
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    description:
      "Get deep insights into your team's performance with comprehensive analytics and reporting. Make data-driven decisions with confidence.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description:
      "Your data is protected with bank-level encryption, SOC 2 compliance, and advanced security features. Sleep soundly knowing your information is safe.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Powerful features designed to help your team work smarter, not harder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
