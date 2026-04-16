import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { exercises } from '../../data/exercises';
import { Exercise } from '../../types/exercise';
import { RoutineWithExercises } from '../../types/routine';
import { loadRoutines, saveRoutines } from '../../storage/routines';
import { SafeAreaView } from 'react-native-safe-area-context';

const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

export default function CreateRoutineScreen() {
  const [routineName, setRoutineName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [searchText, selectedMuscleGroup]);

  const handleToggleExercise = (exercise: Exercise) => {
    const alreadySelected = selectedExercises.some((item) => item.id === exercise.id);

    if (alreadySelected) {
      setSelectedExercises((prev) => prev.filter((item) => item.id !== exercise.id));
    } else {
      setSelectedExercises((prev) => [...prev, exercise]);
    }
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
    <>
      <SafeAreaView style={styles.container}>
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
          Select Exercises ({selectedExercises.length})
        </Text>

        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No exercises found.</Text>
          }
        />

        <Pressable style={styles.saveButton} onPress={handleSaveRoutine}>
          <Text style={styles.saveButtonText}>Save Routine</Text>
        </Pressable>
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
  },
  listContent: {
    paddingBottom: 120,
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
  },
  saveButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
});