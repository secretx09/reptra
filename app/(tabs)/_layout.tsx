import { useCallback, useState } from 'react';
import { Tabs, useFocusEffect } from 'expo-router';
import { loadSettings } from '../../storage/settings';
import { AppTheme } from '../../types/settings';
import { getThemePalette } from '../../utils/appTheme';

export default function TabsLayout() {
  const [theme, setTheme] = useState<AppTheme>('graphite');
  const palette = getThemePalette(theme);

  useFocusEffect(
    useCallback(() => {
      const fetchSettings = async () => {
        const settings = await loadSettings();
        setTheme(settings.theme);
      };

      fetchSettings();
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: palette.background,
        },
        headerTintColor: palette.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
        },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: '#888888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerTitle: 'Reptra' }}
      />
      <Tabs.Screen
        name="workout"
        options={{ title: 'Workout', headerTitle: 'Reptra' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', headerTitle: 'Reptra' }}
      />
    </Tabs>
  );
}
