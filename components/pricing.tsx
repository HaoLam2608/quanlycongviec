import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for small teams getting started",
    features: ["Up to 10 team members", "Basic automation workflows", "5GB storage", "Email support", "Mobile apps"],
    cta: "Start Free Trial",
    popular: false,
    href: "/signup",
  },
  {
    name: "Professional",
    price: "$79",
    description: "For growing teams that need more power",
    features: [
      "Up to 50 team members",
      "Advanced automation",
      "100GB storage",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
    ],
    cta: "Start Free Trial",
    popular: true,
    href: "/signup",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with specific needs",
    features: [
      "Unlimited team members",
      "Custom workflows",
      "Unlimited storage",
      "24/7 dedicated support",
      "Advanced security",
      "Custom contracts",
      "Onboarding assistance",
    ],
    cta: "Contact Sales",
    popular: false,
    href: "#",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Choose the plan that's right for your team. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`border-border bg-card relative ${
                plan.popular ? "ring-2 ring-secondary shadow-xl scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-secondary px-4 py-1 text-sm font-semibold text-secondary-foreground">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="p-8 pb-6">
                <h3 className="font-heading text-2xl font-bold text-card-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-4xl font-bold text-card-foreground">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-chart-1 flex-shrink-0 mt-0.5" />
                      <span className="text-card-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-8 pb-8">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  }`}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  )
}
