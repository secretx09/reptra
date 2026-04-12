import { useEffect, useState } from 'react';
import { Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { RoutineWithExercises } from '../../types/routine';
import { loadRoutines } from '../../storage/routines';
import RoutineCard from '../../components/RoutineCard';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutScreen() {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);

  const fetchRoutines = async () => {
    const savedRoutines = await loadRoutines();
    setRoutines(savedRoutines);
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Workout</Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => Alert.alert('Coming soon', 'Empty workout sessions will be added later.')}
      >
        <Text style={styles.primaryButtonText}>Start Empty Workout</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push('/routine/create')}
      >
        <Text style={styles.secondaryButtonText}>Create New Routine</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Your Routines</Text>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoutineCard
            routine={item}
            onPress={() => router.push(`/routine/${item.id}`)}
            onStart={() =>
              Alert.alert('Coming soon', `Starting ${item.name} will be added later.`)
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No routines yet. Create your first one.</Text>
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
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
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