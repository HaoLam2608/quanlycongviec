import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 🔧 QUAN TRỌNG: IP máy tính chạy backend
// Lấy IP: chạy "ipconfig" (Windows) -> tìm IPv4 Address
const COMPUTER_IP = '192.168.102.15'; // IP thực tế của máy bạn

// Tự động phát hiện môi trường
const getBaseURL = () => {
    const isExpoGo = Constants.appOwnership === 'expo';
    const isProduction = !__DEV__;

    if (isProduction) {
        return 'https://your-backend.herokuapp.com';
    }

    // Development mode
    if (Platform.OS === 'android') {
        // Kiểm tra xem có phải emulator không bằng cách thử Device.isDevice
        // Tạm thời dùng COMPUTER_IP cho cả emulator và device
        return `http://${COMPUTER_IP}:5000`;
    } else if (Platform.OS === 'ios') {
        return `http://${COMPUTER_IP}:5000`;
    }

    return 'http://localhost:5000';
};

// API Configuration
export const API_CONFIG = {
    BASE_URL: getBaseURL(),
    TIMEOUT: 30000, // Tăng timeout lên 30s cho upload file

    // Các URL backup để thử nếu kết nối thất bại
    FALLBACK_URLS: [
        `http://${COMPUTER_IP}:5000`,      // IP thực
        'http://10.0.2.2:5000',             // Android Emulator
        'http://192.168.1.15:5000',         // IP khác (nếu có)
        'http://localhost:5000',            // Localhost
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