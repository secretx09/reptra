import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  TextInput,
  Share,
} from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadSettings } from '../../../storage/settings';
import { WeightUnit } from '../../../types/settings';
import { Exercise } from '../../../types/exercise';
import {
  loadWorkouts,
  deleteWorkoutById,
  updateWorkoutById,
} from '../../../storage/workouts';
import { loadRoutines, saveRoutines } from '../../../storage/routines';
import { RoutineExerciseWithDefaults, RoutineWithExercises } from '../../../types/routine';
import { SavedExerciseLog, SavedWorkoutSession, WorkoutSet } from '../../../types/workout';
import { calculateWorkoutSummary } from '../../../utils/calculateWorkoutSummary';
import { formatWorkoutDuration } from '../../../utils/formatDuration';
import { getMuscleGroups, loadExerciseLibrary } from '../../../utils/exerciseLibrary';
import { getMostRecentSetPrefill } from '../../../utils/workoutHistory';
import {
  convertWeightValue,
  convertVolumeValue,
  formatWeightNumber,
  formatWeightWithUnit,
} from '../../../utils/weightUnits';

export default function WorkoutHistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<SavedWorkoutSession | null>(null);
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [isEditingWorkoutName, setIsEditingWorkoutName] = useState(false);
  const [workoutNameDraft, setWorkoutNameDraft] = useState('');
  const [isEditingWorkoutNote, setIsEditingWorkoutNote] = useState(false);
  const [workoutNoteDraft, setWorkoutNoteDraft] = useState('');
  const [editingExerciseNoteId, setEditingExerciseNoteId] = useState<string | null>(
    null
  );
  const [exerciseNoteDraft, setExerciseNoteDraft] = useState('');
  const [editingSetKey, setEditingSetKey] = useState<string | null>(null);
  const [setWeightDraft, setSetWeightDraft] = useState('');
  const [setRepsDraft, setSetRepsDraft] = useState('');
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [exerciseSearchText, setExerciseSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');

  useFocusEffect(
    useCallback(() => {
      const fetchWorkout = async () => {
        const [savedWorkouts, savedSettings, loadedExercises] = await Promise.all([
          loadWorkouts(),
          loadSettings(),
          loadExerciseLibrary(),
        ]);
        const foundWorkout = savedWorkouts.find((item) => item.id === id) || null;

        setWorkout(foundWorkout);
        setWorkouts(savedWorkouts);
        setExerciseLibrary(loadedExercises);
        setWorkoutNameDraft(foundWorkout?.routineName ?? '');
        setIsEditingWorkoutName(false);
        setWorkoutNoteDraft(foundWorkout?.note ?? '');
        setIsEditingWorkoutNote(false);
        setEditingExerciseNoteId(null);
        setExerciseNoteDraft('');
        setEditingSetKey(null);
        setSetWeightDraft('');
        setSetRepsDraft('');
        setIsExercisePickerOpen(false);
        setExerciseSearchText('');
        setSelectedMuscleGroup('All');
        setWeightUnit(savedSettings.weightUnit);
      };

      fetchWorkout();
    }, [id])
  );

  const muscleGroups = useMemo(
    () => getMuscleGroups(exerciseLibrary),
    [exerciseLibrary]
  );

  const filteredExercisesToAdd = useMemo(() => {
    if (!workout) return [];

    const addedExerciseIds = new Set(
      workout.exercises.map((exercise) => exercise.exerciseId)
    );
    const normalizedSearchText = exerciseSearchText.trim().toLowerCase();

    return exerciseLibrary.filter((exercise) => {
      if (addedExerciseIds.has(exercise.id)) return false;

      const matchesSearch =
        normalizedSearchText.length === 0 ||
        exercise.name.toLowerCase().includes(normalizedSearchText);
      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [exerciseLibrary, exerciseSearchText, selectedMuscleGroup, workout]);

  const handleDeleteWorkout = () => {
    if (!workout) return;

    Alert.alert(
      'Delete workout',
      `Are you sure you want to delete this ${workout.routineName} workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkoutById(workout.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleStartAgain = () => {
    if (!workout) return;

    router.push({
      pathname: '/workout/session/empty',
      params: {
        templateWorkoutId: workout.id,
      },
    });
  };

  const handleShareWorkout = async () => {
    if (!workout) return;

    const summaryLines = [
      workout.routineName,
      `${formattedDate} at ${formattedTime}`,
      formattedDuration ? `Duration: ${formattedDuration}` : '',
      `${workout.exercises.length} exercises`,
      `${totalSets} sets`,
      `${totalReps} reps`,
      `Heaviest: ${formatWeightWithUnit(String(heaviestWeight || 0), weightUnit, 'lb')}`,
      `Volume: ${formatWeightNumber(convertedVolume)} ${weightUnit}`,
      workout.note?.trim() ? `Note: ${workout.note.trim()}` : '',
      '',
      ...workout.exercises.map((exercise) => {
        const setSummary = exercise.sets
          .map(
            (set) =>
              `${formatWeightWithUnit(set.weight, weightUnit, sourceWeightUnit)} x ${set.reps || '-'}`
          )
          .join(', ');
        const exerciseNote = exercise.note?.trim()
          ? ` (${exercise.note.trim()})`
          : '';

        return `${exercise.exerciseName}: ${setSummary || 'No sets'}${exerciseNote}`;
      }),
    ].filter(Boolean);

    try {
      await Share.share({
        message: summaryLines.join('\n'),
      });
    } catch {
      Alert.alert('Share failed', 'Unable to open the share sheet right now.');
    }
  };

  const handleSaveAsRoutine = async () => {
    if (!workout) return;

    if (workout.exercises.length === 0) {
      Alert.alert(
        'No exercises',
        'Add at least one exercise before saving this workout as a routine.'
      );
      return;
    }

    const existingRoutines = await loadRoutines();
    const baseName = `${workout.routineName} Routine`;
    const existingNames = new Set(
      existingRoutines.map((routine) => routine.name.trim().toLowerCase())
    );
    let routineName = baseName;
    let copyNumber = 2;

    while (existingNames.has(routineName.trim().toLowerCase())) {
      routineName = `${baseName} ${copyNumber}`;
      copyNumber += 1;
    }

    const routineExercises: RoutineExerciseWithDefaults[] = workout.exercises.map(
      (savedExercise) => {
        const libraryExercise = exerciseLibrary.find(
          (exercise) => exercise.id === savedExercise.exerciseId
        );
        const firstSet = savedExercise.sets[0];
        const parsedWeight = Number(firstSet?.weight);
        const defaultWeight =
          firstSet?.weight && !Number.isNaN(parsedWeight)
            ? formatWeightNumber(
                convertWeightValue(parsedWeight, sourceWeightUnit, weightUnit)
              )
            : '';

        return {
          ...(libraryExercise ?? {
            id: savedExercise.exerciseId,
            name: savedExercise.exerciseName,
            muscleGroup: 'Custom',
            primaryMuscles: [],
            secondaryMuscles: [],
            equipment: 'Unknown',
            instructions: [],
            isCustom: true,
          }),
          defaultSets: String(Math.max(savedExercise.sets.length, 1)),
          defaultWeight,
          defaultReps: firstSet?.reps || '',
          defaultRestSeconds: '',
          note: savedExercise.note?.trim() ?? '',
          supersetGroupId: null,
        };
      }
    );

    const newRoutine: RoutineWithExercises = {
      id: `routine-${Date.now()}`,
      name: routineName,
      createdAt: new Date().toISOString(),
      isPinned: false,
      note: workout.note?.trim() ?? '',
      exercises: routineExercises,
    };

    await saveRoutines([...existingRoutines, newRoutine]);

    Alert.alert(
      'Routine saved',
      `"${routineName}" was added to your routines.`,
      [
        { text: 'Stay Here', style: 'cancel' },
        {
          text: 'View Routine',
          onPress: () => router.push(`/routine/${newRoutine.id}`),
        },
      ]
    );
  };

  const handleStartEditingWorkoutName = () => {
    if (!workout) return;

    setWorkoutNameDraft(workout.routineName);
    setIsEditingWorkoutName(true);
  };

  const handleCancelEditingWorkoutName = () => {
    setWorkoutNameDraft(workout?.routineName ?? '');
    setIsEditingWorkoutName(false);
  };

  const handleSaveWorkoutName = async () => {
    if (!workout) return;

    const trimmedName = workoutNameDraft.trim();

    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a workout name.');
      return;
    }

    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      routineName: trimmedName,
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    setWorkouts((prev) =>
      prev.map((item) => (item.id === workout.id ? updatedWorkout : item))
    );
    setWorkoutNameDraft(updatedWorkout.routineName);
    setIsEditingWorkoutName(false);
  };

  const handleStartEditingWorkoutNote = () => {
    if (!workout) return;

    setWorkoutNoteDraft(workout.note ?? '');
    setIsEditingWorkoutNote(true);
  };

  const handleCancelEditingWorkoutNote = () => {
    setWorkoutNoteDraft(workout?.note ?? '');
    setIsEditingWorkoutNote(false);
  };

  const handleSaveWorkoutNote = async () => {
    if (!workout) return;

    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      note: workoutNoteDraft.trim(),
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    setWorkoutNoteDraft(updatedWorkout.note ?? '');
    setIsEditingWorkoutNote(false);
  };

  const handleStartEditingExerciseNote = (exercise: SavedExerciseLog) => {
    setEditingExerciseNoteId(exercise.exerciseId);
    setExerciseNoteDraft(exercise.note ?? '');
  };

  const handleCancelEditingExerciseNote = () => {
    setEditingExerciseNoteId(null);
    setExerciseNoteDraft('');
  };

  const handleSaveExerciseNote = async (exerciseId: string) => {
    if (!workout) return;

    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? { ...exercise, note: exerciseNoteDraft.trim() }
          : exercise
      ),
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    setEditingExerciseNoteId(null);
    setExerciseNoteDraft('');
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (!workout) return;

    const targetExercise = workout.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId
    );

    if (!targetExercise) return;

    Alert.alert(
      'Delete exercise',
      `Remove ${targetExercise.exerciseName} from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedWorkout: SavedWorkoutSession = {
              ...workout,
              exercises: workout.exercises.filter(
                (exercise) => exercise.exerciseId !== exerciseId
              ),
            };

            await updateWorkoutById(workout.id, updatedWorkout);
            setWorkout(updatedWorkout);

            if (editingExerciseNoteId === exerciseId) {
              handleCancelEditingExerciseNote();
            }

            if (editingSetKey?.startsWith(`${exerciseId}:`)) {
              handleCancelEditingSet();
            }
          },
        },
      ]
    );
  };

  const handleAddExerciseToWorkout = async (exercise: Exercise) => {
    if (!workout) return;

    const prefill = getMostRecentSetPrefill(
      workouts.filter((item) => item.id !== workout.id),
      exercise.id,
      1
    );
    const newExerciseLog: SavedExerciseLog = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      note: '',
      sets: [
        {
          id: `${exercise.id}-${Date.now()}`,
          setNumber: 1,
          weight: prefill?.weight || '',
          reps: prefill?.reps || '',
          completed: true,
        },
      ],
    };
    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      exercises: [...workout.exercises, newExerciseLog],
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    setWorkouts((prev) =>
      prev.map((item) => (item.id === workout.id ? updatedWorkout : item))
    );
    setExerciseSearchText('');
    setSelectedMuscleGroup('All');
  };

  const getSetKey = (exerciseId: string, setId: string) => `${exerciseId}:${setId}`;

  const handleStartEditingSet = (exerciseId: string, set: WorkoutSet) => {
    const sourceWeightUnit = workout?.weightUnit ?? 'lb';
    const displayedWeight = convertWeightValue(
      Number(set.weight) || 0,
      sourceWeightUnit,
      weightUnit
    );

    setEditingSetKey(getSetKey(exerciseId, set.id));
    setSetWeightDraft(set.weight ? formatWeightNumber(displayedWeight) : '');
    setSetRepsDraft(set.reps ?? '');
  };

  const handleCancelEditingSet = () => {
    setEditingSetKey(null);
    setSetWeightDraft('');
    setSetRepsDraft('');
  };

  const handleSaveSet = async (exerciseId: string, setId: string) => {
    if (!workout) return;

    const sourceWeightUnit = workout.weightUnit ?? 'lb';
    const parsedWeight = Number(setWeightDraft);
    const savedWeight =
      setWeightDraft.trim() === '' || Number.isNaN(parsedWeight)
        ? ''
        : formatWeightNumber(
            convertWeightValue(parsedWeight, weightUnit, sourceWeightUnit)
          );

    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? {
                      ...set,
                      weight: savedWeight,
                      reps: setRepsDraft.trim(),
                    }
                  : set
              ),
            }
          : exercise
      ),
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    handleCancelEditingSet();
  };

  const handleAddSet = async (exerciseId: string) => {
    if (!workout) return;

    const targetExercise = workout.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId
    );

    if (!targetExercise) return;

    const previousSet = targetExercise.sets[targetExercise.sets.length - 1];
    const historyPrefill = getMostRecentSetPrefill(
      workouts.filter((item) => item.id !== workout.id),
      exerciseId,
      targetExercise.sets.length + 1
    );
    const newSet: WorkoutSet = {
      id: `${exerciseId}-${Date.now()}`,
      setNumber: targetExercise.sets.length + 1,
      weight: previousSet?.weight || historyPrefill?.weight || '',
      reps: previousSet?.reps || historyPrefill?.reps || '',
      completed: true,
    };

    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: [...exercise.sets, newSet],
            }
          : exercise
      ),
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    setWorkouts((prev) =>
      prev.map((item) => (item.id === workout.id ? updatedWorkout : item))
    );
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    if (!workout) return;

    const targetExercise = workout.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId
    );
    const targetSet = targetExercise?.sets.find((set) => set.id === setId);

    if (!targetExercise || !targetSet) return;

    Alert.alert(
      'Delete set',
      `Delete set ${targetSet.setNumber} from ${targetExercise.exerciseName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedWorkout: SavedWorkoutSession = {
              ...workout,
              exercises: workout.exercises
                .map((exercise) => {
                  if (exercise.exerciseId !== exerciseId) {
                    return exercise;
                  }

                  const updatedSets = exercise.sets
                    .filter((set) => set.id !== setId)
                    .map((set, index) => ({
                      ...set,
                      setNumber: index + 1,
                    }));

                  return {
                    ...exercise,
                    sets: updatedSets,
                  };
                })
                .filter(
                  (exercise) =>
                    exercise.sets.length > 0 || exercise.note.trim() !== ''
                ),
            };

            await updateWorkoutById(workout.id, updatedWorkout);
            setWorkout(updatedWorkout);

            if (editingSetKey === getSetKey(exerciseId, setId)) {
              handleCancelEditingSet();
            }
          },
        },
      ]
    );
  };

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFoundTitle}>Workout not found</Text>
        <Text style={styles.notFoundText}>
          This workout may have been deleted.
        </Text>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(workout.completedAt).toLocaleDateString();
  const formattedTime = new Date(workout.completedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const formattedDuration = formatWorkoutDuration(workout.durationMinutes);

  const { totalSets, totalReps, totalVolume, heaviestWeight } =
    calculateWorkoutSummary(workout);
  const sourceWeightUnit = workout.weightUnit ?? 'lb';
  const convertedVolume = convertVolumeValue(totalVolume, 'lb', weightUnit);

  return (
    <>
      <Stack.Screen options={{ title: 'Workout Details' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={workout.exercises}
          keyExtractor={(item) => item.exerciseId}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              {isEditingWorkoutName ? (
                <View style={styles.workoutNameEditBox}>
                  <TextInput
                    style={styles.workoutNameInput}
                    placeholder="Workout name"
                    placeholderTextColor="#777777"
                    value={workoutNameDraft}
                    onChangeText={setWorkoutNameDraft}
                  />

                  <View style={styles.workoutNameActions}>
                    <Pressable
                      style={styles.workoutNameSaveButton}
                      onPress={handleSaveWorkoutName}
                    >
                      <Text style={styles.workoutNameSaveButtonText}>Save</Text>
                    </Pressable>

                    <Pressable
                      style={styles.workoutNameCancelButton}
                      onPress={handleCancelEditingWorkoutName}
                    >
                      <Text style={styles.workoutNameCancelButtonText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.workoutTitleRow}>
                  <Text style={styles.title}>{workout.routineName}</Text>

                  <Pressable onPress={handleStartEditingWorkoutName}>
                    <Text style={styles.workoutTitleAction}>Rename</Text>
                  </Pressable>
                </View>
              )}
              <Text style={styles.subtitle}>
                {formattedDate} at {formattedTime}
              </Text>
              <Text style={styles.subtitle}>
                {workout.exercises.length} exercise
                {workout.exercises.length === 1 ? '' : 's'} • {totalSets} set
                {totalSets === 1 ? '' : 's'}
              </Text>
              {formattedDuration ? (
                <Text style={styles.subtitle}>Duration: {formattedDuration}</Text>
              ) : null}

              {workout.note?.trim() || isEditingWorkoutNote ? (
                <View style={styles.workoutNoteBox}>
                  <View style={styles.workoutNoteHeader}>
                    <Text style={styles.workoutNoteTitle}>Workout Note</Text>

                    {!isEditingWorkoutNote && (
                      <Pressable onPress={handleStartEditingWorkoutNote}>
                        <Text style={styles.workoutNoteAction}>Edit</Text>
                      </Pressable>
                    )}
                  </View>

                  {isEditingWorkoutNote ? (
                    <>
                      <TextInput
                        style={styles.workoutNoteInput}
                        placeholder="How did this workout feel?"
                        placeholderTextColor="#777777"
                        value={workoutNoteDraft}
                        onChangeText={setWorkoutNoteDraft}
                        multiline
                      />

                      <View style={styles.workoutNoteActions}>
                        <Pressable
                          style={styles.workoutNoteSaveButton}
                          onPress={handleSaveWorkoutNote}
                        >
                          <Text style={styles.workoutNoteSaveButtonText}>Save</Text>
                        </Pressable>

                        <Pressable
                          style={styles.workoutNoteCancelButton}
                          onPress={handleCancelEditingWorkoutNote}
                        >
                          <Text style={styles.workoutNoteCancelButtonText}>
                            Cancel
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.workoutNoteText}>{workout.note}</Text>
                  )}
                </View>
              ) : (
                <Pressable
                  style={styles.addWorkoutNoteButton}
                  onPress={handleStartEditingWorkoutNote}
                >
                  <Text style={styles.addWorkoutNoteButtonText}>
                    + Add Workout Note
                  </Text>
                </Pressable>
              )}

              <View style={styles.summaryStatsRow}>
                <View style={styles.summaryStatPill}>
                  <Text style={styles.summaryStatValue}>{totalReps}</Text>
                  <Text style={styles.summaryStatLabel}>Total Reps</Text>
                </View>

                <View style={styles.summaryStatPill}>
                  <Text style={styles.summaryStatValue}>
                    {formatWeightWithUnit(String(heaviestWeight || 0), weightUnit, 'lb')}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Heaviest Set</Text>
                </View>

                <View style={styles.summaryStatPill}>
                  <Text style={styles.summaryStatValue}>
                    {formatWeightNumber(convertedVolume)}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Volume</Text>
                </View>
              </View>

              <Pressable
                style={styles.startAgainButton}
                onPress={handleStartAgain}
              >
                <Text style={styles.startAgainButtonText}>Start Again</Text>
              </Pressable>

              <Pressable style={styles.shareButton} onPress={handleShareWorkout}>
                <Text style={styles.shareButtonText}>Share Summary</Text>
              </Pressable>

              <Pressable
                style={styles.saveAsRoutineButton}
                onPress={handleSaveAsRoutine}
              >
                <Text style={styles.saveAsRoutineButtonText}>
                  Save as Routine
                </Text>
              </Pressable>

              <Pressable
                style={styles.addExerciseTrigger}
                onPress={() => setIsExercisePickerOpen((current) => !current)}
              >
                <Text style={styles.addExerciseTriggerText}>
                  {isExercisePickerOpen ? 'Close Exercise Picker' : '+ Add Exercise'}
                </Text>
              </Pressable>

              {isExercisePickerOpen && (
                <View style={styles.exercisePickerCard}>
                  <Text style={styles.exercisePickerTitle}>Add Exercise</Text>

                  <TextInput
                    style={styles.exerciseSearchInput}
                    placeholder="Search exercises..."
                    placeholderTextColor="#888888"
                    value={exerciseSearchText}
                    onChangeText={setExerciseSearchText}
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
                    <Text style={styles.emptyPickerText}>
                      No matching exercises to add.
                    </Text>
                  ) : (
                    filteredExercisesToAdd.map((exercise) => (
                      <View key={exercise.id} style={styles.exercisePickerRow}>
                        <View style={styles.exercisePickerInfo}>
                          <Text style={styles.exercisePickerName}>
                            {exercise.name}
                          </Text>
                          <Text style={styles.exercisePickerMeta}>
                            {exercise.muscleGroup} {'\u2022'} {exercise.equipment}
                          </Text>
                        </View>

                        <Pressable
                          style={styles.exercisePickerAddButton}
                          onPress={() => handleAddExerciseToWorkout(exercise)}
                        >
                          <Text style={styles.exercisePickerAddButtonText}>
                            Add
                          </Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          }
          renderItem={({ item, index }: { item: SavedExerciseLog; index: number }) => (
            <View style={styles.exerciseCard}>
              <View style={styles.exerciseHeaderRow}>
                <Text style={styles.exerciseName}>
                  {index + 1}. {item.exerciseName}
                </Text>

                <Pressable
                  style={styles.deleteExerciseButton}
                  onPress={() => handleDeleteExercise(item.exerciseId)}
                >
                  <Text style={styles.deleteExerciseButtonText}>Delete</Text>
                </Pressable>
              </View>

              {item.note || editingExerciseNoteId === item.exerciseId ? (
                <View style={styles.noteBox}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>Exercise Note</Text>

                    {editingExerciseNoteId !== item.exerciseId && (
                      <Pressable onPress={() => handleStartEditingExerciseNote(item)}>
                        <Text style={styles.noteAction}>Edit</Text>
                      </Pressable>
                    )}
                  </View>

                  {editingExerciseNoteId === item.exerciseId ? (
                    <>
                      <TextInput
                        style={styles.exerciseNoteInput}
                        placeholder="Exercise note..."
                        placeholderTextColor="#777777"
                        value={exerciseNoteDraft}
                        onChangeText={setExerciseNoteDraft}
                        multiline
                      />

                      <View style={styles.exerciseNoteActions}>
                        <Pressable
                          style={styles.exerciseNoteSaveButton}
                          onPress={() => handleSaveExerciseNote(item.exerciseId)}
                        >
                          <Text style={styles.exerciseNoteSaveButtonText}>Save</Text>
                        </Pressable>

                        <Pressable
                          style={styles.exerciseNoteCancelButton}
                          onPress={handleCancelEditingExerciseNote}
                        >
                          <Text style={styles.exerciseNoteCancelButtonText}>
                            Cancel
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noteText}>{item.note}</Text>
                  )}
                </View>
              ) : (
                <Pressable
                  style={styles.addExerciseNoteButton}
                  onPress={() => handleStartEditingExerciseNote(item)}
                >
                  <Text style={styles.addExerciseNoteButtonText}>
                    + Add Exercise Note
                  </Text>
                </Pressable>
              )}

              {item.sets.map((set: WorkoutSet) => {
                const setKey = getSetKey(item.exerciseId, set.id);
                const isEditingSet = editingSetKey === setKey;

                return (
                  <View
                    key={set.id}
                    style={[
                      styles.setRow,
                      isEditingSet && styles.setRowEditing,
                    ]}
                  >
                    <Text style={styles.setLabel}>Set {set.setNumber}</Text>

                    {isEditingSet ? (
                      <View style={styles.setEditWrap}>
                        <View style={styles.setEditInputs}>
                          <TextInput
                            style={styles.setEditInput}
                            placeholder={weightUnit}
                            placeholderTextColor="#777777"
                            keyboardType="numeric"
                            value={setWeightDraft}
                            onChangeText={setSetWeightDraft}
                          />

                          <TextInput
                            style={styles.setEditInput}
                            placeholder="Reps"
                            placeholderTextColor="#777777"
                            keyboardType="numeric"
                            value={setRepsDraft}
                            onChangeText={setSetRepsDraft}
                          />
                        </View>

                        <View style={styles.setEditActions}>
                          <Pressable
                            style={styles.setSaveButton}
                            onPress={() => handleSaveSet(item.exerciseId, set.id)}
                          >
                            <Text style={styles.setSaveButtonText}>Save</Text>
                          </Pressable>

                          <Pressable
                            style={styles.setCancelButton}
                            onPress={handleCancelEditingSet}
                          >
                            <Text style={styles.setCancelButtonText}>Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.setValue}>
                          {formatWeightWithUnit(
                            set.weight,
                            weightUnit,
                            sourceWeightUnit
                          )}
                        </Text>
                        <Text style={styles.setValue}>{set.reps || '-'} reps</Text>
                        <Pressable
                          style={styles.setEditButton}
                          onPress={() => handleStartEditingSet(item.exerciseId, set)}
                        >
                          <Text style={styles.setEditButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          style={styles.setDeleteButton}
                          onPress={() => handleDeleteSet(item.exerciseId, set.id)}
                        >
                          <Text style={styles.setDeleteButtonText}>Delete</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                );
              })}

              <Pressable
                style={styles.addSetButton}
                onPress={() => handleAddSet(item.exerciseId)}
              >
                <Text style={styles.addSetButtonText}>+ Add Set</Text>
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            <>
              {workout.exercises.length === 0 && (
                <View style={styles.emptyWorkoutCard}>
                  <Text style={styles.emptyWorkoutTitle}>No exercises left</Text>
                  <Text style={styles.emptyWorkoutText}>
                    This workout has no saved exercises anymore. You can keep the
                    workout note, start it again, or delete the workout entirely.
                  </Text>
                </View>
              )}

              <Pressable style={styles.deleteButton} onPress={handleDeleteWorkout}>
                <Text style={styles.deleteButtonText}>Delete Workout</Text>
              </Pressable>
            </>
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
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    flex: 1,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  workoutTitleAction: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
    paddingTop: 8,
  },
  workoutNameEditBox: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  workoutNameInput: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  workoutNameActions: {
    flexDirection: 'row',
    gap: 8,
  },
  workoutNameSaveButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  workoutNameSaveButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  workoutNameCancelButton: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  workoutNameCancelButtonText: {
    color: '#dddddd',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 2,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  workoutNoteBox: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  workoutNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  workoutNoteTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  workoutNoteAction: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  workoutNoteText: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 20,
  },
  workoutNoteInput: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 82,
    textAlignVertical: 'top',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  workoutNoteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  workoutNoteSaveButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  workoutNoteSaveButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  workoutNoteCancelButton: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  workoutNoteCancelButtonText: {
    color: '#dddddd',
    fontSize: 13,
    fontWeight: '700',
  },
  addWorkoutNoteButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 12,
  },
  addWorkoutNoteButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryStatPill: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryStatValue: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  summaryStatLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  deleteExerciseButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deleteExerciseButtonText: {
    color: '#ff8a8a',
    fontSize: 12,
    fontWeight: '700',
  },
  noteBox: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  noteTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  noteAction: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  noteText: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 20,
  },
  exerciseNoteInput: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  exerciseNoteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseNoteSaveButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  exerciseNoteSaveButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  exerciseNoteCancelButton: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  exerciseNoteCancelButtonText: {
    color: '#dddddd',
    fontSize: 13,
    fontWeight: '700',
  },
  addExerciseNoteButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  addExerciseNoteButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
  },
  setRow: {
    backgroundColor: '#161616',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setRowEditing: {
    alignItems: 'stretch',
    gap: 10,
  },
  setLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  setValue: {
    color: '#aaaaaa',
    fontSize: 14,
  },
  setEditButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  setEditButtonText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
  },
  setDeleteButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  setDeleteButtonText: {
    color: '#ff8a8a',
    fontSize: 12,
    fontWeight: '700',
  },
  setEditWrap: {
    flex: 1,
    gap: 8,
  },
  setEditInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  setEditInput: {
    flex: 1,
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
  },
  setEditActions: {
    flexDirection: 'row',
    gap: 8,
  },
  setSaveButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  setSaveButtonText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
  },
  setCancelButton: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  setCancelButtonText: {
    color: '#dddddd',
    fontSize: 12,
    fontWeight: '700',
  },
  addSetButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  addSetButtonText: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
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
  emptyWorkoutCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  emptyWorkoutTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyWorkoutText: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
  },
  startAgainButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  startAgainButtonText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  saveAsRoutineButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveAsRoutineButtonText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  addExerciseTrigger: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  addExerciseTriggerText: {
    color: '#4da6ff',
    fontSize: 15,
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
  exerciseSearchInput: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
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
  exercisePickerRow: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  exercisePickerInfo: {
    flex: 1,
  },
  exercisePickerName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  exercisePickerMeta: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  exercisePickerAddButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exercisePickerAddButtonText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyPickerText: {
    color: '#aaaaaa',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
  notFoundTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
  },
});
