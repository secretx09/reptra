import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
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
import { buildDemoMedia, splitMultilineInput } from '../../utils/customExerciseForm';

const selectableMuscleGroups = baseMuscleGroups.filter((group) => group !== 'All');

export default function CreateCustomExerciseScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [name, setName] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('Chest');
  const [equipment, setEquipment] = useState('');
  const [instructionsInput, setInstructionsInput] = useState('');
  const [demoType, setDemoType] = useState<'video' | 'gif'>('video');
  const [demoUrl, setDemoUrl] = useState('');
  const [demoTitle, setDemoTitle] = useState('');
  const [demoSource, setDemoSource] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const scrollToFocusedField = (y: number) => {
    const scroll = () => scrollViewRef.current?.scrollTo({ y, animated: true });

    setTimeout(scroll, 100);
    setTimeout(scroll, 320);
  };

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
      demoMedia: buildDemoMedia(demoType, demoUrl, demoTitle, demoSource),
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
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible && styles.contentKeyboardOpen,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
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

          <View style={styles.mediaCard}>
            <Text style={styles.mediaTitle}>Demo Media</Text>
            <Text style={styles.mediaSubtitle}>
              Optional for now. Add a GIF or video link so this exercise is ready
              for embedded demos later.
            </Text>

            <View style={styles.mediaTypeRow}>
              {(['video', 'gif'] as const).map((type) => {
                const isSelected = demoType === type;

                return (
                  <Pressable
                    key={type}
                    style={[
                      styles.mediaTypeButton,
                      isSelected && styles.mediaTypeButtonSelected,
                    ]}
                    onPress={() => setDemoType(type)}
                  >
                    <Text
                      style={[
                        styles.mediaTypeButtonText,
                        isSelected && styles.mediaTypeButtonTextSelected,
                      ]}
                    >
                      {type === 'video' ? 'Video' : 'GIF'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Demo URL"
              placeholderTextColor="#888888"
              autoCapitalize="none"
              value={demoUrl}
              onChangeText={setDemoUrl}
              onFocus={() => scrollToFocusedField(260)}
            />

            <TextInput
              style={styles.input}
              placeholder="Demo title"
              placeholderTextColor="#888888"
              value={demoTitle}
              onChangeText={setDemoTitle}
              onFocus={() => scrollToFocusedField(330)}
            />

            <TextInput
              style={styles.input}
              placeholder="Source label"
              placeholderTextColor="#888888"
              value={demoSource}
              onChangeText={setDemoSource}
              onFocus={() => scrollToFocusedField(390)}
            />
          </View>

          <TextInput
            style={styles.multilineInput}
            placeholder="Instructions (one step per line)"
            placeholderTextColor="#888888"
            value={instructionsInput}
            onChangeText={setInstructionsInput}
            onFocus={() => scrollToFocusedField(560)}
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
  contentKeyboardOpen: {
    paddingBottom: 260,
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
  mediaCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  mediaTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  mediaSubtitle: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  mediaTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  mediaTypeButton: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  mediaTypeButtonSelected: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  mediaTypeButtonText: {
    color: '#dddddd',
    fontSize: 13,
    fontWeight: '700',
  },
  mediaTypeButtonTextSelected: {
    color: '#4da6ff',
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
