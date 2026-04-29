import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  loadCustomExercises,
  updateCustomExerciseById,
} from '../../../storage/customExercises';
import { Exercise } from '../../../types/exercise';
import { baseMuscleGroups, loadExerciseLibrary } from '../../../utils/exerciseLibrary';
import {
  buildDemoMedia,
  joinMultilineInput,
  splitMultilineInput,
} from '../../../utils/customExerciseForm';

const selectableMuscleGroups = baseMuscleGroups.filter((group) => group !== 'All');

export default function EditCustomExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
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

  useFocusEffect(
    useCallback(() => {
      const fetchExercise = async () => {
        const customExercises = await loadCustomExercises();
        const foundExercise =
          customExercises.find((item) => item.id === id && item.isCustom) ?? null;

        setExercise(foundExercise);
        setName(foundExercise?.name ?? '');
        setSelectedMuscleGroup(foundExercise?.muscleGroup ?? 'Chest');
        setEquipment(foundExercise?.equipment ?? '');
        setInstructionsInput(joinMultilineInput(foundExercise?.instructions));
        setDemoType(foundExercise?.demoMedia?.type ?? 'video');
        setDemoUrl(foundExercise?.demoMedia?.url ?? '');
        setDemoTitle(foundExercise?.demoMedia?.title ?? '');
        setDemoSource(foundExercise?.demoMedia?.sourceLabel ?? '');
      };

      fetchExercise();
    }, [id])
  );

  const handleSave = async () => {
    if (!exercise) return;

    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter an exercise name.');
      return;
    }

    if (!equipment.trim()) {
      Alert.alert('Missing equipment', 'Please enter the equipment used.');
      return;
    }

    const exerciseLibrary = await loadExerciseLibrary();
    const normalizedName = name.trim().toLowerCase();
    const duplicateExists = exerciseLibrary.some(
      (item) =>
        item.id !== exercise.id &&
        item.name.trim().toLowerCase() === normalizedName
    );

    if (duplicateExists) {
      Alert.alert('Exercise already exists', 'Another exercise already uses that name.');
      return;
    }

    const updatedExercise: Exercise = {
      ...exercise,
      name: name.trim(),
      muscleGroup: selectedMuscleGroup,
      primaryMuscles: [selectedMuscleGroup],
      equipment: equipment.trim(),
      demoMedia: buildDemoMedia(demoType, demoUrl, demoTitle, demoSource),
      instructions: splitMultilineInput(instructionsInput),
      isCustom: true,
    };

    await updateCustomExerciseById(exercise.id, updatedExercise);

    Alert.alert('Custom exercise updated', 'Your changes were saved.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  if (!exercise) {
    return (
      <SafeAreaView style={styles.notFoundContainer} edges={['left', 'right', 'bottom']}>
        <Text style={styles.notFoundTitle}>Custom exercise not found</Text>
        <Text style={styles.notFoundText}>
          This exercise may have been deleted.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Exercise' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible && styles.contentKeyboardOpen,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={styles.title}>Edit Custom Exercise</Text>
          <Text style={styles.subtitle}>
            Update the details used across the exercise library and future routines.
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
              Optional. Add or update a GIF/video link for this exercise.
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
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
