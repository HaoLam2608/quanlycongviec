import axiosInstance from './config'

const assignmentAPI = {
  requestToJoin: async (data: { taskId?: number; subtaskId?: number; message?: string }) => {
    const response = await axiosInstance.post('/assignments/request', data)
    return response.data
  },

  // Get join requests based on user role (admin/manager/teamlead)
  getMyJoinRequests: async () => {
    const response = await axiosInstance.get('/assignments/requests/join')
    return response.data
  }
}

export default assignmentAPI
