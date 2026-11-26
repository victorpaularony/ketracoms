import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AdminColors } from '@/constants/theme';

const KetracoTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: AdminColors.primary,
    background: AdminColors.bg,
    card: AdminColors.surface,
    text: AdminColors.textPri,
    border: AdminColors.border,
    notification: AdminColors.accent,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={KetracoTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
        <Stack.Screen name="reports" options={{ title: 'Reports' }} />
        <Stack.Screen name="feedback" options={{ title: 'Feedback' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
