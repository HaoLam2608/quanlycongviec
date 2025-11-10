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
  // Tạo permission mới
  createPermission: (data: { resource: string; action: string; description?: string; name?: string }) => api.post('/roles/permissions', data),

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

export const updateRole = async (id: number, data: {
  name?: string;
  description?: string;
  permissions?: number[];
}) => {
  try {
    const res = await roleAPI.updateRole(id, data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};

export const deleteRole = async (id: number) => {
  try {
    const res = await roleAPI.deleteRole(id);
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Lỗi không xác định" };
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

// Group APIs
export const groupAPI = {
  // Đóng nhóm
  closeGroup: (id: number) => api.patch(`/groups/${id}/close`),
  getGroups: (params?: { duanId?: number }) => api.get('/groups', { params }),
  getGroup: (id: number) => api.get(`/groups/${id}`),
  createGroup: (data: { name: string; description?: string; duanId?: number; leaderId?: number; memberIds?: number[] }) => api.post('/groups', data),
  updateGroup: (id: number, data: { name?: string; description?: string; leaderId?: number; duanId?: number; memberIds?: number[]; projectIds?: number[] }) => api.put(`/groups/${id}`, data),
  // Xóa deleteGroup - không cho phép xóa nhóm
  addMembers: (id: number, memberIds: number[]) => api.post(`/groups/${id}/members`, { memberIds }),
  removeMember: (id: number, userId: number) => api.delete(`/groups/${id}/members/${userId}`),
  // Thêm nhóm vào dự án (qua group_projects)
  addGroupToProject: (groupId: number, projectId: number) => api.post('/groups/add-to-project', { groupId, projectId }),
  // Xóa nhóm khỏi dự án (qua group_projects)
  removeGroupFromProject: (groupId: number, projectId: number) => api.post('/groups/remove-from-project', { groupId, projectId })
};

// Đóng nhóm
export const closeGroup = async (id: number) => {
  try {
    const res = await groupAPI.closeGroup(id);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Lỗi không xác định' };
  }
};

// Wrapper for groups
export const getGroups = async (params?: { duanId?: number }) => {
  try {
    const res = await groupAPI.getGroups(params);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Lỗi không xác định' };
  }
};

export const createGroup = async (data: { name: string; description?: string; duanId?: number; leaderId?: number; memberIds?: number[]; projectIds?: number[] }) => {
  try {
    const res = await groupAPI.createGroup(data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Lỗi không xác định' };
  }
};

export const updateGroup = async (id: number, data: { name?: string; description?: string; leaderId?: number; duanId?: number; memberIds?: number[]; projectIds?: number[] }) => {
  try {
    const res = await groupAPI.updateGroup(id, data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Lỗi không xác định' };
  }
};

// Xóa deleteGroup function - không cho phép xóa nhóm

export const addGroupMembers = async (id: number, memberIds: number[]) => {
  try {
    const res = await groupAPI.addMembers(id, memberIds);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Lỗi không xác định' };
  }
};

export const removeGroupMember = async (id: number, userId: number) => {
  try {
    const res = await groupAPI.removeMember(id, userId);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Lỗi không xác định' };
  }
};

export const createPermission = async (data: { resource: string; action: string; description?: string; name?: string }) => {
  try {
    const res = await roleAPI.createPermission(data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Lỗi không xác định' };
  }
};

// Settings APIs
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data: any) => api.put('/settings', data),
  testNotification: (payload: { type?: string; to?: string }) => api.post('/settings/notify-test', payload),
};

export const getSystemSettings = async () => {
  try {
    const res = await settingsAPI.getSettings();
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể lấy cài đặt hệ thống' };
  }
};

export const updateSystemSettings = async (data: any) => {
  try {
    const res = await settingsAPI.updateSettings(data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể cập nhật cài đặt hệ thống' };
  }
};

export const testSystemNotification = async (payload: { type?: string; to?: string }) => {
  try {
    const res = await settingsAPI.testNotification(payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể gửi thử thông báo' };
  }
};