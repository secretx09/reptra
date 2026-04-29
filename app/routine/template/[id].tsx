import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { routineTemplates } from '../../../data/routineTemplates';
import { loadRoutines, saveRoutines } from '../../../storage/routines';
import { saveTemplateWorkoutDraft } from '../../../storage/templateWorkoutDrafts';
import { Exercise } from '../../../types/exercise';
import { RoutineExerciseWithDefaults, RoutineWithExercises } from '../../../types/routine';
import { WeightUnit } from '../../../types/settings';
import { loadSettings } from '../../../storage/settings';
import {
  buildRoutineFromTemplate,
  buildRoutineName,
} from '../../../utils/buildRoutineTemplate';
import { getMuscleGroups, loadExerciseLibrary } from '../../../utils/exerciseLibrary';
import { parseRestTimerInput } from '../../../utils/restTimer';
import { getWeightFieldLabel } from '../../../utils/weightUnits';

export default function RoutineTemplatePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [templateRoutine, setTemplateRoutine] = useState<RoutineWithExercises | null>(
    null
  );
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const [loadedExercises, savedRoutines, settings] = await Promise.all([
          loadExerciseLibrary(),
          loadRoutines(),
          loadSettings(),
        ]);
        const template = routineTemplates.find((item) => item.id === id);

        setExerciseLibrary(loadedExercises);
        setRoutines(savedRoutines);
        setWeightUnit(settings.weightUnit);

        if (!template) {
          setTemplateRoutine(null);
          return;
        }

        setTemplateRoutine((currentRoutine) => {
          if (currentRoutine) {
            return currentRoutine;
          }

          return buildRoutineFromTemplate(
            template,
            loadedExercises,
            `template-preview-${template.id}`
          );
        });
      };

      fetchData();
    }, [id])
  );

  const template = routineTemplates.find((item) => item.id === id);

  const muscleGroups = useMemo(
    () => getMuscleGroups(exerciseLibrary),
    [exerciseLibrary]
  );

  const filteredExercises = useMemo(() => {
    const addedIds = new Set(
      templateRoutine?.exercises.map((exercise) => exercise.id) ?? []
    );

    return exerciseLibrary.filter((exercise) => {
      if (addedIds.has(exercise.id)) return false;

      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [exerciseLibrary, searchText, selectedMuscleGroup, templateRoutine]);

  const handleAddExercise = (exercise: Exercise) => {
    setTemplateRoutine((currentRoutine) => {
      if (!currentRoutine) return currentRoutine;

      return {
        ...currentRoutine,
        exercises: [
          ...currentRoutine.exercises,
          {
            ...exercise,
            defaultSets: '3',
            defaultWeight: '',
            defaultReps: '8',
            defaultRestSeconds: '',
            note: '',
            supersetGroupId: null,
          },
        ],
      };
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setTemplateRoutine((currentRoutine) => {
      if (!currentRoutine) return currentRoutine;

      return {
        ...currentRoutine,
        exercises: currentRoutine.exercises.filter(
          (exercise) => exercise.id !== exerciseId
        ),
      };
    });
  };

  const handleUpdateExerciseDefault = (
    exerciseId: string,
    field:
      | 'defaultSets'
      | 'defaultWeight'
      | 'defaultReps'
      | 'defaultRestSeconds'
      | 'note',
    value: string
  ) => {
    setTemplateRoutine((currentRoutine) => {
      if (!currentRoutine) return currentRoutine;

      return {
        ...currentRoutine,
        exercises: currentRoutine.exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
        ),
      };
    });
  };

  const getPreparedRoutine = (draftId: string, name?: string) => {
    if (!templateRoutine) return null;

    return {
      ...templateRoutine,
      id: draftId,
      name: name ?? templateRoutine.name,
      exercises: templateRoutine.exercises.map((exercise) => {
        const parsedRestSeconds = parseRestTimerInput(
          exercise.defaultRestSeconds ?? ''
        );

        return {
          ...exercise,
          defaultSets: exercise.defaultSets ?? '',
          defaultWeight: exercise.defaultWeight ?? '',
          defaultReps: exercise.defaultReps ?? '',
          defaultRestSeconds: parsedRestSeconds
            ? parsedRestSeconds.toString()
            : '',
          note: exercise.note ?? '',
          supersetGroupId: null,
        };
      }),
    };
  };

  const handleStartWorkout = async () => {
    if (!templateRoutine || templateRoutine.exercises.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before starting.');
      return;
    }

    const draftId = `template-draft-${id}-${Date.now()}`;
    const draft = getPreparedRoutine(draftId);

    if (!draft) return;

    await saveTemplateWorkoutDraft(draft);
    router.push(`/workout/session/${draft.id}` as never);
  };

  const handleSaveAsRoutine = async () => {
    if (!templateRoutine || templateRoutine.exercises.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before saving.');
      return;
    }

    const routineName = buildRoutineName(templateRoutine.name, routines);
    const newRoutine = getPreparedRoutine(new Date().toISOString(), routineName);

    if (!newRoutine) return;

    const updatedRoutines = [...routines, newRoutine];
    await saveRoutines(updatedRoutines);
    setRoutines(updatedRoutines);

    Alert.alert('Routine saved', `"${newRoutine.name}" was added to your routines.`, [
      {
        text: 'Open Routine',
        onPress: () => router.replace(`/routine/${newRoutine.id}`),
      },
      { text: 'Stay Here', style: 'cancel' },
    ]);
  };

  if (!template || !templateRoutine) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <Text style={styles.notFoundTitle}>Template not found</Text>
        <Text style={styles.notFoundText}>
          This template may have been removed.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: template.name }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.appName}>Reptra</Text>
          <Text style={styles.title}>{templateRoutine.name}</Text>
          <Text style={styles.subtitle}>{template.description}</Text>

          <View style={styles.actionRow}>
            <Pressable style={styles.startButton} onPress={handleStartWorkout}>
              <Text style={styles.startButtonText}>Start Workout</Text>
            </Pressable>

            <Pressable style={styles.saveButton} onPress={handleSaveAsRoutine}>
              <Text style={styles.saveButtonText}>Save as Routine</Text>
            </Pressable>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Template Focus</Text>
            <Text style={styles.infoValue}>{template.focus}</Text>
            <Text style={styles.infoText}>
              Customize this preview freely. It will not be saved to your routines
              unless you choose `Save as Routine`.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Exercises ({templateRoutine.exercises.length})
          </Text>

          {templateRoutine.exercises.map(
            (exercise: RoutineExerciseWithDefaults, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeaderRow}>
                  <View style={styles.exerciseHeaderText}>
                    <Text style={styles.exerciseIndex}>{index + 1}</Text>
                    <View style={styles.exerciseTitleWrap}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.muscleGroup} {'\u2022'} {exercise.equipment}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemoveExercise(exercise.id)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>

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
                      handleUpdateExerciseDefault(exercise.id, 'defaultReps', value)
                    }
                  />
                  <TextInput
                    style={styles.smallInput}
                    placeholder="90 / 1:30"
                    placeholderTextColor="#777777"
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

                <TextInput
                  style={styles.noteInput}
                  placeholder="Exercise note..."
                  placeholderTextColor="#777777"
                  value={exercise.note ?? ''}
                  onChangeText={(value) =>
                    handleUpdateExerciseDefault(exercise.id, 'note', value)
                  }
                  multiline
                />
              </View>
            )
          )}

          <Pressable
            style={styles.addExerciseTrigger}
            onPress={() => setIsExercisePickerOpen((current) => !current)}
          >
            <Text style={styles.addExerciseTriggerText}>
              {isExercisePickerOpen ? 'Close Exercise Picker' : 'Add Exercises'}
            </Text>
          </Pressable>

          {isExercisePickerOpen && (
            <View style={styles.pickerCard}>
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
                style={styles.searchInput}
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

              {filteredExercises.length === 0 ? (
                <Text style={styles.emptyPickerText}>No exercises found.</Text>
              ) : (
                filteredExercises.map((exercise) => (
                  <View key={exercise.id} style={styles.pickerExerciseRow}>
                    <View style={styles.pickerExerciseText}>
                      <Text style={styles.pickerExerciseName}>{exercise.name}</Text>
                      <Text style={styles.pickerExerciseMeta}>
                        {exercise.muscleGroup} {'\u2022'} {exercise.equipment}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.addButton}
                      onPress={() => handleAddExercise(exercise)}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  appName: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  infoLabel: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  infoText: {
    color: '#b9d6f2',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
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
    fontWeight: '800',
    minWidth: 18,
  },
  exerciseTitleWrap: {
    flex: 1,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  exerciseMeta: {
    color: '#999999',
    fontSize: 13,
  },
  removeButton: {
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  removeButtonText: {
    color: '#ff8a8a',
    fontSize: 12,
    fontWeight: '800',
  },
  defaultsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallInput: {
    width: '48%',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  noteInput: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
    marginTop: 8,
    textAlignVertical: 'top',
  },
  addExerciseTrigger: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 14,
  },
  addExerciseTriggerText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '800',
  },
  pickerCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 12,
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
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
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
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
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
    fontWeight: '700',
  },
  filterButtonTextSelected: {
    color: '#111111',
  },
  pickerExerciseRow: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerExerciseText: {
    flex: 1,
  },
  pickerExerciseName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  pickerExerciseMeta: {
    color: '#999999',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyPickerText: {
    color: '#aaaaaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  notFoundTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 80,
    marginBottom: 8,
  },
  notFoundText: {
    color: '#aaaaaa',
    fontSize: 15,
    textAlign: 'center',
  },
});
