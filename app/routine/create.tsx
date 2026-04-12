import { useState } from 'react';
import { Text, StyleSheet, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { exercises } from '../../data/exercises';
import { Exercise } from '../../types/exercise';
import { RoutineWithExercises } from '../../types/routine';
import { loadRoutines, saveRoutines } from '../../storage/routines';

export default function CreateRoutineScreen() {
  const [routineName, setRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Routine</Text>

      <TextInput
        style={styles.input}
        placeholder="Routine name"
        placeholderTextColor="#888888"
        value={routineName}
        onChangeText={setRoutineName}
      />

      <Text style={styles.sectionTitle}>Select Exercises</Text>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <Pressable style={styles.saveButton} onPress={handleSaveRoutine}>
        <Text style={styles.saveButtonText}>Save Routine</Text>
      </Pressable>
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
    marginBottom: 16,
    fontSize: 16,
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