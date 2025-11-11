import api from './config'

// API for approval workflow
export const approvalAPI = {
    // Get pending approvals (for manager/admin)
    getPendingApprovals: async (type = 'all') => {
        try {
            const res = await api.get(`/approvals/pending?type=${type}`)
            return res.data
        } catch (err: any) {
            throw err.response?.data || { message: "Không thể lấy danh sách chờ phê duyệt" }
        }
    },

    // Approve task completion
    approveTask: async (taskId: number, approved: boolean, reason?: string) => {
        try {
            const res = await api.post(`/approvals/tasks/${taskId}/approve`, {
                approved,
                reason
            })
            return res.data
        } catch (err: any) {
            throw err.response?.data || { message: "Không thể phê duyệt công việc" }
        }
    },

    // Approve subtask completion  
    approveSubtask: async (subtaskId: number, approved: boolean, reason?: string) => {
        try {
            const res = await api.post(`/approvals/subtasks/${subtaskId}/approve`, {
                approved,
                reason
            })
            return res.data
        } catch (err: any) {
            throw err.response?.data || { message: "Không thể phê duyệt công việc nhỏ" }
        }
    }
}

// Update member task/subtask status API
export const memberAPI = {
    // Update task status (for members)
    updateTaskStatus: async (taskId: number, status: string) => {
        try {
            const res = await api.patch(`/members/tasks/${taskId}/status`, {
                trangThai: status
            })
            return res.data
        } catch (err: any) {
            throw err.response?.data || { message: "Không thể cập nhật trạng thái công việc" }
        }
    },

    // Update subtask status (for members)
    updateSubtaskStatus: async (taskId: number, subtaskId: number, status: string) => {
        try {
            const res = await api.patch(`/members/tasks/${taskId}/subtasks/${subtaskId}/status`, {
                trangThai: status
            })
            return res.data
        } catch (err: any) {
            throw err.response?.data || { message: "Không thể cập nhật trạng thái công việc nhỏ" }
        }
    }
}

export default {
    ...approvalAPI,
    member: memberAPI
}