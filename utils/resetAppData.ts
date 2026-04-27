import AsyncStorage from '@react-native-async-storage/async-storage';

const RESET_KEYS = [
  'workouts',
  'routines',
  'progressPhotos',
  'customExercises',
  'favoriteExercises',
  'appSettings',
];

export async function resetAppData() {
  await AsyncStorage.multiRemove(RESET_KEYS);
}
