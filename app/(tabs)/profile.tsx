import { useCallback, useMemo, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { loadWorkouts } from '../../storage/workouts';
import { SavedWorkoutSession } from '../../types/workout';
import WorkoutHistoryCard from '../../components/WorkoutHistoryCard';
import StatCard from '../../components/StatCard';
import PRCard from '../../components/PRCard';
import { calculateExercisePRs } from '../../utils/calculatePRs';
import { calculateWeeklyStats } from '../../utils/calculateWeeklyStats';

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

  const weeklyStats = useMemo(() => {
    return calculateWeeklyStats(workouts);
  }, [workouts]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutHistoryCard
            workout={item}
            onPress={() => router.push(`/workout/history/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Profile</Text>
                <Text style={styles.subtitle}>Your recent workouts</Text>
              </View>

              <Pressable
                style={styles.settingsButton}
                onPress={() => router.push('/profile/settings')}
              >
                <Text style={styles.settingsButtonText}>Settings</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <StatCard label="Total Workouts" value={totalWorkouts} />
              <StatCard label="Total Sets" value={totalSets} />
              <StatCard label="Exercises Logged" value={totalExercisesLogged} />
            </View>

            <Text style={styles.sectionTitle}>This Week</Text>

            <View style={styles.statsRow}>
              <StatCard label="Workouts" value={weeklyStats.workoutsThisWeek} />
              <StatCard label="Sets" value={weeklyStats.setsThisWeek} />
              <StatCard label="Exercises" value={weeklyStats.exercisesThisWeek} />
            </View>

            <Text style={styles.sectionTitle}>Personal Records</Text>

            {exercisePRs.length === 0 ? (
              <Text style={styles.emptyPRText}>
                No PRs yet. Finish a workout with weight entered to see them here.
              </Text>
            ) : (
              <>
                <View style={styles.prList}>
                  {exercisePRs.slice(0, 3).map((pr) => (
                    <PRCard key={pr.exerciseId} pr={pr} />
                  ))}
                </View>

                {exercisePRs.length > 3 && (
                  <Text
                    style={styles.viewAllLink}
                    onPress={() => router.push('/profile/prs')}
                  >
                    View All PRs
                  </Text>
                )}
              </>
            )}

            <Text style={styles.sectionTitle}>Workout History</Text>
          </>
        }
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
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
  },
  settingsButton: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
    marginBottom: 10,
  },
  emptyPRText: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 18,
  },
  viewAllLink: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
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