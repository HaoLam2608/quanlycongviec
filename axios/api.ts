import api from "./config";

export const registerUser = async (data: {
  manv: string;
  password: string;
  hoten: string;
  chucvu: string;
  sdt: string;
}) => {
  try {
    const res = await api.post("/auth/register", data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};
export const loginUser = async (data: { manv: string; password: string }) => {
  try {
    const res = await api.post("/auth/login", data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Lỗi không xác định" };
  }
};
