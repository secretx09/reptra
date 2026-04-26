import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { loadSettings } from '../../storage/settings';
import { deleteCustomExerciseById } from '../../storage/customExercises';
import { loadWorkouts } from '../../storage/workouts';
import { Exercise } from '../../types/exercise';
import { WeightUnit } from '../../types/settings';
import { SavedWorkoutSession } from '../../types/workout';
import { loadExerciseLibrary } from '../../utils/exerciseLibrary';
import { calculateEstimatedOneRepMax } from '../../utils/oneRepMax';
import {
  convertVolumeValue,
  convertWeightValue,
  formatWeightNumber,
  formatWeightUnit,
} from '../../utils/weightUnits';

type ExerciseTab = 'summary' | 'history' | 'howto';
type ChartRangeKey = '6' | '12' | 'all';
type ChartMetricKey =
  | 'bestWeight'
  | 'bestEstimatedOneRepMax'
  | 'bestSetVolume'
  | 'sessionVolume'
  | 'totalReps';

type ExerciseHistoryPoint = {
  id: string;
  completedAt: string;
  label: string;
  routineName: string;
  bestWeight: number;
  bestEstimatedOneRepMax: number;
  bestSetVolume: number;
  sessionVolume: number;
  totalReps: number;
  totalSets: number;
  note: string;
  sets: {
    id: string;
    setNumber: number;
    weight: number;
    reps: number;
  }[];
};

const tabOptions: { key: ExerciseTab; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'history', label: 'History' },
  { key: 'howto', label: 'How To' },
];

const chartMetricOptions: {
  key: ChartMetricKey;
  label: string;
  subtitle: string;
}[] = [
  {
    key: 'bestWeight',
    label: 'Heaviest Weight',
    subtitle: 'Best logged weight each session',
  },
  {
    key: 'bestEstimatedOneRepMax',
    label: 'Estimated 1RM',
    subtitle: 'Projected one-rep max over time',
  },
  {
    key: 'bestSetVolume',
    label: 'Best Set Volume',
    subtitle: 'Highest single-set volume each session',
  },
  {
    key: 'sessionVolume',
    label: 'Session Volume',
    subtitle: 'Total volume across the full session',
  },
  {
    key: 'totalReps',
    label: 'Total Reps',
    subtitle: 'All reps logged for the session',
  },
];

