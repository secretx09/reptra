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
import { RoutineWithExercises } from '../../../types/routine';
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

  useEffect(() => {
    const fetchRoutine = async () => {
      const routines = await loadRoutines();
      const found = routines.find((r) => r.id === id) || null;
      setRoutine(found);
    };

    fetchRoutine();
  }, [id]);

  const handleAddSet = (exerciseId: string) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] || [];
      const previousSet = currentSets[currentSets.length - 1];

      const newSet: WorkoutSet = {
        id: new Date().toISOString(),
        setNumber: currentSets.length + 1,
        weight: previousSet ? previousSet.weight : '',
        reps: previousSet ? previousSet.reps : '',
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

  const handleFinishWorkout = async () => {
    if (!routine) return;

    const completedExercises: SavedExerciseLog[] = routine.exercises
      .map((exercise) => {
        const sets = exerciseSets[exercise.id] || [];

        const nonEmptySets = sets.filter(
          (set) => set.weight.trim() !== '' || set.reps.trim() !== ''
        );

        return {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: nonEmptySets,
        };
      })
      .filter((exerciseLog) => exerciseLog.sets.length > 0);

    if (completedExercises.length === 0) {
      Alert.alert(
        'No workout data',
        'Add at least one set with weight or reps before finishing.'
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
        <Text style={styles.title}>{routine.name}</Text>
        <Text style={styles.subtitle}>
          {routine.exercises.length} exercise
          {routine.exercises.length === 1 ? '' : 's'}
        </Text>

        <FlatList
          data={routine.exercises}
          keyExtractor={(item: Exercise) => item.id}
          renderItem={({ item, index }) => {
            const sets = exerciseSets[item.id] || [];

            return (
              <View style={styles.exerciseCard}>
                <Text style={styles.exerciseName}>
                  {index + 1}. {item.name}
                </Text>

                <Text style={styles.exerciseMeta}>
                  {item.muscleGroup} • {item.equipment}
                </Text>

                {sets.map((set) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setLabel}>Set {set.setNumber}</Text>

                    <TextInput
                      style={styles.input}
                      placeholder="Weight"
                      placeholderTextColor="#777777"
                      keyboardType="numeric"
                      value={set.weight}
                      onChangeText={(value) =>
                        handleUpdateSet(item.id, set.id, 'weight', value)
                      }
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Reps"
                      placeholderTextColor="#777777"
                      keyboardType="numeric"
                      value={set.reps}
                      onChangeText={(value) =>
                        handleUpdateSet(item.id, set.id, 'reps', value)
                      }
                    />
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
  setLabel: {
    color: '#ffffff',
    fontSize: 14,
    width: 48,
    fontWeight: '600',
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