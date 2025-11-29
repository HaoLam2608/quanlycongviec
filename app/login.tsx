import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { STORAGE_KEYS } from '../constants/api';
import NotificationService from '../services/notificationService';
import { loginUser } from '../src/axios/api';
import { API_CONFIG } from '../src/config/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const [manv, setManv] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!manv.trim() || !password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        setIsLoading(true);
        try {
            const response = await loginUser({ manv: manv.trim(), password });
            // Lưu thông tin đăng nhập vào AsyncStorage
            if (response.accessToken) {
                try {
                    // Backend trả userId ở root level, không phải response.user.id
                    const userIdValue = response.userId ? String(response.userId) : '';

                    // Tạo user object từ response
                    const userObject = {
                        id: response.userId,
                        manv: response.manv || manv,
                        hoten: response.hoten || '',
                        role: response.role || '',
                        chucvu: response.chucvu || '',
                        avatar: response.avatar || null
                    };

                    await AsyncStorage.multiSet([
                        [STORAGE_KEYS.ACCESS_TOKEN, response.accessToken],
                        [STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken || ''],
                        [STORAGE_KEYS.USER_CODE, response.manv || manv],
                        [STORAGE_KEYS.USER_NAME, response.hoten || ''],
                        [STORAGE_KEYS.USER_ROLE, response.role || ''],
                        [STORAGE_KEYS.USER_ID, userIdValue],
                        ['user', JSON.stringify(userObject)], // Lưu user object đã construct
                    ]);

                    console.log('✅ Đăng nhập thành công:', response);
                    console.log('👤 User object đã lưu:', userObject);

                    // Đăng ký push notification sau khi login
                    console.log('🔔 [Login] Bắt đầu đăng ký push notification...');
                    try {
                        const pushToken = await NotificationService.registerForPushNotificationsAsync();
                        console.log('🔔 [Login] Push token nhận được:', pushToken);

                        if (pushToken) {
                            console.log('🔔 [Login] Đang gửi token lên backend...');
                            await NotificationService.sendTokenToBackend(
                                pushToken,
                                API_CONFIG.BASE_URL,
                                response.accessToken
                            );
                            console.log('✅ [Login] Đăng ký push notification thành công!');
                        } else {
                            console.log('⚠️ [Login] Không nhận được push token');
                        }
                    } catch (notifError) {
                        console.error('❌ [Login] Lỗi đăng ký push notification:', notifError);
                        // Không throw error để không ảnh hưởng đến luồng login
                    }

                    // Điều hướng theo role
                    const normalizedRole = (response.role || '').toLowerCase();
                    console.log('🔍 Role từ backend:', response.role);
                    console.log('🔍 Normalized role:', normalizedRole);
                    switch (normalizedRole) {
                        case 'admin':
                            router.replace('/(admin)/' as any);
                            break;
                        case 'manager':
                            router.replace('/(manager)/' as any);
                            break;
                        case 'teamlead':
                        case 'teamleader':
                        case 'team_lead':
                        case 'team-lead':
                        case 'team leader':
                            router.replace('/(teamlead)' as any);
                            break;
                        case 'employee':
                        default:
                            router.replace('/(tabs)/member-dashboard/' as any);
                            break;
                    }
                } catch (storageError) {
                    console.error('Lỗi lưu thông tin:', storageError);
                    Alert.alert('Lỗi', 'Không thể lưu thông tin đăng nhập');
                }
            }
        } catch (error: any) {
            console.error('❌ Lỗi đăng nhập chi tiết:', {
                message: error.message,
                status: error.status,
                details: error.details,
                stack: error.stack
            });

            let errorMessage = 'Mã nhân viên hoặc mật khẩu không đúng';

            if (error.message) {
                errorMessage = error.message;
            } else if (error.status) {
                switch (error.status) {
                    case 400:
                        errorMessage = 'Thông tin đăng nhập không hợp lệ';
                        break;
                    case 401:
                        errorMessage = 'Mã nhân viên hoặc mật khẩu không đúng';
                        break;
                    case 404:
                        errorMessage = 'Không tìm thấy tài khoản';
                        break;
                    case 500:
                        errorMessage = 'Lỗi máy chủ, vui lòng thử lại sau';
                        break;
                    default:
                        errorMessage = `Lỗi ${error.status}: ${error.details?.message || 'Không rõ nguyên nhân'}`;
                }
            }

            Alert.alert('Đăng nhập thất bại', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToRegister = () => {
        router.push('/register');
    };

    const goBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <LinearGradient
                colors={["#f8fafc", "#e0f2fe", "#bae6fd"]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Back Button */}
                        <TouchableOpacity style={styles.backButton} onPress={goBack}>
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>

                        <Animated.View
                            style={[
                                styles.content,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.logoContainer}>
                                    <View style={styles.logoCircle}>
                                        <Text style={styles.logoIcon}>👤</Text>
                                    </View>
                                </View>
                                <Text style={styles.welcomeText}>Xin chào!</Text>
                                <Text style={styles.subText}>Đăng nhập để tiếp tục</Text>
                            </View>

                            {/* Form */}
                            <View style={styles.formContainer}>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Mã nhân viên</Text>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputIcon}>👨‍💼</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập mã nhân viên"
                                            placeholderTextColor="#7dd3fc"
                                            value={manv}
                                            onChangeText={setManv}
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Mật khẩu</Text>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputIcon}>🔒</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập mật khẩu"
                                            placeholderTextColor="#7dd3fc"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeButton}
                                        >
                                            <Text style={styles.eyeIcon}>
                                                {showPassword ? '👁️' : '👁️‍🗨️'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.loginButton}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.loginButtonText}>
                                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Decorative circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButtonText: {
        fontSize: 24,
        color: '#0ea5e9',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 3,
        borderColor: '#e0f2fe',
    },
    logoIcon: {
        fontSize: 48,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0c4a6e',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#0369a1',
        opacity: 0.85,
    },
    formContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 28,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0c4a6e',
        marginBottom: 10,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: '#bae6fd',
    },
    inputIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 16,
        color: '#0c4a6e',
        fontWeight: '500',
    },
    eyeButton: {
        padding: 8,
    },
    eyeIcon: {
        fontSize: 20,
    },
    loginButton: {
        backgroundColor: '#0ea5e9',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    loginButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    registerLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
        color: '#64748b',
        opacity: 0.9,
    },
    registerTextBold: {
        fontWeight: 'bold',
        color: '#0ea5e9',
    },
    circle1: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        top: -60,
        right: -60,
    },
    circle2: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(14, 165, 233, 0.06)',
        bottom: -40,
        left: -50,
    },
});