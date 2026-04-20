import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadRoutines, updateRoutineById } from '../../../storage/routines';
import { Exercise } from '../../../types/exercise';
import {
  RoutineExerciseWithDefaults,
  RoutineWithExercises,
} from '../../../types/routine';
import { getMuscleGroups, loadExerciseLibrary } from '../../../utils/exerciseLibrary';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [editedExercises, setEditedExercises] = useState<
    RoutineExerciseWithDefaults[]
  >([]);
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');

  useEffect(() => {
    const fetchRoutine = async () => {
      const routines = await loadRoutines();
      const foundRoutine = routines.find((item) => item.id === id) || null;

      if (foundRoutine) {
        setRoutine(foundRoutine);
        setRoutineName(foundRoutine.name);
        setEditedExercises(foundRoutine.exercises);
      }
    };

    fetchRoutine();
  }, [id]);

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

  const handleRemoveExercise = (exerciseId: string) => {
    setEditedExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
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
      },
    ]);
  };

  const handleMoveExerciseUp = (index: number) => {
    if (index === 0) return;

    setEditedExercises((prev) => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated;
    });
  };

  const handleMoveExerciseDown = (index: number) => {
    setEditedExercises((prev) => {
      if (index === prev.length - 1) return prev;

      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
  };

  const handleUpdateExerciseDefault = (
    exerciseId: string,
    field: 'defaultSets' | 'defaultWeight' | 'defaultReps' | 'defaultRestSeconds',
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

    const updatedRoutine: RoutineWithExercises = {
      ...routine,
      name: routineName.trim(),
      exercises: editedExercises,
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
      <Stack.Screen options={{ title: 'Edit Routine' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={filteredExercisesToAdd}
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
              <Text style={styles.title}>Edit Routine</Text>
              <Text style={styles.subtitle}>Adjust exercise order and defaults</Text>

              <Text style={styles.label}>Routine Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Routine name"
                placeholderTextColor="#888888"
                value={routineName}
                onChangeText={setRoutineName}
              />

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
                          <Text style={styles.exerciseName}>{item.name}</Text>
                          <Text style={styles.exerciseMeta}>
                            {item.muscleGroup} • {item.equipment}
                          </Text>
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
                        <Text style={styles.defaultLabel}>Weight</Text>
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
                          placeholder="sec"
                          placeholderTextColor="#777777"
                          keyboardType="numeric"
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
                  </View>
                ))
              )}

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
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matching exercises to add.</Text>
          }
          ListFooterComponent={
            <Pressable style={styles.saveButton} onPress={handleSaveChanges}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
  sectionTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
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
  },
  exerciseMeta: {
    color: '#9a9a9a',
    fontSize: 13,
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
  saveButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#111111',
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
