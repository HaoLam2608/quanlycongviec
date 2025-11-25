/**
 * Debug utility để kiểm tra và xóa auth data trong AsyncStorage
 * 
 * Cách sử dụng:
 * 1. Import file này vào bất kỳ component nào (ví dụ welcome.tsx)
 * 2. Gọi hàm tương ứng để debug hoặc clear storage
 * 3. Sau khi xong, bỏ comment import
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/api';

/**
 * In ra tất cả auth keys hiện có trong storage
 */
export const debugAuthStorage = async () => {
  console.log('🔍 [Debug] Checking AsyncStorage auth keys...');
  
  const keys = [
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER_ID,
    STORAGE_KEYS.USER_NAME,
    STORAGE_KEYS.USER_CODE,
    STORAGE_KEYS.USER_ROLE,
    STORAGE_KEYS.USER_AVATAR,
    STORAGE_KEYS.LAST_AUTH_EVENT,
    'token', // legacy key
  ];
  
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    console.log('📦 [Debug] Auth storage contents:');
    pairs.forEach(([key, value]) => {
      if (value) {
        // Truncate long tokens for readability
        const displayValue = value.length > 50 
          ? `${value.substring(0, 30)}...${value.substring(value.length - 10)}`
          : value;
        console.log(`  ${key}: ${displayValue}`);
      } else {
        console.log(`  ${key}: (empty)`);
      }
    });
    
    // Check for any other keys
    const allKeys = await AsyncStorage.getAllKeys();
    const authRelatedKeys = allKeys.filter(k => 
      k.includes('token') || 
      k.includes('auth') || 
      k.includes('user') ||
      k.includes('role')
    );
    
    if (authRelatedKeys.length > keys.length) {
      console.log('⚠️ [Debug] Found additional auth-related keys:', 
        authRelatedKeys.filter(k => !keys.includes(k))
      );
    }
    
    return pairs;
  } catch (error) {
    console.error('❌ [Debug] Error reading storage:', error);
    return [];
  }
};

/**
 * Xóa TOÀN BỘ auth data khỏi storage
 * App sẽ chuyển về welcome screen sau khi xóa
 */
export const clearAuthStorage = async () => {
  console.log('🧹 [Debug] Clearing all auth data from storage...');
  
  const keysToRemove = [
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER_ID,
    STORAGE_KEYS.USER_NAME,
    STORAGE_KEYS.USER_CODE,
    STORAGE_KEYS.USER_ROLE,
    STORAGE_KEYS.USER_AVATAR,
    STORAGE_KEYS.LAST_AUTH_EVENT,
    'token', // legacy key
    'refreshToken', // legacy key
    'userId', // legacy key
    'hoten', // legacy key
    'manv', // legacy key
    'role', // legacy key
    'avatar', // legacy key
  ];
  
  try {
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ [Debug] All auth data cleared successfully');
    console.log('📝 [Debug] Keys removed:', keysToRemove.length);
    
    // Verify
    const remaining = await AsyncStorage.multiGet(keysToRemove);
    const stillHasData = remaining.some(([_, value]) => value !== null);
    
    if (stillHasData) {
      console.warn('⚠️ [Debug] Some keys still have data after removal:');
      remaining.forEach(([key, value]) => {
        if (value) console.log(`  ${key}: ${value}`);
      });
    } else {
      console.log('✅ [Debug] Verification passed - all keys removed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ [Debug] Error clearing storage:', error);
    return false;
  }
};

/**
 * Xóa chỉ tokens (giữ lại user info để test)
 */
export const clearTokensOnly = async () => {
  console.log('🧹 [Debug] Clearing tokens only...');
  
  const keysToRemove = [
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    'token', // legacy
    'refreshToken', // legacy
  ];
  
  try {
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ [Debug] Tokens cleared');
    return true;
  } catch (error) {
    console.error('❌ [Debug] Error clearing tokens:', error);
    return false;
  }
};

/**
 * In tất cả keys trong AsyncStorage (không chỉ auth)
 */
export const debugAllStorage = async () => {
  console.log('🔍 [Debug] Listing ALL AsyncStorage keys...');
  
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log(`📦 [Debug] Total keys: ${keys.length}`);
    
    if (keys.length > 0) {
      console.log('📝 [Debug] All keys:', keys);
      
      // Get values for first 20 keys (to avoid spam)
      const keysToCheck = keys.slice(0, 20);
      const values = await AsyncStorage.multiGet(keysToCheck);
      
      console.log('💾 [Debug] Sample values (first 20):');
      values.forEach(([key, value]) => {
        const displayValue = value && value.length > 100 
          ? `${value.substring(0, 50)}... (${value.length} chars)`
          : value;
        console.log(`  ${key}: ${displayValue}`);
      });
      
      if (keys.length > 20) {
        console.log(`... and ${keys.length - 20} more keys`);
      }
    } else {
      console.log('📭 [Debug] Storage is empty');
    }
    
    return keys;
  } catch (error) {
    console.error('❌ [Debug] Error listing storage:', error);
    return [];
  }
};

/**
 * Sử dụng nhanh:
 * 
 * // Trong welcome.tsx hoặc component khác:
 * import { debugAuthStorage, clearAuthStorage } from './utils/debugStorage';
 * 
 * // Trong useEffect hoặc button handler:
 * await debugAuthStorage();  // Xem storage
 * await clearAuthStorage();  // Xóa hết auth data
 */