const chartRangeOptions: { key: ChartRangeKey; label: string }[] = [
  { key: '6', label: 'Last 6' },
  { key: '12', label: 'Last 12' },
  { key: 'all', label: 'All' },
];

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
  const [activeTab, setActiveTab] = useState<ExerciseTab>('summary');
  const [chartMetric, setChartMetric] = useState<ChartMetricKey>('bestWeight');
  const [chartRange, setChartRange] = useState<ChartRangeKey>('6');

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

  const historyPoints = useMemo(() => {
    if (!id) {
      return [];
    }

    return workouts
      .map((workout) => {
        const exerciseLog = workout.exercises.find((item) => item.exerciseId === id);
        const sourceWeightUnit = workout.weightUnit ?? 'lb';

        if (!exerciseLog || exerciseLog.sets.length === 0) {
          return null;
        }

        let bestWeight = 0;
        let bestEstimatedOneRepMax = 0;
        let bestSetVolume = 0;
        let sessionVolume = 0;
        let totalReps = 0;
        const loggedSets = exerciseLog.sets.map((set) => {
          const weight = convertWeightValue(
            Number(set.weight),
            sourceWeightUnit,
            'lb'
          );
          const reps = Number(set.reps);

          return {
            id: set.id,
            setNumber: set.setNumber,
            weight: Number.isNaN(weight) ? 0 : weight,
            reps: Number.isNaN(reps) ? 0 : reps,
          };
        });

        loggedSets.forEach((set) => {
          const { weight, reps } = set;

          if (!Number.isNaN(reps) && reps > 0) {
            totalReps += reps;
          }

          if (!Number.isNaN(weight) && weight > 0) {
            bestWeight = Math.max(bestWeight, weight);

            if (!Number.isNaN(reps) && reps > 0) {
              const setVolume = weight * reps;
              sessionVolume += setVolume;
              bestSetVolume = Math.max(bestSetVolume, setVolume);
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
          routineName: workout.routineName,
          bestWeight,
          bestEstimatedOneRepMax,
          bestSetVolume,
          sessionVolume,
          totalReps,
          totalSets: exerciseLog.sets.length,
          note: exerciseLog.note,
          sets: loggedSets,
        } satisfies ExerciseHistoryPoint;
      })
      .filter((item): item is ExerciseHistoryPoint => item !== null)
      .sort(
        (a, b) =>
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      );
  }, [id, workouts]);

  const chartPoints =
    chartRange === 'all' ? historyPoints : historyPoints.slice(-Number(chartRange));
  const chartMetricConfig = chartMetricOptions.find((item) => item.key === chartMetric)!;
  const chartMaxValue = Math.max(
    ...chartPoints.map((point) => point[chartMetric]),
    0
  );
  const chartBestPoint = chartPoints
    .slice()
    .sort((a, b) => b[chartMetric] - a[chartMetric])[0];
  const chartLatestPoint = chartPoints[chartPoints.length - 1] || null;
  const latestSession = historyPoints[historyPoints.length - 1] || null;
  const previousSession =
    historyPoints.length > 1 ? historyPoints[historyPoints.length - 2] : null;
  const bestWeight = Math.max(...historyPoints.map((point) => point.bestWeight), 0);
  const bestEstimatedOneRepMax = Math.max(
    ...historyPoints.map((point) => point.bestEstimatedOneRepMax),
    0
  );
  const bestSetVolume = Math.max(...historyPoints.map((point) => point.bestSetVolume), 0);
  const bestSessionVolume = Math.max(
    ...historyPoints.map((point) => point.sessionVolume),
    0
  );
  const totalTrackedSessions = historyPoints.length;
  const estimatedOneRepMaxChange =
    latestSession && previousSession
      ? latestSession.bestEstimatedOneRepMax - previousSession.bestEstimatedOneRepMax
      : null;
  const oneRepMaxTrendText =
    estimatedOneRepMaxChange === null
      ? 'Log another session to unlock session-to-session 1RM trend.'
      : estimatedOneRepMaxChange > 0
        ? `Your latest estimated 1RM is up ${formatWeightNumber(
            convertWeightValue(estimatedOneRepMaxChange, 'lb', weightUnit)
          )} ${formatWeightUnit(weightUnit)} from your previous logged session.`
        : estimatedOneRepMaxChange < 0
          ? `Your latest estimated 1RM is down ${formatWeightNumber(
              convertWeightValue(Math.abs(estimatedOneRepMaxChange), 'lb', weightUnit)
            )} ${formatWeightUnit(weightUnit)} from your previous logged session.`
          : 'Your estimated 1RM matched your previous logged session.';

  const formatMetricValue = useCallback(
    (value: number, metric: ChartMetricKey) => {
      if (metric === 'bestWeight' || metric === 'bestEstimatedOneRepMax') {
        return `${formatWeightNumber(
          convertWeightValue(value, 'lb', weightUnit)
        )} ${formatWeightUnit(weightUnit)}`;
      }

      if (metric === 'bestSetVolume' || metric === 'sessionVolume') {
        return `${formatWeightNumber(convertVolumeValue(value, 'lb', weightUnit))}`;
      }

      return `${value}`;
    },
    [weightUnit]
  );

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

  const handleDeleteCustomExercise = () => {
    if (!exercise?.isCustom) return;

    Alert.alert(
      'Delete custom exercise',
      `Delete "${exercise.name}" from your exercise library? Saved workouts that already used it will still keep their history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomExerciseById(exercise.id);
            router.replace('/exercise');
          },
        },
      ]
    );
  };

  const renderDemoCard = () => (
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
  );

  const renderSummaryTab = () => (
    <>
      {renderDemoCard()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PR Summary</Text>

        {historyPoints.length === 0 ? (
          <Text style={styles.emptySectionText}>
            No logged sessions for this exercise yet. Complete a workout with this
            exercise to see your progress here.
          </Text>
        ) : (
          <>
            <View style={styles.oneRepMaxHero}>
              <Text style={styles.oneRepMaxEyebrow}>Estimated 1RM</Text>
              <Text style={styles.oneRepMaxValue}>
                {formatWeightNumber(
                  convertWeightValue(bestEstimatedOneRepMax, 'lb', weightUnit)
                )}{' '}
                {formatWeightUnit(weightUnit)}
              </Text>
              <Text style={styles.oneRepMaxText}>
                Best projected single-rep strength based on your logged sets.
              </Text>
            </View>

            <View style={styles.progressSummaryGrid}>
              <View style={styles.progressSummaryCard}>
                <Text style={styles.progressSummaryValue}>
                  {formatWeightNumber(
                    convertWeightValue(bestWeight, 'lb', weightUnit)
                  )}{' '}
                  {formatWeightUnit(weightUnit)}
                </Text>
                <Text style={styles.progressSummaryLabel}>Heaviest Weight</Text>
              </View>

              <View style={styles.progressSummaryCard}>
                <Text style={styles.progressSummaryValue}>
                  {formatWeightNumber(
                    convertWeightValue(bestEstimatedOneRepMax, 'lb', weightUnit)
                  )}{' '}
                  {formatWeightUnit(weightUnit)}
                </Text>
                <Text style={styles.progressSummaryLabel}>Best Est. 1RM</Text>
              </View>

              <View style={styles.progressSummaryCard}>
                <Text style={styles.progressSummaryValue}>
                  {formatWeightNumber(
                    convertVolumeValue(bestSetVolume, 'lb', weightUnit)
                  )}
                </Text>
                <Text style={styles.progressSummaryLabel}>Best Set Volume</Text>
              </View>

              <View style={styles.progressSummaryCard}>
                <Text style={styles.progressSummaryValue}>
                  {formatWeightNumber(
                    convertVolumeValue(bestSessionVolume, 'lb', weightUnit)
                  )}
                </Text>
                <Text style={styles.progressSummaryLabel}>Best Session Volume</Text>
              </View>

              <View style={styles.progressSummaryCard}>
                <Text style={styles.progressSummaryValue}>{totalTrackedSessions}</Text>
                <Text style={styles.progressSummaryLabel}>Tracked Sessions</Text>
              </View>

              <View style={styles.progressSummaryCard}>
                <Text style={styles.progressSummaryValue}>
                  {latestSession ? latestSession.totalReps : 0}
                </Text>
                <Text style={styles.progressSummaryLabel}>Latest Total Reps</Text>
              </View>
            </View>

            <View style={styles.prInsightCard}>
              <Text style={styles.prInsightTitle}>1RM Trend</Text>
              <Text style={styles.prInsightText}>{oneRepMaxTrendText}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chart</Text>

        {historyPoints.length === 0 ? (
          <Text style={styles.emptySectionText}>
            Log this exercise to unlock chart history.
          </Text>
        ) : (
          <>
            <View style={styles.metricSelectorRow}>
              {chartMetricOptions.map((option) => {
                const isSelected = option.key === chartMetric;

                return (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.metricChip,
                      isSelected && styles.metricChipSelected,
                    ]}
                    onPress={() => setChartMetric(option.key)}
                  >
                    <Text
                      style={[
                        styles.metricChipText,
                        isSelected && styles.metricChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.chartRangeRow}>
              {chartRangeOptions.map((option) => {
                const isSelected = option.key === chartRange;

                return (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.chartRangeChip,
                      isSelected && styles.chartRangeChipSelected,
                    ]}
                    onPress={() => setChartRange(option.key)}
                  >
                    <Text
                      style={[
                        styles.chartRangeChipText,
                        isSelected && styles.chartRangeChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <View style={styles.chartHeaderTextWrap}>
                  <Text style={styles.chartTitle}>{chartMetricConfig.label}</Text>
                  <Text style={styles.chartSubtitle}>
                    {chartMetricConfig.subtitle}
                  </Text>
                </View>

                <View style={styles.chartBadge}>
                  <Text style={styles.chartBadgeValue}>{chartPoints.length}</Text>
                  <Text style={styles.chartBadgeLabel}>Sessions</Text>
                </View>
              </View>

              <View style={styles.chartInsightRow}>
                <View style={styles.chartInsightPill}>
                  <Text style={styles.chartInsightLabel}>Latest</Text>
                  <Text style={styles.chartInsightValue}>
                    {chartLatestPoint
                      ? formatMetricValue(chartLatestPoint[chartMetric], chartMetric)
                      : '0'}
                  </Text>
                </View>

                <View style={styles.chartInsightPill}>
                  <Text style={styles.chartInsightLabel}>Best</Text>
                  <Text style={styles.chartInsightValue}>
                    {chartBestPoint
                      ? formatMetricValue(chartBestPoint[chartMetric], chartMetric)
                      : '0'}
                  </Text>
                </View>
              </View>

              <View style={styles.chartBarsRow}>
                {chartPoints.map((point) => {
                  const metricValue = point[chartMetric];
                  const barHeight =
                    chartMaxValue > 0
                      ? Math.max(16, Math.round((metricValue / chartMaxValue) * 120))
                      : 10;
                  const isBestPoint =
                    chartBestPoint?.id === point.id &&
                    chartBestPoint[chartMetric] === metricValue &&
                    metricValue > 0;

                  return (
                    <View key={point.id} style={styles.chartBarColumn}>
                      <Text style={styles.chartValue}>
                        {formatMetricValue(metricValue, chartMetric)}
                      </Text>

                      <View style={styles.chartTrack}>
                        <View
                          style={[
                            styles.chartFill,
                            isBestPoint && styles.chartFillBest,
                            { height: barHeight },
                          ]}
                        />
                      </View>

                      <Text style={styles.chartLabel}>{point.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </View>
    </>
  );

  const renderHistoryTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Exercise History</Text>

      {historyPoints.length === 0 ? (
        <Text style={styles.emptySectionText}>
          No session history for this exercise yet.
        </Text>
      ) : (
        historyPoints
          .slice()
          .reverse()
          .map((point) => (
            <View key={`history-${point.id}`} style={styles.historyCard}>
              <View style={styles.historyHeaderRow}>
                <View>
                  <Text style={styles.historyDate}>
                    {new Date(point.completedAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.historyRoutineName}>
                    {point.routineName}
                  </Text>
                  <Text style={styles.historySubtitle}>
                    {point.totalSets} set{point.totalSets === 1 ? '' : 's'} |{' '}
                    {point.totalReps} reps
                  </Text>
                </View>

                <Text style={styles.historyWeight}>
                  {formatWeightNumber(
                    convertWeightValue(point.bestWeight, 'lb', weightUnit)
                  )}{' '}
                  {formatWeightUnit(weightUnit)}
                </Text>
              </View>

              <View style={styles.historySetList}>
                {point.sets.map((set) => (
                  <View key={set.id} style={styles.historySetRow}>
                    <Text style={styles.historySetLabel}>Set {set.setNumber}</Text>
                    <Text style={styles.historySetValue}>
                      {formatWeightNumber(
                        convertWeightValue(set.weight, 'lb', weightUnit)
                      )}{' '}
                      {formatWeightUnit(weightUnit)} x {set.reps || '-'}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.historyStatsRow}>
                <View style={styles.historyStatPill}>
                  <Text style={styles.historyStatValue}>
                    {formatWeightNumber(
                      convertWeightValue(
                        point.bestEstimatedOneRepMax,
                        'lb',
                        weightUnit
                      )
                    )}
                  </Text>
                  <Text style={styles.historyStatLabel}>Est. 1RM</Text>
                </View>

                <View style={styles.historyStatPill}>
                  <Text style={styles.historyStatValue}>
                    {formatWeightNumber(
                      convertVolumeValue(point.bestSetVolume, 'lb', weightUnit)
                    )}
                  </Text>
                  <Text style={styles.historyStatLabel}>Best Set Vol</Text>
                </View>

                <View style={styles.historyStatPill}>
                  <Text style={styles.historyStatValue}>
                    {formatWeightNumber(
                      convertVolumeValue(point.sessionVolume, 'lb', weightUnit)
                    )}
                  </Text>
                  <Text style={styles.historyStatLabel}>Session Vol</Text>
                </View>
              </View>

              {point.note ? (
                <View style={styles.historyNoteBox}>
                  <Text style={styles.historyNoteLabel}>Note</Text>
                  <Text style={styles.historyNoteText}>{point.note}</Text>
                </View>
              ) : null}

              <Pressable
                style={styles.historyDetailsButton}
                onPress={() => router.push(`/workout/history/${point.id}`)}
              >
                <Text style={styles.historyDetailsButtonText}>
                  View Full Workout
                </Text>
              </Pressable>
            </View>
          ))
      )}
    </View>
  );

  const renderHowToTab = () => (
    <>
      {renderDemoCard()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Target Muscles</Text>

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
                <View key={`secondary-${muscle}`} style={styles.secondaryTargetChip}>
                  <Text style={styles.secondaryTargetChipText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
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
    </>
  );

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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.meta}>
            {exercise.muscleGroup} | {exercise.equipment}
          </Text>

          {exercise.isCustom ? (
            <View style={styles.customActionRow}>
              <Pressable
                style={styles.customEditButton}
                onPress={() => router.push(`/exercise/edit/${exercise.id}`)}
              >
                <Text style={styles.customEditButtonText}>Edit Custom Exercise</Text>
              </Pressable>

              <Pressable
                style={styles.customDeleteButton}
                onPress={handleDeleteCustomExercise}
              >
                <Text style={styles.customDeleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.tabRow}>
            {tabOptions.map((tab) => {
              const isSelected = tab.key === activeTab;

              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, isSelected && styles.tabButtonSelected]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      isSelected && styles.tabButtonTextSelected,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeTab === 'summary' && renderSummaryTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'howto' && renderHowToTab()}
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
    marginBottom: 20,
  },
  customActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  customEditButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  customEditButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  customDeleteButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  customDeleteButtonText: {
    color: '#ff8a8a',
    fontSize: 13,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonSelected: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  tabButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  tabButtonTextSelected: {
    color: '#4da6ff',
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
  metricSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metricChip: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricChipSelected: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  metricChipText: {
    color: '#dddddd',
    fontSize: 12,
    fontWeight: '700',
  },
  metricChipTextSelected: {
    color: '#4da6ff',
  },
  chartRangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chartRangeChip: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  chartRangeChipSelected: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  chartRangeChipText: {
    color: '#dddddd',
    fontSize: 12,
    fontWeight: '700',
  },
  chartRangeChipTextSelected: {
    color: '#4da6ff',
  },
  chartCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  chartHeaderTextWrap: {
    flex: 1,
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
  chartInsightRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chartInsightPill: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    padding: 10,
  },
  chartInsightLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartInsightValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
    textAlign: 'center',
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
  chartFillBest: {
    backgroundColor: '#9fd0ff',
  },
  chartLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  historyDate: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyRoutineName: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  historySubtitle: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  historyWeight: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  historySetList: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  historySetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  historySetLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
  },
  historySetValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  historyStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  historyStatPill: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  historyStatValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  historyStatLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyNoteBox: {
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 12,
  },
  historyNoteLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyNoteText: {
    color: '#dddddd',
    fontSize: 13,
    lineHeight: 20,
  },
  historyDetailsButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  historyDetailsButtonText: {
    color: '#4da6ff',
    fontSize: 13,
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
