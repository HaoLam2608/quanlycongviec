import api from "./config";

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  // Gửi lên endpoint /users/avatar (backend sẽ lấy user từ token)
  const res = await api.post(`/users/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
