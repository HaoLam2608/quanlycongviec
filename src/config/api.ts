import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 🔧 QUAN TRỌNG: Thay đổi IP này thành IP của máy tính đang chạy backend
// Để lấy IP: chạy "ipconfig" (Windows) hoặc "ifconfig" (Mac/Linux)
// Tìm dòng "IPv4 Address" hoặc "inet" (thường là 192.168.x.x)
const COMPUTER_IP = '192.168.1.109'; // <-- THAY ĐỔI IP NÀY nếu khác!

// Tự động phát hiện môi trường và chọn URL phù hợp
const getBaseURL = () => {
    // Kiểm tra nếu đang chạy trên Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    // Kiểm tra nếu là production build
    const isProduction = !__DEV__;
    
    if (isProduction) {
        // 🌐 Production: Sử dụng backend online
        return 'https://your-backend.herokuapp.com'; // Thay URL production của bạn
    }
    
    // Development mode
    if (Platform.OS === 'android') {
        if (isExpoGo) {
            // Expo Go trên Android: dùng IP máy tính
            return `http://${COMPUTER_IP}:5000`;
        } else {
            // Native build trên Android: dùng IP máy tính
            return `http://${COMPUTER_IP}:5000`;
        }
    } else if (Platform.OS === 'ios') {
        // iOS Simulator hoặc device: đều dùng IP máy tính
        return `http://${COMPUTER_IP}:5000`;
    }
    
    // Fallback: localhost (for web)
    return 'http://localhost:5000';
};

// API Configuration
export const API_CONFIG = {
    BASE_URL: getBaseURL(),
    TIMEOUT: 10000,
    
    // 🔍 Các URL backup để test (giữ lại để tham khảo)
    ALTERNATIVE_URLS: [
        'http://localhost:5000',        // Cho web
        'http://10.0.2.2:5000',         // Cho Android Emulator
        `http://${COMPUTER_IP}:5000`,   // Cho thiết bị thật
    ]
};

console.log('🌐 API Config:', {
    Platform: Platform.OS,
    isExpoGo: Constants.appOwnership === 'expo',
    isDevelopment: __DEV__,
    BASE_URL: API_CONFIG.BASE_URL,
});

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