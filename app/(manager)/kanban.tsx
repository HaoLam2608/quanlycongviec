import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function KanbanBoard() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>📋 Kanban Board</Text>
                <Text style={styles.description}>
                    Đây là trang Kanban Board dành cho Manager.
                    {'\n\n'}
                    Các chức năng sẽ bao gồm:
                    {'\n'}• Hiển thị công việc theo cột trạng thái
                    {'\n'}• Kéo thả để thay đổi trạng thái
                    {'\n'}• Lọc theo người thực hiện
                    {'\n'}• Lọc theo dự án
                    {'\n'}• Tìm kiếm nhanh công việc
                    {'\n'}• Thêm ghi chú và comment
                    {'\n'}• Thiết lập màu sắc theo độ ưu tiên
                    {'\n'}• Xuất view Kanban thành hình ảnh
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