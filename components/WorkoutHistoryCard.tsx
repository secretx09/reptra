import { Pressable, Text, StyleSheet } from 'react-native';
import { SavedWorkoutSession } from '../types/workout';
import { formatWorkoutDuration } from '../utils/formatDuration';

type WorkoutHistoryCardProps = {
  workout: SavedWorkoutSession;
  onPress?: () => void;
};

export default function WorkoutHistoryCard({
  workout,
  onPress,
}: WorkoutHistoryCardProps) {
  const totalSets = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0
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
        {workout.exercises.length === 1 ? '' : 's'} • {totalSets} set
        {totalSets === 1 ? '' : 's'}
      </Text>
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
