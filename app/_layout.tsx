import { CreovatorTheme } from '@/constants/theme';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import 'react-native-reanimated';
import { useResponsive } from '@/constants/useResponsive';


// Disables LogBox specifically for Web to prevent Metro LogContext crash
if (Platform.OS === 'web') {
  LogBox.ignoreAllLogs(true);
} else {
  LogBox.ignoreAllLogs();
}

export const unstable_settings = {
  anchor: 'index',
};

const creovatorNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: CreovatorTheme.colors.primary,
    background: CreovatorTheme.colors.bgDark,
    card: CreovatorTheme.colors.bgDarker,
    text: CreovatorTheme.colors.textWhite,
    border: CreovatorTheme.colors.cardBorder,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={creovatorNavTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: CreovatorTheme.colors.bgDark } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login-selection" />
        <Stack.Screen name="user-login" />
        <Stack.Screen name="admin-login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="events/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="events/create-custom" options={{ presentation: 'modal' }} />
        <Stack.Screen name="events/[id]/index" />
        <Stack.Screen name="events/[id]/participants" />
        <Stack.Screen name="certificates/index" />
        <Stack.Screen name="id-cards/index" />
        <Stack.Screen name="qr/scan" />
        <Stack.Screen name="emails/index" />
        <Stack.Screen name="design-studio/editor" />
        <Stack.Screen name="design-studio/my-designs" />
        <Stack.Screen name="payment/index" />
        <Stack.Screen name="admin/dashboard" />
        <Stack.Screen name="admin/organizers" />
        <Stack.Screen name="admin/events" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}