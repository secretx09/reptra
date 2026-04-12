import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.appName}>Reptra</Text>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.text}>
        Your friends&apos; workout feed will go here later.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appName: {
    color: '#4da6ff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  text: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
  },
});