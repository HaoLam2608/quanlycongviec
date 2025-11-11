import { Stack } from 'expo-router';
import React from 'react';

export default function ManagerLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: 'Manager Dashboard'
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
                    title: 'Quản lý công việc',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="team"
                options={{
                    title: 'Quản lý nhóm',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
            <Stack.Screen
                name="kanban"
                options={{
                    title: 'Kanban Board',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff'
                }}
            />
        </Stack>
    );
}