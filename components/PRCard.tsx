import { View, Text, StyleSheet } from 'react-native';
import { ExercisePR } from '../types/workout';

type PRCardProps = {
  pr: ExercisePR;
};

export default function PRCard({ pr }: PRCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.exerciseName}>{pr.exerciseName}</Text>
      <Text style={styles.weight}>{pr.heaviestWeight} lb</Text>
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
    marginBottom: 10,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  weight: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
  },
});