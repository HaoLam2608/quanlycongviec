import React from 'react'
import { Clock, CheckCircle2, AlertTriangle, Play, Pause } from 'lucide-react'

interface TaskStatusBadgeProps {
  status: string
  className?: string
}

const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Chờ bắt đầu':
        return {
          icon: Clock,
          text: 'Chờ bắt đầu',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600'
        }
      case 'Đang chạy':
        return {
          icon: Play,
          text: 'Đang thực hiện',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        }
      case 'Tạm dừng':
        return {
          icon: Pause,
          text: 'Tạm dừng',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        }
      case 'Chờ xác nhận hoàn thành':
        return {
          icon: Clock,
          text: 'Chờ phê duyệt',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600'
        }
      case 'Hoàn thành':
        return {
          icon: CheckCircle2,
          text: 'Hoàn thành',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        }
      case 'Quá hạn':
        return {
          icon: AlertTriangle,
          text: 'Quá hạn',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        }
      default:
        return {
          icon: Clock,
          text: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}>
      <Icon className={`w-3 h-3 mr-1 ${config.iconColor}`} />
      {config.text}
    </span>
  )
}

export default TaskStatusBadge