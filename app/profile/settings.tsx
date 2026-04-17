import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function ProfileSettingsScreen() {
  const showComingSoon = (label: string) => {
    Alert.alert('Coming soon', `${label} will be added later.`);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />

      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize Reptra later from here.</Text>

        <Pressable
          style={styles.settingRow}
          onPress={() => showComingSoon('Units')}
        >
          <View>
            <Text style={styles.settingTitle}>Units</Text>
            <Text style={styles.settingDescription}>
              Pounds / kilograms
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => showComingSoon('Rest timer defaults')}
        >
          <View>
            <Text style={styles.settingTitle}>Rest Timer Defaults</Text>
            <Text style={styles.settingDescription}>
              Set default rest times later
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => showComingSoon('Autofill preferences')}
        >
          <View>
            <Text style={styles.settingTitle}>Autofill Preferences</Text>
            <Text style={styles.settingDescription}>
              Control suggested weight/reps later
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => showComingSoon('Theme and appearance')}
        >
          <View>
            <Text style={styles.settingTitle}>Appearance</Text>
            <Text style={styles.settingDescription}>
              Theme and display options later
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => showComingSoon('Account and sync')}
        >
          <View>
            <Text style={styles.settingTitle}>Account & Sync</Text>
            <Text style={styles.settingDescription}>
              Cloud sync and login later
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 15,
    marginBottom: 20,
  },
  settingRow: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#aaaaaa',
    fontSize: 14,
  },
  chevron: {
    color: '#777777',
    fontSize: 24,
    fontWeight: '700',
  },
});