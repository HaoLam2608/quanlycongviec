import api from './config'

type PendingType = 'all' | 'tasks' | 'subtasks'

// API for approval workflow
const getPendingApprovals = async (options?: { type?: PendingType }) => {
    const queryType = options?.type ?? 'all'
    try {
        const res = await api.get('/approvals/pending', {
            params: { type: queryType }
        })
        return res.data
    } catch (err: any) {
        // Detect HTML 404 responses (often indicates wrong baseURL or backend not running)
        const respData = err.response?.data;
        if (typeof respData === 'string' && respData.trim().startsWith('<!DOCTYPE')) {
            throw { message: 'Server trả về HTML (404/nhầm route). Kiểm tra backend hoặc BASE_URL.' };
        }
        // If server provided a JSON message, forward it
        throw err.response?.data || { message: 'Không thể lấy danh sách chờ phê duyệt' }
    }
}

const getAllApprovals = async () => {
    try {
        const res = await api.get('/approvals')
        return res.data
    } catch (err: any) {
        if (err.response?.status === 404) {
            return getPendingApprovals({ type: 'all' })
        }
        throw err.response?.data || { message: 'Không thể lấy danh sách phê duyệt' }
    }
}

// Get approved history (tasks and subtasks already approved)
const getApprovedHistory = async (limit: number = 100) => {
    try {
        const res = await api.get('/approvals/history', { params: { limit } });
        return res.data;
    } catch (err: any) {
        if (err.response?.status === 404) {
            return getAllApprovals();
        }
        throw err.response?.data || { message: 'Không thể lấy lịch sử phê duyệt' };
    }
}

const approveTask = async (taskId: number, approved: boolean, reason?: string) => {
    try {
        const res = await api.post(`/approvals/tasks/${taskId}/approve`, {
            approved,
            reason
        })
        return res.data
    } catch (err: any) {
        throw err.response?.data || { message: 'Không thể phê duyệt công việc' }
    }
}

const approveSubtask = async (subtaskId: number, approved: boolean, reason?: string) => {
    try {
        const res = await api.post(`/approvals/subtasks/${subtaskId}/approve`, {
            approved,
            reason
        })
        return res.data
    } catch (err: any) {
        throw err.response?.data || { message: 'Không thể phê duyệt công việc nhỏ' }
    }
}

export const approvalAPI = {
    getPendingApprovals,
    getAllApprovals,
    getApprovedHistory,
    approveTask,
    approveSubtask
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