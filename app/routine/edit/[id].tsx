import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadSettings } from '../../../storage/settings';
import { loadRoutines, updateRoutineById } from '../../../storage/routines';
import { Exercise } from '../../../types/exercise';
import {
  RoutineExerciseWithDefaults,
  RoutineWithExercises,
} from '../../../types/routine';
import { WeightUnit } from '../../../types/settings';
import { getMuscleGroups, loadExerciseLibrary } from '../../../utils/exerciseLibrary';
import {
  getSupersetDisplayMap,
  getSupersetBlocks,
  getSupersetInstructionText,
  getSupersetSummaryLine,
  normalizeSupersetExercises,
  toggleSupersetWithPrevious,
} from '../../../utils/routineSupersets';
import { parseRestTimerInput } from '../../../utils/restTimer';
import { getWeightFieldLabel } from '../../../utils/weightUnits';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [routineNote, setRoutineNote] = useState('');
  const [editedExercises, setEditedExercises] = useState<
    RoutineExerciseWithDefaults[]
  >([]);
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const fetchRoutine = async () => {
      const routines = await loadRoutines();
      const foundRoutine = routines.find((item) => item.id === id) || null;

      if (foundRoutine) {
        const normalizedExercises = normalizeSupersetExercises(
          foundRoutine.exercises.map((exercise) => ({
            ...exercise,
            defaultSets: exercise.defaultSets ?? '',
            defaultWeight: exercise.defaultWeight ?? '',
            defaultReps: exercise.defaultReps ?? '',
            defaultRestSeconds: exercise.defaultRestSeconds ?? '',
            note: exercise.note ?? '',
          }))
        );

        setRoutine({
          ...foundRoutine,
          name: foundRoutine.name ?? '',
          isPinned: foundRoutine.isPinned ?? false,
          note: foundRoutine.note ?? '',
          exercises: normalizedExercises,
        });
        setRoutineName(foundRoutine.name ?? '');
        setRoutineNote(foundRoutine.note ?? '');
        setIsPinned(foundRoutine.isPinned ?? false);
        setEditedExercises(normalizedExercises);
      }
    };

    fetchRoutine();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      const fetchExerciseLibrary = async () => {
        const loadedExercises = await loadExerciseLibrary();
        const savedSettings = await loadSettings();
        setExerciseLibrary(loadedExercises);
        setWeightUnit(savedSettings.weightUnit);
      };

      fetchExerciseLibrary();
    }, [])
  );

  const muscleGroups = useMemo(
    () => getMuscleGroups(exerciseLibrary),
    [exerciseLibrary]
  );

  const filteredExercisesToAdd = useMemo(() => {
    const alreadyAddedIds = new Set(editedExercises.map((exercise) => exercise.id));

    return exerciseLibrary.filter((exercise) => {
      if (alreadyAddedIds.has(exercise.id)) return false;

      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [editedExercises, exerciseLibrary, searchText, selectedMuscleGroup]);

  const supersetDisplayMap = useMemo(
    () => getSupersetDisplayMap(editedExercises),
    [editedExercises]
  );

  const supersetBlocks = useMemo(
    () => getSupersetBlocks(editedExercises).filter((block) => block.label !== ''),
    [editedExercises]
  );

  const handleRemoveExercise = (exerciseId: string) => {
    setEditedExercises((prev) =>
      normalizeSupersetExercises(
        prev.filter((exercise) => exercise.id !== exerciseId)
      )
    );
  };

  const handleAddExercise = (exercise: Exercise) => {
    setEditedExercises((prev) => [
      ...prev,
      {
        ...exercise,
        defaultSets: '',
        defaultWeight: '',
        defaultReps: '',
        defaultRestSeconds: '',
        note: '',
        supersetGroupId: null,
      },
    ]);
  };

  const handleMoveExerciseUp = (index: number) => {
    if (index === 0) return;

    setEditedExercises((prev) => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return normalizeSupersetExercises(updated);
    });
  };

  const handleMoveExerciseDown = (index: number) => {
    setEditedExercises((prev) => {
      if (index === prev.length - 1) return prev;

      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return normalizeSupersetExercises(updated);
    });
  };

  const handleToggleSuperset = (index: number) => {
    setEditedExercises((prev) => toggleSupersetWithPrevious(prev, index));
  };

  const handleUpdateExerciseDefault = (
    exerciseId: string,
    field:
      | 'defaultSets'
      | 'defaultWeight'
      | 'defaultReps'
      | 'defaultRestSeconds'
      | 'note',
    value: string
  ) => {
    setEditedExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const handleSaveChanges = async () => {
    if (!routine) return;

    if (!routineName.trim()) {
      Alert.alert('Missing name', 'Please enter a routine name.');
      return;
    }

    if (editedExercises.length === 0) {
      Alert.alert('No exercises left', 'A routine must have at least one exercise.');
      return;
    }

    const normalizedExercises = editedExercises.map((exercise) => {
      const parsedRestSeconds = parseRestTimerInput(
        exercise.defaultRestSeconds ?? ''
      );

      return {
        ...exercise,
        defaultRestSeconds: parsedRestSeconds ? parsedRestSeconds.toString() : '',
        note: exercise.note?.trim() ?? '',
      };
    });

    const updatedRoutine: RoutineWithExercises = {
      ...routine,
      name: routineName.trim(),
      isPinned,
      note: routineNote.trim(),
      exercises: normalizedExercises,
    };

    await updateRoutineById(routine.id, updatedRoutine);

    Alert.alert('Routine updated', 'Your routine has been updated.', [
      {
        text: 'OK',
        onPress: () => router.back(),
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

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.topBarText}>
          <Text style={styles.title}>Edit Routine</Text>
          <Text style={styles.subtitle}>Adjust exercise order and defaults</Text>
        </View>

        <Pressable style={styles.topSaveButton} onPress={handleSaveChanges}>
          <Text style={styles.topSaveButtonText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
            <Text style={styles.label}>Routine Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Routine name"
              placeholderTextColor="#888888"
              value={routineName}
              onChangeText={setRoutineName}
            />

            <Text style={styles.label}>Routine Note</Text>
            <TextInput
              style={styles.routineNoteInput}
              placeholder="Routine note or goal..."
              placeholderTextColor="#888888"
              value={routineNote}
              onChangeText={setRoutineNote}
              multiline
            />

            <Pressable
              style={[styles.pinToggleCard, isPinned && styles.pinToggleCardActive]}
              onPress={() => setIsPinned((current) => !current)}
            >
              <View style={styles.pinToggleTextWrap}>
                <Text style={styles.pinToggleTitle}>
                  {isPinned ? 'Pinned Routine' : 'Pin This Routine'}
                </Text>
                <Text style={styles.pinToggleText}>
                  {isPinned
                    ? 'This routine will stay near the top on your Workout tab.'
                    : 'Pin your go-to routine so it stays easier to reach.'}
                </Text>
              </View>
              <Text style={[styles.pinToggleChip, isPinned && styles.pinToggleChipActive]}>
                {isPinned ? 'Pinned' : 'Off'}
              </Text>
            </Pressable>

            {supersetBlocks.length > 0 && (
              <View style={styles.supersetSummaryCard}>
                <Text style={styles.supersetSummaryTitle}>Superset Layout</Text>
                <Text style={styles.supersetSummaryText}>
                  {supersetBlocks.length} superset
                  {supersetBlocks.length === 1 ? '' : 's'} in this routine.
                  {' '}
                  {getSupersetInstructionText()}
                </Text>

                {supersetBlocks.map((block) => (
                  <Text key={block.id} style={styles.supersetSummaryLine}>
                    {getSupersetSummaryLine(block, supersetDisplayMap)}
                  </Text>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Current Exercises</Text>

            {editedExercises.length === 0 ? (
              <Text style={styles.emptyText}>No exercises left in this routine.</Text>
            ) : (
              editedExercises.map((item, index) => (
                <View key={item.id} style={styles.exerciseCard}>
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
                            {`${supersetDisplayMap[item.id].slotLabel} in Superset ${supersetDisplayMap[item.id].groupLabel}`}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.actionColumn}>
                      <View style={styles.reorderRow}>
                        <Pressable
                          style={[
                            styles.orderButton,
                            index === 0 && styles.orderButtonDisabled,
                          ]}
                          onPress={() => handleMoveExerciseUp(index)}
                          disabled={index === 0}
                        >
                          <Text
                            style={[
                              styles.orderButtonText,
                              index === 0 && styles.orderButtonTextDisabled,
                            ]}
                          >
                            ↑
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.orderButton,
                            index === editedExercises.length - 1 &&
                              styles.orderButtonDisabled,
                          ]}
                          onPress={() => handleMoveExerciseDown(index)}
                          disabled={index === editedExercises.length - 1}
                        >
                          <Text
                            style={[
                              styles.orderButtonText,
                              index === editedExercises.length - 1 &&
                                styles.orderButtonTextDisabled,
                            ]}
                          >
                            ↓
                          </Text>
                        </Pressable>
                      </View>

                      <Pressable
                        style={styles.removeButton}
                        onPress={() => handleRemoveExercise(item.id)}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.defaultsGrid}>
                    <View style={styles.defaultField}>
                      <Text style={styles.defaultLabel}>Sets</Text>
                      <TextInput
                        style={styles.smallInput}
                        placeholder="0"
                        placeholderTextColor="#777777"
                        keyboardType="numeric"
                        value={item.defaultSets}
                        onChangeText={(value) =>
                          handleUpdateExerciseDefault(item.id, 'defaultSets', value)
                        }
                      />
                    </View>

                    <View style={styles.defaultField}>
                      <Text style={styles.defaultLabel}>
                        {getWeightFieldLabel(weightUnit)}
                      </Text>
                      <TextInput
                        style={styles.smallInput}
                        placeholder="0"
                        placeholderTextColor="#777777"
                        keyboardType="numeric"
                        value={item.defaultWeight}
                        onChangeText={(value) =>
                          handleUpdateExerciseDefault(item.id, 'defaultWeight', value)
                        }
                      />
                    </View>

                    <View style={styles.defaultField}>
                      <Text style={styles.defaultLabel}>Reps</Text>
                      <TextInput
                        style={styles.smallInput}
                        placeholder="0"
                        placeholderTextColor="#777777"
                        keyboardType="numeric"
                        value={item.defaultReps}
                        onChangeText={(value) =>
                          handleUpdateExerciseDefault(item.id, 'defaultReps', value)
                        }
                      />
                    </View>

                    <View style={styles.defaultField}>
                      <Text style={styles.defaultLabel}>Rest</Text>
                      <TextInput
                        style={styles.smallInput}
                        placeholder="90 / 1:30"
                        placeholderTextColor="#777777"
                        value={item.defaultRestSeconds}
                        onChangeText={(value) =>
                          handleUpdateExerciseDefault(
                            item.id,
                            'defaultRestSeconds',
                            value
                          )
                        }
                      />
                    </View>
                  </View>

                  <TextInput
                    style={styles.exerciseNoteInput}
                    placeholder="Exercise note..."
                    placeholderTextColor="#777777"
                    value={item.note ?? ''}
                    onChangeText={(value) =>
                      handleUpdateExerciseDefault(item.id, 'note', value)
                    }
                    multiline
                  />

                  {index > 0 && (
                    <Pressable
                      style={[
                        styles.supersetButton,
                        supersetDisplayMap[item.id] &&
                          styles.supersetButtonActive,
                      ]}
                      onPress={() => handleToggleSuperset(index)}
                    >
                      <Text
                        style={[
                          styles.supersetButtonText,
                          supersetDisplayMap[item.id] &&
                            styles.supersetButtonTextActive,
                        ]}
                      >
                        {supersetDisplayMap[item.id]
                          ? 'Remove Superset'
                          : 'Superset With Previous'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}

            <Pressable
              style={styles.addExerciseTrigger}
              onPress={() => setIsExercisePickerOpen((prev) => !prev)}
            >
              <Text style={styles.addExerciseTriggerText}>
                {isExercisePickerOpen ? 'Close Exercise Picker' : 'Add Exercises'}
              </Text>
            </Pressable>

            {isExercisePickerOpen && (
              <>
                <Text style={styles.sectionTitle}>Pick Exercises</Text>

                <Pressable
                  style={styles.createCustomButton}
                  onPress={() => router.push('/exercise/create')}
                >
                  <Text style={styles.createCustomButtonText}>
                    + Create Custom Exercise
                  </Text>
                </Pressable>

                <TextInput
                  style={styles.input}
                  placeholder="Search exercises..."
                  placeholderTextColor="#888888"
                  value={searchText}
                  onChangeText={setSearchText}
                />

                <View style={styles.filterRow}>
                  {muscleGroups.map((group) => {
                    const isSelected = selectedMuscleGroup === group;

                    return (
                      <Pressable
                        key={group}
                        style={[
                          styles.filterButton,
                          isSelected && styles.filterButtonSelected,
                        ]}
                        onPress={() => setSelectedMuscleGroup(group)}
                      >
                        <Text
                          style={[
                            styles.filterButtonText,
                            isSelected && styles.filterButtonTextSelected,
                          ]}
                        >
                          {group}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {filteredExercisesToAdd.length === 0 ? (
                  <Text style={styles.emptyText}>No matching exercises to add.</Text>
                ) : (
                  filteredExercisesToAdd.map((item) => (
                    <View key={item.id} style={styles.addExerciseCard}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{item.name}</Text>
                        <Text style={styles.exerciseMeta}>
                          {item.muscleGroup} {'\u2022'} {item.equipment}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.addButton}
                        onPress={() => handleAddExercise(item)}
                      >
                        <Text style={styles.addButtonText}>Add</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </>
            )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  topBarText: {
    flex: 1,
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
  },
  topSaveButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topSaveButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#171717',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  routineNoteInput: {
    backgroundColor: '#171717',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 76,
    textAlignVertical: 'top',
    marginBottom: 16,
    fontSize: 15,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
  },
  pinToggleCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pinToggleCardActive: {
    borderColor: '#4da6ff',
    backgroundColor: '#16324d',
  },
  pinToggleTextWrap: {
    flex: 1,
  },
  pinToggleTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  pinToggleText: {
    color: '#9a9a9a',
    fontSize: 13,
    lineHeight: 18,
  },
  pinToggleChip: {
    color: '#9a9a9a',
    fontSize: 12,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pinToggleChipActive: {
    color: '#4da6ff',
    borderColor: '#4da6ff',
    backgroundColor: '#0f2740',
  },
  supersetSummaryCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  supersetSummaryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  supersetSummaryText: {
    color: '#9dbbda',
    fontSize: 13,
    marginBottom: 8,
  },
  supersetSummaryLine: {
    color: '#d8ecff',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  addExerciseTrigger: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addExerciseTriggerText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  createCustomButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  createCustomButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
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
  addExerciseCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
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
  exerciseInfo: {
    flex: 1,
  },
  actionColumn: {
    alignItems: 'flex-end',
    gap: 8,
  },
  reorderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    flex: 1,
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
  defaultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  defaultField: {
    flex: 1,
    minWidth: 72,
  },
  defaultLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  smallInput: {
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
  },
  exerciseNoteInput: {
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 64,
    textAlignVertical: 'top',
    fontSize: 13,
    marginTop: 10,
  },
  removeButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    color: '#ff8a8a',
    fontSize: 13,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  orderButton: {
    width: 34,
    height: 34,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonDisabled: {
    backgroundColor: '#1c1c1c',
    borderColor: '#333333',
  },
  orderButtonText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  orderButtonTextDisabled: {
    color: '#666666',
  },
  supersetButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2e2e2e',
    backgroundColor: '#121212',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  supersetButtonActive: {
    borderColor: '#4da6ff',
    backgroundColor: '#16324d',
  },
  supersetButtonText: {
    color: '#d2d2d2',
    fontSize: 13,
    fontWeight: '700',
  },
  supersetButtonTextActive: {
    color: '#4da6ff',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonSelected: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  filterButtonTextSelected: {
    color: '#111111',
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
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
