import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadSettings } from '../../storage/settings';
import { deleteRoutineById, loadRoutines } from '../../storage/routines';
import { Exercise } from '../../types/exercise';
import { RoutineExerciseWithDefaults, RoutineWithExercises } from '../../types/routine';
import { WeightUnit } from '../../types/settings';
import { formatWeightUnit } from '../../utils/weightUnits';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');

  const fetchRoutine = async () => {
    const routines = await loadRoutines();
    const foundRoutine = routines.find((item) => item.id === id) || null;
    setRoutine(foundRoutine);
  };

  useEffect(() => {
    fetchRoutine();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const savedSettings = await loadSettings();
        setWeightUnit(savedSettings.weightUnit);
        await fetchRoutine();
      };

      fetchData();
    }, [id])
  );

  const handleDeleteRoutine = () => {
    if (!routine) return;

    Alert.alert(
      'Delete routine',
      `Are you sure you want to delete "${routine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRoutineById(routine.id);
            router.back();
          },
        },
      ]
    );
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Routine not found</Text>
        <Text style={styles.notFoundText}>
          This routine may have been deleted.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: routine.name }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={routine.exercises}
          keyExtractor={(item: Exercise) => item.id}
          ListHeaderComponent={
            <>
              <Text style={styles.title}>{routine.name}</Text>
              <Text style={styles.subtitle}>
                {routine.exercises.length} exercise
                {routine.exercises.length === 1 ? '' : 's'}
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => router.push(`/routine/edit/${routine.id}`)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.startButton}
                  onPress={() => router.push(`/workout/session/${routine.id}`)}
                >
                  <Text style={styles.startButtonText}>Start Routine</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>Exercises</Text>
            </>
          }
          renderItem={({ item, index }: { item: RoutineExerciseWithDefaults; index: number }) => (
            <View style={styles.exerciseCard}>
              <View style={styles.exerciseHeaderRow}>
                <View style={styles.exerciseHeaderText}>
                  <Text style={styles.exerciseIndex}>{index + 1}</Text>
                  <View style={styles.exerciseTitleWrap}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {item.muscleGroup} • {item.equipment}
                    </Text>
                  </View>
                </View>

                {!!item.defaultRestSeconds && (
                  <View style={styles.restBadge}>
                    <Text style={styles.restBadgeText}>
                      {item.defaultRestSeconds}s rest
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.defaultsRow}>
                {!!item.defaultSets && (
                  <View style={styles.defaultChip}>
                    <Text style={styles.defaultChipText}>
                      {item.defaultSets} sets
                    </Text>
                  </View>
                )}

                {!!item.defaultWeight && (
                  <View style={styles.defaultChip}>
                    <Text style={styles.defaultChipText}>
                      {item.defaultWeight} {formatWeightUnit(weightUnit)}
                    </Text>
                  </View>
                )}

                {!!item.defaultReps && (
                  <View style={styles.defaultChip}>
                    <Text style={styles.defaultChipText}>
                      {item.defaultReps} reps
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          ListFooterComponent={
            <Pressable style={styles.deleteButton} onPress={handleDeleteRoutine}>
              <Text style={styles.deleteButtonText}>Delete Routine</Text>
            </Pressable>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 13,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  editButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1.4,
  },
  startButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
  exerciseCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  exerciseHeaderText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  exerciseIndex: {
    color: '#4da6ff',
    fontSize: 16,
    fontWeight: '700',
    paddingTop: 1,
    minWidth: 14,
  },
  exerciseTitleWrap: {
    flex: 1,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  exerciseMeta: {
    color: '#9a9a9a',
    fontSize: 13,
  },
  restBadge: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  restBadgeText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
  },
  defaultsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  defaultChip: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  defaultChipText: {
    color: '#dddddd',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#ff8a8a',
    fontSize: 16,
    fontWeight: '700',
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  notFoundText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
  },
});
