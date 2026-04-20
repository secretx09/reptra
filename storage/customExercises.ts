import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '../types/exercise';

const CUSTOM_EXERCISES_KEY = 'customExercises';

export async function loadCustomExercises(): Promise<Exercise[]> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load custom exercises:', error);
    return [];
  }
}

export async function saveCustomExercises(customExercises: Exercise[]) {
  try {
    await AsyncStorage.setItem(
      CUSTOM_EXERCISES_KEY,
      JSON.stringify(customExercises)
    );
  } catch (error) {
    console.error('Failed to save custom exercises:', error);
  }
}
