import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
                        ['accessToken', response.accessToken],
                        ['refreshToken', response.refreshToken || ''],
                        ['user', JSON.stringify(userObject)], // Lưu user object đã construct
                        ['manv', userObject.manv],
                        ['hoten', userObject.hoten],
                        ['role', userObject.role],
                        ['userId', String(userObject.id)],
                    ]);

                    console.log('✅ Đăng nhập thành công:', response);
                    console.log('👤 User object đã lưu:', userObject);

                    // Điều hướng theo role
                    const userRole = response.role;
                    switch (userRole) {
                        case 'admin':
                            router.replace('/(admin)/' as any);
                            break;
                        case 'manager':
                            router.replace('/(manager)/' as any);
                            break;
                        case 'employee':
                        default:
                            router.replace('/(tabs)');
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
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />
            <LinearGradient
                colors={['#667eea', '#764ba2']}
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
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
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
        color: '#ffffff',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9ff',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: '#e8ebf7',
    },
    inputIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16,
        color: '#667eea',
        fontWeight: '500',
    },
    eyeButton: {
        padding: 8,
    },
    eyeIcon: {
        fontSize: 20,
    },
    loginButton: {
        backgroundColor: '#667eea',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    registerLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
        color: '#6b7280',
    },
    registerTextBold: {
        fontWeight: 'bold',
        color: '#667eea',
    },
    circle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -50,
        right: -50,
    },
    circle2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -30,
        left: -40,
    },
});