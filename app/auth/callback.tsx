import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  exchangeAuthCodeForSession,
  getCurrentUser,
} from '../../services/auth';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [status, setStatus] = useState('Confirming your account...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      if (params.error_description) {
        setStatus(params.error_description);
        setIsLoading(false);
        return;
      }

      if (params.code) {
        const result = await exchangeAuthCodeForSession(params.code);
        setStatus(result.message);
        setIsLoading(false);
        return;
      }

      const user = await getCurrentUser();
      setStatus(
        user
          ? 'You are signed in. You can return to Reptra.'
          : 'Your email may be confirmed. Return to Reptra and sign in.'
      );
      setIsLoading(false);
    };

    handleCallback();
  }, [params.code, params.error_description]);

  return (
    <>
      <Stack.Screen options={{ title: 'Auth Callback' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.card}>
          <Text style={styles.appName}>Reptra</Text>
          <Text style={styles.title}>Account Confirmation</Text>

          {isLoading ? (
            <ActivityIndicator color="#4da6ff" style={styles.loader} />
          ) : null}

          <Text style={styles.message}>{status}</Text>

          <Pressable
            style={styles.button}
            onPress={() => router.replace('/account' as never)}
          >
            <Text style={styles.buttonText}>Back to Account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 18,
    padding: 18,
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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 10,
  },
  message: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
});
