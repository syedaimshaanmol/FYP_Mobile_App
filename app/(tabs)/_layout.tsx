import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreovatorTheme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: CreovatorTheme.colors.primary,
        tabBarInactiveTintColor: CreovatorTheme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: CreovatorTheme.colors.bgDarker,
          borderTopWidth: 1,
          borderTopColor: CreovatorTheme.colors.cardBorder,
          height: Platform.OS === 'ios' ? 88 : 68 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="design"
        options={{
          title: 'Design',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'color-palette' : 'color-palette-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Studio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={22}
              color={focused ? CreovatorTheme.colors.secondary : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      {/* Hide old explore tab */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
