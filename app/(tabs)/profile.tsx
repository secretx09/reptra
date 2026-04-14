import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { loadWorkouts } from '../../storage/workouts';
import { SavedWorkoutSession } from '../../types/workout';
import WorkoutHistoryCard from '../../components/WorkoutHistoryCard';

export default function ProfileScreen() {
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);

  const fetchWorkouts = async () => {
    const savedWorkouts = await loadWorkouts();
    setWorkouts(savedWorkouts);
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your recent workouts</Text>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WorkoutHistoryCard workout={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No workouts yet. Finish a workout to see it here.
          </Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 15,
    marginBottom: 16,
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