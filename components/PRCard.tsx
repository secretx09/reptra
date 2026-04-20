import { View, Text, StyleSheet } from 'react-native';
import { ExercisePR } from '../types/workout';
import { WeightUnit } from '../types/settings';
import { formatWeightUnit } from '../utils/weightUnits';

type PRCardProps = {
  pr: ExercisePR;
  weightUnit: WeightUnit;
};

export default function PRCard({ pr, weightUnit }: PRCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.exerciseName}>{pr.exerciseName}</Text>

      <Text style={styles.weight}>
        Max: {pr.heaviestWeight} {formatWeightUnit(weightUnit)}
      </Text>

      <Text style={styles.oneRepMax}>
        1RM: {Math.round(pr.bestEstimatedOneRepMax)} {formatWeightUnit(weightUnit)}
      </Text>
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
    marginBottom: 6,
  },
  weight: {
    color: '#aaaaaa',
    fontSize: 14,
  },
  oneRepMax: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
});
