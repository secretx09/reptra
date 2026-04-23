import { View, Text, StyleSheet } from 'react-native';
import { ExercisePR } from '../types/workout';
import { WeightUnit } from '../types/settings';
import { convertWeightValue, formatWeightNumber, formatWeightUnit } from '../utils/weightUnits';

type PRCardProps = {
  pr: ExercisePR;
  weightUnit: WeightUnit;
};

export default function PRCard({ pr, weightUnit }: PRCardProps) {
  const convertedHeaviestWeight = convertWeightValue(
    pr.heaviestWeight,
    'lb',
    weightUnit
  );
  const convertedOneRepMax = convertWeightValue(
    pr.bestEstimatedOneRepMax,
    'lb',
    weightUnit
  );

  return (
    <View style={styles.card}>
      <Text style={styles.exerciseName}>{pr.exerciseName}</Text>

      <Text style={styles.weight}>
        Max: {formatWeightNumber(convertedHeaviestWeight)} {formatWeightUnit(weightUnit)}
      </Text>

      <Text style={styles.oneRepMax}>
        1RM: {formatWeightNumber(convertedOneRepMax)} {formatWeightUnit(weightUnit)}
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
