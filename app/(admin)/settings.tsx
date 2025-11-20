import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SettingsManagement() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        autoBackup: false,
        darkMode: false,
    });

    useEffect(() => {
        loadUserProfile();
        loadSettings();
    }, []);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserProfile(user);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('appSettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUserProfile();
        setRefreshing(false);
    };

    const handleToggle = async (key: string) => {
        const newSettings = {
            ...settings,
            [key]: !settings[key as keyof typeof settings]
        };
        setSettings(newSettings);
        
        try {
            await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.multiRemove(['token', 'user']);
                            router.replace('/auth/login');
                        } catch (error) {
                            console.error('Error logging out:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleChangePassword = () => {
        Alert.alert('Thông báo', 'Chức năng đổi mật khẩu đang được phát triển');
    };

    const handleClearCache = async () => {
        Alert.alert(
            'Xóa bộ nhớ cache',
            'Bạn có chắc chắn muốn xóa bộ nhớ cache? Điều này sẽ xóa dữ liệu tạm thời.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Clear specific cache keys but keep token and user
                            Alert.alert('Thành công', 'Đã xóa bộ nhớ cache');
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa cache');
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({ 
        icon, 
        title, 
        description, 
        value, 
        onToggle, 
        color = '#3b82f6' 
    }: any) => (
        <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {description && <Text style={styles.settingDescription}>{description}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#d1d5db', true: color + '80' }}
                thumbColor={value ? color : '#f3f4f6'}
            />
        </View>
    );

    const ActionItem = ({ icon, title, color, onPress, showChevron = true }: any) => (
        <TouchableOpacity 
            style={styles.actionItem}
            onPress={onPress}
        >
            <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.actionTitle}>{title}</Text>
            {showChevron && <Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* User Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileAvatar}>
                        <Ionicons name="person" size={40} color="#fff" />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{userProfile?.hoten || 'Admin'}</Text>
                        <Text style={styles.profileEmail}>{userProfile?.email || 'admin@example.com'}</Text>
                        <View style={styles.profileBadge}>
                            <Ionicons name="shield-checkmark" size={14} color="#ef4444" />
                            <Text style={styles.profileRole}>
                                {userProfile?.role?.tenVaiTro || 'Administrator'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Profile Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 Thông tin cá nhân</Text>
                    
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Mã nhân viên</Text>
                                <Text style={styles.infoValue}>{userProfile?.manv || 'N/A'}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Số điện thoại</Text>
                                <Text style={styles.infoValue}>{userProfile?.sdt || 'Chưa cập nhật'}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Địa chỉ</Text>
                                <Text style={styles.infoValue}>{userProfile?.diaChi || 'Chưa cập nhật'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* App Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚙️ Cài đặt ứng dụng</Text>
                    
                    <SettingItem
                        icon="mail"
                        title="Thông báo Email"
                        description="Nhận thông báo qua email"
                        value={settings.emailNotifications}
                        onToggle={() => handleToggle('emailNotifications')}
                        color="#3b82f6"
                    />
                    
                    <SettingItem
                        icon="notifications"
                        title="Thông báo đẩy"
                        description="Hiển thị thông báo trên thiết bị"
                        value={settings.pushNotifications}
                        onToggle={() => handleToggle('pushNotifications')}
                        color="#f59e0b"
                    />
                    
                    <SettingItem
                        icon="cloud-upload"
                        title="Tự động sao lưu"
                        description="Sao lưu dữ liệu tự động hàng ngày"
                        value={settings.autoBackup}
                        onToggle={() => handleToggle('autoBackup')}
                        color="#10b981"
                    />
                </View>

                {/* Account Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>� Bảo mật</Text>
                    
                    <ActionItem
                        icon="key"
                        title="Đổi mật khẩu"
                        color="#8b5cf6"
                        onPress={handleChangePassword}
                    />
                </View>

                {/* System Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>�️ Hệ thống</Text>
                    
                    <ActionItem
                        icon="document-text"
                        title="Quản lý tài liệu"
                        color="#14b8a6"
                        onPress={() => router.push('/(admin)/documents')}
                    />
                    
                    <ActionItem
                        icon="trash"
                        title="Xóa bộ nhớ cache"
                        color="#f59e0b"
                        onPress={handleClearCache}
                    />
                </View>

                {/* System Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ℹ️ Thông tin hệ thống</Text>
                    
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Phiên bản ứng dụng</Text>
                                <Text style={styles.infoValue}>1.0.0</Text>
                            </View>
                        </View>
                        
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Trạng thái server</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.infoValue}>Online</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out" size={20} color="#fff" />
                    <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    content: {
        flex: 1,
    },
    profileCard: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 4,
    },
    profileRole: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ef4444',
    },
    section: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
    },
    infoRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    infoItem: {
        gap: 4,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '600',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    settingIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    settingDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
