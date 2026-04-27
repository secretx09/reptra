import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Exercise } from '../../types/exercise';
import { loadFavoriteExerciseIds } from '../../storage/favoriteExercises';
import { getMuscleGroups, loadExerciseLibrary } from '../../utils/exerciseLibrary';

export default function ExerciseLibraryScreen() {
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchExerciseLibrary = async () => {
        const [loadedExercises, savedFavoriteIds] = await Promise.all([
          loadExerciseLibrary(),
          loadFavoriteExerciseIds(),
        ]);
        setExerciseLibrary(loadedExercises);
        setFavoriteExerciseIds(savedFavoriteIds);
      };

      fetchExerciseLibrary();
    }, [])
  );

  const muscleGroups = useMemo(
    () => getMuscleGroups(exerciseLibrary),
    [exerciseLibrary]
  );

  const filteredExercises = useMemo(() => {
    return exerciseLibrary.filter((exercise) => {
      if (showFavoritesOnly && !favoriteExerciseIds.includes(exercise.id)) {
        return false;
      }

      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [
    exerciseLibrary,
    favoriteExerciseIds,
    searchText,
    selectedMuscleGroup,
    showFavoritesOnly,
  ]);

  return (
    <>
      <Stack.Screen options={{ title: 'All Exercises' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.exerciseCard}
              onPress={() => router.push(`/exercise/${item.id}`)}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {item.muscleGroup} • {item.equipment}
                </Text>
              </View>

              <View style={styles.badgeColumn}>
                {item.isCustom ? (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>Custom</Text>
                  </View>
                ) : null}

                {favoriteExerciseIds.includes(item.id) ? (
                  <View style={styles.favoriteBadge}>
                    <Text style={styles.favoriteBadgeText}>Fav</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
          ListHeaderComponent={
            <>
              <Text style={styles.title}>Exercise Library</Text>
              <Text style={styles.subtitle}>
                Browse every exercise and open the detail pages from here.
              </Text>

              <Pressable
                style={styles.createButton}
                onPress={() => router.push('/exercise/create')}
              >
                <Text style={styles.createButtonText}>+ Create Custom Exercise</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.favoriteFilterButton,
                  showFavoritesOnly && styles.favoriteFilterButtonActive,
                ]}
                onPress={() => setShowFavoritesOnly((current) => !current)}
              >
                <Text
                  style={[
                    styles.favoriteFilterButtonText,
                    showFavoritesOnly && styles.favoriteFilterButtonTextActive,
                  ]}
                >
                  {showFavoritesOnly
                    ? 'Showing Favorite Exercises'
                    : 'Show Favorite Exercises'}
                </Text>
              </Pressable>

              <TextInput
                style={styles.input}
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
            </>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matching exercises found.</Text>
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
    paddingHorizontal: 14,
    paddingTop: 12,
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
    marginBottom: 14,
  },
  createButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  favoriteFilterButton: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  favoriteFilterButtonActive: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  favoriteFilterButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  favoriteFilterButtonTextActive: {
    color: '#4da6ff',
  },
  input: {
    backgroundColor: '#171717',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
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
  exerciseCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  badgeColumn: {
    gap: 6,
    alignItems: 'flex-end',
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  exerciseMeta: {
    color: '#aaaaaa',
    fontSize: 13,
  },
  customBadge: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  customBadgeText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
  },
  favoriteBadge: {
    backgroundColor: '#211a08',
    borderWidth: 1,
    borderColor: '#d2a640',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  favoriteBadgeText: {
    color: '#ffd36b',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
});
