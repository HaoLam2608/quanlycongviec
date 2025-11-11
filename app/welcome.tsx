import { router } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const handleGetStarted = () => {
        router.push('/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.gradient}>
                <View style={styles.content}>
                    {/* Logo và tên ứng dụng */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoText}>QL</Text>
                        </View>
                        <Text style={styles.appName}>Quản Lý Công Việc</Text>
                        <Text style={styles.tagline}>Tổ chức công việc hiệu quả</Text>
                    </View>

                    {/* Thông tin tính năng */}
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Text style={styles.featureIconText}>📋</Text>
                            </View>
                            <Text style={styles.featureText}>Quản lý dự án</Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Text style={styles.featureIconText}>👥</Text>
                            </View>
                            <Text style={styles.featureText}>Làm việc nhóm</Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Text style={styles.featureIconText}>📊</Text>
                            </View>
                            <Text style={styles.featureText}>Báo cáo tiến độ</Text>
                        </View>
                    </View>

                    {/* Nút bắt đầu */}
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={handleGetStarted}
                        activeOpacity={0.8}
                    >
                        <View style={styles.buttonGradient}>
                            <Text style={styles.startButtonText}>Bắt Đầu</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.footerText}>
                        Chào mừng bạn đến với ứng dụng quản lý công việc hiệu quả
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#667eea',
    },
    content: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 50,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    featuresContainer: {
        width: '100%',
        paddingHorizontal: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    featureIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    featureIconText: {
        fontSize: 24,
    },
    featureText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    startButton: {
        width: width * 0.8,
        height: 55,
        borderRadius: 27.5,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ff7b7b',
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    footerText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
    },
});