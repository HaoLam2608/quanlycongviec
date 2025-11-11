import React, { useState, useEffect } from 'react'
import { approvalAPI } from '@/axios/approvalApi'

interface ApprovalCountBadgeProps {
  className?: string
}

const ApprovalCountBadge: React.FC<ApprovalCountBadgeProps> = ({ className = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const loadCount = async () => {
      try {
        // Check if user is authenticated and has appropriate role before fetching
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
        
        // Only show for admin and manager roles
        if (!token || !role || !['admin', 'manager'].includes(role)) {
          setCount(0)
          return
        }
        
        const data = await approvalAPI.getPendingApprovals('all')
        const totalCount = (data.data.tasks?.length || 0) + (data.data.subtasks?.length || 0)
        setCount(totalCount)
      } catch (error) {
        // Ignore error to avoid showing notification every time
        setCount(0)
      }
    }

    // Add delay to ensure token is set after login redirect
    const initialTimer = setTimeout(() => {
      loadCount()
    }, 1200) // Increased delay to ensure token is ready
    
    // Refresh every 30 seconds
    const interval = setInterval(loadCount, 30000)
    
    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [])

  if (count === 0) return null

  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-red-500 rounded-full ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default ApprovalCountBadge