import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { STORAGE_KEYS } from '../constants/api';
import { deactivatePushNotificationDevice } from '../src/axios/api';

export function useLogout() {
  const logout = async () => {
    try {
      // First, deactivate push notification device on backend
      try {
        await deactivatePushNotificationDevice();
        console.log('✅ Device tokens deactivated on backend');
      } catch (error) {
        console.warn('⚠️ Warning: Could not deactivate device on backend:', error);
        // Don't fail logout if this fails - continue with local cleanup
      }

      // Xóa tất cả dữ liệu authentication
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_NAME,
        STORAGE_KEYS.USER_CODE,
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.USER_AVATAR
      ]);

      // Chuyển về trang welcome
      router.replace('/welcome');
    } catch (error) {
      console.error('Error during logout:', error);
      // Vẫn chuyển về trang welcome dù có lỗi
      router.replace('/welcome');
    }
  };

  return { logout };
}