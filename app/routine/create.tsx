import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Exercise } from '../../types/exercise';
import {
  RoutineExerciseWithDefaults,
  RoutineWithExercises,
} from '../../types/routine';
import { loadRoutines, saveRoutines } from '../../storage/routines';
import { loadSettings } from '../../storage/settings';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WeightUnit } from '../../types/settings';
import { getMuscleGroups, loadExerciseLibrary } from '../../utils/exerciseLibrary';
import { getWeightFieldLabel } from '../../utils/weightUnits';

export default function CreateRoutineScreen() {
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [routineName, setRoutineName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [selectedExercises, setSelectedExercises] = useState<
    RoutineExerciseWithDefaults[]
  >([]);

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

  const filteredExercises = useMemo(() => {
    return exerciseLibrary.filter((exercise) => {
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [exerciseLibrary, searchText, selectedMuscleGroup]);

  const handleToggleExercise = (exercise: Exercise) => {
    const alreadySelected = selectedExercises.some((item) => item.id === exercise.id);

    if (alreadySelected) {
      setSelectedExercises((prev) => prev.filter((item) => item.id !== exercise.id));
    } else {
      setSelectedExercises((prev) => [
        ...prev,
        {
          ...exercise,
          defaultSets: '',
          defaultWeight: '',
          defaultReps: '',
          defaultRestSeconds: '',
        },
      ]);
    }
  };

  const handleUpdateExerciseDefault = (
    exerciseId: string,
    field: 'defaultSets' | 'defaultWeight' | 'defaultReps' | 'defaultRestSeconds',
    value: string
  ) => {
    setSelectedExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Missing name', 'Please enter a routine name.');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('No exercises selected', 'Please add at least one exercise.');
      return;
    }

    const newRoutine: RoutineWithExercises = {
      id: new Date().toISOString(),
      name: routineName.trim(),
      createdAt: new Date().toISOString(),
      exercises: selectedExercises,
    };

    const existingRoutines = await loadRoutines();
    const updatedRoutines = [...existingRoutines, newRoutine];
    await saveRoutines(updatedRoutines);

    router.back();
  };

  const renderExercise = ({ item }: { item: Exercise }) => {
    const isSelected = selectedExercises.some((exercise) => exercise.id === item.id);

    return (
      <Pressable
        style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}
        onPress={() => handleToggleExercise(item)}
      >
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMeta}>
          {item.muscleGroup} • {item.equipment}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Create Routine</Text>

            <TextInput
              style={styles.input}
              placeholder="Routine name"
              placeholderTextColor="#888888"
              value={routineName}
              onChangeText={setRoutineName}
            />

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

            <Text style={styles.sectionTitle}>
              Selected Exercises ({selectedExercises.length})
            </Text>

            {selectedExercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.selectedExerciseCard}>
                <Text style={styles.exerciseName}>
                  {index + 1}. {exercise.name}
                </Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.muscleGroup} • {exercise.equipment}
                </Text>

                <View style={styles.defaultsRow}>
                  <TextInput
                    style={styles.smallInput}
                    placeholder="Sets"
                    placeholderTextColor="#777777"
                    keyboardType="numeric"
                    value={exercise.defaultSets}
                    onChangeText={(value) =>
                      handleUpdateExerciseDefault(exercise.id, 'defaultSets', value)
                    }
                  />
                  <TextInput
                    style={styles.smallInput}
                    placeholder={getWeightFieldLabel(weightUnit)}
                    placeholderTextColor="#777777"
                    keyboardType="numeric"
                    value={exercise.defaultWeight}
                    onChangeText={(value) =>
                      handleUpdateExerciseDefault(exercise.id, 'defaultWeight', value)
                    }
                  />
                  <TextInput
                    style={styles.smallInput}
                    placeholder="Reps"
                    placeholderTextColor="#777777"
                    keyboardType="numeric"
                    value={exercise.defaultReps}
                    onChangeText={(value) =>
                      handleUpdateExerciseDefault(exercise.id, 'defaultReps', value)
                    }
                  />
                  <TextInput
                    style={styles.smallInput}
                    placeholder="Rest"
                    placeholderTextColor="#777777"
                    keyboardType="numeric"
                    value={exercise.defaultRestSeconds}
                    onChangeText={(value) =>
                      handleUpdateExerciseDefault(
                        exercise.id,
                        'defaultRestSeconds',
                        value
                      )
                    }
                  />
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Add Exercises</Text>

            <Pressable
              style={styles.createCustomButton}
              onPress={() => router.push('/exercise/create')}
            >
              <Text style={styles.createCustomButtonText}>
                + Create Custom Exercise
              </Text>
            </Pressable>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No exercises found.</Text>
        }
        ListFooterComponent={
          <Pressable style={styles.saveButton} onPress={handleSaveRoutine}>
            <Text style={styles.saveButtonText}>Save Routine</Text>
          </Pressable>
        }
      />
    </SafeAreaView>
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1c1c1c',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
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
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextSelected: {
    color: '#111111',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 6,
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
  selectedExerciseCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exerciseCardSelected: {
    borderColor: '#4da6ff',
    backgroundColor: '#16324d',
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
    marginBottom: 10,
  },
  defaultsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallInput: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#161616',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  saveButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
});
