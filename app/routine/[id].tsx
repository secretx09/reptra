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
import {
  createRoutine,
  deleteRoutineById,
  loadRoutines,
  saveRoutines,
} from '../../storage/routines';
import { Exercise } from '../../types/exercise';
import { RoutineExerciseWithDefaults, RoutineWithExercises } from '../../types/routine';
import { WeightUnit } from '../../types/settings';
import {
  getSupersetBlocks,
  getSupersetDisplayMap,
  getSupersetInstructionText,
  getSupersetSummaryLine,
} from '../../utils/routineSupersets';
import { formatRestTimerLabel } from '../../utils/restTimer';
import { formatWeightUnit } from '../../utils/weightUnits';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');

  const fetchRoutine = useCallback(async () => {
    const routines = await loadRoutines();
    const foundRoutine = routines.find((item) => item.id === id) || null;
    setRoutine(foundRoutine);
  }, [id]);

  useEffect(() => {
    fetchRoutine();
  }, [fetchRoutine]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const savedSettings = await loadSettings();
        setWeightUnit(savedSettings.weightUnit);
        await fetchRoutine();
      };

      fetchData();
    }, [fetchRoutine])
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

  const handleTogglePinned = async () => {
    if (!routine) return;

    const routines = await loadRoutines();
    const updatedRoutines = routines.map((item) =>
      item.id === routine.id ? { ...item, isPinned: !(item.isPinned ?? false) } : item
    );

    const updatedRoutine =
      updatedRoutines.find((item) => item.id === routine.id) ?? null;

    await saveRoutines(updatedRoutines);
    setRoutine(updatedRoutine);
  };

  const handleDuplicateRoutine = async () => {
    if (!routine) return;

    const duplicatedRoutine: RoutineWithExercises = {
      ...routine,
      id: new Date().toISOString(),
      name: `${routine.name} Copy`,
      createdAt: new Date().toISOString(),
      isPinned: false,
      exercises: routine.exercises.map((exercise) => ({
        ...exercise,
        supersetGroupId: exercise.supersetGroupId ?? null,
      })),
    };

    await createRoutine(duplicatedRoutine);

    Alert.alert('Routine duplicated', `"${duplicatedRoutine.name}" is ready to edit.`, [
      {
        text: 'Open Copy',
        onPress: () => router.replace(`/routine/${duplicatedRoutine.id}`),
      },
      {
        text: 'Stay Here',
        style: 'cancel',
      },
    ]);
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.notFoundContainer} edges={['left', 'right', 'bottom']}>
        <Text style={styles.notFoundTitle}>Routine not found</Text>
        <Text style={styles.notFoundText}>
          This routine may have been deleted.
        </Text>
      </SafeAreaView>
    );
  }

  const supersetDisplayMap = getSupersetDisplayMap(routine.exercises);
  const supersetBlocks = getSupersetBlocks(routine.exercises);

  return (
    <>
      <Stack.Screen options={{ title: routine.name }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
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

              {!!routine.note?.trim() && (
                <View style={styles.routineNoteCard}>
                  <Text style={styles.routineNoteLabel}>Routine Note</Text>
                  <Text style={styles.routineNoteText}>{routine.note.trim()}</Text>
                </View>
              )}

              {supersetBlocks.some((block) => block.label !== '') && (
                <View style={styles.supersetOverviewCard}>
                  <Text style={styles.supersetOverviewTitle}>Superset Layout</Text>
                  <Text style={styles.supersetOverviewText}>
                    {getSupersetInstructionText()}
                  </Text>
                  {supersetBlocks
                    .filter((block) => block.label !== '')
                    .map((block) => (
                      <Text key={block.id} style={styles.supersetOverviewLine}>
                        {getSupersetSummaryLine(block, supersetDisplayMap)}
                      </Text>
                    ))}
                </View>
              )}

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => router.push(`/routine/edit/${routine.id}`)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.duplicateButton}
                  onPress={handleDuplicateRoutine}
                >
                  <Text style={styles.duplicateButtonText}>Duplicate</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.pinButton,
                    routine.isPinned && styles.pinButtonActive,
                  ]}
                  onPress={handleTogglePinned}
                >
                  <Text
                    style={[
                      styles.pinButtonText,
                      routine.isPinned && styles.pinButtonTextActive,
                    ]}
                  >
                    {routine.isPinned ? 'Pinned' : 'Pin'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.primaryActionRow}>
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
            <View
              style={[
                styles.exerciseCard,
                supersetDisplayMap[item.id] && styles.supersetExerciseCard,
              ]}
            >
              <View style={styles.exerciseHeaderRow}>
                <View style={styles.exerciseHeaderText}>
                  <Text style={styles.exerciseIndex}>{index + 1}</Text>
                  <View style={styles.exerciseTitleWrap}>
                    <View style={styles.exerciseTitleRow}>
                      <Text style={styles.exerciseName}>{item.name}</Text>

                      {supersetDisplayMap[item.id] && (
                        <View style={styles.supersetBadge}>
                          <Text style={styles.supersetBadgeText}>
                            {supersetDisplayMap[item.id].slotLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.exerciseMeta}>
                      {item.muscleGroup} {'\u2022'} {item.equipment}
                    </Text>
                    {supersetDisplayMap[item.id] && (
                      <Text style={styles.supersetHint}>
                        {`Part of Superset ${supersetDisplayMap[item.id].groupLabel}`}
                      </Text>
                    )}
                  </View>
                </View>

                {!!item.defaultRestSeconds && (
                  <View style={styles.restBadge}>
                    <Text style={styles.restBadgeText}>
                      {formatRestTimerLabel(Number(item.defaultRestSeconds))}
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

              {!!item.note?.trim() && (
                <View style={styles.exerciseNoteBox}>
                  <Text style={styles.exerciseNoteLabel}>Note</Text>
                  <Text style={styles.exerciseNoteText}>{item.note.trim()}</Text>
                </View>
              )}
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
  routineNoteCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  routineNoteLabel: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  routineNoteText: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 20,
  },
  supersetOverviewCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  supersetOverviewTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  supersetOverviewText: {
    color: '#9dbbda',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  supersetOverviewLine: {
    color: '#d8ecff',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  primaryActionRow: {
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
  duplicateButton: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  duplicateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pinButton: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 0.9,
  },
  pinButtonActive: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  pinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pinButtonTextActive: {
    color: '#4da6ff',
  },
  startButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
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
  supersetExerciseCard: {
    borderColor: '#355574',
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
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
  supersetHint: {
    color: '#7fbfff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  supersetBadge: {
    backgroundColor: '#0f2740',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  supersetBadgeText: {
    color: '#4da6ff',
    fontSize: 11,
    fontWeight: '700',
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
  exerciseNoteBox: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  exerciseNoteLabel: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseNoteText: {
    color: '#dddddd',
    fontSize: 13,
    lineHeight: 19,
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
