import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import LogoutButton from '../../components/ui/LogoutButton';

export default function UsersManagement() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>👥 Quản lý người dùng</Text>
                <LogoutButton variant="icon" size="md" iconType="power" />
            </View>
            <View style={styles.content}>
                <Text style={styles.description}>
                    Đây là trang quản lý người dùng dành cho Admin.
                    {'\n\n'}
                    Các chức năng sẽ bao gồm:
                    {'\n'}• Xem danh sách tất cả người dùng
                    {'\n'}• Thêm người dùng mới
                    {'\n'}• Chỉnh sửa thông tin người dùng
                    {'\n'}• Phân quyền và vai trò
                    {'\n'}• Khóa/mở khóa tài khoản
                    {'\n'}• Quản lý avatar và thông tin cá nhân
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 0,
    },
    content: {
        padding: 20,
        paddingTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        color: '#6b7280',
        lineHeight: 24,
    },
});