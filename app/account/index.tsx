import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '@supabase/supabase-js';
import {
  getCurrentUser,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  testSupabaseConnection,
} from '../../services/auth';
import { isSupabaseConfigured } from '../../services/supabase';

type AuthMode = 'signIn' | 'signUp';

export default function AccountScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');

  const fetchCurrentUser = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCurrentUser();
    }, [fetchCurrentUser])
  );

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      Alert.alert('Missing info', 'Enter an email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setIsLoading(true);

    const result =
      authMode === 'signIn'
        ? await signInWithEmail(trimmedEmail, password)
        : await signUpWithEmail(trimmedEmail, password, displayName);

    setIsLoading(false);

    if (!result.ok) {
      Alert.alert('Account error', result.message);
      return;
    }

    await fetchCurrentUser();
    Alert.alert('Account', result.message);
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    const result = await signOut();
    setIsLoading(false);

    if (!result.ok) {
      Alert.alert('Sign out failed', result.message);
      return;
    }

    setCurrentUser(null);
    Alert.alert('Account', result.message);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    const result = await testSupabaseConnection();
    setIsLoading(false);
    setConnectionStatus(result.message);

    if (!result.ok) {
      Alert.alert('Connection issue', result.message);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Account' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.appName}>Reptra</Text>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>
            This is the first Supabase login layer. Local workouts still work even
            if you are signed out.
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
              {isSupabaseConfigured()
                ? 'Supabase Connected'
                : 'Supabase Not Configured'}
            </Text>
            <Text style={styles.statusText}>
              {isSupabaseConfigured()
                ? 'You can sign up or sign in with your Supabase project.'
                : 'Add your Supabase URL and anon key to a local .env file, then restart Expo.'}
            </Text>

            <Pressable
              style={styles.connectionButton}
              onPress={handleTestConnection}
              disabled={!isSupabaseConfigured() || isLoading}
            >
              <Text style={styles.connectionButtonText}>Test Connection</Text>
            </Pressable>

            {connectionStatus ? (
              <Text style={styles.connectionStatus}>{connectionStatus}</Text>
            ) : null}
          </View>

          {currentUser ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Signed In</Text>
              <Text style={styles.signedInEmail}>{currentUser.email}</Text>
              <Text style={styles.sectionDescription}>
                Next session, we can use this account to start syncing local
                workouts to Supabase.
              </Text>

              <Pressable
                style={styles.secondaryButton}
                onPress={fetchCurrentUser}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Refresh Session</Text>
              </Pressable>

              <Pressable
                style={styles.dangerButton}
                onPress={handleSignOut}
                disabled={isLoading}
              >
                <Text style={styles.dangerButtonText}>Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <View style={styles.modeRow}>
                <Pressable
                  style={[
                    styles.modeButton,
                    authMode === 'signIn' && styles.modeButtonActive,
                  ]}
                  onPress={() => setAuthMode('signIn')}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      authMode === 'signIn' && styles.modeButtonTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modeButton,
                    authMode === 'signUp' && styles.modeButtonActive,
                  ]}
                  onPress={() => setAuthMode('signUp')}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      authMode === 'signUp' && styles.modeButtonTextActive,
                    ]}
                  >
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              {authMode === 'signUp' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Display name"
                  placeholderTextColor="#777777"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              ) : null}

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#777777"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#777777"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  (!isSupabaseConfigured() || isLoading) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!isSupabaseConfigured() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#111111" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {authMode === 'signIn' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
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
  connectionButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  connectionButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '800',
  },
  connectionStatus: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  sectionCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  signedInEmail: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  modeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modeButtonTextActive: {
    color: '#4da6ff',
  },
  input: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '800',
  },
  dangerButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ff8a8a',
    fontSize: 14,
    fontWeight: '800',
  },
});
