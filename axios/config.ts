import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // URL backend của bạn
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});


// Nếu access token hết hạn -> tự gọi refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;
    const message = err.response?.data?.message;

    // Nếu lỗi do token hết hạn / không hợp lệ => status 401 => thử refresh
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem("refreshToken") : null;
        if (!refreshToken) throw new Error('Missing refresh token');
        const response = await axios.post("http://localhost:5000/auth/refresh", { refreshToken });
        const newAccessToken = response.data.accessToken;
        // store new access token under the canonical key used by the app
        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Only remove authentication-related keys (avoid wiping other app data)
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('manv');
          localStorage.removeItem('hoten');
          localStorage.removeItem('role');
          localStorage.removeItem('avatar');
          localStorage.removeItem('userId');
          // keep 'token' removal for backward compatibility if present
          localStorage.removeItem('token');
        } catch (e) {
          // ignore storage errors
        }
        // lightweight diagnostic: record why we cleared auth keys so you can
        // inspect it in the browser after reproduction
        try {
          const ev = {
            time: new Date().toISOString(),
            type: 'refreshFailed',
            message: refreshError?.toString?.() || String(refreshError)
          }
          localStorage.setItem('lastAuthEvent', JSON.stringify(ev))
        } catch (e) {
          /* ignore */
        }
        // Do NOT force a full-page redirect here. Reject the error and let
        // client-side auth handling (AuthGuard) decide where to navigate.
        console.warn('Refresh failed — auth keys cleared, rejecting so AuthGuard can handle redirect', refreshError)
        return Promise.reject(refreshError);
      }
    }

    // 403: lỗi phân quyền thực sự (RBAC) - chuyển tới trang 403
    if (status === 403) {
      const url = err?.config?.url || ''
      const currentRole = localStorage.getItem('role')
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      
      // Log detailed 403 info for debugging
      console.error('🚨 403 FORBIDDEN - API Call Failed:', {
        api: url,
        method: err?.config?.method?.toUpperCase(),
        currentRole,
        currentPath,
        message,
        timestamp: new Date().toISOString()
      });
      
      // Check if this is from notifications endpoint - don't redirect
      if (url.includes('/notifications/')) {
        console.warn('⚠️ Notifications permission denied - will not redirect to 403')
        return Promise.reject(err);
      }
      
      // Don't redirect to 403 if on public pages (landing, login, signup)
      const publicPaths = ['/', '/login', '/signup', '/forgot-password']
      if (publicPaths.includes(currentPath)) {
        console.warn('⚠️ 403 on public page - will not redirect, just rejecting request')
        return Promise.reject(err);
      }
      
      // Don't redirect if we're in the middle of login process (within 2 seconds of login)
      const lastLogin = localStorage.getItem('lastLoginTime')
      if (lastLogin) {
        const timeSinceLogin = Date.now() - parseInt(lastLogin)
        if (timeSinceLogin < 2000) {
          console.warn('⚠️ 403 during login process - will not redirect, waiting for auth to settle')
          return Promise.reject(err);
        }
      }
      
      console.warn('🚫 403 Error - Redirecting to /403 page')
      
      try {
        // diagnostic: record permission-denied event
        try {
          localStorage.setItem('lastAuthEvent', JSON.stringify({ 
            time: new Date().toISOString(), 
            type: 'permissionDenied', 
            message,
            url,
            currentRole,
            currentPath
          }))
        } catch (e) { /* ignore */ }
        
        // Redirect to 403 page
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/403'
          }
        }, 100)
      } catch (e) {
        /* ignore */
      }
    }
    return Promise.reject(err);
  }
);
export default api;
