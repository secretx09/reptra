import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { loadRoutines } from '../../../storage/routines';
import {
  isTemplateWorkoutDraftId,
  loadTemplateWorkoutDraft,
} from '../../../storage/templateWorkoutDrafts';
import { loadWorkouts, saveWorkouts } from '../../../storage/workouts';
import { Exercise } from '../../../types/exercise';
import { RoutineExerciseWithDefaults, RoutineWithExercises } from '../../../types/routine';
import { WeightUnit } from '../../../types/settings';
import {
  SavedExerciseLog,
  SavedWorkoutSession,
  WorkoutSet,
} from '../../../types/workout';
import { getMuscleGroups, loadExerciseLibrary } from '../../../utils/exerciseLibrary';
import {
  getSupersetBlocks,
  getSupersetDisplayMap,
  normalizeSupersetExercises,
} from '../../../utils/routineSupersets';
import {
  formatRestTimerCountdown,
  formatRestTimerLabel,
  parseRestTimerInput,
} from '../../../utils/restTimer';
import { getMostRecentSetPrefill } from '../../../utils/workoutHistory';
import { getWeightPlaceholder } from '../../../utils/weightUnits';

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [startedAt] = useState(() => new Date().toISOString());
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [defaultRestTimerSeconds, setDefaultRestTimerSeconds] = useState(90);
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [sessionExercises, setSessionExercises] = useState<RoutineExerciseWithDefaults[]>([]);
  const [exerciseSets, setExerciseSets] = useState<Record<string, WorkoutSet[]>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [exerciseRestTimes, setExerciseRestTimes] = useState<Record<string, number>>({});
  const [exerciseRestConfigs, setExerciseRestConfigs] = useState<Record<string, number>>({});
  const [restEditorInputs, setRestEditorInputs] = useState<Record<string, string>>({});
  const [openRestEditorId, setOpenRestEditorId] = useState<string | null>(null);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');

  useEffect(() => {
    const fetchRoutine = async () => {
      const routines = await loadRoutines();
      const found = routines.find((r) => r.id === id) || null;
      const templateDraft =
        !found && id ? await loadTemplateWorkoutDraft(id) : null;
      const routineToLoad = found ?? templateDraft;

      if (!routineToLoad) {
        setRoutine(null);
        return;
      }

      const normalizedExercises = normalizeSupersetExercises(
        routineToLoad.exercises.map((exercise) => ({
          ...exercise,
          defaultSets: exercise.defaultSets ?? '',
          defaultWeight: exercise.defaultWeight ?? '',
          defaultReps: exercise.defaultReps ?? '',
          defaultRestSeconds: exercise.defaultRestSeconds ?? '',
          note: exercise.note ?? '',
        }))
      );
      const initialExerciseSets: Record<string, WorkoutSet[]> = {};
      const initialExerciseNotes: Record<string, string> = {};
      const initialRestConfigs: Record<string, number> = {};
      const initialRestEditorInputs: Record<string, string> = {};

      normalizedExercises.forEach((exercise) => {
        const defaultSetCount = Number(exercise.defaultSets);
        const parsedRestSeconds = Number(exercise.defaultRestSeconds);

        initialExerciseSets[exercise.id] =
          !Number.isNaN(defaultSetCount) && defaultSetCount > 0
            ? Array.from({ length: defaultSetCount }, (_, index) => ({
                id: `${exercise.id}-${index}-${Date.now()}`,
                setNumber: index + 1,
                weight: exercise.defaultWeight || '',
                reps: exercise.defaultReps || '',
                completed: false,
              }))
            : [];

        initialExerciseNotes[exercise.id] = exercise.note ?? '';
        initialRestConfigs[exercise.id] =
          Number.isInteger(parsedRestSeconds) && parsedRestSeconds > 0
            ? parsedRestSeconds
            : 0;
        initialRestEditorInputs[exercise.id] =
          initialRestConfigs[exercise.id] > 0
            ? initialRestConfigs[exercise.id].toString()
            : '';
      });

      setRoutine(routineToLoad);
      setSessionExercises(normalizedExercises);
      setExerciseSets(initialExerciseSets);
      setExerciseNotes(initialExerciseNotes);
      setExerciseRestConfigs(initialRestConfigs);
      setRestEditorInputs(initialRestEditorInputs);
    };

    fetchRoutine();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      const fetchExerciseLibrary = async () => {
        const loadedExercises = await loadExerciseLibrary();
        const existingWorkouts = await loadWorkouts();
        const savedSettings = await loadSettings();
        setExerciseLibrary(loadedExercises);
        setSavedWorkouts(existingWorkouts);
        setWeightUnit(savedSettings.weightUnit);
        setDefaultRestTimerSeconds(savedSettings.defaultRestTimerSeconds);
      };

      fetchExerciseLibrary();
    }, [])
  );

  const muscleGroups = useMemo(
    () => getMuscleGroups(exerciseLibrary),
    [exerciseLibrary]
  );

  const filteredExercises = useMemo(() => {
    const addedIds = new Set(sessionExercises.map((item) => item.id));

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
  }, [exerciseLibrary, searchText, selectedMuscleGroup, sessionExercises]);

  const supersetDisplayMap = useMemo(
    () => getSupersetDisplayMap(sessionExercises),
    [sessionExercises]
  );

  const supersetBlocks = useMemo(
    () => getSupersetBlocks(sessionExercises),
    [sessionExercises]
  );

  const getBlockForExercise = useCallback(
    (exerciseId: string) =>
      supersetBlocks.find((block) =>
        block.exercises.some((exercise) => exercise.id === exerciseId)
      ) || null,
    [supersetBlocks]
  );

  const getSupersetRoundStatus = useCallback(
    (block: (typeof supersetBlocks)[number]) => {
      const maxSetCount = Math.max(
        ...block.exercises.map(
          (exercise) => (exerciseSets[exercise.id] || []).length
        ),
        0
      );

      for (let setNumber = 1; setNumber <= maxSetCount; setNumber += 1) {
        for (const exercise of block.exercises) {
          const matchingSet = (exerciseSets[exercise.id] || []).find(
            (set) => set.setNumber === setNumber
          );

          if (!matchingSet || !matchingSet.completed) {
            return {
              nextSlotLabel: `${supersetDisplayMap[exercise.id]?.slotLabel || ''} Set ${setNumber}`,
              roundLabel: `Round ${setNumber}`,
              isComplete: false,
            };
          }
        }
      }

      return {
        nextSlotLabel: '',
        roundLabel: maxSetCount > 0 ? `Round ${maxSetCount} complete` : 'Ready to start',
        isComplete: true,
      };
    },
    [exerciseSets, supersetDisplayMap]
  );

  useEffect(() => {
    const hasActiveTimers = Object.values(exerciseRestTimes).some(
      (seconds) => seconds > 0
    );

    if (!hasActiveTimers) return;

    const interval = setInterval(() => {
      setExerciseRestTimes((prev) => {
        const nextState: Record<string, number> = {};

        Object.entries(prev).forEach(([exerciseId, seconds]) => {
          nextState[exerciseId] = seconds > 1 ? seconds - 1 : 0;
        });

        return nextState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [exerciseRestTimes]);

  const handleAddExercise = (exercise: Exercise) => {
    const firstSetPrefill = getMostRecentSetPrefill(savedWorkouts, exercise.id, 1);

    const routineExercise: RoutineExerciseWithDefaults = {
      ...exercise,
      defaultSets: '',
      defaultWeight: '',
      defaultReps: '',
      defaultRestSeconds: '',
      note: '',
      supersetGroupId: null,
    };

    setSessionExercises((prev) => [...prev, routineExercise]);
    setExerciseSets((prev) => ({
      ...prev,
      [exercise.id]: [
        {
          id: new Date().toISOString(),
          setNumber: 1,
          weight: firstSetPrefill?.weight || '',
          reps: firstSetPrefill?.reps || '',
          completed: false,
        },
      ],
    }));
    setExerciseRestTimes((prev) => ({
      ...prev,
      [exercise.id]: 0,
    }));
    setExerciseRestConfigs((prev) => ({
      ...prev,
      [exercise.id]: 0,
    }));
    setRestEditorInputs((prev) => ({
      ...prev,
      [exercise.id]: '',
    }));
    setSearchText('');
    setSelectedMuscleGroup('All');
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
    setExerciseSets((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || []).map((set) =>
        set.id === setId ? { ...set, [field]: value } : set
      ),
    }));
  };

  const handleToggleSetCompleted = (exerciseId: string, setId: string) => {
    const currentSet = (exerciseSets[exerciseId] || []).find(
      (set) => set.id === setId
    );
    const currentBlock = getBlockForExercise(exerciseId);
    const isCompletingSet = !!currentSet && !currentSet.completed;

    let timerExerciseIds: string[] = [];
    let resolvedRestSeconds = 0;

    if (currentSet && isCompletingSet) {
      if (currentBlock && currentBlock.label) {
        const blockExerciseIds = currentBlock.exercises.map(
          (exercise) => exercise.id
        );
        const roundIsComplete = currentBlock.exercises.every((exercise) => {
          const matchingSet = (exerciseSets[exercise.id] || []).find(
            (set) => set.setNumber === currentSet.setNumber
          );

          if (exercise.id === exerciseId) {
            return !!matchingSet;
          }

          return !!matchingSet?.completed;
        });

        if (roundIsComplete) {
          timerExerciseIds = blockExerciseIds;
          resolvedRestSeconds =
            exerciseRestConfigs[exerciseId] ||
            currentBlock.exercises.reduce((best, exercise) => {
              return Math.max(best, exerciseRestConfigs[exercise.id] || 0);
            }, 0);
        }
      } else {
        resolvedRestSeconds = exerciseRestConfigs[exerciseId] || 0;
        timerExerciseIds = resolvedRestSeconds > 0 ? [exerciseId] : [];
      }
    }

    setExerciseSets((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || []).map((set) =>
        set.id === setId ? { ...set, completed: !set.completed } : set
      ),
    }));

    if (resolvedRestSeconds > 0 && timerExerciseIds.length > 0) {
      setExerciseRestTimes((prev) => ({
        ...prev,
        ...timerExerciseIds.reduce<Record<string, number>>((acc, id) => {
          acc[id] = resolvedRestSeconds;
          return acc;
        }, {}),
      }));
    }
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    setExerciseSets((prev) => {
      const filteredSets = (prev[exerciseId] || []).filter(
        (set) => set.id !== setId
      );

      return {
        ...prev,
        [exerciseId]: filteredSets.map((set, index) => ({
          ...set,
          setNumber: index + 1,
        })),
      };
    });
  };

  const handleUpdateExerciseNote = (exerciseId: string, value: string) => {
    setExerciseNotes((prev) => ({
      ...prev,
      [exerciseId]: value,
    }));
  };

  const handleOpenRestEditor = (exerciseId: string) => {
    const configuredValue = exerciseRestConfigs[exerciseId] || 0;

    setRestEditorInputs((prev) => ({
      ...prev,
      [exerciseId]: configuredValue > 0 ? configuredValue.toString() : '',
    }));
    setOpenRestEditorId((prev) => (prev === exerciseId ? null : exerciseId));
  };

  const handleUseDefaultRestTimer = (exerciseId: string) => {
    setExerciseRestConfigs((prev) => ({
      ...prev,
      [exerciseId]: defaultRestTimerSeconds,
    }));
    setRestEditorInputs((prev) => ({
      ...prev,
      [exerciseId]: defaultRestTimerSeconds.toString(),
    }));
    setOpenRestEditorId(null);
  };

  const handleTurnOffRestTimer = (exerciseId: string) => {
    setExerciseRestConfigs((prev) => ({
      ...prev,
      [exerciseId]: 0,
    }));
    setExerciseRestTimes((prev) => ({
      ...prev,
      [exerciseId]: 0,
    }));
    setRestEditorInputs((prev) => ({
      ...prev,
      [exerciseId]: '',
    }));
    setOpenRestEditorId(null);
  };

  const handleSaveRestTimerConfig = (exerciseId: string) => {
    const parsedValue = parseRestTimerInput(restEditorInputs[exerciseId] || '');

    if (!parsedValue) {
      Alert.alert(
        'Invalid rest timer',
        'Enter a rest time like `45`, `90`, or `1:30`.'
      );
      return;
    }

    setExerciseRestConfigs((prev) => ({
      ...prev,
      [exerciseId]: parsedValue,
    }));
    setOpenRestEditorId(null);
  };

  const getRestTimerStatus = (exerciseId: string) => {
    const remainingSeconds = exerciseRestTimes[exerciseId] || 0;
    const configuredSeconds = exerciseRestConfigs[exerciseId] || 0;

    if (remainingSeconds > 0) {
      return formatRestTimerCountdown(remainingSeconds);
    }

    return formatRestTimerLabel(configuredSeconds);
  };

  const handleFinishWorkout = async () => {
    if (!routine) return;

    const completedExercises: SavedExerciseLog[] = sessionExercises
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
        'Check off at least one set or add an exercise note before finishing.'
      );
      return;
    }

    const completedAt = new Date().toISOString();
    const durationMs =
      new Date(completedAt).getTime() - new Date(startedAt).getTime();
    const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000));

    const newWorkout: SavedWorkoutSession = {
      id: new Date().toISOString(),
      routineId: isTemplateWorkoutDraftId(routine.id) ? null : routine.id,
      routineName: routine.name,
      weightUnit,
      startedAt,
      completedAt,
      durationMinutes,
      exercises: completedExercises,
    };

    const existingWorkouts = await loadWorkouts();
    const updatedWorkouts = [newWorkout, ...existingWorkouts];
    await saveWorkouts(updatedWorkouts);

    router.replace(`/workout/summary/${newWorkout.id}` as never);
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Routine not found</Text>
      </SafeAreaView>
    );
  }

  const renderExerciseCard = (
    exercise: RoutineExerciseWithDefaults,
    index: number,
    isSupersetChild = false
  ) => {
    const sets = exerciseSets[exercise.id] || [];
    const exerciseNote = exerciseNotes[exercise.id] || '';
    const supersetMeta = supersetDisplayMap[exercise.id];
    const isEditorOpen = openRestEditorId === exercise.id;
    const currentBlock = getBlockForExercise(exercise.id);
    const nextSupersetSlot =
      currentBlock && currentBlock.label
        ? getSupersetRoundStatus(currentBlock).nextSlotLabel
        : '';
    const isNextSupersetExercise =
      !!nextSupersetSlot &&
      nextSupersetSlot.startsWith(supersetMeta?.slotLabel || '');

    return (
      <View
        key={exercise.id}
        style={[
          styles.exerciseCard,
          isSupersetChild && styles.supersetExerciseCard,
          isNextSupersetExercise && styles.nextSupersetExerciseCard,
        ]}
      >
        <View style={styles.exerciseHeaderRow}>
          <View style={styles.exerciseHeaderText}>
            <Text style={styles.exerciseIndex}>{index + 1}</Text>
            <View style={styles.exerciseTitleWrap}>
              <View style={styles.exerciseTitleRow}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>

                {supersetMeta && (
                  <View style={styles.supersetBadge}>
                    <Text style={styles.supersetBadgeText}>
                      {supersetMeta.slotLabel}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.exerciseMeta}>
                {exercise.muscleGroup} {'\u2022'} {exercise.equipment}
              </Text>
              {supersetMeta && (
                <Text style={styles.supersetExerciseHint}>
                  {isNextSupersetExercise
                    ? 'Up next in the superset flow'
                    : `Part of Superset ${supersetMeta.groupLabel}`}
                </Text>
              )}
            </View>
          </View>
        </View>

        <TextInput
          style={styles.exerciseNoteInput}
          placeholder="Exercise note..."
          placeholderTextColor="#777777"
          value={exerciseNote}
          onChangeText={(value) => handleUpdateExerciseNote(exercise.id, value)}
          multiline
        />

        <Pressable
          style={styles.restTimerRow}
          onPress={() => handleOpenRestEditor(exercise.id)}
        >
          <Text style={styles.restTimerLabel}>Rest timer:</Text>
          <Text style={styles.restTimerValue}>
            {getRestTimerStatus(exercise.id)}
          </Text>
        </Pressable>

        {isEditorOpen && (
          <View style={styles.restEditorCard}>
            <TextInput
              style={styles.restEditorInput}
              placeholder="e.g. 90 or 1:30"
              placeholderTextColor="#777777"
              value={restEditorInputs[exercise.id] || ''}
              onChangeText={(value) =>
                setRestEditorInputs((prev) => ({
                  ...prev,
                  [exercise.id]: value,
                }))
              }
            />

            <View style={styles.restEditorActions}>
              <Pressable
                style={styles.restEditorButton}
                onPress={() => handleUseDefaultRestTimer(exercise.id)}
              >
                <Text style={styles.restEditorButtonText}>
                  Use Default ({formatRestTimerLabel(defaultRestTimerSeconds)})
                </Text>
              </Pressable>

              <Pressable
                style={styles.restEditorButton}
                onPress={() => handleSaveRestTimerConfig(exercise.id)}
              >
                <Text style={styles.restEditorButtonText}>Save Timer</Text>
              </Pressable>

              <Pressable
                style={styles.restEditorOffButton}
                onPress={() => handleTurnOffRestTimer(exercise.id)}
              >
                <Text style={styles.restEditorOffButtonText}>Turn Off</Text>
              </Pressable>
            </View>
          </View>
        )}

        {sets.map((set) => (
          <View
            key={set.id}
            style={[styles.setRow, set.completed && styles.setRowCompleted]}
          >
            <Pressable
              style={[
                styles.checkButton,
                set.completed && styles.checkButtonCompleted,
              ]}
              onPress={() => handleToggleSetCompleted(exercise.id, set.id)}
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
              style={[styles.setLabel, set.completed && styles.completedText]}
            >
              {set.setNumber}
            </Text>

            <TextInput
              style={[styles.input, set.completed && styles.inputCompleted]}
              placeholder={getWeightPlaceholder(weightUnit)}
              placeholderTextColor="#777777"
              keyboardType="numeric"
              value={set.weight}
              onChangeText={(value) =>
                handleUpdateSet(exercise.id, set.id, 'weight', value)
              }
            />

            <TextInput
              style={[styles.input, set.completed && styles.inputCompleted]}
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
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Workout Session' }} />

      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{routine.name}</Text>
          <Text style={styles.subtitle}>
            {sessionExercises.length} exercise
            {sessionExercises.length === 1 ? '' : 's'}
          </Text>

          {!!routine.note?.trim() && (
            <View style={styles.routineNoteCard}>
              <Text style={styles.routineNoteLabel}>Routine Note</Text>
              <Text style={styles.routineNoteText}>{routine.note.trim()}</Text>
            </View>
          )}

          <View style={styles.addExerciseSection}>
            <Pressable
              style={styles.addExerciseTrigger}
              onPress={() => setIsExercisePickerOpen((prev) => !prev)}
            >
              <Text style={styles.addExerciseTriggerText}>
                {isExercisePickerOpen ? 'Close Exercise Picker' : '+ Add Exercise'}
              </Text>
            </Pressable>

            {isExercisePickerOpen && (
              <View style={styles.exercisePickerCard}>
                <Text style={styles.exercisePickerTitle}>Add Exercise</Text>

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

                {filteredExercises.length === 0 ? (
                  <Text style={styles.emptyPickerText}>
                    No matching exercises found.
                  </Text>
                ) : (
                  filteredExercises.map((exercise) => (
                    <View key={exercise.id} style={styles.addExerciseCard}>
                      <View style={styles.addExerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseMeta}>
                          {exercise.muscleGroup} {'\u2022'} {exercise.equipment}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.addExerciseButton}
                        onPress={() => handleAddExercise(exercise)}
                      >
                        <Text style={styles.addExerciseButtonText}>Add</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>

          {supersetBlocks.map((block) => {
            if (block.label === '') {
              const exercise = block.exercises[0];
              const index = sessionExercises.findIndex((item) => item.id === exercise.id);
              return renderExerciseCard(exercise, index);
            }

            return (
              <View key={block.id} style={styles.supersetBlock}>
                {(() => {
                  const roundStatus = getSupersetRoundStatus(block);

                  return (
                <View style={styles.supersetBlockHeader}>
                  <View style={styles.supersetBlockHeaderText}>
                    <Text style={styles.supersetBlockTitle}>Superset {block.label}</Text>
                    <Text style={styles.supersetBlockSubtitle}>
                      {roundStatus.isComplete
                        ? `${roundStatus.roundLabel}. Add another round or rest as needed.`
                        : `Next up: ${roundStatus.nextSlotLabel}. Rest starts after the full round.`}
                    </Text>
                  </View>

                  <View style={styles.supersetBlockBadge}>
                    <Text style={styles.supersetBlockBadgeText}>
                      {block.exercises.length} exercises
                    </Text>
                  </View>
                </View>
                  );
                })()}

                {block.exercises.map((exercise) => {
                  const index = sessionExercises.findIndex((item) => item.id === exercise.id);
                  return renderExerciseCard(exercise, index, true);
                })}
              </View>
            );
          })}

          <Pressable style={styles.finishButton} onPress={handleFinishWorkout}>
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </Pressable>
        </ScrollView>
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
    marginBottom: 14,
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
  addExerciseSection: {
    marginBottom: 14,
  },
  addExerciseTrigger: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
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
    marginTop: 10,
  },
  exercisePickerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  exerciseCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  supersetBlock: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  supersetBlockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  supersetBlockHeaderText: {
    flex: 1,
    paddingRight: 4,
  },
  supersetBlockTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  supersetBlockSubtitle: {
    color: '#9dbbda',
    fontSize: 12,
  },
  supersetBlockBadge: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  supersetBlockBadgeText: {
    color: '#4da6ff',
    fontSize: 11,
    fontWeight: '700',
  },
  supersetExerciseCard: {
    marginBottom: 8,
    borderColor: '#355574',
  },
  nextSupersetExerciseCard: {
    borderColor: '#4da6ff',
    shadowColor: '#4da6ff',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 2,
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
  addExerciseCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  addExerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    flexShrink: 1,
  },
  exerciseMeta: {
    color: '#9a9a9a',
    fontSize: 13,
  },
  supersetExerciseHint: {
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
  restTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  restTimerLabel: {
    color: '#aaaaaa',
    fontSize: 13,
    fontWeight: '600',
  },
  restTimerValue: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  restEditorCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  restEditorInput: {
    backgroundColor: '#171717',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  restEditorActions: {
    gap: 8,
  },
  restEditorButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  restEditorButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  restEditorOffButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  restEditorOffButtonText: {
    color: '#ff8a8a',
    fontSize: 13,
    fontWeight: '700',
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
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
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
    marginBottom: 4,
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
  emptyPickerText: {
    color: '#aaaaaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  addExerciseButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addExerciseButtonText: {
    color: '#4da6ff',
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
  listContent: {
    paddingBottom: 20,
  },
  notFound: {
    color: '#ffffff',
    fontSize: 18,
  },
});
