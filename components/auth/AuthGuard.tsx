"use client"
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [refreshError, setRefreshError] = useState<string | null>(null)

    const isTokenValid = useCallback((t?: string | null) => {
        if (!t) return false
        try {
            const payload = JSON.parse(atob(t.split('.')[1]))
            const currentTime = Date.now() / 1000
            return !(payload.exp && payload.exp < currentTime)
        } catch (e) {
            return false
        }
    }, [])

    const checkAuth = useCallback(async () => {
        setChecking(true)
        setRefreshError(null)
        try {
            const token = localStorage.getItem('accessToken')
            const refreshToken = localStorage.getItem('refreshToken')

            if (isTokenValid(token)) {
                // token hợp lệ, cho render
                setChecking(false)
                return
            }

            // Nếu accessToken không có hoặc hết hạn, thử dùng refreshToken
            if (refreshToken) {
                try {
                    const res = await axios.post('https://taskhadflow-api.nibies.space/auth/refresh', { refreshToken })
                    const newAccessToken = res.data.accessToken
                    if (newAccessToken) {
                        localStorage.setItem('accessToken', newAccessToken)
                        setChecking(false)
                        return
                    }
                    // Nếu server không trả accessToken, coi như không thể refresh
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                    localStorage.removeItem('manv')
                    localStorage.removeItem('hoten')
                    localStorage.removeItem('role')
                    router.replace('/401')
                    return
                } catch (err: any) {
                    const status = err?.response?.status
                    // Nếu server trả 401/403 -> refresh token không hợp lệ -> logout
                    if (status === 401 || status === 403) {
                        localStorage.removeItem('accessToken')
                        localStorage.removeItem('refreshToken')
                        localStorage.removeItem('manv')
                        localStorage.removeItem('hoten')
                        localStorage.removeItem('role')
                        router.replace('/401')
                        return
                    }

                    // Các lỗi khác (mạng, timeout, 5xx): đừng xóa token ngay, cho phép retry
                    console.error('Refresh request failed (network/5xx) — will not clear tokens:', err)
                    setRefreshError('network')
                    setChecking(false)
                    return
                }
            }

            // Không có token hợp lệ và không có refreshToken
            router.replace('/401')
        } finally {
            setChecking(false)
        }
    }, [isTokenValid, router])

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Đang kiểm tra xác thực...</p>
                </div>
            </div>
        )
    }

    if (refreshError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full bg-white dark:bg-neutral p-6 rounded shadow text-center">
                    <h3 className="text-lg font-medium mb-2">Lỗi kết nối khi xác thực</h3>
                    <p className="text-sm text-muted-foreground mb-4">Không thể xác thực do lỗi mạng hoặc lỗi máy chủ tạm thời. Vui lòng thử lại.</p>
                    <div className="flex justify-center gap-2">
                        <button className="btn" onClick={() => checkAuth()}>Thử lại</button>
                        <button className="btn btn-ghost" onClick={() => router.replace('/')}>Về trang chủ</button>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}