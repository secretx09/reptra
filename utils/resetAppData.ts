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
  'wellnessCheckIns',
  'nutritionTargets',
  'dailyNutritionLogs',
  'savedMealPresets',
  'customNutritionFoods',
];

export async function resetAppData() {
  await AsyncStorage.multiRemove(RESET_KEYS);
}
