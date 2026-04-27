import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITE_EXERCISES_KEY = 'favoriteExercises';

export async function loadFavoriteExerciseIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITE_EXERCISES_KEY);
    return data ? (JSON.parse(data) as string[]) : [];
  } catch (error) {
    console.error('Failed to load favorite exercises:', error);
    return [];
  }
}

export async function saveFavoriteExerciseIds(exerciseIds: string[]) {
  try {
    await AsyncStorage.setItem(
      FAVORITE_EXERCISES_KEY,
      JSON.stringify(Array.from(new Set(exerciseIds)))
    );
  } catch (error) {
    console.error('Failed to save favorite exercises:', error);
  }
}

export async function toggleFavoriteExerciseId(exerciseId: string) {
  const favoriteIds = await loadFavoriteExerciseIds();
  const isFavorite = favoriteIds.includes(exerciseId);
  const updatedFavoriteIds = isFavorite
    ? favoriteIds.filter((id) => id !== exerciseId)
    : [...favoriteIds, exerciseId];

  await saveFavoriteExerciseIds(updatedFavoriteIds);
  return updatedFavoriteIds;
}
