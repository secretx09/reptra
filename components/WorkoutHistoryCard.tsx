import { Pressable, Text, StyleSheet, View } from 'react-native';
import { WeightUnit } from '../types/settings';
import { SavedWorkoutSession } from '../types/workout';
import { calculateWorkoutSummary } from '../utils/calculateWorkoutSummary';
import { formatWorkoutDuration } from '../utils/formatDuration';
import {
  convertWeightValue,
  formatWeightNumber,
  formatWeightUnit,
} from '../utils/weightUnits';

type WorkoutHistoryCardProps = {
  workout: SavedWorkoutSession;
  onPress?: () => void;
  onStartAgain?: () => void;
  onShare?: () => void;
  onSaveAsRoutine?: () => void;
  weightUnit?: WeightUnit;
};

export default function WorkoutHistoryCard({
  workout,
  onPress,
  onStartAgain,
  onShare,
  onSaveAsRoutine,
  weightUnit = 'lb',
}: WorkoutHistoryCardProps) {
  const { totalSets, totalReps, heaviestWeight } = calculateWorkoutSummary(workout);
  const convertedHeaviestWeight = convertWeightValue(
    heaviestWeight,
    'lb',
    weightUnit
  );

  const formattedDate = new Date(workout.completedAt).toLocaleDateString();
  const formattedTime = new Date(workout.completedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const formattedDuration = formatWorkoutDuration(workout.durationMinutes);
  const isRoutineWorkout = workout.routineId !== null;
  const hasNote = Boolean(workout.note?.trim());

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        <View style={styles.titleRow}>
          <Text style={styles.routineName}>{workout.routineName}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {isRoutineWorkout ? 'Routine' : 'Empty'}
            </Text>
          </View>
        </View>

        <Text style={styles.meta}>
          {formattedDate} at {formattedTime}
        </Text>
        <Text style={styles.meta}>
          {workout.exercises.length} exercise
          {workout.exercises.length === 1 ? '' : 's'} {'\u2022'} {totalSets} set
          {totalSets === 1 ? '' : 's'}
        </Text>
        {totalReps > 0 || heaviestWeight > 0 ? (
          <Text style={styles.meta}>
            {totalReps > 0 ? `${totalReps} reps` : '0 reps'}
            {heaviestWeight > 0
              ? ` \u2022 Heaviest ${formatWeightNumber(convertedHeaviestWeight)} ${formatWeightUnit(weightUnit)}`
              : ''}
          </Text>
        ) : null}
        {formattedDuration ? (
          <Text style={styles.meta}>Duration: {formattedDuration}</Text>
        ) : null}

        {hasNote ? (
          <Text style={styles.notePreview} numberOfLines={1}>
            Note: {workout.note?.trim()}
          </Text>
        ) : null}
      </Pressable>

      {(onStartAgain || onShare || onSaveAsRoutine) && (
        <View style={styles.quickActionRow}>
          {onStartAgain && (
            <Pressable style={styles.quickActionButton} onPress={onStartAgain}>
              <Text style={styles.quickActionText}>Start</Text>
            </Pressable>
          )}

          {onShare && (
            <Pressable style={styles.quickActionButton} onPress={onShare}>
              <Text style={styles.quickActionText}>Share</Text>
            </Pressable>
          )}

          {onSaveAsRoutine && (
            <Pressable
              style={[styles.quickActionButton, styles.quickActionButtonPrimary]}
              onPress={onSaveAsRoutine}
            >
              <Text style={styles.quickActionTextPrimary}>Routine</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  routineName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  typeBadgeText: {
    color: '#4da6ff',
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 2,
  },
  notePreview: {
    color: '#d6d6d6',
    fontSize: 13,
    marginTop: 8,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  quickActionButtonPrimary: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionTextPrimary: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
  },
});
