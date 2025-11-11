import { User } from './auth';

export interface Project {
  id: number;
  tenduan: string;
  mota?: string;
  ngaybatdau: string;
  ngayketthuc: string;
  status: 'dang_thuc_hien' | 'hoan_thanh' | 'tam_dung' | 'huy_bo';
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: number;
  tentask: string;
  mota?: string;
  duanId: number;
  nguoiDuocGiaoId: number;
  ngayBatDau?: string;
  ngayKetThuc: string;
  mucDoUuTien: 'thap' | 'trung_binh' | 'cao' | 'khan_cap';
  trangThai: 'cho_xu_ly' | 'dang_thuc_hien' | 'hoan_thanh' | 'tam_dung' | 'huy_bo';
  ghiChu?: string;
  createdAt?: string;
  updatedAt?: string;
  DuAn?: Project;
  NguoiDuocGiao?: User;
}

export interface SubTask {
  id: number;
  tenSubtask: string;
  mota?: string;
  taskId: number;
  nguoiThucHienId: number;
  ngayBatDau?: string;
  ngayKetThuc?: string;
  trangThai: 'cho_xu_ly' | 'dang_thuc_hien' | 'hoan_thanh' | 'tam_dung' | 'huy_bo';
  ghiChu?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkLog {
  id: number;
  userId: number;
  taskId?: number;
  subtaskId?: number;
  hours: number;
  note: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}