import { CreovatorTheme } from '@/constants/theme';
import { useResponsive } from '@/constants/useResponsive';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const r = useResponsive();

  // ⭐ 5 tabs sharing the width — on small phones, shrink icon/label/padding
  // instead of letting "AI Studio" squeeze/wrap and look cut off.
  const iconSize = r.size(0.055, 20, 24);
  const labelSize = r.font(0.03, 9.5, 11);
  const tabItemPadX = r.isSmallScreen ? 0 : 4;

  // Custom label renderer: shrinks to fit instead of wrapping/cutting,
  // and swaps in a shorter label on very small screens.
  const renderLabel = (fullLabel: string, shortLabel: string) =>
    ({ color, focused }: { color: string; focused: boolean }) => (
      <Text
        style={{
          color,
          fontSize: labelSize,
          fontWeight: '700',
          marginTop: 2,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {r.isSmallScreen ? shortLabel : fullLabel}
      </Text>
    );

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
          height: (Platform.OS === 'ios' ? 60 : 50) + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingHorizontal: tabItemPadX,
        },
        tabBarLabelStyle: {
          fontSize: labelSize,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: renderLabel('Dashboard', 'Home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarLabel: renderLabel('Events', 'Events'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="design"
        options={{
          title: 'Design',
          tabBarLabel: renderLabel('Design', 'Design'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'color-palette' : 'color-palette-outline'}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Studio',
          tabBarLabel: renderLabel('AI Studio', 'AI'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={iconSize}
              color={focused ? CreovatorTheme.colors.secondary : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: renderLabel('Profile', 'Profile'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={iconSize}
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