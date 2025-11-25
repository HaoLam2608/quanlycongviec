import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Props = any;

const ICON_MAP: Record<string, { name: string; label: string }> = {
  'member-dashboard/index': { name: 'home-outline', label: 'Trang chủ' },
  'member-tasks/index': { name: 'checkmark-circle-outline', label: 'Công việc' },
  'member-kanban/index': { name: 'grid-outline', label: 'Kanban' },
  'member-projects/index': { name: 'folder-outline', label: 'Dự án' },
  'member-calendar/index': { name: 'calendar-outline', label: 'Lịch' },
  'member-timesheet/index': { name: 'time-outline', label: 'Timesheet' },
  'member-profile/index': { name: 'person-outline', label: 'Hồ sơ' },
};

export default function CustomTabBar({ state, descriptors, navigation }: Props) {
  // Only show a fixed whitelist of routes to avoid stray/errored tabs
  const whitelist = Object.keys(ICON_MAP);

  return (
    <View style={styles.container}>
      {state.routes
        .filter((r: any) => whitelist.includes(r.name))
        .map((route: any, index: number) => {
          const { options } = descriptors[route.key] || {};
          const focused = state.index === state.routes.indexOf(route);
          const meta = ICON_MAP[route.name] || { name: 'ellipse-outline', label: route.name };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tab}
            >
              <Ionicons name={focused ? meta.name.replace('-outline', '') : meta.name} size={22} color={focused ? '#667eea' : '#999'} />
              <Text style={[styles.label, focused && { color: '#667eea' }]} numberOfLines={1}>{meta.label}</Text>
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    backgroundColor: '#fff',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    color: '#999'
  }
});
