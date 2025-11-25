import React, { useEffect, useState, useCallback } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Alert,
    Switch,
    Modal,
    TextInput,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getMyProfile, updateMyProfile, uploadAvatar } from '@/src/axios/api';
import api from '@/src/axios/config';
import { API_CONFIG } from '@/src/config/api';

interface Profile {
    id?: number;
    hoten?: string;
    manv?: string;
    sdt?: string;
    email?: string;
    chucvu?: string;
    avatarUrl?: string;
}

export default function TeamLeadSettingsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [updating, setUpdating] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
            loadSettings();
        }, [])
    );

    const loadProfile = async () => {
        try {
            setLoading(true);
            let data: any = null;
            try {
                data = await getMyProfile();
            } catch (e) {
                try {
                    const res = await api.get('/users/me');
                    data = res.data || res;
                } catch (err) {
                    throw err;
                }
            }

            const user = data && data.id ? data : (data.user || data.data || null);
            if (user) {
                let avatarPath = user.avatarUrl || user.avatar || null;
                let avatarFull: string | undefined = undefined;
                if (avatarPath) {
                    if (typeof avatarPath === 'string') {
                        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
                            avatarFull = avatarPath;
                        } else {
                            const slash = avatarPath.startsWith('/') ? '' : '/';
                            avatarFull = `${API_CONFIG.BASE_URL}${slash}${avatarPath}`;
                        }
                    }
                }

                setProfile({
                    id: user.id,
                    hoten: user.hoten || user.name || user.fullName,
                    manv: user.manv,
                    sdt: user.sdt || user.phone,
                    email: user.email,
                    chucvu: user.chucvu || user.role || user.position,
                    avatarUrl: avatarFull,
                });
            }
        } catch (err) {
            console.error('Error loading profile', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const notifications = await AsyncStorage.getItem('notificationsEnabled');
            const darkMode = await AsyncStorage.getItem('darkModeEnabled');
            if (notifications !== null) setNotificationsEnabled(notifications === 'true');
            if (darkMode !== null) setDarkModeEnabled(darkMode === 'true');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const toggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);
        await AsyncStorage.setItem('notificationsEnabled', value.toString());
    };

    const toggleDarkMode = async (value: boolean) => {
        setDarkModeEnabled(value);
        await AsyncStorage.setItem('darkModeEnabled', value.toString());
        Alert.alert('Thông báo', 'Chế độ tối sẽ được áp dụng trong phiên bản sau');
    };

    const pickAvatar = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Thông báo', 'Bạn cần cấp quyền truy cập thư viện ảnh');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setSelectedAvatar(asset.uri);
            }
        } catch (error) {
            console.error('Error picking avatar:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    const handleEditProfile = () => {
        if (profile) {
            setEditName(profile.hoten || '');
            setEditPhone(profile.sdt || '');
            setEditEmail(profile.email || '');
            setSelectedAvatar(null);
            setShowEditModal(true);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            if (!editName.trim()) {
                Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
                return;
            }

            setUpdating(true);

            if (selectedAvatar) {
                setUploadingAvatar(true);
                try {
                    const filename = selectedAvatar.split('/').pop() || 'avatar.jpg';
                    const match = /\.([\w]+)$/.exec(filename);
                    const mime = match ? `image/${match[1]}` : 'image/jpeg';

                    const uploadRes: any = await uploadAvatar({ uri: selectedAvatar, name: filename, type: mime });

                    const returnedPath = uploadRes?.path || uploadRes?.avatar || uploadRes?.avatarUrl || uploadRes?.data?.avatar;
                    if (returnedPath) {
                        const slash = returnedPath.startsWith('/') ? '' : '/';
                        const full = returnedPath.startsWith('http') ? returnedPath : `${API_CONFIG.BASE_URL}${slash}${returnedPath}`;
                        setProfile(prev => prev ? { ...prev, avatarUrl: full } : prev);
                    }
                } catch (avatarError) {
                    console.error('Error uploading avatar:', avatarError);
                    Alert.alert('Cảnh báo', 'Ảnh đại diện không được tải lên, nhưng thông tin khác sẽ được cập nhật');
                } finally {
                    setUploadingAvatar(false);
                }
            }

            const payload: any = { hoten: editName.trim() };
            if (editPhone.trim()) payload.sdt = editPhone.trim();
            if (editEmail.trim()) payload.email = editEmail.trim();

            // Use updateMyProfile helper
            await updateMyProfile(payload);

            Alert.alert('Thành công', 'Cập nhật thông tin thành công');
            setShowEditModal(false);
            await loadProfile();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật thông tin';
            Alert.alert('Lỗi', message);
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Xác nhận đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.multiRemove(['token', 'refreshToken', 'userId', 'hoten', 'manv', 'role', 'user']);
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hồ sơ cá nhân</Text>
                    {profile ? (
                        <View style={styles.profileCard}>
                            <TouchableOpacity style={styles.profileHeader} onPress={handleEditProfile} activeOpacity={0.8}>
                                {profile.avatarUrl ? (
                                    <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} onError={() => setProfile(prev => prev ? { ...prev, avatarUrl: undefined } : prev)} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarInitial}>{(profile.hoten || '?').charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                                <View style={styles.profileInfo}>
                                    <Text style={styles.profileName}>{profile.hoten || 'Không có tên'}</Text>
                                    {profile.manv && <Text style={styles.profileCode}>{profile.manv}</Text>}
                                    {profile.chucvu && <Text style={styles.profileRole}>{profile.chucvu}</Text>}
                                </View>
                                <View style={styles.editButton}>
                                    <Ionicons name="create-outline" size={20} color="#f59e0b" />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.profileDetails}>
                                <View style={styles.detailRow}>
                                    <Ionicons name="call" size={18} color="#6b7280" />
                                    <Text style={styles.detailLabel}>Số điện thoại</Text>
                                    <Text style={styles.detailValue}>{profile.sdt || 'N/A'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Ionicons name="mail" size={18} color="#6b7280" />
                                    <Text style={styles.detailLabel}>Email</Text>
                                    <Text style={styles.detailValue}>{profile.email || 'N/A'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Ionicons name="id-card" size={18} color="#6b7280" />
                                    <Text style={styles.detailLabel}>Mã NV</Text>
                                    <Text style={styles.detailValue}>{profile.id ?? 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Không có dữ liệu hồ sơ</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cài đặt</Text>
                    <View style={styles.settingsCard}>
                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="notifications" size={22} color="#f59e0b" />
                                <Text style={styles.settingLabel}>Thông báo</Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                thumbColor={notificationsEnabled ? '#f59e0b' : '#f3f4f6'}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="moon" size={22} color="#8b5cf6" />
                                <Text style={styles.settingLabel}>Chế độ tối</Text>
                            </View>
                            <Switch
                                value={darkModeEnabled}
                                onValueChange={toggleDarkMode}
                                trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                                thumbColor={darkModeEnabled ? '#8b5cf6' : '#f3f4f6'}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="language" size={22} color="#3b82f6" />
                                <Text style={styles.settingLabel}>Ngôn ngữ</Text>
                            </View>
                            <View style={styles.settingRight}>
                                <Text style={styles.settingValue}>Tiếng Việt</Text>
                                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Về ứng dụng</Text>
                    <View style={styles.settingsCard}>
                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="help-circle" size={22} color="#10b981" />
                                <Text style={styles.settingLabel}>Trợ giúp & Hỗ trợ</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="shield-checkmark" size={22} color="#6b7280" />
                                <Text style={styles.settingLabel}>Chính sách bảo mật</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="information-circle" size={22} color="#3b82f6" />
                                <Text style={styles.settingLabel}>Phiên bản</Text>
                            </View>
                            <Text style={styles.settingValue}>1.0.0</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Modal visible={showEditModal} animationType="slide" transparent>
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContent}>
                            <Text style={modalStyles.modalTitle}>Chỉnh sửa thông tin</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={modalStyles.avatarSection}>
                                    <TouchableOpacity style={modalStyles.avatarPickerContainer} onPress={pickAvatar}>
                                        {selectedAvatar ? (
                                            <Image source={{ uri: selectedAvatar }} style={modalStyles.avatarPreview} onError={() => setSelectedAvatar(null)} />
                                        ) : profile?.avatarUrl ? (
                                            <Image source={{ uri: profile.avatarUrl }} style={modalStyles.avatarPreview} onError={() => setProfile(prev => prev ? { ...prev, avatarUrl: undefined } : prev)} />
                                        ) : (
                                            <View style={modalStyles.avatarPlaceholderModal}>
                                                <Text style={modalStyles.avatarInitialModal}>{(editName || profile?.hoten || '?').charAt(0).toUpperCase()}</Text>
                                            </View>
                                        )}
                                        <View style={modalStyles.avatarOverlay}>
                                            <Ionicons name="camera" size={24} color="#fff" />
                                            <Text style={modalStyles.avatarOverlayText}>Đổi ảnh</Text>
                                        </View>
                                    </TouchableOpacity>
                                    {uploadingAvatar && (
                                        <View style={modalStyles.uploadingOverlay}>
                                            <ActivityIndicator size="small" color="#f59e0b" />
                                            <Text style={modalStyles.uploadingText}>Đang tải lên...</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={modalStyles.formGroup}>
                                    <Text style={modalStyles.label}>Họ và tên *</Text>
                                    <TextInput style={modalStyles.input} placeholder="Nhập họ tên" value={editName} onChangeText={setEditName} />
                                </View>

                                <View style={modalStyles.formGroup}>
                                    <Text style={modalStyles.label}>Số điện thoại</Text>
                                    <TextInput style={modalStyles.input} placeholder="Nhập số điện thoại" keyboardType="phone-pad" value={editPhone} onChangeText={setEditPhone} />
                                </View>

                                <View style={modalStyles.formGroup}>
                                    <Text style={modalStyles.label}>Email</Text>
                                    <TextInput style={modalStyles.input} placeholder="Nhập email" keyboardType="email-address" autoCapitalize="none" value={editEmail} onChangeText={setEditEmail} />
                                </View>

                                <View style={modalStyles.infoBox}>
                                    <Ionicons name="information-circle" size={18} color="#3b82f6" />
                                    <Text style={modalStyles.infoText}>Mã nhân viên và chức vụ không thể thay đổi</Text>
                                </View>
                            </ScrollView>

                            <View style={modalStyles.modalActions}>
                                <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => setShowEditModal(false)} disabled={updating}>
                                    <Text style={modalStyles.modalBtnText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#f59e0b' }]} onPress={handleUpdateProfile} disabled={updating}>
                                    {updating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[modalStyles.modalBtnText, { color: '#fff' }]}>Cập nhật</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out" size={20} color="#fff" />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#6b7280',
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#fef3c7',
    },
    avatarPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    profileCode: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    profileRole: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f59e0b',
    },
    profileDetails: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    settingsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingValue: {
        fontSize: 14,
        color: '#6b7280',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        marginHorizontal: 16,
        marginTop: 32,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

const modalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 20,
        textAlign: 'center',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#f9fafb',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dbeafe',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 18,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    modalBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    modalBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarPickerContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 2,
        borderColor: '#f59e0b',
    },
    avatarPreview: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    avatarPlaceholderModal: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitialModal: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarOverlayText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    uploadingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    uploadingText: {
        fontSize: 13,
        color: '#f59e0b',
        fontWeight: '600',
    },
});
 
