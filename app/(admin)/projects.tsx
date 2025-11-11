import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function ProjectsManagement() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>📋 Quản lý dự án</Text>
                <Text style={styles.description}>
                    Đây là trang quản lý dự án dành cho Admin.
                    {'\n\n'}
                    Các chức năng sẽ bao gồm:
                    {'\n'}• Xem tất cả dự án trong hệ thống
                    {'\n'}• Tạo dự án mới
                    {'\n'}• Chỉnh sửa thông tin dự án
                    {'\n'}• Phân công người quản lý dự án
                    {'\n'}• Theo dõi tiến độ tổng thể
                    {'\n'}• Báo cáo hiệu suất dự án
                    {'\n'}• Thiết lập deadline và milestone
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