import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
} from 'react-native';
import { loginUser } from '../src/axios/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const [manv, setManv] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
                    await AsyncStorage.multiSet([
                        ['accessToken', response.accessToken],
                        ['refreshToken', response.refreshToken || ''],
                        ['manv', response.user?.manv || manv],
                        ['hoten', response.user?.hoten || ''],
                        ['role', response.user?.role || ''],
                        ['userId', String(response.user?.id || '')],
                    ]);

                    console.log('Đăng nhập thành công:', response);

                    // Điều hướng theo role
                    const userRole = response.user?.role || response.role;
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={goBack}>
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Text style={styles.logoText}>QL</Text>
                            </View>
                            <Text style={styles.welcomeText}>Chào mừng trở lại!</Text>
                            <Text style={styles.subText}>Đăng nhập để tiếp tục</Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Mã nhân viên</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập mã nhân viên"
                                placeholderTextColor="#999"
                                value={manv}
                                onChangeText={setManv}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Mật khẩu</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập mật khẩu"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.loginButtonText}>
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
                            <TouchableOpacity onPress={navigateToRegister}>
                                <Text style={styles.registerLink}>Đăng ký ngay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    backButton: {
        position: 'absolute',
        left: -20,
        top: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#667eea',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#666',
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1.5,
        borderColor: '#e1e5e9',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    loginButton: {
        height: 55,
        backgroundColor: '#667eea',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#667eea',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    loginButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    registerText: {
        fontSize: 16,
        color: '#666',
    },
    registerLink: {
        fontSize: 16,
        color: '#667eea',
        fontWeight: '600',
    },
});