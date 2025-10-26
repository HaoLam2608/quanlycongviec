import { useState, useEffect } from 'react';

interface AuthUser {
    id: string | null;
    manv: string | null;
    hoten: string | null;
    role: string | null;
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser>({ id: null, manv: null, hoten: null, role: null });

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const manv = localStorage.getItem('manv');
        const hoten = localStorage.getItem('hoten');
        const role = localStorage.getItem('role');
        setUser({ id: userId, manv, hoten, role });
    }, []);

    return user;
}