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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Exercise } from '../../types/exercise';
import {
  RoutineExerciseWithDefaults,
  RoutineWithExercises,
} from '../../types/routine';
import { WeightUnit } from '../../types/settings';
import { loadRoutines, saveRoutines } from '../../storage/routines';
import { loadSettings } from '../../storage/settings';
import { getMuscleGroups, loadExerciseLibrary } from '../../utils/exerciseLibrary';
import {
  getSupersetDisplayMap,
  normalizeSupersetExercises,
  toggleSupersetWithPrevious,
} from '../../utils/routineSupersets';
import { getWeightFieldLabel } from '../../utils/weightUnits';

export default function CreateRoutineScreen() {
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [routineName, setRoutineName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
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
    const selectedIds = new Set(selectedExercises.map((exercise) => exercise.id));

    return exerciseLibrary.filter((exercise) => {
      if (selectedIds.has(exercise.id)) return false;

      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [exerciseLibrary, searchText, selectedExercises, selectedMuscleGroup]);

  const supersetDisplayMap = useMemo(
    () => getSupersetDisplayMap(selectedExercises),
    [selectedExercises]
  );

  const handleAddExercise = (exercise: Exercise) => {
    setSelectedExercises((prev) => [
      ...prev,
      {
        ...exercise,
        defaultSets: '',
        defaultWeight: '',
        defaultReps: '',
        defaultRestSeconds: '',
        supersetGroupId: null,
      },
    ]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      normalizeSupersetExercises(
        prev.filter((exercise) => exercise.id !== exerciseId)
      )
    );
  };

  const handleToggleSuperset = (index: number) => {
    setSelectedExercises((prev) => toggleSupersetWithPrevious(prev, index));
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

  const renderExercise = ({ item }: { item: Exercise }) => (
    <Pressable
      style={styles.exercisePickerCard}
      onPress={() => handleAddExercise(item)}
    >
      <View style={styles.exercisePickerInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMeta}>
          {item.muscleGroup} • {item.equipment}
        </Text>
      </View>

      <View style={styles.addChip}>
        <Text style={styles.addChipText}>Add</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={isExercisePickerOpen ? filteredExercises : []}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.topRow}>
              <Text style={styles.title}>Build Your Routine</Text>

              <Pressable style={styles.topSaveButton} onPress={handleSaveRoutine}>
                <Text style={styles.topSaveButtonText}>Save</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Routine name"
              placeholderTextColor="#888888"
              value={routineName}
              onChangeText={setRoutineName}
            />

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Exercises Added</Text>
              <Text style={styles.summaryValue}>{selectedExercises.length}</Text>
            </View>

              <Text style={styles.sectionTitle}>
                Selected Exercises ({selectedExercises.length})
              </Text>

              {selectedExercises.length === 0 ? (
                <Text style={styles.emptySelectedText}>
                  Tap `Add Exercises` to start building your routine.
                </Text>
              ) : (
                selectedExercises.map((exercise, index) => (
                  <View key={exercise.id} style={styles.selectedExerciseCard}>
                    <View style={styles.exerciseTitleRow}>
                      <Text style={styles.exerciseName}>
                        {index + 1}. {exercise.name}
                      </Text>

                      {supersetDisplayMap[exercise.id] && (
                        <View style={styles.supersetBadge}>
                          <Text style={styles.supersetBadgeText}>
                            {supersetDisplayMap[exercise.id].label}
                          </Text>
                        </View>
                      )}
                    </View>

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
                          handleUpdateExerciseDefault(
                            exercise.id,
                            'defaultSets',
                            value
                          )
                        }
                      />
                      <TextInput
                        style={styles.smallInput}
                        placeholder={getWeightFieldLabel(weightUnit)}
                        placeholderTextColor="#777777"
                        keyboardType="numeric"
                        value={exercise.defaultWeight}
                        onChangeText={(value) =>
                          handleUpdateExerciseDefault(
                            exercise.id,
                            'defaultWeight',
                            value
                          )
                        }
                      />
                      <TextInput
                        style={styles.smallInput}
                        placeholder="Reps"
                        placeholderTextColor="#777777"
                        keyboardType="numeric"
                        value={exercise.defaultReps}
                        onChangeText={(value) =>
                          handleUpdateExerciseDefault(
                            exercise.id,
                            'defaultReps',
                            value
                          )
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

                    <View style={styles.exerciseActionRow}>
                      {index > 0 && (
                        <Pressable
                          style={[
                            styles.supersetButton,
                            supersetDisplayMap[exercise.id] &&
                              styles.supersetButtonActive,
                          ]}
                          onPress={() => handleToggleSuperset(index)}
                        >
                          <Text
                            style={[
                              styles.supersetButtonText,
                              supersetDisplayMap[exercise.id] &&
                                styles.supersetButtonTextActive,
                            ]}
                          >
                            {supersetDisplayMap[exercise.id]
                              ? 'Remove Superset'
                              : 'Superset With Previous'}
                          </Text>
                        </Pressable>
                      )}

                      <Pressable
                        style={[
                          styles.removeButton,
                          index === 0 && styles.removeButtonFull,
                        ]}
                        onPress={() => handleRemoveExercise(exercise.id)}
                      >
                        <Text style={styles.removeButtonText}>Remove Exercise</Text>
                      </Pressable>
                    </View>
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
                </>
              )}
          </>
        }
        ListEmptyComponent={
          isExercisePickerOpen ? (
            <Text style={styles.emptyPickerText}>No exercises found.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
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
  summaryCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#9a9a9a',
    fontSize: 13,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptySelectedText: {
    color: '#aaaaaa',
    fontSize: 15,
    marginBottom: 16,
  },
  selectedExerciseCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    flex: 1,
  },
  exerciseMeta: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 10,
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
  exerciseActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  supersetButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2e2e2e',
    backgroundColor: '#161616',
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
  removeButton: {
    flex: 1,
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  removeButtonFull: {
    flex: 0,
    width: '100%',
  },
  removeButtonText: {
    color: '#ff8a8a',
    fontSize: 13,
    fontWeight: '700',
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
  exercisePickerCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  exercisePickerInfo: {
    flex: 1,
  },
  addChip: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addChipText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyPickerText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 24,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
});
