import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { STORAGE_KEYS } from '../constants/api';

/**
 * Root index - kiểm tra auth và redirect đến màn hình phù hợp
 */
export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      console.log('🔍 [Index] Checking auth status...');
      
      const [accessToken, refreshToken, role] = await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_ROLE,
      ]);

      const token = accessToken[1];
      const refresh = refreshToken[1];
      const userRole = role[1];

      console.log('🔑 [Index] Auth check:', {
        hasToken: !!token,
        hasRefresh: !!refresh,
        role: userRole,
      });

      // Nếu không có token hoặc refresh token -> chưa đăng nhập
      if (!token || !refresh) {
        console.log('➡️ [Index] No auth tokens, redirecting to welcome');
        setRedirectTo('/welcome');
        setIsChecking(false);
        return;
      }

      // Có token -> redirect theo role
      console.log('✅ [Index] Has auth tokens, role:', userRole);
      
      switch (userRole) {
        case 'admin':
          setRedirectTo('/(admin)');
          break;
        case 'manager':
          setRedirectTo('/(manager)');
          break;
        case 'teamlead':
          setRedirectTo('/(teamlead)');
          break;
        case 'employee':
        case 'member':
          setRedirectTo('/(tabs)');
          break;
        default:
          // Role không xác định -> về welcome để đăng nhập lại
          console.log('⚠️ [Index] Unknown role, redirecting to welcome');
          setRedirectTo('/welcome');
      }

      setIsChecking(false);
    } catch (error) {
      console.error('❌ [Index] Error checking auth:', error);
      // Lỗi -> về welcome an toàn
      setRedirectTo('/welcome');
      setIsChecking(false);
    }
  };

  // Đang kiểm tra auth
  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Redirect đến màn hình phù hợp
  if (redirectTo) {
    console.log('🚀 [Index] Redirecting to:', redirectTo);
    return <Redirect href={redirectTo as any} />;
  }

  // Fallback (không nên xảy ra)
  return <Redirect href="/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
