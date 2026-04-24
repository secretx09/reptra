import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { loadSettings } from '../../storage/settings';
import { RoutineWithExercises } from '../../types/routine';
import { AppTheme } from '../../types/settings';
import { loadRoutines } from '../../storage/routines';
import { loadWorkouts } from '../../storage/workouts';
import RoutineCard from '../../components/RoutineCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemePalette } from '../../utils/appTheme';
import { SavedWorkoutSession } from '../../types/workout';

function formatLastCompletedLabel(dateString: string) {
  const completedAt = new Date(dateString).getTime();
  const now = Date.now();
  const dayDiff = Math.floor((now - completedAt) / (1000 * 60 * 60 * 24));

  if (dayDiff <= 0) {
    return 'Today';
  }

  if (dayDiff === 1) {
    return 'Yesterday';
  }

  if (dayDiff < 7) {
    return `${dayDiff}d ago`;
  }

  return new Date(dateString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

export default function WorkoutScreen() {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [theme, setTheme] = useState<AppTheme>('graphite');
  const [searchQuery, setSearchQuery] = useState('');
  const [routineFilter, setRoutineFilter] = useState<
    'all' | 'pinned' | 'supersets' | 'standard'
  >('all');
  const [sortOption, setSortOption] = useState<
    'newest' | 'oldest' | 'alphabetical' | 'most-exercises'
  >('newest');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const palette = getThemePalette(theme);

  const fetchRoutines = async () => {
    const savedRoutines = await loadRoutines();
    setRoutines(savedRoutines);
  };

  const fetchWorkouts = async () => {
    const savedWorkouts = await loadWorkouts();
    setWorkouts(savedWorkouts);
  };

  useEffect(() => {
    fetchRoutines();
    fetchWorkouts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
      fetchWorkouts();
      const fetchSettings = async () => {
        const settings = await loadSettings();
        setTheme(settings.theme);
      };

      fetchSettings();
    }, [])
  );

  const filteredRoutines = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = routines.filter((routine) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        routine.name.toLowerCase().includes(normalizedQuery) ||
        routine.exercises.some((exercise) =>
          exercise.name.toLowerCase().includes(normalizedQuery)
        );

      const hasSuperset = routine.exercises.some((exercise) => exercise.supersetGroupId);
      const matchesFilter =
        routineFilter === 'all' ||
        (routineFilter === 'pinned' && Boolean(routine.isPinned)) ||
        (routineFilter === 'supersets' && hasSuperset) ||
        (routineFilter === 'standard' && !hasSuperset);

      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      const pinDelta = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
      if (pinDelta !== 0) {
        return pinDelta;
      }

      if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      if (sortOption === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }

      if (sortOption === 'most-exercises') {
        return b.exercises.length - a.exercises.length;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [routines, searchQuery, routineFilter, sortOption]);

  const routineOverview = useMemo(() => {
    const supersetCount = routines.filter((routine) =>
      routine.exercises.some((exercise) => exercise.supersetGroupId)
    ).length;
    const pinnedCount = routines.filter((routine) => routine.isPinned).length;
    const totalExercises = routines.reduce(
      (sum, routine) => sum + routine.exercises.length,
      0
    );

    return {
      totalRoutines: routines.length,
      pinnedRoutines: pinnedCount,
      supersetRoutines: supersetCount,
      totalExercises,
    };
  }, [routines]);

  const routineActivity = useMemo(() => {
    const activityMap = new Map<
      string,
      { completedCount: number; completedThisWeek: number; lastCompletedAt?: string }
    >();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    workouts.forEach((workout) => {
      if (!workout.routineId) {
        return;
      }

      const completedAtTime = new Date(workout.completedAt).getTime();
      const happenedThisWeek = completedAtTime >= sevenDaysAgo;

      const existing = activityMap.get(workout.routineId);

      if (!existing) {
        activityMap.set(workout.routineId, {
          completedCount: 1,
          completedThisWeek: happenedThisWeek ? 1 : 0,
          lastCompletedAt: workout.completedAt,
        });
        return;
      }

      const lastTime = existing.lastCompletedAt
        ? new Date(existing.lastCompletedAt).getTime()
        : 0;

      activityMap.set(workout.routineId, {
        completedCount: existing.completedCount + 1,
        completedThisWeek: existing.completedThisWeek + (happenedThisWeek ? 1 : 0),
        lastCompletedAt:
          completedAtTime > lastTime ? workout.completedAt : existing.lastCompletedAt,
      });
    });

    return activityMap;
  }, [workouts]);

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

      <View style={styles.searchRow}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search routines or exercises"
          placeholderTextColor="#777777"
          style={styles.searchInput}
        />

        <Pressable
          style={styles.filterMenuButton}
          onPress={() => setShowFilterMenu((current) => !current)}
        >
          <Ionicons name="menu" size={22} color="#ffffff" />
        </Pressable>
      </View>

      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{routineOverview.totalRoutines}</Text>
          <Text style={styles.overviewLabel}>Routines</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{routineOverview.pinnedRoutines}</Text>
          <Text style={styles.overviewLabel}>Pinned</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{routineOverview.supersetRoutines}</Text>
          <Text style={styles.overviewLabel}>Supersets</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{routineOverview.totalExercises}</Text>
          <Text style={styles.overviewLabel}>Exercises</Text>
        </View>
      </View>

      {showFilterMenu && (
        <View style={styles.filterMenuCard}>
          <Text style={styles.filterSectionTitle}>Filter By</Text>
          <View style={styles.filterRow}>
            {[
              { label: 'All', value: 'all' },
              { label: 'Pinned', value: 'pinned' },
              { label: 'Supersets', value: 'supersets' },
              { label: 'Standard', value: 'standard' },
            ].map((option) => {
              const isActive = routineFilter === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[styles.filterChip, isActive && styles.activeChip]}
                  onPress={() =>
                    setRoutineFilter(
                      option.value as 'all' | 'pinned' | 'supersets' | 'standard'
                    )
                  }
                >
                  <Text style={[styles.filterChipText, isActive && styles.activeChipText]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterSectionTitle}>Sort By</Text>
          <View style={styles.filterRow}>
            {[
              { label: 'Newest', value: 'newest' },
              { label: 'Oldest', value: 'oldest' },
              { label: 'A-Z', value: 'alphabetical' },
              { label: 'Most Exercises', value: 'most-exercises' },
            ].map((option) => {
              const isActive = sortOption === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[styles.filterChip, isActive && styles.activeChip]}
                  onPress={() =>
                    setSortOption(
                      option.value as
                        | 'newest'
                        | 'oldest'
                        | 'alphabetical'
                        | 'most-exercises'
                    )
                  }
                >
                  <Text style={[styles.filterChipText, isActive && styles.activeChipText]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <Text style={styles.resultCount}>
        {filteredRoutines.length} routine{filteredRoutines.length === 1 ? '' : 's'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
      edges={['left', 'right']}
    >
      <FlatList
        data={filteredRoutines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const activity = routineActivity.get(item.id);

          return (
            <RoutineCard
              routine={item}
              onPress={() => router.push(`/routine/${item.id}`)}
              onStart={() => router.push(`/workout/session/${item.id}`)}
              completedCount={activity?.completedCount ?? 0}
              lastCompletedLabel={
                activity?.lastCompletedAt
                  ? formatLastCompletedLabel(activity.lastCompletedAt)
                  : undefined
              }
              completedThisWeek={activity?.completedThisWeek ?? 0}
            />
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {routines.length === 0
              ? 'No routines yet. Create your first one.'
              : 'No routines match your current search or filters.'}
          </Text>
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
  searchInput: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  filterMenuButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  overviewCard: {
    width: '23%',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  overviewValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  overviewLabel: {
    color: '#8f8f8f',
    fontSize: 12,
    fontWeight: '600',
  },
  filterMenuCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  filterSectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeChip: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  filterChipText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#111111',
  },
  resultCount: {
    color: '#8f8f8f',
    fontSize: 13,
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
