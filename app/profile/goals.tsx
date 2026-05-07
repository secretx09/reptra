import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  deleteFitnessGoalById,
  loadFitnessGoals,
  saveFitnessGoals,
  upsertFitnessGoal,
} from '../../storage/fitnessGoals';
import { loadSettings } from '../../storage/settings';
import { loadWorkouts } from '../../storage/workouts';
import { FitnessGoal, FitnessGoalMetric } from '../../types/fitnessGoal';
import { WeightUnit } from '../../types/settings';
import { SavedWorkoutSession } from '../../types/workout';
import { calculateExercisePRs } from '../../utils/calculatePRs';
import {
  calculateFitnessGoalProgress,
  formatGoalValue,
  goalMetricOptions,
} from '../../utils/fitnessGoals';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [selectedMetric, setSelectedMetric] =
    useState<FitnessGoalMetric>('workouts');

  const fetchData = useCallback(async () => {
    const [savedGoals, savedWorkouts, settings] = await Promise.all([
      loadFitnessGoals(),
      loadWorkouts(),
      loadSettings(),
    ]);

    setGoals(savedGoals);
    setWorkouts(savedWorkouts);
    setWeightUnit(settings.weightUnit);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const prs = useMemo(() => calculateExercisePRs(workouts), [workouts]);
  const goalProgress = useMemo(
    () => calculateFitnessGoalProgress(goals, workouts, prs, weightUnit),
    [goals, prs, weightUnit, workouts]
  );
  const activeGoals = goalProgress.filter(
    (progress) => progress.goal.status === 'active'
  );
  const archivedGoals = goalProgress.filter(
    (progress) => progress.goal.status === 'archived'
  );

  const handleCreateGoal = async () => {
    const trimmedTitle = title.trim();
    const parsedTarget = Number(targetValue);

    if (!trimmedTitle) {
      Alert.alert('Missing title', 'Give this goal a name first.');
      return;
    }

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      Alert.alert('Missing target', 'Enter a target number greater than 0.');
      return;
    }

    const newGoal: FitnessGoal = {
      id: `goal-${Date.now()}`,
      title: trimmedTitle,
      metric: selectedMetric,
      targetValue: parsedTarget,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    await upsertFitnessGoal(newGoal);
    setTitle('');
    setTargetValue('');
    await fetchData();
  };

  const handleToggleArchive = async (goal: FitnessGoal) => {
    const updatedGoal: FitnessGoal = {
      ...goal,
      status: goal.status === 'active' ? 'archived' : 'active',
    };

    await upsertFitnessGoal(updatedGoal);
    await fetchData();
  };

  const handleDeleteGoal = (goal: FitnessGoal) => {
    Alert.alert('Delete goal', `Delete "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFitnessGoalById(goal.id);
          await fetchData();
        },
      },
    ]);
  };

  const handleClearCompleted = async () => {
    const updatedGoals = goals.map((goal) => {
      const progress = goalProgress.find((item) => item.goal.id === goal.id);

      if (progress?.isComplete) {
        return { ...goal, status: 'archived' as const };
      }

      return goal;
    });

    await saveFitnessGoals(updatedGoals);
    await fetchData();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Training Goals' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={activeGoals}
          keyExtractor={(item) => item.goal.id}
          ListHeaderComponent={
            <>
              <View style={styles.headerCard}>
                <Text style={styles.kicker}>Reptra</Text>
                <Text style={styles.title}>Training Goals</Text>
                <Text style={styles.subtitle}>
                  Set local goals for workouts, sets, reps, volume, or PRs.
                </Text>
              </View>

              <View style={styles.createCard}>
                <Text style={styles.sectionTitle}>Create Goal</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Goal title"
                  placeholderTextColor="#777777"
                  value={title}
                  onChangeText={setTitle}
                />

                <TextInput
                  style={styles.input}
                  placeholder={
                    selectedMetric === 'volume'
                      ? `Target volume (${weightUnit})`
                      : 'Target number'
                  }
                  placeholderTextColor="#777777"
                  keyboardType="numeric"
                  value={targetValue}
                  onChangeText={setTargetValue}
                />

                <View style={styles.metricGrid}>
                  {goalMetricOptions.map((option) => {
                    const isSelected = selectedMetric === option.metric;

                    return (
                      <Pressable
                        key={option.metric}
                        style={[
                          styles.metricButton,
                          isSelected && styles.metricButtonSelected,
                        ]}
                        onPress={() => setSelectedMetric(option.metric)}
                      >
                        <Text
                          style={[
                            styles.metricButtonText,
                            isSelected && styles.metricButtonTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable style={styles.primaryButton} onPress={handleCreateGoal}>
                  <Text style={styles.primaryButtonText}>Save Goal</Text>
                </Pressable>
              </View>

              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Active Goals</Text>
                  <Text style={styles.sectionSubtitle}>
                    {activeGoals.length} active, {archivedGoals.length} archived
                  </Text>
                </View>

                <Pressable onPress={handleClearCompleted}>
                  <Text style={styles.headerAction}>Archive Complete</Text>
                </Pressable>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.goalCard,
                item.isComplete && styles.goalCardComplete,
              ]}
            >
              <View style={styles.goalHeaderRow}>
                <View style={styles.goalTextWrap}>
                  <Text style={styles.goalTitle}>{item.goal.title}</Text>
                  <Text style={styles.goalMeta}>{item.metricLabel}</Text>
                </View>

                <Text style={styles.goalPercent}>{item.progressPercent}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.progressRatio * 100}%` },
                  ]}
                />
              </View>

              <Text style={styles.goalProgressText}>
                {formatGoalValue(
                  item.displayedCurrentValue,
                  item.goal.metric,
                  weightUnit
                )}{' '}
                /{' '}
                {formatGoalValue(
                  item.displayedTargetValue,
                  item.goal.metric,
                  weightUnit
                )}
              </Text>

              <View style={styles.goalActions}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => handleToggleArchive(item.goal)}
                >
                  <Text style={styles.secondaryButtonText}>Archive</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteGoal(item.goal)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No active goals yet. Create one above to start tracking.
            </Text>
          }
          ListFooterComponent={
            archivedGoals.length > 0 ? (
              <View style={styles.archivedCard}>
                <Text style={styles.sectionTitle}>Archived Goals</Text>
                {archivedGoals.map((item) => (
                  <View key={item.goal.id} style={styles.archivedGoalRow}>
                    <View style={styles.goalTextWrap}>
                      <Text style={styles.archivedGoalTitle}>
                        {item.goal.title}
                      </Text>
                      <Text style={styles.goalMeta}>
                        {item.progressPercent}% complete
                      </Text>
                    </View>

                    <Pressable onPress={() => handleToggleArchive(item.goal)}>
                      <Text style={styles.headerAction}>Restore</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null
          }
          contentContainerStyle={styles.content}
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
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  headerCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  kicker: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: '#b9d6f2',
    fontSize: 14,
    lineHeight: 20,
  },
  createCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricButton: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  metricButtonSelected: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  metricButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  metricButtonTextSelected: {
    color: '#111111',
  },
  primaryButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  headerAction: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
  },
  goalCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  goalCardComplete: {
    backgroundColor: '#101c29',
    borderColor: '#294969',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  goalTextWrap: {
    flex: 1,
  },
  goalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  goalMeta: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
  },
  goalPercent: {
    color: '#4da6ff',
    fontSize: 18,
    fontWeight: '900',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#101010',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4da6ff',
    borderRadius: 999,
  },
  goalProgressText: {
    color: '#dddddd',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '800',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff8a8a',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  archivedCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  archivedGoalRow: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  archivedGoalTitle: {
    color: '#dddddd',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
});
