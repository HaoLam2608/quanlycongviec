import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import LogoutButton from '../../components/ui/LogoutButton';
import { PageHeader } from '../../components/ui/PageHeader';

export default function AdminDashboard() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <PageHeader
                    title="Bảng điều khiển Admin"
                    subtitle="Quản lý toàn bộ hệ thống"
                    role="admin"
                />
                <LogoutButton variant="icon" size="md" iconType="power" className="absolute top-4 right-4" />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Thống kê tổng quan</Text>
                    <Text style={styles.placeholder}>
                        Đây là trang dashboard dành cho quản trị viên.
                        Hiển thị thống kê tổng quan về hệ thống.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Quản lý người dùng</Text>
                    <Text style={styles.placeholder}>
                        Chức năng quản lý tất cả người dùng trong hệ thống.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Quản lý dự án</Text>
                    <Text style={styles.placeholder}>
                        Xem và quản lý tất cả dự án trong tổ chức.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📈 Báo cáo và thống kê</Text>
                    <Text style={styles.placeholder}>
                        Xem báo cáo chi tiết và phân tích dữ liệu.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚙️ Cài đặt hệ thống</Text>
                    <Text style={styles.placeholder}>
                        Cấu hình và thiết lập hệ thống.
                    </Text>
                </View>
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
        position: 'relative',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    placeholder: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        fontStyle: 'italic',
    },
});