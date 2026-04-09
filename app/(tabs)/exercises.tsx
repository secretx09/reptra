import { useMemo, useState } from 'react';
import {View, Text, StyleSheet, FlatList, TextInput, Pressable} from 'react-native';
import { exercises } from '../../data/exercises';
import { Exercise } from '../../types/exercise';
import ExerciseCard from '../../components/ExerciseCard';

const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

export default function ExercisesScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesMuscleGroup =
        selectedMuscleGroup === 'All' ||
        exercise.muscleGroup === selectedMuscleGroup;

      return matchesSearch && matchesMuscleGroup;
    });
  }, [searchText, selectedMuscleGroup]);

  const renderExercise = ({ item }: { item: Exercise }) => {
    return <ExerciseCard exercise={item} />;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercise Library</Text>

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

      <Text style={styles.resultText}>
        {filteredExercises.length} exercise
        {filteredExercises.length === 1 ? '' : 's'}
      </Text>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No exercises found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#1c1c1c',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextSelected: {
    color: '#111111',
  },
  resultText: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});