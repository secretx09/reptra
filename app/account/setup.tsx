import { Stack, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthRedirectUrl } from '../../services/auth';
import { getSupabaseUrl, isSupabaseConfigured } from '../../services/supabase';

const schemaSteps = [
  'Open Supabase, then go to SQL Editor.',
  'Paste and run the contents of reptra/supabase/schema.sql.',
  'Make sure Authentication > URL Configuration includes the Expo redirect below for confirmation and password reset emails.',
  'The profile policy also allows signed-in users to check public usernames for availability.',
  'The profiles table includes display name, username, bio, and training focus for future social features.',
  'Restart Expo after changing .env values.',
];

export default function AccountSetupScreen() {
  const redirectUrl = getAuthRedirectUrl();
  const projectUrl = getSupabaseUrl();

  return (
    <>
      <Stack.Screen options={{ title: 'Supabase Setup' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.appName}>Reptra</Text>
          <Text style={styles.title}>Supabase Setup</Text>
          <Text style={styles.subtitle}>
            A quick checklist for making the current cloud account, backup, and
            restore tools work safely.
          </Text>

          <View
            style={[
              styles.statusCard,
              isSupabaseConfigured() && styles.statusCardReady,
            ]}
          >
            <Text
              style={[
                styles.statusTitle,
                isSupabaseConfigured() && styles.statusTitleReady,
              ]}
            >
              {isSupabaseConfigured() ? 'Environment Ready' : 'Missing .env'}
            </Text>
            <Text style={styles.statusText}>
              {isSupabaseConfigured()
                ? `Project URL: ${projectUrl}`
                : 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to reptra/.env, then restart Expo.'}
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Checklist</Text>
            {schemaSteps.map((step, index) => (
              <View key={step} style={styles.checklistRow}>
                <Text style={styles.checklistNumber}>{index + 1}</Text>
                <Text style={styles.checklistText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Confirmation Redirect</Text>
            <Text style={styles.sectionDescription}>
              Put this exact URL in Supabase Authentication URL Configuration
              while testing in Expo Go.
            </Text>
            <Text style={styles.urlText}>{redirectUrl}</Text>
            <Text style={styles.helperText}>
              If your computer IP changes, this Expo redirect can change too.
              Update Supabase with the new value shown here.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Current Tables</Text>
            <Text style={styles.sectionDescription}>
              The app currently expects these Supabase tables:
            </Text>
            <Text style={styles.tableName}>profiles</Text>
            <Text style={styles.tableName}>cloud_records</Text>
            <Text style={styles.helperText}>
              Both tables use Row Level Security so users can only access their
              own profile and cloud backup records.
            </Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/account' as never)}
          >
            <Text style={styles.primaryButtonText}>Back To Account</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  appName: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  statusCardReady: {
    backgroundColor: '#101c29',
    borderColor: '#294969',
  },
  statusTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusTitleReady: {
    color: '#4da6ff',
  },
  statusText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  checklistRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  checklistNumber: {
    backgroundColor: '#16324d',
    borderRadius: 999,
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
    height: 24,
    lineHeight: 24,
    textAlign: 'center',
    width: 24,
  },
  checklistText: {
    color: '#ffffff',
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  urlText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 10,
  },
  tableName: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  helperText: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
});
