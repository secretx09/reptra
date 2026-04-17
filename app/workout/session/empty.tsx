import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmptyWorkoutSessionScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Empty Workout' }} />

      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Empty Workout</Text>
        <Text style={styles.subtitle}>
          This workout started without a routine.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Next step</Text>
          <Text style={styles.infoText}>
            In the next session, we’ll let you add exercises into this workout live.
          </Text>
        </View>

        <Pressable
          style={styles.actionButton}
          onPress={() =>
            Alert.alert(
              'Coming next',
              'Adding exercises to a blank workout is the next step.'
            )
          }
        >
          <Text style={styles.actionButtonText}>Add Exercise</Text>
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 18,
  },
  infoCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
});