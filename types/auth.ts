export interface User {
  id: number;
  manv: string;
  hoten: string;
  chucvu: string;
  sdt: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  manv: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken?: string;
  user: User;
  manv: string;
  userId: number;
  hoten: string;
  role: string;
  token?: string; // fallback
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterRequest {
  manv: string;
  password: string;
  hoten: string;
  chucvu: string;
  sdt: string;
}