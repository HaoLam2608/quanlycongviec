import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../constants/api';
import NotificationService from '../services/notificationService';
import { API_CONFIG } from '../src/config/api';
import { AuthState, User } from '../types/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [token, userId, hoten, manv, role, avatar] = await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_NAME,
        STORAGE_KEYS.USER_CODE,
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.USER_AVATAR
      ]);

      if (token[1] && userId[1]) {
        const user: User = {
          id: parseInt(userId[1]),
          manv: manv[1] || '',
          hoten: hoten[1] || '',
          chucvu: '',
          sdt: '',
          role: (role[1] as 'admin' | 'manager' | 'employee') || 'employee',
          avatar: avatar[1] || undefined
        };

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to check authentication status'
      });
    }
  };

  const login = async (userData: User, tokens: { accessToken: string; refreshToken?: string }) => {
    try {
      console.log('🔐 [useAuth] Bắt đầu quá trình login...');
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken || ''],
        [STORAGE_KEYS.USER_ID, userData.id.toString()],
        [STORAGE_KEYS.USER_NAME, userData.hoten],
        [STORAGE_KEYS.USER_CODE, userData.manv],
        [STORAGE_KEYS.USER_ROLE, userData.role],
        [STORAGE_KEYS.USER_AVATAR, userData.avatar || '']
      ]);

      console.log('✅ [useAuth] Đã lưu thông tin auth vào AsyncStorage');

      setAuthState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      console.log('✅ [useAuth] Đã cập nhật authState');

      // Đăng ký push notification sau khi login
      console.log('🔔 [useAuth] Bắt đầu đăng ký push notification...');
      try {
        console.log('🔔 [useAuth] Gọi NotificationService.registerForPushNotificationsAsync()...');
        const pushToken = await NotificationService.registerForPushNotificationsAsync();
        console.log('🔔 [useAuth] Push token nhận được:', pushToken);
        
        if (pushToken) {
          console.log('🔔 [useAuth] Gửi token lên backend:', API_CONFIG.BASE_URL);
          await NotificationService.sendTokenToBackend(
            pushToken,
            API_CONFIG.BASE_URL,
            tokens.accessToken
          );
          console.log('✅ [useAuth] Hoàn tất đăng ký push notification');
        } else {
          console.log('⚠️ [useAuth] Push token là null, bỏ qua gửi lên backend');
        }
      } catch (notifError) {
        console.error('❌ [useAuth] Lỗi đăng ký push notification:', notifError);
        console.error('❌ [useAuth] Error stack:', notifError instanceof Error ? notifError.stack : 'No stack trace');
        // Không throw error để không ảnh hưởng đến luồng login
      }
      
      console.log('✅ [useAuth] Hoàn tất login');
    } catch (error) {
      console.error('❌ [useAuth] Error saving auth data:', error);
      throw new Error('Failed to save authentication data');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_NAME,
        STORAGE_KEYS.USER_CODE,
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.USER_AVATAR
      ]);

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...userData };
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
    }
  };

  return {
    ...authState,
    login,
    logout,
    updateUser,
    checkAuthStatus
  };
}