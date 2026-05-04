import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RoutineWithExercises } from '../types/routine';
import { getTrainingCategory } from '../utils/trainingSplit';

type RoutineCardProps = {
  routine: RoutineWithExercises;
  onPress?: () => void;
  onStart?: () => void;
  completedCount?: number;
  lastCompletedLabel?: string;
  completedThisWeek?: number;
};

export default function RoutineCard({
  routine,
  onPress,
  onStart,
  completedCount = 0,
  lastCompletedLabel,
  completedThisWeek = 0,
}: RoutineCardProps) {
  const trainingCategory = getTrainingCategory(routine.trainingCategory ?? 'mixed');

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.titleRow}>
        <Text style={styles.name}>{routine.name}</Text>
        {routine.isPinned && (
          <View style={styles.pinBadge}>
            <Ionicons name="star" size={12} color="#111111" />
            <Text style={styles.pinBadgeText}>Pinned</Text>
          </View>
        )}
      </View>
      <Text style={styles.meta}>
        {routine.exercises.length} exercise{routine.exercises.length === 1 ? '' : 's'}
      </Text>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeText}>{trainingCategory.label}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>
            completion{completedCount === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.statChip}>
          <Text style={styles.statValue}>{lastCompletedLabel ?? 'Not yet'}</Text>
          <Text style={styles.statLabel}>last run</Text>
        </View>

        <View style={styles.statChip}>
          <Text style={styles.statValue}>{completedThisWeek}</Text>
          <Text style={styles.statLabel}>this week</Text>
        </View>
      </View>

      {onStart && (
        <Pressable
          style={styles.button}
          onPress={(event) => {
            event.stopPropagation();
            onStart();
          }}
        >
          <Text style={styles.buttonText}>Start Routine</Text>
        </Pressable>
      )}
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
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pinBadgeText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  categoryBadgeText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8f8f8f',
    fontSize: 12,
    fontWeight: '600',
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
