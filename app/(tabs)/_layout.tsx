import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e1e5e9',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      {/* Hidden redirect tab - must be first for default route */}
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="member-dashboard/index"
        options={{
          title: 'Trang chủ',
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="member-tasks/index"
        options={{
          title: 'Công việc',
          tabBarLabel: 'Công việc',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "checkmark-circle" : "checkmark-circle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="member-kanban/index"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="member-projects/index"
        options={{
          title: 'Dự án',
          tabBarLabel: 'Dự án',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "folder" : "folder-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="member-calendar/index"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="member-timesheet/index"
        options={{
          title: 'Timesheet',
          tabBarLabel: 'Timesheet',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="member-profile/index"
        options={{
          title: 'Hồ sơ',
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

    </Tabs>
  );
}
