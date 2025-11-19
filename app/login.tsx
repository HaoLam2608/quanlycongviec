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
import { loginUser } from '../src/axios/api';

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
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
            <LinearGradient
                colors={["#2563eb", "#3b82f6"]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
                                            placeholderTextColor="rgba(102, 126, 234, 0.5)"
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
                                            placeholderTextColor="rgba(102, 126, 234, 0.5)"
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

                                <TouchableOpacity
                                    style={styles.registerLink}
                                    onPress={navigateToRegister}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.registerText}>
                                        Chưa có tài khoản? <Text style={styles.registerTextBold}>Đăng ký ngay</Text>
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
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButtonText: {
        fontSize: 24,
        color: '#ffffff',
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
        backgroundColor: 'rgba(37, 99, 235, 0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    logoIcon: {
        fontSize: 48,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#2563eb',
        opacity: 0.8,
    },
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 22,
        padding: 22,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.13,
        shadowRadius: 12,
        elevation: 6,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f6fd',
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderColor: '#dbeafe',
    },
    inputIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '500',
    },
    eyeButton: {
        padding: 8,
    },
    eyeIcon: {
        fontSize: 20,
    },
    loginButton: {
        backgroundColor: '#2563eb',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
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
        color: '#2563eb',
        opacity: 0.8,
    },
    registerTextBold: {
        fontWeight: 'bold',
        color: '#2563eb',
    },
    circle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        top: -50,
        right: -50,
    },
    circle2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(37, 99, 235, 0.10)',
        bottom: -30,
        left: -40,
    },
});