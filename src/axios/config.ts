import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { API_CONFIG, STORAGE_KEYS } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log tất cả requests để debug
api.interceptors.request.use(
  async (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    try {
      if (config.data && typeof config.data === 'object') {
        console.log('📤 Request data keys:', Object.keys(config.data));
      } else {
        console.log('📤 Request data:', config.data);
      }
    } catch (e) {
      console.warn('Unable to preview request data for logging', e);
    }
    
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Log tất cả responses để debug
api.interceptors.response.use(
  (res) => {
    console.log(`✅ API Response: ${res.config.method?.toUpperCase()} ${res.config.url}`);
    try {
      if (res.data && typeof res.data === 'object') {
        console.log('📥 Response keys:', Object.keys(res.data));
        // Friendly, small preview for user objects
        if ((res.data as any).user) {
          const u = (res.data as any).user;
          console.log('👤 user preview:', {
            id: u.id,
            hoten: u.hoten,
            manv: u.manv,
            email: u.email,
            chucvu: u.chucvu,
            avatarUrl: u.avatarUrl || u.avatar
          });
        } else if (Object.keys(res.data).length <= 6) {
          console.log('📥 Response data (shallow):', res.data);
        }
      } else {
        console.log('📥 Response data:', res.data);
      }
    } catch (e) {
      console.warn('Unable to preview response data for logging', e);
    }
    console.log('📊 Response status:', res.status);
    return res;
  },
  async (err) => {
    console.error(`❌ API Error: ${err.config?.method?.toUpperCase()} ${err.config?.url}`);
    console.error('📥 Error response:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      code: err.code
    });

    const originalRequest = err.config;
    const status = err.response?.status;
    const message = err.response?.data?.message;

    // Nếu lỗi do token hết hạn / không hợp lệ => status 401 => thử refresh
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error('Missing refresh token');
        
        const response = await axios.post("http://localhost:5000/auth/refresh", { refreshToken });
        const newAccessToken = response.data.accessToken;
        
        // Lưu token mới
        await AsyncStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Xóa tất cả dữ liệu liên quan đến authentication
        try {
          const keysToRemove = [
            'accessToken',
            'refreshToken', 
            'manv',
            'hoten',
            'role',
            'avatar',
            'userId',
            'token'
          ];
          await AsyncStorage.multiRemove(keysToRemove);
        } catch (e) {
          console.error('Error removing auth data:', e);
        }
        
        // Lưu thông tin lỗi để debug
        try {
          const ev = {
            time: new Date().toISOString(),
            type: 'refreshFailed',
            message: refreshError?.toString?.() || String(refreshError)
          }
          await AsyncStorage.setItem('lastAuthEvent', JSON.stringify(ev));
        } catch (e) {
          // ignore
        }
        
        console.warn('Refresh failed — auth keys cleared, rejecting so AuthGuard can handle redirect', refreshError);
        return Promise.reject(refreshError);
      }
    }

    // 403: lỗi phân quyền thực sự (RBAC) - chuyển tới trang 403
    if (status === 403) {
      console.warn('Permission denied:', message);
      try {
        // Lưu thông tin lỗi permission denied
        await AsyncStorage.setItem('lastAuthEvent', JSON.stringify({ 
          time: new Date().toISOString(), 
          type: 'permissionDenied', 
          message 
        }));
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(err);
  }
);

export default api;
