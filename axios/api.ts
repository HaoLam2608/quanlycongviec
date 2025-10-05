import api from "./config";

export const registerUser = async (data: {
  manv: string;
  password: string;
  hoten: string;
  chucvu: string;
  sdt: string;
}) => {
  try {
    const res = await authAPI.register(data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};
export const loginUser = async (data: { manv: string; password: string }) => {
  try {
    const res = await authAPI.login(data.manv, data.password);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};

// Auth APIs
export const authAPI = {
  login: (manv: string, password: string) =>
    api.post('/auth/login', { manv, password }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
};

// RBAC APIs
export const usersAPI = {
  getUsers: () => api.get('/users'),
  createUser: (userData: any) => api.post('/users', userData),
  updateUser: (id: number, userData: any) => api.put(`/users/${id}`, userData),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
  
  getRoles: () => api.get('/users/roles'),
  createRole: (roleData: any) => api.post('/users/roles', roleData),
  updateRole: (id: number, roleData: any) => api.put(`/users/roles/${id}`, roleData),
  deleteRole: (id: number) => api.delete(`/users/roles/${id}`),
  
  getPermissions: () => api.get('/users/permissions'),
  getMyPermissions: () => api.get('/users/my-permissions'),
};