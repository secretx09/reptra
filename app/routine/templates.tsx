import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { routineTemplates, RoutineTemplate } from '../../data/routineTemplates';
import { loadRoutines, saveRoutines } from '../../storage/routines';
import { Exercise } from '../../types/exercise';
import { RoutineExerciseWithDefaults, RoutineWithExercises } from '../../types/routine';
import { loadExerciseLibrary } from '../../utils/exerciseLibrary';

function buildRoutineName(baseName: string, routines: RoutineWithExercises[]) {
  const existingNames = new Set(
    routines.map((routine) => routine.name.trim().toLowerCase())
  );

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let copyNumber = 2;
  let nextName = `${baseName} ${copyNumber}`;

  while (existingNames.has(nextName.toLowerCase())) {
    copyNumber += 1;
    nextName = `${baseName} ${copyNumber}`;
  }

  return nextName;
}

function createTemplateExercise(
  exercise: Exercise,
  index: number
): RoutineExerciseWithDefaults {
  return {
    ...exercise,
    defaultSets: '3',
    defaultWeight: '',
    defaultReps: index === 0 ? '5' : '8',
    defaultRestSeconds: '',
    note: '',
    supersetGroupId: null,
  };
}

export default function RoutineTemplatesScreen() {
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const [loadedExercises, savedRoutines] = await Promise.all([
          loadExerciseLibrary(),
          loadRoutines(),
        ]);

        setExerciseLibrary(loadedExercises);
        setRoutines(savedRoutines);
      };

      fetchData();
    }, [])
  );

  const exerciseById = useMemo(() => {
    const map = new Map<string, Exercise>();
    exerciseLibrary.forEach((exercise) => map.set(exercise.id, exercise));
    return map;
  }, [exerciseLibrary]);

  const getTemplateExercises = (template: RoutineTemplate) =>
    template.exerciseIds
      .map((exerciseId) => exerciseById.get(exerciseId))
      .filter((exercise): exercise is Exercise => Boolean(exercise));

  const handleCreateTemplateRoutine = async (template: RoutineTemplate) => {
    const templateExercises = getTemplateExercises(template);

    if (templateExercises.length === 0) {
      Alert.alert(
        'Template unavailable',
        'The exercises for this template could not be found.'
      );
      return;
    }

    const newRoutine: RoutineWithExercises = {
      id: new Date().toISOString(),
      name: buildRoutineName(template.name, routines),
      createdAt: new Date().toISOString(),
      isPinned: false,
      note: template.description,
      exercises: templateExercises.map(createTemplateExercise),
    };

    const updatedRoutines = [...routines, newRoutine];
    await saveRoutines(updatedRoutines);
    setRoutines(updatedRoutines);

    Alert.alert('Template added', `"${newRoutine.name}" is ready.`, [
      {
        text: 'Open Routine',
        onPress: () => router.replace(`/routine/${newRoutine.id}`),
      },
      { text: 'Stay Here', style: 'cancel' },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Routine Templates' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <FlatList
          data={routineTemplates}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.appName}>Reptra</Text>
              <Text style={styles.title}>Routine Templates</Text>
              <Text style={styles.subtitle}>
                Start from a preset, then edit it like any other routine.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const templateExercises = getTemplateExercises(item);

            return (
              <View style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.templateHeaderText}>
                    <Text style={styles.templateName}>{item.name}</Text>
                    <Text style={styles.templateFocus}>{item.focus}</Text>
                  </View>

                  <Text style={styles.exerciseCount}>
                    {templateExercises.length} exercises
                  </Text>
                </View>

                <Text style={styles.templateDescription}>{item.description}</Text>

                <View style={styles.exerciseList}>
                  {templateExercises.map((exercise, index) => (
                    <Text key={exercise.id} style={styles.exerciseLine}>
                      {index + 1}. {exercise.name}
                    </Text>
                  ))}
                </View>

                <Pressable
                  style={styles.useButton}
                  onPress={() => handleCreateTemplateRoutine(item)}
                >
                  <Text style={styles.useButtonText}>Use Template</Text>
                </Pressable>
              </View>
            );
          }}
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
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  header: {
    paddingTop: 16,
    marginBottom: 16,
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
  },
  templateCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  templateHeaderText: {
    flex: 1,
  },
  templateName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  templateFocus: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseCount: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
  },
  templateDescription: {
    color: '#cfcfcf',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  exerciseList: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  exerciseLine: {
    color: '#dddddd',
    fontSize: 13,
    lineHeight: 18,
  },
  useButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
});
