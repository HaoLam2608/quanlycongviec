"use client";

import { useState, useEffect } from "react";
import UserFormEnhanced from "@/components/admin/UserFormEnhanced";
import { getUsers } from "@/axios/adminApi";


export default function AdminProfile() {
  const [openModal, setOpenModal] = useState(true);
  const [editUser, setEditUser] = useState<any>(null);

  useEffect(() => {
    // Lấy mã nhân viên từ localStorage
    const manv = localStorage.getItem("manv") || "";
    if (manv) {
      getUsers({ search: manv }).then(res => {
        const users = res.users || res.rows || res.data || [];
        const user = Array.isArray(users) ? users[0] : users;
        if (user) setEditUser(user);
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <UserFormEnhanced
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => setOpenModal(false)}
        editUser={editUser}
      />
    </div>
  );
}
