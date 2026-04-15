import { useCallback, useMemo, useState } from 'react';
import { Text, StyleSheet, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { loadWorkouts } from '../../storage/workouts';
import { SavedWorkoutSession, ExercisePR } from '../../types/workout';
import WorkoutHistoryCard from '../../components/WorkoutHistoryCard';
import StatCard from '../../components/StatCard';
import PRCard from '../../components/PRCard';
import { calculateExercisePRs } from '../../utils/calculatePRs';

export default function ProfileScreen() {
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);

  const fetchWorkouts = async () => {
    const savedWorkouts = await loadWorkouts();
    setWorkouts(savedWorkouts);
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const totalWorkouts = workouts.length;

  const totalSets = useMemo(() => {
    return workouts.reduce((workoutSum, workout) => {
      return (
        workoutSum +
        workout.exercises.reduce((exerciseSum, exercise) => {
          return exerciseSum + exercise.sets.length;
        }, 0)
      );
    }, 0);
  }, [workouts]);

  const totalExercisesLogged = useMemo(() => {
    return workouts.reduce((sum, workout) => {
      return sum + workout.exercises.length;
    }, 0);
  }, [workouts]);

  const exercisePRs = useMemo(() => {
    return calculateExercisePRs(workouts);
  }, [workouts]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your recent workouts</Text>

      <View style={styles.statsRow}>
        <StatCard label="Total Workouts" value={totalWorkouts} />
        <StatCard label="Total Sets" value={totalSets} />
        <StatCard label="Exercises Logged" value={totalExercisesLogged} />
      </View>

      <Text style={styles.sectionTitle}>Personal Records</Text>

      {exercisePRs.length === 0 ? (
        <Text style={styles.emptyPRText}>
          No PRs yet. Finish a workout with weight entered to see them here.
        </Text>
      ) : (
        <View style={styles.prList}>
          {exercisePRs.slice(0, 5).map((pr) => (
            <PRCard key={pr.exerciseId} pr={pr} />
          ))}
        </View>
      )}

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutHistoryCard
            workout={item}
            onPress={() => router.push(`/workout/history/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No workouts yet. Finish a workout to see it here.
          </Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  prList: {
    marginBottom: 18,
  },
  emptyPRText: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 18,
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