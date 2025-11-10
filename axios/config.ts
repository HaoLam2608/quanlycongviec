import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // URL backend của bạn
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
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
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error('Missing refresh token');
        const response = await axios.post("http://localhost:5000/auth/refresh", { refreshToken });
        const newAccessToken = response.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Only remove authentication-related keys (avoid wiping other app data)
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('accesstoken'); // Remove old key for safety
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('manv');
          localStorage.removeItem('hoten');
          localStorage.removeItem('role');
          localStorage.removeItem('avatar');
          localStorage.removeItem('userId');
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
      console.warn('Permission denied:', message);
      try {
        // diagnostic: record permission-denied event
        try {
          localStorage.setItem('lastAuthEvent', JSON.stringify({ time: new Date().toISOString(), type: 'permissionDenied', message }))
        } catch (e) { /* ignore */ }
        // redirect to 403 page (still a hard redirect for now)
        if (typeof window !== 'undefined') window.location.href = '/403';
      } catch (e) {
        /* ignore */
      }
    }
    return Promise.reject(err);
  }
);
export default api;
