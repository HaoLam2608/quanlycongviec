// API Configuration
export const API_CONFIG = {
    // � Cho Android Emulator - sử dụng 10.0.2.2 thay vì localhost
    BASE_URL: 'http://10.0.2.2:5000',
    
    // 🔧 Nếu test trên iOS Simulator hoặc Expo Go, dùng localhost
    // BASE_URL: 'http://localhost:5000',
    
    // 📱 Nếu test trên điện thoại thật, sử dụng IP của máy tính
    // BASE_URL: 'http://192.168.1.100:5000',  // Thay IP này!
    
    // 🌐 Hoặc nếu backend deploy online
    // BASE_URL: 'https://your-backend.herokuapp.com',
    
    TIMEOUT: 10000,
    
    // 🔍 Các URL backup để test
    ALTERNATIVE_URLS: [
        'http://localhost:5000',    // Cho iOS Simulator
        'http://10.0.2.2:5000',     // Cho Android Emulator
        'http://127.0.0.1:5000',
        'http://localhost:3000',
        'http://10.0.2.2:3000',
    ]
};

// Endpoints
export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout'
    },
    HEALTH: '/health'
};

// Storage Keys - giống với file constants/api.ts
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_ID: 'userId',
    MANV: 'manv',
    HOTEN: 'hoten',
    ROLE: 'role',
    AVATAR: 'avatar',
    LAST_AUTH_EVENT: 'lastAuthEvent'
} as const;