import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadSettings } from '../../../storage/settings';
import { loadWorkouts, updateWorkoutById } from '../../../storage/workouts';
import { WeightUnit } from '../../../types/settings';
import { SavedExerciseLog, SavedWorkoutSession, WorkoutSet } from '../../../types/workout';
import { calculateWorkoutSummary } from '../../../utils/calculateWorkoutSummary';
import { detectWorkoutPRs } from '../../../utils/detectWorkoutPRs';
import { formatWorkoutDuration } from '../../../utils/formatDuration';
import {
  convertWeightValue,
  convertVolumeValue,
  formatWeightNumber,
  formatWeightWithUnit,
} from '../../../utils/weightUnits';

export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<SavedWorkoutSession | null>(null);
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [workoutNote, setWorkoutNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchSummary = async () => {
        const [savedWorkouts, savedSettings] = await Promise.all([
          loadWorkouts(),
          loadSettings(),
        ]);
        const foundWorkout = savedWorkouts.find((item) => item.id === id) || null;

        setWorkout(foundWorkout);
        setWorkoutNote(foundWorkout?.note ?? '');
        setNoteSaved(Boolean(foundWorkout?.note?.trim()));
        setWorkouts(savedWorkouts);
        setWeightUnit(savedSettings.weightUnit);
      };

      fetchSummary();
    }, [id])
  );

  const handleDone = () => {
    router.replace('/(tabs)/workout');
  };

  const handleViewDetails = () => {
    if (!workout) return;

    router.replace(`/workout/history/${workout.id}`);
  };

  const handleStartAgain = () => {
    if (!workout) return;

    router.replace({
      pathname: '/workout/session/empty',
      params: {
        templateWorkoutId: workout.id,
      },
    });
  };

  const handleSaveWorkoutNote = async () => {
    if (!workout) return;

    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      note: workoutNote.trim(),
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    setWorkouts((prev) =>
      prev.map((item) => (item.id === workout.id ? updatedWorkout : item))
    );
    setNoteSaved(true);
    Alert.alert('Note saved', 'Your workout note was added to this workout.');
  };

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFoundTitle}>Workout summary not found</Text>
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
  const formattedDuration = formatWorkoutDuration(workout.durationMinutes);
  const { totalSets, totalReps, totalVolume, heaviestWeight } =
    calculateWorkoutSummary(workout);
  const convertedVolume = convertVolumeValue(totalVolume, 'lb', weightUnit);
  const sourceWeightUnit = workout.weightUnit ?? 'lb';
  const prHighlights = detectWorkoutPRs(workout, workouts);

  return (
    <>
      <Stack.Screen options={{ title: 'Workout Summary' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={workout.exercises}
          keyExtractor={(item) => item.exerciseId}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.kicker}>Workout Saved</Text>
              <Text style={styles.title}>{workout.routineName}</Text>
              <Text style={styles.subtitle}>
                {formattedDate} at {formattedTime}
              </Text>
              {formattedDuration ? (
                <Text style={styles.subtitle}>Duration: {formattedDuration}</Text>
              ) : null}

              <View style={styles.summaryGrid}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{workout.exercises.length}</Text>
                  <Text style={styles.summaryLabel}>Exercises</Text>
                </View>

                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{totalSets}</Text>
                  <Text style={styles.summaryLabel}>Sets</Text>
                </View>

                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{totalReps}</Text>
                  <Text style={styles.summaryLabel}>Reps</Text>
                </View>

                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>
                    {formatWeightWithUnit(String(heaviestWeight || 0), weightUnit, 'lb')}
                  </Text>
                  <Text style={styles.summaryLabel}>Heaviest</Text>
                </View>

                <View style={[styles.summaryStat, styles.wideSummaryStat]}>
                  <Text style={styles.summaryValue}>
                    {formatWeightNumber(convertedVolume)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Volume</Text>
                </View>
              </View>

              {prHighlights.length > 0 && (
                <View style={styles.prCard}>
                  <Text style={styles.prTitle}>New PRs</Text>
                  <Text style={styles.prSubtitle}>
                    {prHighlights.length} new personal record
                    {prHighlights.length === 1 ? '' : 's'} from this workout.
                  </Text>

                  {prHighlights.slice(0, 4).map((pr) => {
                    const displayedValue = convertWeightValue(
                      pr.value,
                      'lb',
                      weightUnit
                    );
                    const displayedPreviousValue = convertWeightValue(
                      pr.previousValue,
                      'lb',
                      weightUnit
                    );
                    const label =
                      pr.type === 'heaviest' ? 'Heaviest Set' : 'Estimated 1RM';

                    return (
                      <View
                        key={`${pr.exerciseId}-${pr.type}`}
                        style={styles.prRow}
                      >
                        <View style={styles.prRowText}>
                          <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                          <Text style={styles.prType}>{label}</Text>
                        </View>

                        <View style={styles.prValueWrap}>
                          <Text style={styles.prValue}>
                            {formatWeightWithUnit(
                              String(displayedValue),
                              weightUnit,
                              weightUnit
                            )}
                          </Text>
                          {pr.previousValue > 0 && (
                            <Text style={styles.prPrevious}>
                              Previous {formatWeightNumber(displayedPreviousValue)}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Workout Note</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="How did this workout feel?"
                  placeholderTextColor="#777777"
                  value={workoutNote}
                  onChangeText={(value) => {
                    setWorkoutNote(value);
                    setNoteSaved(false);
                  }}
                  multiline
                />

                <Pressable
                  style={styles.noteButton}
                  onPress={handleSaveWorkoutNote}
                >
                  <Text style={styles.noteButtonText}>
                    {noteSaved ? 'Update Note' : 'Save Note'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryButton} onPress={handleStartAgain}>
                  <Text style={styles.secondaryButtonText}>Start Again</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={handleViewDetails}>
                  <Text style={styles.secondaryButtonText}>View Details</Text>
                </Pressable>
              </View>

              <Pressable style={styles.primaryButton} onPress={handleDone}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item, index }: { item: SavedExerciseLog; index: number }) => (
            <View style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>
                {index + 1}. {item.exerciseName}
              </Text>

              <Text style={styles.exerciseMeta}>
                {item.sets.length} set{item.sets.length === 1 ? '' : 's'}
              </Text>

              {item.sets.map((set: WorkoutSet) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setLabel}>Set {set.setNumber}</Text>
                  <Text style={styles.setValue}>
                    {formatWeightWithUnit(set.weight, weightUnit, sourceWeightUnit)}
                  </Text>
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
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  headerCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  kicker: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  summaryStat: {
    width: '48%',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  wideSummaryStat: {
    width: '100%',
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#8f8f8f',
    fontSize: 12,
    fontWeight: '600',
  },
  prCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  prTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  prSubtitle: {
    color: '#9dbbda',
    fontSize: 13,
    marginBottom: 12,
  },
  prRow: {
    backgroundColor: '#0d1722',
    borderWidth: 1,
    borderColor: '#1f3c58',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  prRowText: {
    flex: 1,
  },
  prExercise: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  prType: {
    color: '#9dbbda',
    fontSize: 12,
    fontWeight: '600',
  },
  prValueWrap: {
    alignItems: 'flex-end',
  },
  prValue: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  prPrevious: {
    color: '#8f8f8f',
    fontSize: 11,
    fontWeight: '600',
  },
  noteCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  noteTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  noteInput: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 82,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 10,
  },
  noteButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  noteButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  exerciseMeta: {
    color: '#aaaaaa',
    fontSize: 13,
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
    gap: 8,
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
