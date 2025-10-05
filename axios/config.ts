import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // URL backend của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config : any) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error : any) => {
  return Promise.reject(error);
}
);
export default api;
