import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadCustomExercises, saveCustomExercises } from '../../storage/customExercises';
import { Exercise } from '../../types/exercise';
import { baseMuscleGroups, loadExerciseLibrary } from '../../utils/exerciseLibrary';

const selectableMuscleGroups = baseMuscleGroups.filter((group) => group !== 'All');

function splitMultilineInput(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function CreateCustomExerciseScreen() {
  const [name, setName] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('Chest');
  const [equipment, setEquipment] = useState('');
  const [instructionsInput, setInstructionsInput] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter an exercise name.');
      return;
    }

    if (!equipment.trim()) {
      Alert.alert('Missing equipment', 'Please enter the equipment used.');
      return;
    }

    const customExercises = await loadCustomExercises();
    const exerciseLibrary = await loadExerciseLibrary();
    const normalizedName = name.trim().toLowerCase();
    const duplicateExists = exerciseLibrary.some(
      (exercise) => exercise.name.trim().toLowerCase() === normalizedName
    );

    if (duplicateExists) {
      Alert.alert(
        'Exercise already exists',
        'You already created a custom exercise with that name.'
      );
      return;
    }

    const newExercise: Exercise = {
      id: `custom-${new Date().toISOString()}`,
      name: name.trim(),
      muscleGroup: selectedMuscleGroup,
      primaryMuscles: [selectedMuscleGroup],
      secondaryMuscles: [],
      equipment: equipment.trim(),
      instructions: splitMultilineInput(instructionsInput),
      isCustom: true,
    };

    await saveCustomExercises([...customExercises, newExercise]);

    Alert.alert('Custom exercise saved', 'Your custom exercise is ready to use.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Custom Exercise' }} />

      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Create Custom Exercise</Text>
          <Text style={styles.subtitle}>
            Add a custom movement so it shows up anywhere you select exercises.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Exercise name"
            placeholderTextColor="#888888"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Muscle Group</Text>
          <View style={styles.filterRow}>
            {selectableMuscleGroups.map((group) => {
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

          <TextInput
            style={styles.input}
            placeholder="Equipment"
            placeholderTextColor="#888888"
            value={equipment}
            onChangeText={setEquipment}
          />

          <TextInput
            style={styles.multilineInput}
            placeholder="Instructions (one step per line)"
            placeholderTextColor="#888888"
            value={instructionsInput}
            onChangeText={setInstructionsInput}
            multiline
          />

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Custom Exercise</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
    lineHeight: 20,
    marginBottom: 18,
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
    marginBottom: 14,
    fontSize: 15,
  },
  multilineInput: {
    backgroundColor: '#171717',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top',
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
    fontSize: 13,
    fontWeight: '600',
  },
  filterButtonTextSelected: {
    color: '#111111',
  },
  saveButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
});
