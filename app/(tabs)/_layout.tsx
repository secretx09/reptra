import { useCallback, useState } from 'react';
import { Tabs, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { IconSymbol } from '../../components/ui/icon-symbol';
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
        headerShadowVisible: false,
        headerTitleAlign: 'center',
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
        options={{
          title: 'Home',
          headerTitle: 'Reptra',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          headerTitle: 'Reptra',
          tabBarIcon: ({ color }) => (
            <Ionicons name="barbell" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Reptra',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="person.crop.circle.fill" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
