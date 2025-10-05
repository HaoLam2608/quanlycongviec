import api from "./config";

// User APIs
export const userAPI = {
  // Lấy danh sách users với phân trang và tìm kiếm
  getUsers: (params: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/users', { params }),
  
  // Lấy user theo ID
  getUserById: (id: number) => api.get(`/users/${id}`),
  
  // Tạo user mới
  createUser: (data: {
    manv: string;
    password: string;
    hoten: string;
    chucvu: string;
    sdt: string;
    roleId: number;
  }) => api.post('/users', data),
  
  // Cập nhật user
  updateUser: (id: number, data: {
    manv?: string;
    password?: string;
    hoten?: string;
    chucvu?: string;
    sdt?: string;
    roleId?: number;
  }) => api.put(`/users/${id}`, data),
  
  // Xóa user
  deleteUser: (id: number) => api.delete(`/users/${id}`),
  
  // Lấy thống kê dashboard
  getDashboardStats: () => api.get('/users/stats')
};

// Role APIs
export const roleAPI = {
  // Lấy tất cả roles
  getRoles: () => api.get('/roles'),
  
  // Tạo role mới
  createRole: (data: {
    name: string;
    description: string;
    permissions?: number[];
  }) => api.post('/roles', data),
  
  // Cập nhật role
  updateRole: (id: number, data: {
    name?: string;
    description?: string;
    permissions?: number[];
  }) => api.put(`/roles/${id}`, data),
  
  // Xóa role
  deleteRole: (id: number) => api.delete(`/roles/${id}`),
  
  // Lấy tất cả permissions
  getPermissions: () => api.get('/roles/permissions'),
  
  // Lấy permissions của role
  getRolePermissions: (roleId: number) => api.get(`/roles/${roleId}/permissions`),
  
  // Cập nhật permissions cho role
  updateRolePermissions: (roleId: number, permissions: number[]) => 
    api.put(`/roles/${roleId}/permissions`, { permissions })
};

// Wrapper functions để sử dụng trong components
export const getUsers = async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
  try {
    const res = await userAPI.getUsers(params || {});
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};

export const createUser = async (data: {
  manv: string;
  password: string;
  hoten: string;
  chucvu: string;
  sdt: string;
  roleId: number;
}) => {
  try {
    const res = await userAPI.createUser(data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};

export const updateUser = async (id: number, data: any) => {
  try {
    const res = await userAPI.updateUser(id, data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};

export const deleteUser = async (id: number) => {
  try {
    const res = await userAPI.deleteUser(id);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};

export const getRoles = async () => {
  try {
    const res = await roleAPI.getRoles();
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};

export const createRole = async (data: {
  name: string;
  description: string;
  permissions?: number[];
}) => {
  try {
    const res = await roleAPI.createRole(data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};

export const getDashboardStats = async () => {
  try {
    const res = await userAPI.getDashboardStats();
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};