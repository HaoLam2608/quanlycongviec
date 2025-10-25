"use client"

import { Card } from "@/components/ui/card"

interface ProfileStatsProps {
    stats: {
        label: string
        value: string | number
    }[]
}

export function ProfileStats({ stats }: ProfileStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {stats.map((stat, index) => (
                <Card key={index} className="p-4 bg-gradient-to-br from-[#003D82]/5 to-[#005BA8]/5 border border-[#003D82]/10">
                    <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#003D82] mt-2">{stat.value}</p>
                </Card>
            ))}
        </div>
    )
}
