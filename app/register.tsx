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
import { registerUser } from '../src/axios/api';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
    const [formData, setFormData] = useState({
        manv: '',
        password: '',
        confirmPassword: '',
        hoten: '',
        chucvu: '',
        sdt: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const { manv, password, confirmPassword, hoten, chucvu, sdt } = formData;

        if (!manv.trim() || !password.trim() || !hoten.trim() || !chucvu.trim() || !sdt.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return false;
        }

        if (password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(sdt)) {
            Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (10-11 chữ số)');
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const { confirmPassword, ...dataToSend } = formData;
            const response = await registerUser(dataToSend);

            console.log('Đăng ký thành công:', response);
            Alert.alert(
                'Đăng ký thành công',
                'Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/login')
                    }
                ]
            );
        } catch (error: any) {
            console.error('Lỗi đăng ký:', error);
            Alert.alert(
                'Đăng ký thất bại',
                error.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToLogin = () => {
        router.push('/login');
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
                            <Text style={styles.welcomeText}>Tạo tài khoản mới</Text>
                            <Text style={styles.subText}>Đăng ký để bắt đầu sử dụng</Text>
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
                                value={formData.manv}
                                onChangeText={(value) => handleInputChange('manv', value)}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Họ và tên</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập họ và tên"
                                placeholderTextColor="#999"
                                value={formData.hoten}
                                onChangeText={(value) => handleInputChange('hoten', value)}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Chức vụ</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập chức vụ"
                                placeholderTextColor="#999"
                                value={formData.chucvu}
                                onChangeText={(value) => handleInputChange('chucvu', value)}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Số điện thoại</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#999"
                                value={formData.sdt}
                                onChangeText={(value) => handleInputChange('sdt', value)}
                                keyboardType="phone-pad"
                                maxLength={11}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Mật khẩu</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                                placeholderTextColor="#999"
                                value={formData.password}
                                onChangeText={(value) => handleInputChange('password', value)}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập lại mật khẩu"
                                placeholderTextColor="#999"
                                value={formData.confirmPassword}
                                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.registerButtonText}>
                                {isLoading ? 'Đang đăng ký...' : 'Đăng Ký'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Đã có tài khoản? </Text>
                            <TouchableOpacity onPress={navigateToLogin}>
                                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
        paddingHorizontal: 30,
        paddingVertical: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
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
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
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
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subText: {
        fontSize: 14,
        color: '#666',
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    input: {
        height: 48,
        borderWidth: 1.5,
        borderColor: '#e1e5e9',
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 15,
        backgroundColor: '#fff',
        color: '#333',
    },
    registerButton: {
        height: 50,
        backgroundColor: '#667eea',
        borderRadius: 10,
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
    registerButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    loginText: {
        fontSize: 14,
        color: '#666',
    },
    loginLink: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
    },
});