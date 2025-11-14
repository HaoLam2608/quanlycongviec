import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsManagement() {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        autoApproval: false,
        maintenanceMode: false,
        allowRegistration: true,
        requireApproval: true,
    });

    const handleToggle = (key: string) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key as keyof typeof prev]
        }));
    };

    const handleSave = () => {
        Alert.alert('Thành công', 'Đã lưu cài đặt');
    };

    const handleBackup = () => {
        Alert.alert(
            'Sao lưu dữ liệu',
            'Bạn có chắc chắn muốn sao lưu dữ liệu hệ thống?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Sao lưu',
                    onPress: () => {
                        Alert.alert('Thành công', 'Đang tiến hành sao lưu dữ liệu');
                    }
                }
            ]
        );
    };

    const handleRestore = () => {
        Alert.alert(
            'Khôi phục dữ liệu',
            'Bạn có chắc chắn muốn khôi phục dữ liệu? Dữ liệu hiện tại sẽ bị ghi đè.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Khôi phục',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Thông báo', 'Chức năng đang được phát triển');
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
                <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#d1d5db', true: color + '80' }}
                thumbColor={value ? color : '#f3f4f6'}
            />
        </View>
    );

    const ActionButton = ({ icon, title, color, onPress }: any) => (
        <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: color + '20' }]}
            onPress={onPress}
        >
            <View style={[styles.actionIcon, { backgroundColor: color }]}>
                <Ionicons name={icon} size={24} color="#fff" />
            </View>
            <Text style={[styles.actionTitle, { color }]}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Cài đặt hệ thống</Text>
                <Text style={styles.subtitle}>Quản lý cấu hình và tùy chỉnh</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* General Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚙️ Cài đặt chung</Text>
                    
                    <SettingItem
                        icon="mail"
                        title="Thông báo Email"
                        description="Gửi thông báo qua email"
                        value={settings.emailNotifications}
                        onToggle={() => handleToggle('emailNotifications')}
                        color="#3b82f6"
                    />
                    
                    <SettingItem
                        icon="notifications"
                        title="Thông báo Push"
                        description="Hiển thị thông báo đẩy"
                        value={settings.pushNotifications}
                        onToggle={() => handleToggle('pushNotifications')}
                        color="#f59e0b"
                    />
                    
                    <SettingItem
                        icon="people"
                        title="Cho phép đăng ký"
                        description="Người dùng mới có thể đăng ký"
                        value={settings.allowRegistration}
                        onToggle={() => handleToggle('allowRegistration')}
                        color="#10b981"
                    />
                </View>

                {/* Approval Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✅ Cài đặt phê duyệt</Text>
                    
                    <SettingItem
                        icon="checkmark-done"
                        title="Tự động phê duyệt"
                        description="Tự động phê duyệt yêu cầu đơn giản"
                        value={settings.autoApproval}
                        onToggle={() => handleToggle('autoApproval')}
                        color="#ec4899"
                    />
                    
                    <SettingItem
                        icon="document-text"
                        title="Yêu cầu phê duyệt"
                        description="Các thay đổi cần được phê duyệt"
                        value={settings.requireApproval}
                        onToggle={() => handleToggle('requireApproval')}
                        color="#8b5cf6"
                    />
                </View>

                {/* System Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🛠️ Cài đặt hệ thống</Text>
                    
                    <SettingItem
                        icon="construct"
                        title="Chế độ bảo trì"
                        description="Tạm khóa hệ thống để bảo trì"
                        value={settings.maintenanceMode}
                        onToggle={() => handleToggle('maintenanceMode')}
                        color="#ef4444"
                    />
                </View>

                {/* System Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💾 Sao lưu & Khôi phục</Text>
                    
                    <View style={styles.actionsGrid}>
                        <ActionButton
                            icon="cloud-download"
                            title="Sao lưu dữ liệu"
                            color="#3b82f6"
                            onPress={handleBackup}
                        />
                        <ActionButton
                            icon="cloud-upload"
                            title="Khôi phục dữ liệu"
                            color="#10b981"
                            onPress={handleRestore}
                        />
                    </View>
                </View>

                {/* System Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ℹ️ Thông tin hệ thống</Text>
                    
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phiên bản:</Text>
                            <Text style={styles.infoValue}>1.0.0</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Môi trường:</Text>
                            <Text style={styles.infoValue}>Production</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Server:</Text>
                            <Text style={styles.infoValue}>Online</Text>
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Ionicons name="save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Lưu cài đặt</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    settingIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    settingDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    infoLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        marginHorizontal: 16,
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
