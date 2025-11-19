import axiosInstance from './config'

const availableAPI = {
  // Fetch tasks/subtasks that the current member can request from their teamlead
  getAvailableForRequest: async () => {
    const response = await axiosInstance.get('/assignments/available')
    return response.data
  }
}

export default availableAPI
