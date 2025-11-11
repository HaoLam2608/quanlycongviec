import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function SystemReports() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>📈 Báo cáo hệ thống</Text>
                <Text style={styles.description}>
                    Đây là trang báo cáo và thống kê dành cho Admin.
                    {'\n\n'}
                    Các chức năng sẽ bao gồm:
                    {'\n'}• Thống kê tổng quan hệ thống
                    {'\n'}• Báo cáo hiệu suất làm việc
                    {'\n'}• Phân tích tiến độ dự án
                    {'\n'}• Báo cáo theo thời gian
                    {'\n'}• Thống kê theo phòng ban/nhóm
                    {'\n'}• Xuất báo cáo PDF/Excel
                    {'\n'}• Dashboard với biểu đồ trực quan
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