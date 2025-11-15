import { Stack } from 'expo-router';
import React from 'react';

export default function ManagerLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: 'Trang chủ Quản lý'
                }}
            />
            <Stack.Screen
                name="my-projects"
                options={{
                    title: 'Dự án của tôi',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="tasks"
                options={{
                    title: 'Công việc',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="team"
                options={{
                    title: 'Nhóm',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="kanban"
                options={{
                    title: 'Bảng Kanban',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="timeline"
                options={{
                    title: 'Lịch công việc',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="project-detail"
                options={{
                    title: 'Chi tiết dự án',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="group-detail"
                options={{
                    title: 'Chi tiết nhóm',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="reports"
                options={{
                    title: 'Báo cáo',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="profile"
                options={{
                    title: 'Hồ sơ cá nhân',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="task-detail"
                options={{
                    title: 'Chi tiết công việc',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="subtask-detail"
                options={{
                    title: 'Chi tiết công việc con',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="task-subtasks"
                options={{
                    title: 'Danh sách công việc con',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
        </Stack>
    );
}