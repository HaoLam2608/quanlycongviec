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
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // 403 lúc này là lỗi phân quyền thực sự (RBAC)
    if (status === 403) {
      console.warn('Permission denied:', message);
    }
    return Promise.reject(err);
  }
);
export default api;
