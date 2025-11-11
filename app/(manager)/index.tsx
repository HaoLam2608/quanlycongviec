import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import LogoutButton from '../../components/ui/LogoutButton';
import { PageHeader } from '../../components/ui/PageHeader';

export default function ManagerDashboard() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <PageHeader
                    title="Bảng điều khiển Manager"
                    subtitle="Quản lý dự án và nhóm làm việc"
                    role="manager"
                />
                <LogoutButton variant="icon" size="md" iconType="door" className="absolute top-4 right-4" />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Tổng quan dự án</Text>
                    <Text style={styles.placeholder}>
                        Đây là trang dashboard dành cho quản lý dự án.
                        Hiển thị tổng quan về các dự án đang quản lý.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Dự án của tôi</Text>
                    <Text style={styles.placeholder}>
                        Quản lý các dự án được phân công.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✅ Quản lý công việc</Text>
                    <Text style={styles.placeholder}>
                        Phân công và theo dõi tiến độ công việc.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Quản lý nhóm</Text>
                    <Text style={styles.placeholder}>
                        Quản lý thành viên trong nhóm làm việc.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Kanban Board</Text>
                    <Text style={styles.placeholder}>
                        Theo dõi tiến độ công việc trên bảng Kanban.
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