import axiosInstance from './config'

const taskAPI = {
  deleteTask: async (taskId: number) => {
    const response = await axiosInstance.delete(`/tasks/${taskId}`)
    return response.data
  }
}

export default taskAPI
