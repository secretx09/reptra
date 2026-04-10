import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RoutineWithExercises } from '../types/routine';

type RoutineCardProps = {
  routine: RoutineWithExercises;
  onStart?: () => void;
};

export default function RoutineCard({ routine, onStart }: RoutineCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{routine.name}</Text>
      <Text style={styles.meta}>
        {routine.exercises.length} exercise{routine.exercises.length === 1 ? '' : 's'}
      </Text>

      {onStart && (
        <Pressable style={styles.button} onPress={onStart}>
          <Text style={styles.buttonText}>Start Routine</Text>
        </Pressable>
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
  name: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4da6ff',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 15,
  },
});