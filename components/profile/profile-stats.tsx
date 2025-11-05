"use client"

import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface ProfileStatsProps {
    stats: {
        label: string
        value: string | number
        icon?: LucideIcon
    }[]
}

export function ProfileStats({ stats }: ProfileStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Card key={index} className="p-5 bg-gradient-to-br from-[#003D82]/5 to-[#005BA8]/5 border border-[#003D82]/10 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                            {Icon && (
                                <div className="p-2 bg-[#003D82]/10 rounded-lg">
                                    <Icon className="w-4 h-4 text-[#003D82]" />
                                </div>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-[#003D82]">{stat.value}</p>
                    </Card>
                )
            })}
        </div>
    )
}
