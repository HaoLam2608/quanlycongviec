import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    role?: string;
}

export function PageHeader({ title, subtitle, role }: PageHeaderProps) {
    const getRoleColor = () => {
        switch (role) {
            case 'admin': return '#ef4444';
            case 'manager': return '#f59e0b';
            case 'employee': return '#10b981';
            default: return '#667eea';
        }
    };

    const getRoleLabel = () => {
        switch (role) {
            case 'admin': return 'Quản trị viên';
            case 'manager': return 'Quản lý dự án';
            case 'employee': return 'Nhân viên';
            default: return '';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && (
                    <Text style={styles.subtitle}>{subtitle}</Text>
                )}
                {role && (
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor() }]}>
                        <Text style={styles.roleText}>{getRoleLabel()}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    roleText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
});