import { Pressable, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Exercise } from '../types/exercise';

type ExerciseCardProps = {
  exercise: Exercise;
  onPress?: (exercise: Exercise) => void;
  disableNavigation?: boolean;
};

export default function ExerciseCard({
  exercise,
  onPress,
  disableNavigation = false,
}: ExerciseCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(exercise);
      return;
    }

    if (!disableNavigation) {
      router.push(`/exercise/${exercise.id}`);
    }
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
  },
  meta: {
    color: '#aaaaaa',
    fontSize: 14,
  },
});