import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadSettings } from '../../../storage/settings';
import { WeightUnit } from '../../../types/settings';
import { loadWorkouts, deleteWorkoutById } from '../../../storage/workouts';
import { SavedExerciseLog, SavedWorkoutSession, WorkoutSet } from '../../../types/workout';
import { calculateWorkoutSummary } from '../../../utils/calculateWorkoutSummary';
import { formatWorkoutDuration } from '../../../utils/formatDuration';
import {
  convertVolumeValue,
  formatWeightNumber,
  formatWeightWithUnit,
} from '../../../utils/weightUnits';

export default function WorkoutHistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<SavedWorkoutSession | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');

  useFocusEffect(
    useCallback(() => {
      const fetchWorkout = async () => {
        const workouts = await loadWorkouts();
        const savedSettings = await loadSettings();
        const foundWorkout = workouts.find((item) => item.id === id) || null;

        setWorkout(foundWorkout);
        setWeightUnit(savedSettings.weightUnit);
      };

      fetchWorkout();
    }, [id])
  );

  const handleDeleteWorkout = () => {
    if (!workout) return;

    Alert.alert(
      'Delete workout',
      `Are you sure you want to delete this ${workout.routineName} workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkoutById(workout.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleStartAgain = () => {
    if (!workout) return;

    router.push({
      pathname: '/workout/session/empty',
      params: {
        templateWorkoutId: workout.id,
      },
    });
  };

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
  const formattedDuration = formatWorkoutDuration(workout.durationMinutes);

  const { totalSets, totalReps, totalVolume, heaviestWeight } =
    calculateWorkoutSummary(workout);
  const sourceWeightUnit = workout.weightUnit ?? 'lb';
  const convertedVolume = convertVolumeValue(totalVolume, 'lb', weightUnit);

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
              {formattedDuration ? (
                <Text style={styles.subtitle}>Duration: {formattedDuration}</Text>
              ) : null}

              {workout.note?.trim() ? (
                <View style={styles.workoutNoteBox}>
                  <Text style={styles.workoutNoteTitle}>Workout Note</Text>
                  <Text style={styles.workoutNoteText}>{workout.note}</Text>
                </View>
              ) : null}

              <View style={styles.summaryStatsRow}>
                <View style={styles.summaryStatPill}>
                  <Text style={styles.summaryStatValue}>{totalReps}</Text>
                  <Text style={styles.summaryStatLabel}>Total Reps</Text>
                </View>

                <View style={styles.summaryStatPill}>
                  <Text style={styles.summaryStatValue}>
                    {formatWeightWithUnit(String(heaviestWeight || 0), weightUnit, 'lb')}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Heaviest Set</Text>
                </View>

                <View style={styles.summaryStatPill}>
                  <Text style={styles.summaryStatValue}>
                    {formatWeightNumber(convertedVolume)}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Volume</Text>
                </View>
              </View>

              <Pressable
                style={styles.startAgainButton}
                onPress={handleStartAgain}
              >
                <Text style={styles.startAgainButtonText}>Start Again</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item, index }: { item: SavedExerciseLog; index: number }) => (
            <View style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>
                {index + 1}. {item.exerciseName}
              </Text>

              {item.note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Exercise Note</Text>
                  <Text style={styles.noteText}>{item.note}</Text>
                </View>
              ) : null}

              {item.sets.map((set: WorkoutSet) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setLabel}>Set {set.setNumber}</Text>
                  <Text style={styles.setValue}>
                    {formatWeightWithUnit(
                      set.weight,
                      weightUnit,
                      sourceWeightUnit
                    )}
                  </Text>
                  <Text style={styles.setValue}>{set.reps || '-'} reps</Text>
                </View>
              ))}
            </View>
          )}
          ListFooterComponent={
            <Pressable style={styles.deleteButton} onPress={handleDeleteWorkout}>
              <Text style={styles.deleteButtonText}>Delete Workout</Text>
            </Pressable>
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
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  workoutNoteBox: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  workoutNoteTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  workoutNoteText: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 20,
  },
  summaryStatPill: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryStatValue: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  summaryStatLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '600',
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
  noteBox: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  noteTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  noteText: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 20,
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
  deleteButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#ff8a8a',
    fontSize: 16,
    fontWeight: '700',
  },
  startAgainButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  startAgainButtonText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
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
