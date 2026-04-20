import { useCallback, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { loadSettings } from '../../storage/settings';
import { AppTheme } from '../../types/settings';
import { getThemePalette } from '../../utils/appTheme';

export default function HomeScreen() {
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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.appName, { color: palette.accent }]}>Reptra</Text>
      <Text style={[styles.title, { color: palette.text }]}>Home</Text>
      <Text style={[styles.text, { color: palette.subtext }]}>
        Your friends&apos; workout feed will go here later.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
