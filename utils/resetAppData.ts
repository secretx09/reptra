import AsyncStorage from '@react-native-async-storage/async-storage';

const RESET_KEYS = [
  'workouts',
  'routines',
  'progressPhotos',
  'customExercises',
  'favoriteExercises',
  'appSettings',
  'trainingSplitPlan',
  'fitnessGoals',
  'bodyMeasurements',
];

export async function resetAppData() {
  await AsyncStorage.multiRemove(RESET_KEYS);
}
