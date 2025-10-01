import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CEO, TechStart Inc.",
    image: "/professional-woman-headshot.png",
    content:
      "StreamLine has completely transformed how our team works. We've seen a 40% increase in productivity since switching. The automation features alone have saved us countless hours.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Product Manager, InnovateCo",
    image: "/professional-man-headshot.png",
    content:
      "The best investment we've made this year. The collaboration tools are intuitive, and the analytics give us insights we never had before. Highly recommend!",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Operations Director, GrowthLabs",
    image: "/avatar-1.png",
    content:
      "We tried several platforms before finding StreamLine. The difference is night and day. Our team actually enjoys using it, and the results speak for themselves.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Loved by teams worldwide
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Don't just take our word for it. Here's what our customers have to say.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border bg-card">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-card-foreground leading-relaxed mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-card-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
