import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../config/api';
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
    console.log('🔄 Đang gọi API login với:', { manv: data.manv });
    const res = await authAPI.login(data.manv, data.password);
    console.log('✅ Response từ API login:', res.data);
    
    // Kiểm tra response có đủ thông tin cần thiết không
    if (!res.data.accessToken || !res.data.refreshToken) {
      console.error('❌ Response thiếu token:', res.data);
      throw { message: "Server không trả về đủ thông tin xác thực" };
    }
    
    return res.data;
  } catch (err: any) {
    console.error('❌ Lỗi API login:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      config: {
        url: err.config?.url,
        method: err.config?.method,
        baseURL: err.config?.baseURL
      }
    });
    
    // Trả về lỗi chi tiết hơn
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error || 
                        err.message || 
                        "Lỗi không xác định";
    
    throw { 
      message: errorMessage,
      status: err.response?.status,
      details: err.response?.data
    };
  }
};

// Auth APIs
export const authAPI = {
  login: (manv: string, password: string) =>
    api.post('/auth/login', { manv, password }),

  register: (userData: any) =>
    api.post('/auth/register', userData),

  logout: () =>
    api.post('/auth/logout'),
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

export const uploadAvatar = async (file: { uri: string; type: string; name: string; mimeType?: string }) => {
  try {
    const form = new FormData();
    
    // React Native FormData syntax  
    form.append('avatar', {
      uri: file.uri,
      type: file.mimeType || file.type || 'image/jpeg',
      name: file.name,
    } as any);

    console.log('🔄 FormData created for upload');

    // Lấy token để authenticate
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    const headers: any = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('🔄 Upload headers:', headers);
    console.log('🔄 Using fetch API for upload');

    // Sử dụng fetch thay vì axios cho upload - reliable hơn với FormData
    const response = await fetch(`${API_CONFIG.BASE_URL}/users/avatar`, {
      method: 'POST',
      headers,
      body: form,
    });

    console.log('🔄 Fetch response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Fetch error response:', errorData);
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Upload success:', data);
    return data;

  } catch (err: any) {
    console.error('❌ Upload error:', err);
    if (err.response) {
      console.error('❌ Upload error response data:', err.response.data);
      throw err.response.data;
    }
    throw err;
  }
};

export const getMyProfile = async () => {
  try {
    const res = await api.get('/users/me');
    return res.data.user;
  } catch (err: any) {
    throw err.response?.data || { message: 'Không thể lấy thông tin hồ sơ' };
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
    // Backend returns { tasks: [...], pagination: {...} }
    return res.data.tasks || res.data;
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

// Lấy tasks theo Kanban view
export const getKanbanTasks = async (projectId: string | number) => {
  try {
    console.log('📡 API Call: getKanbanTasks for project:', projectId);
    const url = `/tasks/project/${projectId}/kanban`;
    console.log('📡 Request URL:', url);
    const res = await api.get(url);
    console.log('📡 Response status:', res.status);
    try {
      if (res.data && typeof res.data === 'object') {
        console.log('📡 Response keys:', Object.keys(res.data));
        // if kanban wrapped, show column keys and counts
        if ((res.data as any).kanban) {
          const k = (res.data as any).kanban;
          console.log('📡 Kanban columns:', Object.keys(k).map(col => ({ col, count: Array.isArray(k[col]) ? k[col].length : undefined })));
        } else if (Object.keys(res.data).length <= 6) {
          console.log('📡 Response data (shallow):', res.data);
        }
      } else {
        console.log('📡 Response data:', res.data);
      }
    } catch (e) {
      console.warn('Unable to preview kanban response data for logging', e);
    }
    return res.data;
  } catch (err: any) {
    console.error('📡 API Error:', err);
    console.error('📡 Error response:', err.response);
    throw err.response?.data || { message: "Không thể lấy dữ liệu Kanban" };
  }
};

// Cập nhật trạng thái task (dùng cho drag & drop)
export const updateTaskStatus = async (taskId: number, trangThai: string) => {
  try {
    const res = await api.patch(`/tasks/${taskId}/status`, { trangThai });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể cập nhật trạng thái công việc" };
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

export const getMySubtasks = async () => {
  try {
    const res = await api.get('/tasks/subtasks/my-subtasks');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách subtasks của tôi" };
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

export const getMyWorklogs = async (params?: { date?: string }) => {
  try {
    const res = await api.get('/worklogs/my-worklogs', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách worklog của tôi" };
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

export const updateWorklog = async (id: number, data: {
  userId: number;
  taskId?: number | null;
  subtaskId?: number | null;
  hours: number;
  note?: string;
  date: string;
}) => {
  try {
    const res = await api.put(`/worklogs/${id}`, data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể cập nhật worklog" };
  }
};

export const deleteWorklog = async (id: number) => {
  try {
    const res = await api.delete(`/worklogs/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể xóa worklog" };
  }
};

// Member Dashboard APIs
export const getMemberStats = async () => {
  try {
    const res = await api.get('/members/dashboard/stats');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy thống kê" };
  }
};

export const getTodayTasks = async () => {
  try {
    const res = await api.get('/members/tasks/today');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy công việc hôm nay" };
  }
};

export const getUpcomingTasks = async (days: number = 7) => {
  try {
    const res = await api.get(`/members/tasks/upcoming?days=${days}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy công việc sắp tới" };
  }
};

export const getOverdueTasks = async () => {
  try {
    const res = await api.get('/members/tasks/overdue');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy công việc quá hạn" };
  }
};

export const getRecentActivities = async (limit: number = 10) => {
  try {
    const res = await api.get(`/members/activities/recent?limit=${limit}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy hoạt động gần đây" };
  }
};

export const getMemberTasks = async (filters?: {
  status?: string;
  priority?: string;
  projectId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const res = await api.get(`/members/tasks?${params.toString()}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách công việc" };
  }
};

export const updateMemberTaskStatus = async (taskId: number, status: string) => {
  try {
    // Backend expects body field `trangThai`
    const res = await api.patch(`/tasks/${taskId}/status`, { trangThai: status });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể cập nhật trạng thái" };
  }
};

export const updateMemberSubtaskStatus = async (taskId: number, subtaskId: number, status: string) => {
  try {
    // There is no /status route for subtask; backend expects PUT /tasks/:taskId/subtasks/:id with { trangThai }
    const res = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, { trangThai: status });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể cập nhật trạng thái subtask" };
  }
};

export const getMemberProjects = async () => {
  try {
    const res = await api.get('/members/projects');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách dự án" };
  }
};

// Public stats for homepage (no auth required)
export const getPublicStats = async () => {
  try {
    // Gọi các API để lấy stats tổng hợp
    const [projectsRes, usersRes] = await Promise.allSettled([
      api.get('/duan/getAll'),
      api.get('/users')
    ]);

    const projects = projectsRes.status === 'fulfilled' ? projectsRes.value.data : [];
    const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : {};
    const users = Array.isArray(usersData) ? usersData : (usersData.users || []);

    // Đếm số tasks từ tất cả projects (nếu có thông tin tasks)
    let totalTasks = 0;
    if (Array.isArray(projects)) {
      // Nếu mỗi project có trường tasks array, đếm
      projects.forEach((p: any) => {
        if (p.tasks && Array.isArray(p.tasks)) {
          totalTasks += p.tasks.length;
        }
      });
    }

    return {
      totalProjects: Array.isArray(projects) ? projects.length : 0,
      totalUsers: Array.isArray(users) ? users.length : 0,
      totalTasks: totalTasks,
      activeProjects: Array.isArray(projects) 
        ? projects.filter((p: any) => p.status === 'dang_thuc_hien' || p.status === 'active').length 
        : 0,
    };
  } catch (err: any) {
    console.error('Error fetching public stats:', err);
    // Return fallback data
    return {
      totalProjects: 0,
      totalUsers: 0,
      totalTasks: 0,
      activeProjects: 0,
    };
  }
};

// ==================== NOTIFICATION APIs ====================

export const getMyNotifications = async (params?: { limit?: number }) => {
  try {
    const res = await api.get('/notifications/user', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy danh sách thông báo" };
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const res = await api.post(`/notifications/${notificationId}/mark-read`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể đánh dấu đã đọc" };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const res = await api.patch('/notifications/mark-all-read');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể đánh dấu tất cả đã đọc" };
  }
};

export const getAssignmentDetails = async (assignmentId: string) => {
  try {
    const res = await api.get(`/assignments/${assignmentId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể lấy thông tin giao việc" };
  }
};

export const acceptAssignment = async (assignmentId: string) => {
  try {
    const res = await api.post(`/assignments/${assignmentId}/accept`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể chấp nhận giao việc" };
  }
};

export const declineAssignment = async (assignmentId: string, data: { reason: string }) => {
  try {
    const res = await api.post(`/assignments/${assignmentId}/decline`, data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Không thể từ chối giao việc" };
  }
};
