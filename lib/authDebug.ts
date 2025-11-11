// Debug utility for authentication issues
export const debugAuth = () => {
    if (typeof window === 'undefined') return null
    
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const role = localStorage.getItem('role')
    const userId = localStorage.getItem('userId')
    const manv = localStorage.getItem('manv')
    const hoten = localStorage.getItem('hoten')
    
    // Parse JWT to check expiry
    let tokenInfo = null
    if (accessToken) {
        try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]))
            const currentTime = Date.now() / 1000
            tokenInfo = {
                userId: payload.userId,
                role: payload.role,
                manv: payload.manv,
                exp: payload.exp,
                isExpired: payload.exp < currentTime,
                expiresIn: Math.round(payload.exp - currentTime),
            }
        } catch (e) {
            tokenInfo = { error: 'Invalid token format' }
        }
    }
    
    const authState = {
        localStorage: {
            accessToken: accessToken ? `${accessToken.slice(0, 20)}...` : null,
            refreshToken: refreshToken ? `${refreshToken.slice(0, 20)}...` : null,
            role,
            userId,
            manv,
            hoten
        },
        tokenInfo,
        currentPath: window.location.pathname,
        userAgent: navigator.userAgent
    }
    
    console.log('🔍 Auth Debug State:', authState)
    return authState
}

// Clear all auth data thoroughly
export const clearAllAuthData = () => {
    const keysToRemove = [
        'accessToken',
        'refreshToken',
        'token', // legacy
        'accesstoken', // variant
        'userId',
        'manv',
        'hoten',
        'role',
        'avatar',
        'lastAuthEvent'
    ]
    
    keysToRemove.forEach(key => {
        try {
            localStorage.removeItem(key)
        } catch (e) {
            console.warn('Failed to remove key:', key, e)
        }
    })
    
    try {
        sessionStorage.clear()
    } catch (e) {
        console.warn('Failed to clear sessionStorage:', e)
    }
    
    console.log('🧹 Cleared all auth data')
}

// Check if current user has permission for route
export const hasRoutePermission = (pathname: string): boolean => {
    const role = localStorage.getItem('role')
    
    if (!role) return false
    
    const adminRoutes = ['/admin']
    const managerRoutes = ['/manager']
    const memberRoutes = ['/member']
    
    if (adminRoutes.some(route => pathname.startsWith(route))) {
        return role === 'admin'
    }
    
    if (managerRoutes.some(route => pathname.startsWith(route))) {
        return ['admin', 'manager'].includes(role)
    }
    
    if (memberRoutes.some(route => pathname.startsWith(route))) {
        return ['admin', 'manager', 'employee'].includes(role)
    }
    
    return true // Public routes
}