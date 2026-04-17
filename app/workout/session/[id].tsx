import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadRoutines } from '../../../storage/routines';
import { saveWorkouts, loadWorkouts } from '../../../storage/workouts';
import { RoutineExerciseWithDefaults, RoutineWithExercises } from '../../../types/routine';
import { Exercise } from '../../../types/exercise';
import {
  WorkoutSet,
  SavedWorkoutSession,
  SavedExerciseLog,
} from '../../../types/workout';

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [exerciseSets, setExerciseSets] = useState<{
    [exerciseId: string]: WorkoutSet[];
  }>({});
  const [exerciseNotes, setExerciseNotes] = useState<{
    [exerciseId: string]: string;
  }>({});
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);

  useEffect(() => {
    const fetchRoutine = async () => {
      const routines = await loadRoutines();
      const found = routines.find((r) => r.id === id) || null;

      if (found) {
        setRoutine(found);

        const initialExerciseSets: { [exerciseId: string]: WorkoutSet[] } = {};

        found.exercises.forEach((exercise: RoutineExerciseWithDefaults) => {
          const defaultSetCount = Number(exercise.defaultSets);

          if (!Number.isNaN(defaultSetCount) && defaultSetCount > 0) {
            initialExerciseSets[exercise.id] = Array.from(
              { length: defaultSetCount },
              (_, index) => ({
                id: `${exercise.id}-${index}-${Date.now()}`,
                setNumber: index + 1,
                weight: exercise.defaultWeight || '',
                reps: exercise.defaultReps || '',
                completed: false,
              })
            );
          } else {
            initialExerciseSets[exercise.id] = [];
          }
        });

        setExerciseSets(initialExerciseSets);
      } else {
        setRoutine(null);
      }
    };

    fetchRoutine();
  }, [id]);

  useEffect(() => {
    if (restTimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setRestTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimeRemaining]);

  const startRestTimer = (seconds: number) => {
    setRestTimeRemaining(seconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    if (!routine) return;

    const completedExercises: SavedExerciseLog[] = routine.exercises
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

    const newWorkout: SavedWorkoutSession = {
      id: new Date().toISOString(),
      routineId: routine.id,
      routineName: routine.name,
      completedAt: new Date().toISOString(),
      exercises: completedExercises,
    };

    const existingWorkouts = await loadWorkouts();
    const updatedWorkouts = [newWorkout, ...existingWorkouts];
    await saveWorkouts(updatedWorkouts);

    Alert.alert('Workout saved', 'Your workout has been saved.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Routine not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Workout Session' }} />

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

              <View style={styles.timerCard}>
                <Text style={styles.timerLabel}>Rest Timer</Text>
                <Text style={styles.timerValue}>
                  {restTimeRemaining > 0 ? formatTime(restTimeRemaining) : 'Ready'}
                </Text>

                <View style={styles.timerButtonsRow}>
                  <Pressable
                    style={styles.timerButton}
                    onPress={() => startRestTimer(60)}
                  >
                    <Text style={styles.timerButtonText}>60s</Text>
                  </Pressable>

                  <Pressable
                    style={styles.timerButton}
                    onPress={() => startRestTimer(90)}
                  >
                    <Text style={styles.timerButtonText}>90s</Text>
                  </Pressable>

                  <Pressable
                    style={styles.timerButton}
                    onPress={() => startRestTimer(120)}
                  >
                    <Text style={styles.timerButtonText}>120s</Text>
                  </Pressable>
                </View>
              </View>
            </>
          }
          renderItem={({ item, index }) => {
            const sets = exerciseSets[item.id] || [];
            const exerciseNote = exerciseNotes[item.id] || '';

            return (
              <View style={styles.exerciseCard}>
                <Text style={styles.exerciseName}>
                  {index + 1}. {item.name}
                </Text>

                <Text style={styles.exerciseMeta}>
                  {item.muscleGroup} • {item.equipment}
                </Text>

                {!!item.defaultRestSeconds && (
                  <Text style={styles.defaultInfo}>
                    Default Rest: {item.defaultRestSeconds}s
                  </Text>
                )}

                <Text style={styles.exerciseNoteLabel}>Exercise Note</Text>
                <TextInput
                  style={styles.exerciseNoteInput}
                  placeholder="Add a note for this exercise..."
                  placeholderTextColor="#777777"
                  value={exerciseNote}
                  onChangeText={(value) =>
                    handleUpdateExerciseNote(item.id, value)
                  }
                  multiline
                />

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
                      onPress={() => handleToggleSetCompleted(item.id, set.id)}
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
                      Set {set.setNumber}
                    </Text>

                    <TextInput
                      style={[
                        styles.input,
                        set.completed && styles.inputCompleted,
                      ]}
                      placeholder="Weight"
                      placeholderTextColor="#777777"
                      keyboardType="numeric"
                      value={set.weight}
                      onChangeText={(value) =>
                        handleUpdateSet(item.id, set.id, 'weight', value)
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
                        handleUpdateSet(item.id, set.id, 'reps', value)
                      }
                    />

                    <Pressable
                      style={styles.deleteSetButton}
                      onPress={() => handleDeleteSet(item.id, set.id)}
                    >
                      <Text style={styles.deleteSetButtonText}>✕</Text>
                    </Pressable>
                  </View>
                ))}

                <Pressable
                  style={styles.addSetButton}
                  onPress={() => handleAddSet(item.id)}
                >
                  <Text style={styles.addSetText}>+ Add Set</Text>
                </Pressable>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <Pressable style={styles.finishButton} onPress={handleFinishWorkout}>
              <Text style={styles.finishButtonText}>Finish Workout</Text>
            </Pressable>
          }
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
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 16,
  },
  timerCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  timerLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  timerValue: {
    color: '#4da6ff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  timerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timerButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  timerButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseMeta: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 8,
  },
  defaultInfo: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  exerciseNoteLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  exerciseNoteInput: {
    backgroundColor: '#161616',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  setRow: {
    backgroundColor: '#161616',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setRowCompleted: {
    backgroundColor: '#132417',
    borderWidth: 1,
    borderColor: '#2d6a3a',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#222222',
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
    fontSize: 16,
    fontWeight: '700',
  },
  checkButtonTextCompleted: {
    color: '#111111',
  },
  setLabel: {
    color: '#ffffff',
    fontSize: 14,
    width: 48,
    fontWeight: '600',
  },
  completedText: {
    color: '#b8e6c1',
  },
  input: {
    flex: 1,
    backgroundColor: '#222222',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  inputCompleted: {
    borderColor: '#2d6a3a',
  },
  deleteSetButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSetButtonText: {
    color: '#ff8a8a',
    fontSize: 16,
    fontWeight: '700',
  },
  addSetButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4da6ff',
    alignItems: 'center',
  },
  addSetText: {
    color: '#4da6ff',
    fontWeight: '600',
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