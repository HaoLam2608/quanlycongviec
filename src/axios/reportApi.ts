import api from "./config";

export interface Report {
  id: number;
  duanId: number;
  groupId?: number;
  title: string;
  content: string;
  reportType: 'tien_do' | 'van_de' | 'hoan_thanh' | 'tong_ket' | 'khac';
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  reportDate: string;
  createdBy: number;
  attachments?: any[];
  statistics?: any;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
  duan?: {
    id: number;
    tenduan: string;
  };
  creator?: {
    id: number;
    manv: string;
    hoten: string;
    sdt?: string;
    chucvu?: string;
  };
  reviewer?: {
    id: number;
    manv: string;
    hoten: string;
    sdt?: string;
    chucvu?: string;
  };
  group?: {
    id: number;
    name: string;
  };
}

export interface CreateReportData {
  duanId: number;
  groupId?: number;
  title: string;
  content: string;
  reportType: 'tien_do' | 'van_de' | 'hoan_thanh' | 'tong_ket' | 'khac';
  reportDate?: string;
  statistics?: any;
  attachments?: any[];
}

export interface UpdateReportData {
  title?: string;
  content?: string;
  reportType?: 'tien_do' | 'van_de' | 'hoan_thanh' | 'tong_ket' | 'khac';
  reportDate?: string;
  statistics?: any;
  attachments?: any[];
}

export interface ReportFilters {
  status?: 'draft' | 'submitted' | 'reviewed' | 'approved';
  reportType?: 'tien_do' | 'van_de' | 'hoan_thanh' | 'tong_ket' | 'khac';
  groupId?: number;
  startDate?: string;
  endDate?: string;
}

// Tạo báo cáo mới
export const createReport = async (data: CreateReportData): Promise<Report> => {
  const response = await api.post('/reports', data);
  return response.data.report || response.data;
};

// Lấy danh sách báo cáo theo dự án
export const getReportsByDuAn = async (duanId: number, filters?: ReportFilters): Promise<Report[]> => {
  const response = await api.get(`/reports/duan/${duanId}`, { params: filters });
  // Backend trả về { reports: [], total: number }, extract array
  return response.data.reports || response.data;
};

// Lấy thống kê báo cáo theo dự án
export const getReportStatistics = async (duanId: number) => {
  const response = await api.get(`/reports/duan/${duanId}/statistics`);
  return response.data;
};

// Lấy chi tiết một báo cáo
export const getReportById = async (id: number): Promise<Report> => {
  const response = await api.get(`/reports/${id}`);
  return response.data.report || response.data;
};

// Cập nhật báo cáo
export const updateReport = async (id: number, data: UpdateReportData): Promise<Report> => {
  const response = await api.put(`/reports/${id}`, data);
  return response.data.report || response.data;
};

// Gửi báo cáo (draft -> submitted)
export const submitReport = async (id: number): Promise<Report> => {
  const response = await api.patch(`/reports/${id}/submit`);
  return response.data.report || response.data;
};

// Duyệt báo cáo (admin/manager)
export const reviewReport = async (id: number, reviewNote?: string, approved: boolean = true): Promise<Report> => {
  const response = await api.patch(`/reports/${id}/review`, { 
    reviewNote,
    status: approved ? 'approved' : 'reviewed'
  });
  return response.data.report || response.data;
};

// Xóa báo cáo
export const deleteReport = async (id: number): Promise<void> => {
  await api.delete(`/reports/${id}`);
};

// Lấy tất cả báo cáo (admin)
export const getAllReports = async (filters?: ReportFilters): Promise<Report[]> => {
  const response = await api.get('/reports', { params: filters });
  return response.data.reports || response.data;
};

// Upload file đính kèm
export const uploadAttachment = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/reports/attachments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.file;
};

// Tải file đính kèm
export const downloadAttachment = (filename: string) => {
  const apiUrl = api.defaults.baseURL || 'http://localhost:5000';
  return `${apiUrl}/reports/attachments/${filename}`;
};

// Xóa file đính kèm
export const deleteAttachment = async (filename: string) => {
  await api.delete(`/reports/attachments/${filename}`);
};

// Xuất báo cáo ra PDF
export const exportReportToPdf = async (id: number) => {
  const response = await api.get(`/reports/${id}/export/pdf`, {
    responseType: 'blob'
  });
  
  // Tạo URL để download
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `report-${id}-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
