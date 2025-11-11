import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../constants/api';
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
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken || ''],
        [STORAGE_KEYS.USER_ID, userData.id.toString()],
        [STORAGE_KEYS.USER_NAME, userData.hoten],
        [STORAGE_KEYS.USER_CODE, userData.manv],
        [STORAGE_KEYS.USER_ROLE, userData.role],
        [STORAGE_KEYS.USER_AVATAR, userData.avatar || '']
      ]);

      setAuthState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error saving auth data:', error);
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