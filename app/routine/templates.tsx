import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { routineTemplates, RoutineTemplate } from '../../data/routineTemplates';
import { Exercise } from '../../types/exercise';
import { loadExerciseLibrary } from '../../utils/exerciseLibrary';

export default function RoutineTemplatesScreen() {
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const loadedExercises = await loadExerciseLibrary();

        setExerciseLibrary(loadedExercises);
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

  return (
    <>
      <Stack.Screen options={{ title: 'Routine Templates' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
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
                  onPress={() => router.push(`/routine/template/${item.id}`)}
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
