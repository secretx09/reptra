import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadSettings } from '../storage/settings';
import { AppTheme } from '../types/settings';
import { getThemePalette } from '../utils/appTheme';

export default function RootLayout() {
  const [theme, setTheme] = useState<AppTheme>('graphite');
  const palette = getThemePalette(theme);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await loadSettings();
      setTheme(settings.theme);
    };

    fetchSettings();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitle: 'Reptra',
          headerStyle: {
            backgroundColor: palette.background,
          },
          headerTintColor: palette.text,
          headerShadowVisible: false,
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: palette.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
