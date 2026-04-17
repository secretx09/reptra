import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exercises } from '../../../data/exercises';
import { Exercise } from '../../../types/exercise';

const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

export default function EmptyWorkoutSessionScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [addedExercises, setAddedExercises] = useState<Exercise[]>([]);

  const filteredExercises = useMemo(() => {
    const addedIds = new Set(addedExercises.map((exercise) => exercise.id));

    return exercises.filter((exercise) => {
      if (addedIds.has(exercise.id)) return false;

      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [searchText, selectedMuscleGroup, addedExercises]);

  const handleAddExercise = (exercise: Exercise) => {
    setAddedExercises((prev) => [...prev, exercise]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setAddedExercises((prev) =>
      prev.filter((exercise) => exercise.id !== exerciseId)
    );
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
                Add exercises to build this workout live.
              </Text>

              <Text style={styles.sectionTitle}>Current Exercises</Text>

              {addedExercises.length === 0 ? (
                <Text style={styles.emptyText}>
                  No exercises added yet.
                </Text>
              ) : (
                addedExercises.map((exercise, index) => (
                  <View key={exercise.id} style={styles.currentExerciseCard}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>
                        {index + 1}. {exercise.name}
                      </Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.muscleGroup} • {exercise.equipment}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.removeButton}
                      onPress={() => handleRemoveExercise(exercise.id)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </Pressable>
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
            <Text style={styles.emptyText}>No matching exercises found.</Text>
          }
          ListFooterComponent={
            <Pressable
              style={styles.finishButton}
              onPress={() =>
                Alert.alert(
                  'Coming next',
                  'In the next session, these added exercises will become a full working workout logger.'
                )
              }
            >
              <Text style={styles.finishButtonText}>Continue Workout</Text>
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
  input: {
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
  currentExerciseCard: {
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