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
    textColor = "text-gray-900",
    subtitle,
    progress
}: StatsCardProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0 ml-4`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
            </div>

            {progress !== undefined && (
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${iconColor.includes('green') ? 'bg-green-600' :
                                    iconColor.includes('blue') ? 'bg-blue-600' :
                                        iconColor.includes('red') ? 'bg-red-600' :
                                            'bg-gray-600'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}