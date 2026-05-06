import * as Linking from 'expo-linking';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  exchangeAuthLinkForSession,
  getCurrentUser,
  parseAuthLink,
} from '../../services/auth';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
    type?: string;
  }>();
  const [status, setStatus] = useState('Opening your Reptra auth link...');
  const [title, setTitle] = useState('Account Link');
  const [isLoading, setIsLoading] = useState(true);
  const [linkType, setLinkType] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      setLinkType(params.type ?? null);

      if (params.error_description) {
        setTitle('Auth Link Failed');
        setStatus(params.error_description);
        setIsLoading(false);
        return;
      }

      if (params.error) {
        setTitle('Auth Link Failed');
        setStatus(params.error);
        setIsLoading(false);
        return;
      }

      if (params.code) {
        const result = await exchangeAuthLinkForSession(`?code=${params.code}`);
        setTitle(result.ok ? 'Auth Link Complete' : 'Auth Link Failed');
        setStatus(result.message);
        setIsLoading(false);
        return;
      }

      const initialUrl = await Linking.getInitialURL();
      const parsedInitialUrl = initialUrl ? parseAuthLink(initialUrl) : null;

      if (
        initialUrl &&
        parsedInitialUrl &&
        (parsedInitialUrl.code ||
          parsedInitialUrl.accessToken ||
          parsedInitialUrl.tokenHash ||
          parsedInitialUrl.error ||
          parsedInitialUrl.errorDescription)
      ) {
        setLinkType(parsedInitialUrl.type);
        const result = await exchangeAuthLinkForSession(initialUrl);
        setTitle(result.ok ? 'Auth Link Complete' : 'Auth Link Failed');
        setStatus(result.message);
        setIsLoading(false);
        return;
      }

      const user = await getCurrentUser();
      setTitle(user ? 'Already Signed In' : 'Open Reptra');
      setStatus(
        user
          ? 'You are signed in. You can return to Reptra.'
          : 'If Expo Go opened without finishing the link, copy the full email link and paste it into Account > Need help signing in. Production users will need an installed Reptra build or a website fallback later.'
      );
      setIsLoading(false);
    };

    handleCallback();
  }, [params.code, params.error, params.error_description, params.type]);

  return (
    <>
      <Stack.Screen options={{ title: 'Auth Callback' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.card}>
          <Text style={styles.appName}>Reptra</Text>
          <Text style={styles.title}>{title}</Text>

          {isLoading ? (
            <ActivityIndicator color="#4da6ff" style={styles.loader} />
          ) : null}

          <Text style={styles.message}>{status}</Text>

          {linkType ? (
            <Text style={styles.helperText}>Link type: {linkType}</Text>
          ) : null}

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
  helperText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
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
