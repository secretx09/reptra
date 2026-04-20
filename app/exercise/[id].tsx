import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadWorkouts } from '../../storage/workouts';
import { SavedWorkoutSession } from '../../types/workout';
import { Exercise } from '../../types/exercise';
import { loadExerciseLibrary } from '../../utils/exerciseLibrary';
import { calculateEstimatedOneRepMax } from '../../utils/oneRepMax';

type ExerciseProgressPoint = {
  id: string;
  completedAt: string;
  label: string;
  bestWeight: number;
  bestEstimatedOneRepMax: number;
  totalVolume: number;
  totalSets: number;
};

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const savedWorkouts = await loadWorkouts();
      const loadedExercises = await loadExerciseLibrary();
      setWorkouts(savedWorkouts);
      setExerciseLibrary(loadedExercises);
    };

    fetchData();
  }, []);

  const exercise = exerciseLibrary.find((item) => item.id === id);

  const progressPoints = useMemo(() => {
    if (!id) return [];

    return workouts
      .map((workout) => {
        const exerciseLog = workout.exercises.find((item) => item.exerciseId === id);

        if (!exerciseLog || exerciseLog.sets.length === 0) {
          return null;
        }

        let bestWeight = 0;
        let bestEstimatedOneRepMax = 0;
        let totalVolume = 0;

        exerciseLog.sets.forEach((set) => {
          const weight = Number(set.weight);
          const reps = Number(set.reps);

          if (!Number.isNaN(weight) && weight > 0) {
            bestWeight = Math.max(bestWeight, weight);

            if (!Number.isNaN(reps) && reps > 0) {
              totalVolume += weight * reps;
              bestEstimatedOneRepMax = Math.max(
                bestEstimatedOneRepMax,
                calculateEstimatedOneRepMax(weight, reps)
              );
            } else {
              bestEstimatedOneRepMax = Math.max(bestEstimatedOneRepMax, weight);
            }
          }
        });

        return {
          id: workout.id,
          completedAt: workout.completedAt,
          label: formatShortDate(workout.completedAt),
          bestWeight,
          bestEstimatedOneRepMax,
          totalVolume,
          totalSets: exerciseLog.sets.length,
        } satisfies ExerciseProgressPoint;
      })
      .filter((item): item is ExerciseProgressPoint => item !== null)
      .sort(
        (a, b) =>
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      );
  }, [id, workouts]);

  const latestPoints = progressPoints.slice(-6);
  const maxChartValue = Math.max(
    ...latestPoints.map((point) => point.bestWeight),
    0
  );
  const bestWeight = Math.max(...progressPoints.map((point) => point.bestWeight), 0);
  const bestEstimatedOneRepMax = Math.max(
    ...progressPoints.map((point) => point.bestEstimatedOneRepMax),
    0
  );
  const totalTrackedSessions = progressPoints.length;
  const latestSession = progressPoints[progressPoints.length - 1] || null;

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
          <Text style={styles.sectionTitle}>Progress</Text>

          {progressPoints.length === 0 ? (
            <Text style={styles.emptyProgressText}>
              No logged sessions for this exercise yet. Complete a workout with this
              exercise to see your progress chart here.
            </Text>
          ) : (
            <>
              <View style={styles.progressSummaryGrid}>
                <View style={styles.progressSummaryCard}>
                  <Text style={styles.progressSummaryValue}>{bestWeight}</Text>
                  <Text style={styles.progressSummaryLabel}>Best Weight</Text>
                </View>

                <View style={styles.progressSummaryCard}>
                  <Text style={styles.progressSummaryValue}>
                    {bestEstimatedOneRepMax}
                  </Text>
                  <Text style={styles.progressSummaryLabel}>Best 1RM</Text>
                </View>

                <View style={styles.progressSummaryCard}>
                  <Text style={styles.progressSummaryValue}>{totalTrackedSessions}</Text>
                  <Text style={styles.progressSummaryLabel}>Tracked Sessions</Text>
                </View>

                <View style={styles.progressSummaryCard}>
                  <Text style={styles.progressSummaryValue}>
                    {latestSession ? latestSession.totalVolume : 0}
                  </Text>
                  <Text style={styles.progressSummaryLabel}>Latest Volume</Text>
                </View>
              </View>

              <View style={styles.chartCard}>
                <View style={styles.chartHeaderRow}>
                  <View>
                    <Text style={styles.chartTitle}>Best Weight Trend</Text>
                    <Text style={styles.chartSubtitle}>
                      Recent workout performance
                    </Text>
                  </View>

                  <View style={styles.chartBadge}>
                    <Text style={styles.chartBadgeValue}>{latestPoints.length}</Text>
                    <Text style={styles.chartBadgeLabel}>Sessions</Text>
                  </View>
                </View>

                <View style={styles.chartBarsRow}>
                  {latestPoints.map((point) => {
                    const barHeight =
                      maxChartValue > 0
                        ? Math.max(
                            16,
                            Math.round((point.bestWeight / maxChartValue) * 120)
                          )
                        : 10;

                    return (
                      <View key={point.id} style={styles.chartBarColumn}>
                        <Text style={styles.chartValue}>{point.bestWeight}</Text>

                        <View style={styles.chartTrack}>
                          <View
                            style={[styles.chartFill, { height: barHeight }]}
                          />
                        </View>

                        <Text style={styles.chartLabel}>{point.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.recentSessionsCard}>
                <Text style={styles.recentSessionsTitle}>Recent Sessions</Text>

                {latestPoints
                  .slice()
                  .reverse()
                  .map((point) => (
                    <View key={`recent-${point.id}`} style={styles.recentSessionRow}>
                      <View>
                        <Text style={styles.recentSessionDate}>{point.label}</Text>
                        <Text style={styles.recentSessionMeta}>
                          {point.totalSets} set{point.totalSets === 1 ? '' : 's'} •{' '}
                          {point.totalVolume} volume
                        </Text>
                      </View>

                      <View style={styles.recentSessionStats}>
                        <Text style={styles.recentSessionValue}>
                          {point.bestWeight} lb
                        </Text>
                        <Text style={styles.recentSessionSubvalue}>
                          1RM {point.bestEstimatedOneRepMax}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            </>
          )}
        </View>

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
  progressSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  progressSummaryCard: {
    width: '48%',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  progressSummaryValue: {
    color: '#4da6ff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressSummaryLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  chartSubtitle: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  chartBadge: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 72,
  },
  chartBadgeValue: {
    color: '#4da6ff',
    fontSize: 17,
    fontWeight: '700',
  },
  chartBadgeLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartBarColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  chartTrack: {
    width: 26,
    height: 120,
    backgroundColor: '#121212',
    borderRadius: 999,
    justifyContent: 'flex-end',
    padding: 3,
  },
  chartFill: {
    width: '100%',
    minHeight: 10,
    borderRadius: 999,
    backgroundColor: '#4da6ff',
  },
  chartLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  recentSessionsCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
  },
  recentSessionsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  recentSessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  recentSessionDate: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  recentSessionMeta: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  recentSessionStats: {
    alignItems: 'flex-end',
  },
  recentSessionValue: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  recentSessionSubvalue: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  emptyProgressText: {
    color: '#aaaaaa',
    fontSize: 15,
    lineHeight: 22,
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
