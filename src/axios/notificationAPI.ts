import axiosInstance from './config'

export interface Notification {
    id: string
    title: string
    content: string
    type: 'system' | 'project' | 'task' | 'announcement'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'draft' | 'published'
    targetAudience: string
    authorId: number
    author: {
        id: number
        manv: string
        hoten: string
    }
    // user-specific metadata provided by server (optional)
    userMeta?: any
    isRead?: boolean
    publishedAt: string | null
    createdAt: string
    updatedAt: string
}

export interface NotificationStats {
    total: number
    published: number
    draft: number
    byType: Record<string, number>
    byPriority: Record<string, number>
}

export interface CreateNotificationRequest {
    title: string
    content: string
    type: 'system' | 'project' | 'task' | 'announcement'
    targetRole: string[]
}

export interface UpdateNotificationRequest extends Partial<CreateNotificationRequest> {}

// Admin APIs
export const notificationAdminAPI = {
    // Get all notifications for admin
    getAll: async (params?: {
        page?: number
        limit?: number
        type?: string
        status?: string
        search?: string
    }) => {
        const response = await axiosInstance.get('/notifications/admin/all', { params })
        return response.data
    },

    // Create new notification
    create: async (data: CreateNotificationRequest) => {
        const response = await axiosInstance.post('/notifications/admin/create', {
            ...data,
            targetRole: data.targetRole.join(',')
        })
        return response.data
    },

    // Update notification
    update: async (id: string, data: UpdateNotificationRequest) => {
        const response = await axiosInstance.put(`/notifications/admin/${id}`, {
            ...data,
            targetRole: data.targetRole ? data.targetRole.join(',') : undefined
        })
        return response.data
    },

    // Toggle publish status
    toggleStatus: async (id: string, action: 'publish' | 'unpublish') => {
        const response = await axiosInstance.post(`/notifications/admin/${id}/toggle-status`, {
            action
        })
        return response.data
    },

    // Delete notification
    delete: async (id: string) => {
        const response = await axiosInstance.delete(`/notifications/admin/${id}`)
        return response.data
    },

    // Get statistics
    getStats: async (): Promise<{ success: boolean; data: NotificationStats }> => {
        const response = await axiosInstance.get('/notifications/admin/stats')
        return response.data
    }
}

// User APIs
export const notificationUserAPI = {
    // Get notifications for current user
    getMyNotifications: async (params?: {
        page?: number
        limit?: number
    }) => {
        const response = await axiosInstance.get('/notifications/user', { params })
        return response.data
    },

    // Mark notification as read
    markAsRead: async (id: string) => {
        const response = await axiosInstance.post(`/notifications/${id}/mark-read`)
        return response.data
    }

    // Accept assignment (if this notification relates to an assignment)
    ,acceptAssignment: async (assignmentId: string) => {
        const response = await axiosInstance.post(`/assignments/${assignmentId}/accept`)
        return response.data
    }

    // Decline assignment (requires reason)
    ,declineAssignment: async (assignmentId: string, data: { reason: string }) => {
        const response = await axiosInstance.post(`/assignments/${assignmentId}/decline`, data)
        return response.data
    }

    // Get assignment details to check status
    ,getAssignment: async (assignmentId: string) => {
        const response = await axiosInstance.get(`/assignments/${assignmentId}`)
        return response.data
    }
}