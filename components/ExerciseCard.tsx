import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Exercise } from '../types/exercise';

type ExerciseCardProps = {
  exercise: Exercise;
};

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const handlePress = () => {
    router.push(`/exercise/${exercise.id}`);
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <Text style={styles.name}>{exercise.name}</Text>
      <Text style={styles.meta}>
        {exercise.muscleGroup} • {exercise.equipment}
      </Text>
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
  name: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    color: '#aaaaaa',
    fontSize: 14,
  },
});