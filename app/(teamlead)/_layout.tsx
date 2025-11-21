import { Stack } from 'expo-router';
import React from 'react';

export default function TeamLeadLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: 'Bảng điều khiển Team Lead'
                }}
            />
            <Stack.Screen
                name="group"
                options={{
                    title: 'Nhóm của tôi',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="projects"
                options={{
                    title: 'Dự án tham gia',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="project-detail"
                options={{
                    title: 'Chi tiết dự án',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="group-detail"
                options={{
                    title: 'Chi tiết nhóm',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="tasks"
                options={{
                    title: 'Công việc',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="task-detail"
                options={{
                    title: 'Chi tiết công việc',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="subtasks"
                options={{
                    title: 'Bảng công việc con',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="subtask-detail"
                options={{
                    title: 'Chi tiết công việc con',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="subtask-form"
                options={{
                    title: 'Cập nhật công việc con',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="documents"
                options={{
                    title: 'Tài liệu nhóm',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="approvals"
                options={{
                    title: 'Phê duyệt',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="reports"
                options={{
                    title: 'Báo cáo',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="profile"
                options={{
                    title: 'Hồ sơ cá nhân',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="notifications"
                options={{
                    title: 'Thông báo',
                    headerStyle: { backgroundColor: '#7c3aed' },
                    headerTintColor: '#fff'
                }}
            />
        </Stack>
    );
}
