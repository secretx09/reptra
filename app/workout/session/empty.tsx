import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Exercise } from '../../../types/exercise';
import {
  WorkoutSet,
  SavedWorkoutSession,
  SavedExerciseLog,
} from '../../../types/workout';
import { loadWorkouts, saveWorkouts } from '../../../storage/workouts';
import { getMuscleGroups, loadExerciseLibrary } from '../../../utils/exerciseLibrary';

export default function EmptyWorkoutSessionScreen() {
  const [startedAt] = useState(() => new Date().toISOString());
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [addedExercises, setAddedExercises] = useState<Exercise[]>([]);
  const [exerciseSets, setExerciseSets] = useState<{
    [exerciseId: string]: WorkoutSet[];
  }>({});
  const [exerciseNotes, setExerciseNotes] = useState<{
    [exerciseId: string]: string;
  }>({});
  const [exerciseRestTimes, setExerciseRestTimes] = useState<{
    [exerciseId: string]: number;
  }>({});
  const [customRestSeconds, setCustomRestSeconds] = useState<{
    [exerciseId: string]: string;
  }>({});
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchExerciseLibrary = async () => {
        const loadedExercises = await loadExerciseLibrary();
        setExerciseLibrary(loadedExercises);
      };

      fetchExerciseLibrary();
    }, [])
  );

  const muscleGroups = useMemo(
    () => getMuscleGroups(exerciseLibrary),
    [exerciseLibrary]
  );

  const filteredExercises = useMemo(() => {
    const addedIds = new Set(addedExercises.map((exercise) => exercise.id));

    return exerciseLibrary.filter((exercise) => {
      if (addedIds.has(exercise.id)) return false;

      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [exerciseLibrary, searchText, selectedMuscleGroup, addedExercises]);

  useEffect(() => {
    const hasActiveTimers = Object.values(exerciseRestTimes).some(
      (seconds) => seconds > 0
    );

    if (!hasActiveTimers) return;

    const interval = setInterval(() => {
      setExerciseRestTimes((prev) => {
        const nextState: { [exerciseId: string]: number } = {};

        Object.entries(prev).forEach(([exerciseId, seconds]) => {
          nextState[exerciseId] = seconds > 1 ? seconds - 1 : 0;
        });

        return nextState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [exerciseRestTimes]);

  const startRestTimer = (exerciseId: string, seconds: number) => {
    setExerciseRestTimes((prev) => ({
      ...prev,
      [exerciseId]: seconds,
    }));
  };

  const handleStartCustomRestTimer = (exerciseId: string) => {
    const trimmedValue = (customRestSeconds[exerciseId] || '').trim();
    const parsedSeconds = Number(trimmedValue);

    if (
      trimmedValue === '' ||
      !Number.isInteger(parsedSeconds) ||
      parsedSeconds <= 0
    ) {
      Alert.alert(
        'Invalid timer',
        'Enter a whole number of seconds greater than 0.'
      );
      return;
    }

    startRestTimer(exerciseId, parsedSeconds);
    setCustomRestSeconds((prev) => ({
      ...prev,
      [exerciseId]: '',
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddExercise = (exercise: Exercise) => {
    setAddedExercises((prev) => [...prev, exercise]);
    setExerciseSets((prev) => ({
      ...prev,
      [exercise.id]: [],
    }));
    setExerciseRestTimes((prev) => ({
      ...prev,
      [exercise.id]: 0,
    }));
    setSearchText('');
    setSelectedMuscleGroup('All');
    setIsExercisePickerOpen(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setAddedExercises((prev) =>
      prev.filter((exercise) => exercise.id !== exerciseId)
    );

    setExerciseSets((prev) => {
      const updated = { ...prev };
      delete updated[exerciseId];
      return updated;
    });

    setExerciseNotes((prev) => {
      const updated = { ...prev };
      delete updated[exerciseId];
      return updated;
    });
  };

  const handleAddSet = (exerciseId: string) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] || [];
      const previousSet = currentSets[currentSets.length - 1];

      const newSet: WorkoutSet = {
        id: new Date().toISOString(),
        setNumber: currentSets.length + 1,
        weight: previousSet ? previousSet.weight : '',
        reps: previousSet ? previousSet.reps : '',
        completed: false,
      };

      return {
        ...prev,
        [exerciseId]: [...currentSets, newSet],
      };
    });
  };

  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string
  ) => {
    setExerciseSets((prev) => {
      const updatedSets = (prev[exerciseId] || []).map((set) =>
        set.id === setId ? { ...set, [field]: value } : set
      );

      return {
        ...prev,
        [exerciseId]: updatedSets,
      };
    });
  };

  const handleToggleSetCompleted = (exerciseId: string, setId: string) => {
    setExerciseSets((prev) => {
      const updatedSets = (prev[exerciseId] || []).map((set) =>
        set.id === setId ? { ...set, completed: !set.completed } : set
      );

      return {
        ...prev,
        [exerciseId]: updatedSets,
      };
    });
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] || [];
      const filteredSets = currentSets.filter((set) => set.id !== setId);

      const renumberedSets = filteredSets.map((set, index) => ({
        ...set,
        setNumber: index + 1,
      }));

      return {
        ...prev,
        [exerciseId]: renumberedSets,
      };
    });
  };

  const handleUpdateExerciseNote = (exerciseId: string, value: string) => {
    setExerciseNotes((prev) => ({
      ...prev,
      [exerciseId]: value,
    }));
  };

  const handleFinishWorkout = async () => {
    const completedExercises: SavedExerciseLog[] = addedExercises
      .map((exercise) => {
        const sets = exerciseSets[exercise.id] || [];
        const note = exerciseNotes[exercise.id] || '';

        const checkedAndFilledSets = sets.filter(
          (set) =>
            set.completed &&
            (set.weight.trim() !== '' || set.reps.trim() !== '')
        );

        return {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          note: note.trim(),
          sets: checkedAndFilledSets,
        };
      })
      .filter(
        (exerciseLog) =>
          exerciseLog.sets.length > 0 || exerciseLog.note.trim() !== ''
      );

    if (completedExercises.length === 0) {
      Alert.alert(
        'Nothing to save',
        'Add at least one exercise and check off at least one set or add an exercise note before finishing.'
      );
      return;
    }

    const completedAt = new Date().toISOString();
    const durationMs =
      new Date(completedAt).getTime() - new Date(startedAt).getTime();
    const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000));

    const newWorkout: SavedWorkoutSession = {
      id: new Date().toISOString(),
      routineId: null,
      routineName: 'Empty Workout',
      startedAt,
      completedAt,
      durationMinutes,
      exercises: completedExercises,
    };

    const existingWorkouts = await loadWorkouts();
    const updatedWorkouts = [newWorkout, ...existingWorkouts];
    await saveWorkouts(updatedWorkouts);

    Alert.alert('Workout saved', 'Your empty workout has been saved.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Empty Workout' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.addExerciseCard}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {item.muscleGroup} • {item.equipment}
                </Text>
              </View>

              <Pressable
                style={styles.addButton}
                onPress={() => handleAddExercise(item)}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
          )}
          ListHeaderComponent={
            <>
              <Text style={styles.title}>Empty Workout</Text>
              <Text style={styles.subtitle}>
                Add exercises and log this workout live.
              </Text>

              <Text style={styles.sectionTitle}>Current Exercises</Text>

              {addedExercises.length === 0 ? (
                <Text style={styles.emptyText}>
                  No exercises added yet.
                </Text>
              ) : (
                addedExercises.map((exercise, index) => {
                  const sets = exerciseSets[exercise.id] || [];
                  const exerciseNote = exerciseNotes[exercise.id] || '';
                  const restTimeRemaining = exerciseRestTimes[exercise.id] || 0;
                  const customRestValue = customRestSeconds[exercise.id] || '';

                  return (
                    <View key={exercise.id} style={styles.currentExerciseCard}>
                      <View style={styles.exerciseHeaderRow}>
                        <View style={styles.exerciseHeaderText}>
                          <Text style={styles.exerciseIndex}>{index + 1}</Text>
                          <View style={styles.exerciseTitleWrap}>
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                            <Text style={styles.exerciseMeta}>
                              {exercise.muscleGroup} • {exercise.equipment}
                            </Text>
                          </View>
                        </View>

                        <Pressable
                          style={styles.removeButton}
                          onPress={() => handleRemoveExercise(exercise.id)}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </Pressable>
                      </View>

                      <TextInput
                        style={styles.exerciseNoteInput}
                        placeholder="Exercise note..."
                        placeholderTextColor="#777777"
                        value={exerciseNote}
                        onChangeText={(value) =>
                          handleUpdateExerciseNote(exercise.id, value)
                        }
                        multiline
                      />

                      <View style={styles.timerCard}>
                        <View style={styles.timerHeaderRow}>
                          <Text style={styles.timerLabel}>Rest Timer</Text>
                          <Text style={styles.timerValue}>
                            {restTimeRemaining > 0
                              ? formatTime(restTimeRemaining)
                              : 'Ready'}
                          </Text>
                        </View>

                        <View style={styles.timerButtonsRow}>
                          <Pressable
                            style={styles.timerButton}
                            onPress={() => startRestTimer(exercise.id, 60)}
                          >
                            <Text style={styles.timerButtonText}>60s</Text>
                          </Pressable>

                          <Pressable
                            style={styles.timerButton}
                            onPress={() => startRestTimer(exercise.id, 90)}
                          >
                            <Text style={styles.timerButtonText}>90s</Text>
                          </Pressable>

                          <Pressable
                            style={styles.timerButton}
                            onPress={() => startRestTimer(exercise.id, 120)}
                          >
                            <Text style={styles.timerButtonText}>120s</Text>
                          </Pressable>
                        </View>

                        <View style={styles.customTimerRow}>
                          <TextInput
                            style={styles.customTimerInput}
                            placeholder="Custom seconds"
                            placeholderTextColor="#777777"
                            keyboardType="numeric"
                            value={customRestValue}
                            onChangeText={(value) =>
                              setCustomRestSeconds((prev) => ({
                                ...prev,
                                [exercise.id]: value,
                              }))
                            }
                          />

                          <Pressable
                            style={styles.customTimerButton}
                            onPress={() =>
                              handleStartCustomRestTimer(exercise.id)
                            }
                          >
                            <Text style={styles.customTimerButtonText}>Start</Text>
                          </Pressable>
                        </View>
                      </View>

                      {sets.map((set) => (
                        <View
                          key={set.id}
                          style={[
                            styles.setRow,
                            set.completed && styles.setRowCompleted,
                          ]}
                        >
                          <Pressable
                            style={[
                              styles.checkButton,
                              set.completed && styles.checkButtonCompleted,
                            ]}
                            onPress={() =>
                              handleToggleSetCompleted(exercise.id, set.id)
                            }
                          >
                            <Text
                              style={[
                                styles.checkButtonText,
                                set.completed && styles.checkButtonTextCompleted,
                              ]}
                            >
                              ✓
                            </Text>
                          </Pressable>

                          <Text
                            style={[
                              styles.setLabel,
                              set.completed && styles.completedText,
                            ]}
                          >
                            {set.setNumber}
                          </Text>

                          <TextInput
                            style={[
                              styles.input,
                              set.completed && styles.inputCompleted,
                            ]}
                            placeholder="Wt"
                            placeholderTextColor="#777777"
                            keyboardType="numeric"
                            value={set.weight}
                            onChangeText={(value) =>
                              handleUpdateSet(exercise.id, set.id, 'weight', value)
                            }
                          />

                          <TextInput
                            style={[
                              styles.input,
                              set.completed && styles.inputCompleted,
                            ]}
                            placeholder="Reps"
                            placeholderTextColor="#777777"
                            keyboardType="numeric"
                            value={set.reps}
                            onChangeText={(value) =>
                              handleUpdateSet(exercise.id, set.id, 'reps', value)
                            }
                          />

                          <Pressable
                            style={styles.deleteSetButton}
                            onPress={() => handleDeleteSet(exercise.id, set.id)}
                          >
                            <Text style={styles.deleteSetButtonText}>✕</Text>
                          </Pressable>
                        </View>
                      ))}

                      <Pressable
                        style={styles.addSetButton}
                        onPress={() => handleAddSet(exercise.id)}
                      >
                        <Text style={styles.addSetText}>+ Add Set</Text>
                      </Pressable>
                    </View>
                  );
                })
              )}

              <View style={styles.addExerciseSection}>
                <Pressable
                  style={styles.addExerciseTrigger}
                  onPress={() =>
                    setIsExercisePickerOpen((prev) => !prev)
                  }
                >
                  <Text style={styles.addExerciseTriggerText}>
                    {isExercisePickerOpen ? 'Close Exercise Picker' : '+ Add Exercise'}
                  </Text>
                </Pressable>

                {isExercisePickerOpen && (
                  <View style={styles.exercisePickerCard}>
                    <Text style={styles.sectionTitle}>Add Exercises</Text>

                    <Pressable
                      style={styles.createCustomButton}
                      onPress={() => router.push('/exercise/create')}
                    >
                      <Text style={styles.createCustomButtonText}>
                        + Create Custom Exercise
                      </Text>
                    </Pressable>

                    <TextInput
                      style={styles.inputSearch}
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
                  </View>
                )}
              </View>
            </>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matching exercises found.</Text>
          }
          ListFooterComponent={
            <Pressable
              style={styles.finishButton}
              onPress={handleFinishWorkout}
            >
              <Text style={styles.finishButtonText}>Finish Workout</Text>
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
  sectionTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
  },
  addExerciseSection: {
    marginBottom: 6,
  },
  addExerciseTrigger: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  addExerciseTriggerText: {
    color: '#4da6ff',
    fontSize: 14,
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
  exercisePickerCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  timerCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  timerValue: {
    color: '#4da6ff',
    fontSize: 22,
    fontWeight: '700',
  },
  timerButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customTimerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  timerButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  timerButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  customTimerInput: {
    flex: 1,
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  customTimerButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTimerButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  currentExerciseCard: {
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
  exerciseInfo: {
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
  exerciseNoteInput: {
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    minHeight: 52,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  setRow: {
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 8,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setRowCompleted: {
    backgroundColor: '#132417',
    borderWidth: 1,
    borderColor: '#2d6a3a',
  },
  checkButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#202020',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  checkButtonText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '700',
  },
  checkButtonTextCompleted: {
    color: '#111111',
  },
  setLabel: {
    color: '#ffffff',
    fontSize: 13,
    width: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  completedText: {
    color: '#b8e6c1',
  },
  input: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#313131',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  inputCompleted: {
    borderColor: '#2d6a3a',
  },
  deleteSetButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSetButtonText: {
    color: '#ff8a8a',
    fontSize: 14,
    fontWeight: '700',
  },
  addSetButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4da6ff',
    alignItems: 'center',
  },
  addSetText: {
    color: '#4da6ff',
    fontWeight: '700',
    fontSize: 13,
  },
  inputSearch: {
    backgroundColor: '#171717',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
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
  finishButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  finishButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
});
