import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLogout } from '../../../hooks/useLogout';
import { getMyProfile, updateMyProfile, uploadAvatar } from '../../../src/axios/api';
import { API_CONFIG } from '../../../src/config/api';
import { UserProfile } from '../../../types/member';
import { styles } from './index.styles';

export default function MemberProfileScreen() {
    const { logout } = useLogout();
    const [activeTab, setActiveTab] = useState<'info' | 'settings' | 'password'>('info');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to create full avatar URL
    const getFullAvatarUrl = (avatarPath: string | null) => {
        if (!avatarPath) return null;

        // If already full URL, return as is
        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
            return avatarPath;
        }

        // If relative path, create full URL
        return `${API_CONFIG.BASE_URL}${avatarPath.startsWith('/') ? avatarPath : '/' + avatarPath}`;
    };

    // Profile form data
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
    });

    // Settings form data
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        taskReminders: true,
        weeklyReports: false,
    });

    // Password form data
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Fetch profile data from API
    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const data = await getMyProfile();

            console.log('🔍 Profile data:', data);

            // Transform API data to match UserProfile interface
            const transformedProfile: UserProfile = {
                id: data.id || 0,
                fullName: data.hoten || '',
                hoten: data.hoten || '',
                email: data.email || '',
                username: data.manv || '',
                phone: data.sdt || '',
                sdt: data.sdt || '',
                address: data.diachi || '',
                dateOfBirth: data.ngaysinh || '',
                position: data.chucvu || '',
                chucvu: data.chucvu || '',
                department: data.department || '',
                manv: data.manv || '',
                avatar: getFullAvatarUrl(data.avatar), // Transform to full URL
                role: data.role || { name: 'employee' },
                createdAt: data.createdAt || new Date().toISOString(),
            };

            console.log('✅ Profile loaded:', {
                ...transformedProfile,
                avatar: transformedProfile.avatar ? 'URL set' : 'No avatar'
            });

            setProfile(transformedProfile);
            setProfileForm({
                fullName: transformedProfile.fullName || '',
                email: transformedProfile.email || '',
                phone: transformedProfile.phone || '',
                address: transformedProfile.address || '',
                dateOfBirth: transformedProfile.dateOfBirth || '',
            });
            setIsLoading(false);
        } catch (error: any) {
            console.error('❌ Lỗi lấy thông tin profile:', error);
            Alert.alert('Lỗi', error.message || 'Không thể tải thông tin cá nhân');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Pick image from gallery and upload to server
    const pickImage = async () => {
        try {
            // Debug: Check if user is authenticated
            const accessToken = await AsyncStorage.getItem('accessToken');
            const userId = await AsyncStorage.getItem('userId');
            console.log('🔐 Auth Debug:', {
                hasAccessToken: !!accessToken,
                tokenLength: accessToken?.length,
                userId,
                tokenPreview: accessToken?.substring(0, 20) + '...'
            });

            if (!accessToken) {
                Alert.alert('Lỗi', 'Bạn cần đăng nhập lại để upload avatar');
                return;
            }

            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'Images' as any,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];

                // Create File object for upload
                const uri = asset.uri;
                let mimeType = asset.type || 'image/jpeg'; // Mặc định là jpeg

                // Thử đoán từ tên file nếu type không rõ ràng
                if (mimeType === 'image') {
                    const fileExtension = uri.split('.').pop()?.toLowerCase();
                    if (fileExtension === 'png') {
                        mimeType = 'image/png';
                    } else {
                        mimeType = 'image/jpeg'; // Mặc định an toàn
                    }
                }

                const name = asset.fileName || `avatar_${Date.now()}.jpg`;

                console.log('📷 Image selected:', { uri, mimeType, name, size: asset.fileSize });

                // Create FormData compatible file object
                const file = {
                    uri,
                    type: mimeType,
                    name,
                    mimeType, // Thêm mimeType để API nhận biết
                } as any;

                // Upload to server
                console.log('🔄 Uploading avatar...');
                const response = await uploadAvatar(file);
                console.log('✅ Avatar uploaded successfully:', response);

                Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện');
                // Refresh profile to get updated avatar
                console.log('🔄 Refreshing profile to load new avatar...');
                fetchProfile();
            }
        } catch (error: any) {
            console.error('❌ Error uploading avatar:', error);
            const errorMessage = error.message || 'Không thể cập nhật ảnh đại diện';
            Alert.alert('Lỗi', errorMessage);
        }
    };

    // Update profile with API
    const handleUpdateProfile = async () => {
        try {
            if (!profileForm.fullName.trim()) {
                Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
                return;
            }

            // Transform form data to API format
            const updateData = {
                hoten: profileForm.fullName,
                sdt: profileForm.phone,
                chucvu: profile?.chucvu, // Keep current position
                // Note: API doesn't support email, address, dateOfBirth update yet
            };

            console.log('🔄 Updating profile:', updateData);

            await updateMyProfile(updateData);

            Alert.alert('Thành công', 'Đã cập nhật thông tin');
            setIsEditing(false);
            fetchProfile(); // Reload profile data
        } catch (error: any) {
            console.error('❌ Lỗi cập nhật profile:', error);
            Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin');
        }
    };

    // Update settings (currently no API, save to local storage)
    const handleUpdateSettings = async () => {
        try {
            // TODO: If backend has settings API, implement it here
            // await updateMySettings(settings);

            // For now, just show success message as settings are local
            Alert.alert('Thành công', 'Đã cập nhật cài đặt');
        } catch (error: any) {
            console.error('❌ Lỗi cập nhật cài đặt:', error);
            Alert.alert('Lỗi', error.message || 'Không thể cập nhật cài đặt');
        }
    };

    // Change password
    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        try {
            // Use updateMyProfile API for password change
            await updateMyProfile({ password: passwordForm.newPassword });

            Alert.alert('Thành công', 'Đã đổi mật khẩu');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            console.error('❌ Lỗi đổi mật khẩu:', error);
            Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu');
        }
    };

    if (isLoading || !profile) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
            </View>

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
                <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                    {profile?.avatar ? (
                        <Image
                            source={{ uri: profile.avatar }}
                            style={styles.avatar}
                            onLoad={() => console.log('✅ Avatar loaded successfully:', profile.avatar)}
                            onError={(error) => console.error('❌ Avatar load error:', error.nativeEvent.error)}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Ionicons name="person" size={48} color="#9CA3AF" />
                        </View>
                    )}
                    <View style={styles.avatarBadge}>
                        <Ionicons name="camera" size={16} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.userName}>{profile?.fullName || 'Đang tải...'}</Text>
                <Text style={styles.userPosition}>
                    {profile?.position || ''}{profile?.department && profile?.position ? ' - ' : ''}{profile?.department || ''}
                </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'info' && styles.tabActive]}
                    onPress={() => setActiveTab('info')}
                >
                    <Ionicons
                        name="person-outline"
                        size={20}
                        color={activeTab === 'info' ? '#667eea' : '#6B7280'}
                    />
                    <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
                        Thông tin
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
                    onPress={() => setActiveTab('settings')}
                >
                    <Ionicons
                        name="settings-outline"
                        size={20}
                        color={activeTab === 'settings' ? '#667eea' : '#6B7280'}
                    />
                    <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
                        Cài đặt
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'password' && styles.tabActive]}
                    onPress={() => setActiveTab('password')}
                >
                    <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={activeTab === 'password' ? '#667eea' : '#6B7280'}
                    />
                    <Text style={[styles.tabText, activeTab === 'password' && styles.tabTextActive]}>
                        Mật khẩu
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Info Tab */}
                {activeTab === 'info' && (
                    <View style={styles.tabContent}>
                        <View style={styles.infoCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (isEditing) {
                                            handleUpdateProfile();
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                >
                                    <Ionicons
                                        name={isEditing ? 'checkmark' : 'create-outline'}
                                        size={24}
                                        color="#667eea"
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Họ và tên</Text>
                                <TextInput
                                    style={[styles.input, !isEditing && styles.inputDisabled]}
                                    value={profileForm.fullName || ''}
                                    onChangeText={(text) => setProfileForm({ ...profileForm, fullName: text })}
                                    editable={isEditing}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Email</Text>
                                <TextInput
                                    style={[styles.input, !isEditing && styles.inputDisabled]}
                                    value={profileForm.email || ''}
                                    onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
                                    editable={isEditing}
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Số điện thoại</Text>
                                <TextInput
                                    style={[styles.input, !isEditing && styles.inputDisabled]}
                                    value={profileForm.phone || ''}
                                    onChangeText={(text) => setProfileForm({ ...profileForm, phone: text })}
                                    editable={isEditing}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Địa chỉ</Text>
                                <TextInput
                                    style={[styles.input, !isEditing && styles.inputDisabled]}
                                    value={profileForm.address || ''}
                                    onChangeText={(text) => setProfileForm({ ...profileForm, address: text })}
                                    editable={isEditing}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Ngày sinh</Text>
                                <TextInput
                                    style={[styles.input, !isEditing && styles.inputDisabled]}
                                    value={profileForm.dateOfBirth || ''}
                                    onChangeText={(text) => setProfileForm({ ...profileForm, dateOfBirth: text })}
                                    editable={isEditing}
                                    placeholder="DD/MM/YYYY"
                                />
                            </View>

                            {isEditing && (
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setIsEditing(false);
                                        setProfileForm({
                                            fullName: profile?.fullName || '',
                                            email: profile?.email || '',
                                            phone: profile?.phone || '',
                                            address: profile?.address || '',
                                            dateOfBirth: profile?.dateOfBirth || '',
                                        });
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Hủy</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <View style={styles.tabContent}>
                        <View style={styles.infoCard}>
                            <Text style={styles.cardTitle}>Thông báo</Text>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Email thông báo</Text>
                                    <Text style={styles.settingDescription}>
                                        Nhận thông báo qua email
                                    </Text>
                                </View>
                                <Switch
                                    value={settings.emailNotifications}
                                    onValueChange={(value) =>
                                        setSettings({ ...settings, emailNotifications: value })
                                    }
                                    trackColor={{ false: '#D1D5DB', true: '#667eea' }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Push notification</Text>
                                    <Text style={styles.settingDescription}>
                                        Nhận thông báo đẩy trên thiết bị
                                    </Text>
                                </View>
                                <Switch
                                    value={settings.pushNotifications}
                                    onValueChange={(value) =>
                                        setSettings({ ...settings, pushNotifications: value })
                                    }
                                    trackColor={{ false: '#D1D5DB', true: '#667eea' }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Nhắc việc</Text>
                                    <Text style={styles.settingDescription}>
                                        Nhắc nhở về công việc sắp đến hạn
                                    </Text>
                                </View>
                                <Switch
                                    value={settings.taskReminders}
                                    onValueChange={(value) =>
                                        setSettings({ ...settings, taskReminders: value })
                                    }
                                    trackColor={{ false: '#D1D5DB', true: '#667eea' }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Báo cáo tuần</Text>
                                    <Text style={styles.settingDescription}>
                                        Nhận báo cáo tổng kết hàng tuần
                                    </Text>
                                </View>
                                <Switch
                                    value={settings.weeklyReports}
                                    onValueChange={(value) =>
                                        setSettings({ ...settings, weeklyReports: value })
                                    }
                                    trackColor={{ false: '#D1D5DB', true: '#667eea' }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleUpdateSettings}
                            >
                                <Text style={styles.saveButtonText}>Lưu cài đặt</Text>
                            </TouchableOpacity>

                            {/* Logout Button */}
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={() => {
                                    Alert.alert(
                                        'Đăng xuất',
                                        'Bạn có chắc chắn muốn đăng xuất?',
                                        [
                                            { text: 'Hủy', style: 'cancel' },
                                            { text: 'Đăng xuất', style: 'destructive', onPress: logout },
                                        ]
                                    );
                                }}
                            >
                                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                                <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <View style={styles.tabContent}>
                        <View style={styles.infoCard}>
                            <Text style={styles.cardTitle}>Đổi mật khẩu</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Mật khẩu hiện tại</Text>
                                <TextInput
                                    style={styles.input}
                                    value={passwordForm.currentPassword || ''}
                                    onChangeText={(text) =>
                                        setPasswordForm({ ...passwordForm, currentPassword: text })
                                    }
                                    secureTextEntry
                                    placeholder="Nhập mật khẩu hiện tại"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Mật khẩu mới</Text>
                                <TextInput
                                    style={styles.input}
                                    value={passwordForm.newPassword}
                                    onChangeText={(text) =>
                                        setPasswordForm({ ...passwordForm, newPassword: text })
                                    }
                                    secureTextEntry
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Xác nhận mật khẩu mới</Text>
                                <TextInput
                                    style={styles.input}
                                    value={passwordForm.confirmPassword || ''}
                                    onChangeText={(text) =>
                                        setPasswordForm({ ...passwordForm, confirmPassword: text })
                                    }
                                    secureTextEntry
                                    placeholder="Xác nhận mật khẩu mới"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleChangePassword}
                            >
                                <Text style={styles.saveButtonText}>Đổi mật khẩu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}