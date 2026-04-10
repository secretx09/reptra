import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { exercises } from '../../data/exercises';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const exercise = exercises.find((item) => item.id === id);

  if (!exercise) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Exercise not found</Text>
        <Text style={styles.notFoundText}>
          We could not find that exercise.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: exercise.name }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{exercise.name}</Text>

        <Text style={styles.meta}>
          {exercise.muscleGroup} • {exercise.equipment}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {exercise.instructions.map((step, index) => (
            <Text key={index} style={styles.listItem}>
              {index + 1}. {step}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Mistakes</Text>
          {exercise.commonMistakes.map((mistake, index) => (
            <Text key={index} style={styles.listItem}>
              • {mistake}
            </Text>
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  meta: {
    color: '#aaaaaa',
    fontSize: 16,
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  listItem: {
    color: '#dddddd',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  notFoundText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
  },
});