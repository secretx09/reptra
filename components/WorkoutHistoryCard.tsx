import { Pressable, Text, StyleSheet } from 'react-native';
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
  weightUnit?: WeightUnit;
};

export default function WorkoutHistoryCard({
  workout,
  onPress,
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

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.routineName}>{workout.routineName}</Text>
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
    </Pressable>
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
  routineName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  meta: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 2,
  },
});
