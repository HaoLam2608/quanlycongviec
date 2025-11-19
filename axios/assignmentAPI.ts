import axiosInstance from './config'

const assignmentAPI = {
  requestToJoin: async (data: { taskId?: number; subtaskId?: number; message?: string }) => {
    const response = await axiosInstance.post('/assignments/request', data)
    return response.data
  }
}

export default assignmentAPI
