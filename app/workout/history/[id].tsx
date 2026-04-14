import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadWorkouts } from '../../../storage/workouts';
import { SavedExerciseLog, SavedWorkoutSession, WorkoutSet } from '../../../types/workout';

export default function WorkoutHistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<SavedWorkoutSession | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      const workouts = await loadWorkouts();
      const foundWorkout = workouts.find((item) => item.id === id) || null;
      setWorkout(foundWorkout);
    };

    fetchWorkout();
  }, [id]);

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFoundTitle}>Workout not found</Text>
        <Text style={styles.notFoundText}>
          This workout may have been deleted.
        </Text>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(workout.completedAt).toLocaleDateString();
  const formattedTime = new Date(workout.completedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const totalSets = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Workout Details' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={workout.exercises}
          keyExtractor={(item) => item.exerciseId}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.title}>{workout.routineName}</Text>
              <Text style={styles.subtitle}>
                {formattedDate} at {formattedTime}
              </Text>
              <Text style={styles.subtitle}>
                {workout.exercises.length} exercise
                {workout.exercises.length === 1 ? '' : 's'} • {totalSets} set
                {totalSets === 1 ? '' : 's'}
              </Text>
            </View>
          }
          renderItem={({ item, index }: { item: SavedExerciseLog; index: number }) => (
            <View style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>
                {index + 1}. {item.exerciseName}
              </Text>

              {item.sets.map((set: WorkoutSet) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setLabel}>Set {set.setNumber}</Text>
                  <Text style={styles.setValue}>{set.weight || '-'} lb</Text>
                  <Text style={styles.setValue}>{set.reps || '-'} reps</Text>
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
  headerCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 2,
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
    marginBottom: 10,
  },
  setRow: {
    backgroundColor: '#161616',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  setValue: {
    color: '#aaaaaa',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  notFoundTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
  },
});