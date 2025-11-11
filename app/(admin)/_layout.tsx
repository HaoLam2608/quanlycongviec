import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: 'Admin Dashboard'
                }}
            />
            <Stack.Screen
                name="users"
                options={{
                    title: 'Quản lý người dùng',
                    headerStyle: { backgroundColor: '#ef4444' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="projects"
                options={{
                    title: 'Quản lý dự án',
                    headerStyle: { backgroundColor: '#ef4444' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="reports"
                options={{
                    title: 'Báo cáo hệ thống',
                    headerStyle: { backgroundColor: '#ef4444' },
                    headerTintColor: '#fff'
                }}
            />
        </Stack>
    );
}