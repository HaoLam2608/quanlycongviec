import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function MyProjects() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>📋 Dự án của tôi</Text>
                <Text style={styles.description}>
                    Đây là trang quản lý dự án dành cho Manager.
                    {'\n\n'}
                    Các chức năng sẽ bao gồm:
                    {'\n'}• Xem danh sách dự án được phân công
                    {'\n'}• Tạo và chỉnh sửa thông tin dự án
                    {'\n'}• Thiết lập timeline và milestone
                    {'\n'}• Phân công công việc cho thành viên
                    {'\n'}• Theo dõi tiến độ thực hiện
                    {'\n'}• Tạo báo cáo tiến độ dự án
                    {'\n'}• Quản lý tài liệu dự án
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
    content: {
        padding: 20,
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