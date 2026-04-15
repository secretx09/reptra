import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { loadWorkouts } from '../../storage/workouts';
import { SavedWorkoutSession } from '../../types/workout';
import { calculateExercisePRs } from '../../utils/calculatePRs';
import PRCard from '../../components/PRCard';

export default function AllPRsScreen() {
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);

  useEffect(() => {
    const fetchWorkouts = async () => {
      const savedWorkouts = await loadWorkouts();
      setWorkouts(savedWorkouts);
    };

    fetchWorkouts();
  }, []);

  const exercisePRs = calculateExercisePRs(workouts);

  return (
    <>
      <Stack.Screen options={{ title: 'All PRs' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={exercisePRs}
          keyExtractor={(item) => item.exerciseId}
          renderItem={({ item }) => <PRCard pr={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No PRs yet. Finish a workout with weight entered to see them here.
            </Text>
          }
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
  emptyText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  listContent: {
    paddingBottom: 24,
  },
});