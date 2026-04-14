import { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Exercise } from '../../types/exercise';
import { RoutineWithExercises } from '../../types/routine';
import { deleteRoutineById, loadRoutines } from '../../storage/routines';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);

  useEffect(() => {
    const fetchRoutine = async () => {
      const routines = await loadRoutines();
      const foundRoutine = routines.find((item) => item.id === id) || null;
      setRoutine(foundRoutine);
    };

    fetchRoutine();
  }, [id]);

  const handleDeleteRoutine = () => {
    if (!routine) return;

    Alert.alert(
      'Delete routine',
      `Are you sure you want to delete "${routine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRoutineById(routine.id);
            router.back();
          },
        },
      ]
    );
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Routine not found</Text>
        <Text style={styles.notFoundText}>
          This routine may have been deleted.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: routine.name }} />

      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{routine.name}</Text>
        <Text style={styles.subtitle}>
          {routine.exercises.length} exercise{routine.exercises.length === 1 ? '' : 's'}
        </Text>

        <Text style={styles.sectionTitle}>Exercises</Text>

        <FlatList
          data={routine.exercises}
          keyExtractor={(item: Exercise) => item.id}
          renderItem={({ item, index }) => (
            <SafeAreaView style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>
                {index + 1}. {item.name}
              </Text>
              <Text style={styles.exerciseMeta}>
                {item.muscleGroup} • {item.equipment}
              </Text>
            </SafeAreaView>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <Pressable
          style={styles.startButton}
          onPress={() => router.push(`/workout/session/${routine.id}`)}
        >
          <Text style={styles.startButtonText}>Start Routine</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={handleDeleteRoutine}>
          <Text style={styles.deleteButtonText}>Delete Routine</Text>
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
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  exerciseCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseMeta: {
    color: '#aaaaaa',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  startButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff8a8a',
    fontSize: 16,
    fontWeight: '700',
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