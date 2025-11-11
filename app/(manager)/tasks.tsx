import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function TaskManagement() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>✅ Quản lý công việc</Text>
                <Text style={styles.description}>
                    Đây là trang quản lý công việc dành cho Manager.
                    {'\n\n'}
                    Các chức năng sẽ bao gồm:
                    {'\n'}• Tạo và phân công công việc mới
                    {'\n'}• Thiết lập độ ưu tiên và deadline
                    {'\n'}• Theo dõi trạng thái công việc
                    {'\n'}• Tạo subtask và checklist
                    {'\n'}• Gán người thực hiện
                    {'\n'}• Comment và feedback
                    {'\n'}• Báo cáo tiến độ công việc
                    {'\n'}• Export danh sách công việc
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