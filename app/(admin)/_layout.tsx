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
                name="roles"
                options={{
                    title: 'Quản lý vai trò',
                    headerStyle: { backgroundColor: '#ef4444' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="role-detail"
                options={{
                    title: 'Chi tiết vai trò',
                    headerShown: false,
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
                name="project-detail"
                options={{
                    title: 'Chi tiết dự án',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="groups"
                options={{
                    title: 'Quản lý nhóm',
                    headerStyle: { backgroundColor: '#ef4444' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="group-detail"
                options={{
                    title: 'Chi tiết nhóm',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="approvals"
                options={{
                    title: 'Phê duyệt',
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
            <Stack.Screen
                name="documents"
                options={{
                    title: 'Quản lý tài liệu',
                    headerStyle: { backgroundColor: '#ef4444' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="notifications"
                options={{
                    title: 'Thông báo',
                    headerStyle: { backgroundColor: '#ef4444' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="settings"
                options={{
                    title: 'Cài đặt hệ thống',
                    headerStyle: { backgroundColor: '#ef4444' },
                    headerTintColor: '#fff'
                }}
            />
        </Stack>
    );
}