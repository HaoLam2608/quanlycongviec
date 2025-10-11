"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()

    useEffect(() => {
        // Kiểm tra token trong localStorage
        const token = localStorage.getItem('accesstoken')
        
        if (!token) {
            // Không có token, chuyển về trang đăng nhập
            router.replace('/')
            return
        }

        // Có thể thêm logic kiểm tra token hết hạn ở đây
        try {
            // Parse token để kiểm tra exp time (nếu cần)
            const tokenPayload = JSON.parse(atob(token.split('.')[1]))
            const currentTime = Date.now() / 1000

            if (tokenPayload.exp && tokenPayload.exp < currentTime) {
                // Token hết hạn
                localStorage.removeItem('accesstoken')
                localStorage.removeItem('manv')
                localStorage.removeItem('hoten')
                localStorage.removeItem('role')
                router.replace('/')
                return
            }
        } catch (error) {
            // Token không hợp lệ
            localStorage.removeItem('accesstoken')
            localStorage.removeItem('manv')
            localStorage.removeItem('hoten')
            localStorage.removeItem('role')
            router.replace('/')
            return
        }
    }, [router])

    // Kiểm tra token trước khi render
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accesstoken')
        if (!token) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Đang kiểm tra xác thực...</p>
                    </div>
                </div>
            )
        }
    }

    return <>{children}</>
}