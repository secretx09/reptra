import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exercises } from '../../../data/exercises';
import { Exercise } from '../../../types/exercise';
import { RoutineWithExercises } from '../../../types/routine';
import { loadRoutines, updateRoutineById } from '../../../storage/routines';

const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [editedExercises, setEditedExercises] = useState<Exercise[]>([]);
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

  const filteredExercisesToAdd = useMemo(() => {
    const alreadyAddedIds = new Set(editedExercises.map((exercise) => exercise.id));

    return exercises.filter((exercise) => {
      if (alreadyAddedIds.has(exercise.id)) return false;

      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [editedExercises, searchText, selectedMuscleGroup]);

  const handleRemoveExercise = (exerciseId: string) => {
    setEditedExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
  };

  const handleAddExercise = (exercise: Exercise) => {
    setEditedExercises((prev) => [...prev, exercise]);
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
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>
                        {index + 1}. {item.name}
                      </Text>
                      <Text style={styles.exerciseMeta}>
                        {item.muscleGroup} • {item.equipment}
                      </Text>
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
                ))
              )}

              <Text style={styles.sectionTitle}>Add Exercises</Text>

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
    padding: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1c1c1c',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  exerciseCard: {
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
  addExerciseCard: {
    backgroundColor: '#161616',
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
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseMeta: {
    color: '#aaaaaa',
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '700',
  },
  orderButton: {
    width: 36,
    height: 36,
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
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextSelected: {
    color: '#111111',
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 16,
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