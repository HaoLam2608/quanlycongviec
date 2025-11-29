import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    StatusBar,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clearAuthStorage, debugAuthStorage } from '../utils/debugStorage';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Debug: log storage on mount (chỉ khi dev)
        if (__DEV__) {
            debugAuthStorage();
        }
    }, []);

    const handleGetStarted = () => {
        router.push('/login');
    };

    // Debug handler - chỉ hiển thị khi dev
    const handleClearStorage = async () => {
        if (!__DEV__) return;
        
        Alert.alert(
            'Clear Storage',
            'Xóa toàn bộ auth data? App sẽ reset về trạng thái ban đầu.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await clearAuthStorage();
                        if (success) {
                            Alert.alert('Thành công', 'Đã xóa auth data');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <LinearGradient
                colors={["#f8fafc", "#e0f2fe", "#bae6fd", "#7dd3fc"]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <Animated.View 
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    {/* Logo và tên ứng dụng */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoIcon}>📋</Text>
                        </View>
                        <Text style={styles.appName}>TaskFlow</Text>
                        <Text style={styles.tagline}>Quản lý công việc thông minh</Text>
                    </View>

                    {/* Thông tin tính năng */}
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Text style={styles.featureIcon}>🎯</Text>
                            </View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Quản lý dự án</Text>
                                <Text style={styles.featureDesc}>Theo dõi tiến độ dễ dàng</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Text style={styles.featureIcon}>👥</Text>
                            </View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Cộng tác nhóm</Text>
                                <Text style={styles.featureDesc}>Làm việc hiệu quả hơn</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Text style={styles.featureIcon}>📊</Text>
                            </View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Thống kê báo cáo</Text>
                                <Text style={styles.featureDesc}>Dữ liệu trực quan</Text>
                            </View>
                        </View>
                    </View>

                    {/* Nút bắt đầu */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={handleGetStarted}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.startButtonText}>Bắt đầu ngay</Text>
                            <Text style={styles.arrow}>→</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.footerText}>
                            Nâng cao hiệu suất làm việc của bạn
                        </Text>

                    </View>
                </Animated.View>

                {/* Decorative circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <View style={styles.circle3} />
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
        position: 'relative',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 60,
        zIndex: 1,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 3,
        borderColor: '#bae6fd',
    },
    logoIcon: {
        fontSize: 56,
        color: '#0ea5e9',
    },
    appName: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#0c4a6e',
        marginBottom: 8,
        letterSpacing: 1,
        textShadowColor: '#7dd3fc',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        fontSize: 16,
        color: '#0369a1',
        textAlign: 'center',
    },
    featuresContainer: {
        width: '100%',
        paddingVertical: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#e0f2fe',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    featureIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f9ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#bae6fd',
    },
    featureIcon: {
        fontSize: 28,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0c4a6e',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: '#64748b',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0ea5e9',
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 28,
        width: '100%',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    startButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
        marginRight: 8,
        letterSpacing: 0.5,
    },
    arrow: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    footerText: {
        marginTop: 18,
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    debugButton: {
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#e0f2fe',
    },
    debugButtonText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    // Decorative circles
    circle1: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(14, 165, 233, 0.06)',
        top: -70,
        right: -70,
    },
    circle2: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(14, 165, 233, 0.05)',
        bottom: 80,
        left: -50,
    },
    circle3: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(14, 165, 233, 0.04)',
        top: height * 0.35,
        right: 20,
    },
});