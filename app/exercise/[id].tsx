import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { loadSettings } from '../../storage/settings';
import { loadWorkouts } from '../../storage/workouts';
import { Exercise } from '../../types/exercise';
import { WeightUnit } from '../../types/settings';
import { SavedWorkoutSession } from '../../types/workout';
import { loadExerciseLibrary } from '../../utils/exerciseLibrary';
import { calculateEstimatedOneRepMax } from '../../utils/oneRepMax';
import { formatWeightUnit } from '../../utils/weightUnits';

type ExerciseProgressPoint = {
  id: string;
  completedAt: string;
  label: string;
  bestWeight: number;
  bestEstimatedOneRepMax: number;
  totalVolume: number;
  totalSets: number;
  bestReps: number;
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
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');

  useEffect(() => {
    const fetchData = async () => {
      const savedWorkouts = await loadWorkouts();
      const loadedExercises = await loadExerciseLibrary();
      setWorkouts(savedWorkouts);
      setExerciseLibrary(loadedExercises);
    };

    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchSettings = async () => {
        const savedSettings = await loadSettings();
        setWeightUnit(savedSettings.weightUnit);
      };

      fetchSettings();
    }, [])
  );

  const exercise = exerciseLibrary.find((item) => item.id === id);
  const primaryMuscles = exercise?.primaryMuscles ?? [];
  const secondaryMuscles = exercise?.secondaryMuscles ?? [];
  const instructions = exercise?.instructions ?? [];
  const demoMedia = exercise?.demoMedia;

  const progressPoints = useMemo(() => {
    if (!id) {
      return [];
    }

    return workouts
      .map((workout) => {
        const exerciseLog = workout.exercises.find((item) => item.exerciseId === id);

        if (!exerciseLog || exerciseLog.sets.length === 0) {
          return null;
        }

        let bestWeight = 0;
        let bestEstimatedOneRepMax = 0;
        let totalVolume = 0;
        let bestReps = 0;

        exerciseLog.sets.forEach((set) => {
          const weight = Number(set.weight);
          const reps = Number(set.reps);

          if (!Number.isNaN(reps) && reps > 0) {
            bestReps = Math.max(bestReps, reps);
          }

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
          bestReps,
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
  const bestVolume = Math.max(...progressPoints.map((point) => point.totalVolume), 0);
  const bestReps = Math.max(...progressPoints.map((point) => point.bestReps), 0);
  const bestEstimatedOneRepMax = Math.max(
    ...progressPoints.map((point) => point.bestEstimatedOneRepMax),
    0
  );
  const totalTrackedSessions = progressPoints.length;
  const latestSession = progressPoints[progressPoints.length - 1] || null;
  const previousSession =
    progressPoints.length > 1 ? progressPoints[progressPoints.length - 2] : null;
  const estimatedOneRepMaxChange =
    latestSession && previousSession
      ? latestSession.bestEstimatedOneRepMax - previousSession.bestEstimatedOneRepMax
      : null;
  const oneRepMaxTrendText =
    estimatedOneRepMaxChange === null
      ? 'Log another session to unlock session-to-session 1RM trend.'
      : estimatedOneRepMaxChange > 0
        ? `Your latest estimated 1RM is up ${estimatedOneRepMaxChange} ${formatWeightUnit(weightUnit)} from your previous logged session.`
      : estimatedOneRepMaxChange < 0
          ? `Your latest estimated 1RM is down ${Math.abs(estimatedOneRepMaxChange)} ${formatWeightUnit(weightUnit)} from your previous logged session.`
          : 'Your estimated 1RM matched your previous logged session.';

  const handleOpenDemoMedia = async () => {
    if (!demoMedia?.url) {
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(demoMedia.url);
    } catch (error) {
      Alert.alert('Unable to open demo', 'Please try again in a moment.');
    }
  };

  if (!exercise) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Exercise not found</Text>
        <Text style={styles.notFoundText}>
          We could not find that exercise.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: exercise.name }} />

      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{exercise.name}</Text>

          <Text style={styles.meta}>
            {exercise.muscleGroup} | {exercise.equipment}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Demo</Text>

            {demoMedia ? (
              <View style={styles.demoCard}>
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>
                    {demoMedia.type === 'gif' ? 'GIF' : 'VIDEO'}
                  </Text>
                </View>

                <Text style={styles.demoTitle}>{demoMedia.title}</Text>
                <Text style={styles.demoText}>
                  Open a quick movement demo for form reference while reviewing this
                  exercise.
                </Text>

                {demoMedia.sourceLabel ? (
                  <Text style={styles.demoSource}>Source: {demoMedia.sourceLabel}</Text>
                ) : null}

                <Pressable style={styles.demoButton} onPress={handleOpenDemoMedia}>
                  <Text style={styles.demoButtonText}>
                    {demoMedia.type === 'gif' ? 'Open Demo GIF' : 'Watch Demo Video'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.emptySectionText}>
                No demo media has been added for this exercise yet.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Muscle Targets</Text>

            <View style={styles.targetGroup}>
              <Text style={styles.targetGroupLabel}>Primary</Text>
              <View style={styles.targetChipRow}>
                {primaryMuscles.map((muscle) => (
                  <View key={`primary-${muscle}`} style={styles.primaryTargetChip}>
                    <Text style={styles.primaryTargetChipText}>{muscle}</Text>
                  </View>
                ))}
              </View>
            </View>

            {secondaryMuscles.length > 0 ? (
              <View style={styles.targetGroup}>
                <Text style={styles.targetGroupLabel}>Secondary</Text>
                <View style={styles.targetChipRow}>
                  {secondaryMuscles.map((muscle) => (
                    <View
                      key={`secondary-${muscle}`}
                      style={styles.secondaryTargetChip}
                    >
                      <Text style={styles.secondaryTargetChipText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PR Snapshot</Text>

            {progressPoints.length === 0 ? (
              <Text style={styles.emptyProgressText}>
                No logged sessions for this exercise yet. Complete a workout with this
                exercise to see your PRs and progress here.
              </Text>
            ) : (
              <>
                <View style={styles.oneRepMaxHero}>
                  <Text style={styles.oneRepMaxEyebrow}>Estimated 1RM</Text>
                  <Text style={styles.oneRepMaxValue}>
                    {bestEstimatedOneRepMax} {formatWeightUnit(weightUnit)}
                  </Text>
                  <Text style={styles.oneRepMaxText}>
                    Best projected single-rep strength based on your logged sets.
                  </Text>
                </View>

                <View style={styles.progressSummaryGrid}>
                  <View style={styles.progressSummaryCard}>
                    <Text style={styles.progressSummaryValue}>{bestWeight}</Text>
                    <Text style={styles.progressSummaryLabel}>Heaviest Set</Text>
                  </View>

                  <View style={styles.progressSummaryCard}>
                    <Text style={styles.progressSummaryValue}>
                      {bestEstimatedOneRepMax}
                    </Text>
                    <Text style={styles.progressSummaryLabel}>Best Est. 1RM</Text>
                  </View>

                  <View style={styles.progressSummaryCard}>
                    <Text style={styles.progressSummaryValue}>{bestVolume}</Text>
                    <Text style={styles.progressSummaryLabel}>Best Volume</Text>
                  </View>

                  <View style={styles.progressSummaryCard}>
                    <Text style={styles.progressSummaryValue}>{bestReps}</Text>
                    <Text style={styles.progressSummaryLabel}>Most Reps</Text>
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

                <View style={styles.prInsightCard}>
                  <Text style={styles.prInsightTitle}>1RM Trend</Text>
                  <Text style={styles.prInsightText}>{oneRepMaxTrendText}</Text>
                  <Text style={styles.prInsightText}>
                    Current all-time best estimate: {bestEstimatedOneRepMax} {formatWeightUnit(weightUnit)}
                  </Text>
                </View>

                <View style={styles.prInsightCard}>
                  <Text style={styles.prInsightTitle}>Current Bests</Text>
                  <Text style={styles.prInsightText}>
                    Top logged weight: {bestWeight} {formatWeightUnit(weightUnit)}
                  </Text>
                  <Text style={styles.prInsightText}>
                    Best estimated 1RM: {bestEstimatedOneRepMax} {formatWeightUnit(weightUnit)}
                  </Text>
                  <Text style={styles.prInsightText}>
                    Highest logged volume: {bestVolume}
                  </Text>
                  <Text style={styles.prInsightText}>
                    Last recorded session volume: {latestSession ? latestSession.totalVolume : 0}
                  </Text>
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
                            {point.totalSets} set{point.totalSets === 1 ? '' : 's'} |{' '}
                            {point.totalVolume} volume
                          </Text>
                        </View>

                        <View style={styles.recentSessionStats}>
                          <Text style={styles.recentSessionValue}>
                            {point.bestWeight} {formatWeightUnit(weightUnit)}
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
            {instructions.length > 0 ? (
              instructions.map((step, index) => (
                <Text key={index} style={styles.listItem}>
                  {index + 1}. {step}
                </Text>
              ))
            ) : (
              <Text style={styles.emptySectionText}>
                No instructions added for this exercise yet.
              </Text>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
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
  oneRepMaxHero: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  oneRepMaxEyebrow: {
    color: '#9fd0ff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  oneRepMaxValue: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 6,
  },
  oneRepMaxText: {
    color: '#d8ebff',
    fontSize: 14,
    lineHeight: 21,
  },
  demoCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
  },
  demoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  demoBadgeText: {
    color: '#4da6ff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  demoTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  demoText: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  demoSource: {
    color: '#aaaaaa',
    fontSize: 12,
    marginBottom: 12,
  },
  demoButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  targetGroup: {
    marginBottom: 12,
  },
  targetGroupLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  targetChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryTargetChip: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryTargetChipText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryTargetChip: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryTargetChipText: {
    color: '#dddddd',
    fontSize: 13,
    fontWeight: '600',
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
  prInsightCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  prInsightTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  prInsightText: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
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
  emptySectionText: {
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
