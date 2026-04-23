import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { loadSettings } from '../../storage/settings';
import { loadWorkouts } from '../../storage/workouts';
import { WeightUnit } from '../../types/settings';
import { SavedWorkoutSession } from '../../types/workout';
import WorkoutHistoryCard from '../../components/WorkoutHistoryCard';

type HistoryFilter = 'all' | 'routine' | 'empty';
type HistoryDateFilter = 'all' | '7d' | '30d' | '90d';

export default function ProfileWorkoutHistoryScreen() {
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>('all');
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<HistoryDateFilter>('all');

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

  const filteredWorkouts = workouts.filter((workout) => {
    const completedAtMs = new Date(workout.completedAt).getTime();
    const now = Date.now();
    const daysAgo = (now - completedAtMs) / (1000 * 60 * 60 * 24);

    const matchesFilter =
      selectedFilter === 'all'
        ? true
        : selectedFilter === 'routine'
          ? workout.routineId !== null
          : workout.routineId === null;

    const matchesDateFilter =
      selectedDateFilter === 'all'
        ? true
        : selectedDateFilter === '7d'
          ? daysAgo <= 7
          : selectedDateFilter === '30d'
            ? daysAgo <= 30
            : daysAgo <= 90;

    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return matchesFilter && matchesDateFilter;
    }

    const matchesRoutineName = workout.routineName
      .toLowerCase()
      .includes(normalizedSearch);
    const matchesExerciseName = workout.exercises.some((exercise) =>
      exercise.exerciseName.toLowerCase().includes(normalizedSearch)
    );

    return (
      matchesFilter &&
      matchesDateFilter &&
      (matchesRoutineName || matchesExerciseName)
    );
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Workout History' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={filteredWorkouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutHistoryCard
              workout={item}
              weightUnit={weightUnit}
              onPress={() => router.push(`/workout/history/${item.id}`)}
            />
          )}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.title}>Workout History</Text>
              <Text style={styles.subtitle}>
                Search old sessions by workout name or exercise.
              </Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Search workouts or exercises..."
                placeholderTextColor="#777777"
                value={searchText}
                onChangeText={setSearchText}
              />

              <View style={styles.filterRow}>
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedFilter === 'all' && styles.filterButtonSelected,
                  ]}
                  onPress={() => setSelectedFilter('all')}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === 'all' && styles.filterButtonTextSelected,
                    ]}
                  >
                    All
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,
                    selectedFilter === 'routine' && styles.filterButtonSelected,
                  ]}
                  onPress={() => setSelectedFilter('routine')}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === 'routine' &&
                        styles.filterButtonTextSelected,
                    ]}
                  >
                    Routines
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,
                    selectedFilter === 'empty' && styles.filterButtonSelected,
                  ]}
                  onPress={() => setSelectedFilter('empty')}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === 'empty' &&
                        styles.filterButtonTextSelected,
                    ]}
                  >
                    Empty
                  </Text>
                </Pressable>
              </View>

              <View style={styles.dateFilterRow}>
                <Pressable
                  style={[
                    styles.dateFilterButton,
                    selectedDateFilter === 'all' &&
                      styles.dateFilterButtonSelected,
                  ]}
                  onPress={() => setSelectedDateFilter('all')}
                >
                  <Text
                    style={[
                      styles.dateFilterButtonText,
                      selectedDateFilter === 'all' &&
                        styles.dateFilterButtonTextSelected,
                    ]}
                  >
                    All Time
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.dateFilterButton,
                    selectedDateFilter === '7d' &&
                      styles.dateFilterButtonSelected,
                  ]}
                  onPress={() => setSelectedDateFilter('7d')}
                >
                  <Text
                    style={[
                      styles.dateFilterButtonText,
                      selectedDateFilter === '7d' &&
                        styles.dateFilterButtonTextSelected,
                    ]}
                  >
                    7 Days
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.dateFilterButton,
                    selectedDateFilter === '30d' &&
                      styles.dateFilterButtonSelected,
                  ]}
                  onPress={() => setSelectedDateFilter('30d')}
                >
                  <Text
                    style={[
                      styles.dateFilterButtonText,
                      selectedDateFilter === '30d' &&
                        styles.dateFilterButtonTextSelected,
                    ]}
                  >
                    30 Days
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.dateFilterButton,
                    selectedDateFilter === '90d' &&
                      styles.dateFilterButtonSelected,
                  ]}
                  onPress={() => setSelectedDateFilter('90d')}
                >
                  <Text
                    style={[
                      styles.dateFilterButtonText,
                      selectedDateFilter === '90d' &&
                        styles.dateFilterButtonTextSelected,
                    ]}
                  >
                    90 Days
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.resultCount}>
                {filteredWorkouts.length} result
                {filteredWorkouts.length === 1 ? '' : 's'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {workouts.length === 0
                ? 'No workouts yet. Finish a workout to see it here.'
                : 'No workouts match your current search.'}
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
  headerCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 13,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dateFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterButtonSelected: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  filterButtonText: {
    color: '#dddddd',
    fontSize: 13,
    fontWeight: '700',
  },
  filterButtonTextSelected: {
    color: '#4da6ff',
  },
  dateFilterButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateFilterButtonSelected: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  dateFilterButtonText: {
    color: '#dddddd',
    fontSize: 12,
    fontWeight: '700',
  },
  dateFilterButtonTextSelected: {
    color: '#4da6ff',
  },
  resultCount: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
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
