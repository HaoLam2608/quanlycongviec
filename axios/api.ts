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
// Lấy dự án của người đang đăng nhập (manager)
// Lấy dự án theo managerId (admin)
export const fetchProjectsByManager = async (managerId: string | number) => {
  try {
    const res = await api.get(`/duan/byManager/${managerId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể lấy dự án theo manager' };
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
    const res = await api.get("/users");

    const usersData = res.data.users || res.data;

    if (!Array.isArray(usersData)) {
      console.error('Thông tin users không hợp lệ:', res.data);
      return [];
    }

    return usersData;
  } catch (err: any) {
    console.error('Error fetching users:', err);
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

// Documents APIs
export const fetchDocuments = async (duanId?: number) => {
  try {
    const params = duanId ? `?duanId=${duanId}` : '';
    const res = await api.get(`/documents/list${params}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách tài liệu" };
  }
};

export const uploadDocument = async (file: File, duanId?: number, description?: string) => {
  try {
    const form = new FormData();
    form.append('file', file);
    if (duanId) form.append('duanId', String(duanId));
    if (description) form.append('description', description);

    const res = await api.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể upload tài liệu' };
  }
};

export const uploadAvatar = async (file: File) => {
  try {
    const form = new FormData();
    form.append('avatar', file);

    const res = await api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể upload avatar' };
  }
};

export const updateMyProfile = async (data: { hoten?: string; sdt?: string; chucvu?: string; password?: string }) => {
  try {
    const res = await api.put('/users/me', data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể cập nhật hồ sơ' };
  }
};

export const deleteDocument = async (id: number) => {
  try {
    const res = await api.delete(`/documents/delete/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể xoá tài liệu' };
  }
};

export const downloadDocument = async (id: number, asDownload = false) => {
  try {
    const res = await api.get(`/documents/download/${id}${asDownload ? '?download=1' : ''}`, { responseType: 'blob' });
    // return blob and filename from headers
    const disposition = res.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^";]+)"?/);
    const filename = match ? match[1] : `document-${id}`;
    return { blob: res.data, filename };
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể tải tài liệu' };
  }
};

// ============ TASK APIs ============

export const getTasksByProject = async (projectId: string | number) => {
  try {
    const res = await api.get(`/tasks/project/${projectId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách công việc" };
  }
};

export const getTaskById = async (id: string | number) => {
  try {
    const res = await api.get(`/tasks/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy thông tin công việc" };
  }
};

export const createTask = async (data: {
  tentask: string;
  mota?: string;
  duanId: number;
  nguoiDuocGiaoId: number;
  ngayBatDau?: string;
  ngayKetThuc: string;
  mucDoUuTien?: string;
  ghiChu?: string;
}) => {
  try {
    const res = await api.post("/tasks", data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể tạo công việc" };
  }
};

export const updateTask = async (id: number, data: any) => {
  try {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể cập nhật công việc" };
  }
};

export const deleteTask = async (id: number) => {
  try {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể xóa công việc" };
  }
};

export const getMyTasks = async (params?: { page?: number; limit?: number; status?: string }) => {
  try {
    const res = await api.get("/tasks/my-tasks", { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách công việc của tôi" };
  }
};

// ============ SUBTASK APIs ============

export const getSubtasksByTask = async (taskId: string | number) => {
  try {
    const res = await api.get(`/tasks/${taskId}/subtasks`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách công việc nhỏ" };
  }
};

export const createSubtask = async (taskId: string | number, data: {
  tenSubtask: string;
  mota?: string;
  nguoiThucHienId: number;
  ngayBatDau?: string;
  ngayKetThuc?: string;
  ghiChu?: string;
}) => {
  try {
    const res = await api.post(`/tasks/${taskId}/subtasks`, data); // Không gửi taskId trong body
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể tạo công việc nhỏ" };
  }
};

export const updateSubtask = async (taskId: string | number, subtaskId: number, data: any) => {
  try {
    const res = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể cập nhật công việc nhỏ" };
  }
};

export const deleteSubtask = async (taskId: string | number, subtaskId: number) => {
  try {
    const res = await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể xóa công việc nhỏ" };
  }
};

// ============ WORKLOG APIs ============

export const getWorklogs = async (params: { taskId?: number; subtaskId?: number }) => {
  try {
    const res = await api.get('/worklogs', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách worklog" };
  }
};

export const createWorklog = async (data: {
  userId: number;
  taskId?: number;
  subtaskId?: number;
  hours: number;
  note: string;
  date: string;
}) => {
  try {
    const res = await api.post('/worklogs', data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể tạo worklog" };
  }
};
