import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { loadSettings } from '../../storage/settings';
import { RoutineWithExercises } from '../../types/routine';
import { AppTheme } from '../../types/settings';
import { loadRoutines } from '../../storage/routines';
import RoutineCard from '../../components/RoutineCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemePalette } from '../../utils/appTheme';

export default function WorkoutScreen() {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [theme, setTheme] = useState<AppTheme>('graphite');
  const palette = getThemePalette(theme);

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
      const fetchSettings = async () => {
        const settings = await loadSettings();
        setTheme(settings.theme);
      };

      fetchSettings();
    }, [])
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Text style={styles.title}>Workout</Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push('/workout/session/empty')}
      >
        <Text style={styles.primaryButtonText}>Start Empty Workout</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push('/routine/create')}
      >
        <Text style={styles.secondaryButtonText}>Create New Routine</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push('/exercise/create')}
      >
        <Text style={styles.secondaryButtonText}>Create Custom Exercise</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push('/exercise/')}
      >
        <Text style={styles.secondaryButtonText}>View All Exercises</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Your Routines</Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
      edges={['left', 'right']}
    >
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoutineCard
            routine={item}
            onPress={() => router.push(`/routine/${item.id}`)}
            onStart={() => router.push(`/workout/session/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No routines yet. Create your first one.</Text>
        }
        ListHeaderComponent={renderHeader}
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
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    marginBottom: 12,
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
    marginTop: 8,
    marginBottom: 12,
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
});
