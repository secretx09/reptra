import AsyncStorage from '@react-native-async-storage/async-storage';

const RESET_KEYS = [
  'workouts',
  'routines',
  'progressPhotos',
  'customExercises',
  'appSettings',
];

export async function resetAppData() {
  await AsyncStorage.multiRemove(RESET_KEYS);
}
