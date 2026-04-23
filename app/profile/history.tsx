import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { loadSettings } from '../../storage/settings';
import { loadWorkouts } from '../../storage/workouts';
import { WeightUnit } from '../../types/settings';
import { SavedWorkoutSession } from '../../types/workout';
import WorkoutHistoryCard from '../../components/WorkoutHistoryCard';

export default function ProfileWorkoutHistoryScreen() {
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');

  const fetchWorkouts = async () => {
    const savedWorkouts = await loadWorkouts();
    const savedSettings = await loadSettings();
    setWorkouts(savedWorkouts);
    setWeightUnit(savedSettings.weightUnit);
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Workout History' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutHistoryCard
              workout={item}
              weightUnit={weightUnit}
              onPress={() => router.push(`/workout/history/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No workouts yet. Finish a workout to see it here.
            </Text>
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
  emptyText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  listContent: {
    paddingBottom: 24,
  },
});
