import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function TeamManagement() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>👥 Quản lý nhóm</Text>
                <Text style={styles.description}>
                    Đây là trang quản lý nhóm làm việc dành cho Manager.
                    {'\n\n'}
                    Các chức năng sẽ bao gồm:
                    {'\n'}• Xem danh sách thành viên trong nhóm
                    {'\n'}• Phân công vai trò và trách nhiệm
                    {'\n'}• Theo dõi hiệu suất làm việc
                    {'\n'}• Đánh giá và feedback
                    {'\n'}• Quản lý lịch làm việc
                    {'\n'}• Chat và giao tiếp nhóm
                    {'\n'}• Báo cáo hoạt động thành viên
                    {'\n'}• Tạo meeting và họp nhóm
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