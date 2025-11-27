import { LucideIcon } from "lucide-react"

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    iconColor: string
    iconBgColor: string
    textColor?: string
    subtitle?: string
    progress?: number
}

export default function StatsCard({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
    textColor = "text-slate-900",
    subtitle,
    progress
}: StatsCardProps) {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${iconBgColor} ${iconColor} transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <div>
                <h3 className={`text-3xl font-bold mb-1 ${textColor}`}>{value}</h3>
                <p className="text-sm text-slate-600 font-medium">{title}</p>
                {subtitle && (
                    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                )}
            </div>

            {progress !== undefined && (
                <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${iconColor.includes('green') ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                iconColor.includes('blue') ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                                    iconColor.includes('red') ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                        iconColor.includes('orange') ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                            iconColor.includes('purple') ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                                                'bg-gradient-to-r from-slate-400 to-slate-600'
                                }`}
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}