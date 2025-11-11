import api from "./config";

// Admin upload avatar for any user
export const adminUploadAvatar = async (userId: number, file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.post(`/users/${userId}/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
