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
export const fetchProjects = async () => {
  try {
    const res = await api.get("/duan/getAll"); // backend GET /duan
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách dự án" };
  }
};
export const getProjectById = async (id: string) => {
  try {
    const res = await api.get(`/duan/getById/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể load dự án" };
  }
};
export const createProject = async (data: {
  tenduan: string;
  mota?: string;
  ngaybatdau: string;
  ngayketthuc: string;
  status?: string;
  userId: string;
}) => {
  try {
    const res = await api.post("/duan/create", data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể tạo dự án" };
  }
};
export const fetchUsers = async () => {
  try {
    const res = await api.get("/users"); // backend GET /users
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách user" };
  }
};

export const updateProject = async (id: number, data: any) => {
  try {
    const res = await api.put(`/duan/update/${id}`, data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể sửa dự án" };
  }
};

export const deleteProject = async (id: number) => {
  try {
    const res = await api.delete(`/duan/delete/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể xoá dự án" };
  }
};
