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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
    }, []);

    const handleGetStarted = () => {
        router.push('/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
            <LinearGradient
                colors={["#2563eb", "#3b82f6", "#60a5fa"]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
                        <View style={[styles.logoCircle, { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: '#fff' }] }>
                            <Text style={[styles.logoIcon, { color: '#fff' }]}>📋</Text>
                        </View>
                        <Text style={[styles.appName, { color: '#fff', textShadowColor: '#2563eb', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 8 }]}>TaskFlow</Text>
                        <Text style={[styles.tagline, { color: 'rgba(255,255,255,0.92)' }]}>Quản lý công việc thông minh</Text>
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
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    logoIcon: {
        fontSize: 56,
    },
    appName: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    featuresContainer: {
        width: '100%',
        paddingVertical: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    featureIconContainer: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    featureIcon: {
        fontSize: 28,
        color: '#2563eb',
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
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
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        paddingHorizontal: 44,
        borderRadius: 28,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
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
        color: 'rgba(255,255,255,0.92)',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    // Decorative circles
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
        bottom: 100,
        left: -40,
    },
    circle3: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        top: height * 0.4,
        right: 30,
    },
});